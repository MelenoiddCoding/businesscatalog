from __future__ import annotations

import re
from dataclasses import dataclass
from math import ceil
from typing import Any

from psycopg import Connection


CANONICAL_DAYS = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)

OSM_DAY_INDEX = {
    "Mo": 0,
    "Tu": 1,
    "We": 2,
    "Th": 3,
    "Fr": 4,
    "Sa": 5,
    "Su": 6,
}

OSM_OPENING_HOURS_PATTERN = re.compile(
    r"^(Mo|Tu|We|Th|Fr|Sa|Su)-(Mo|Tu|We|Th|Fr|Sa|Su)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$"
)


@dataclass(frozen=True)
class BusinessQueryFilters:
    q: str | None
    category: str | None
    zone: str | None
    near_lat: float | None
    near_lng: float | None
    radius_m: int
    sort: str
    page: int
    page_size: int


@dataclass(frozen=True)
class ReviewQueryFilters:
    page: int
    page_size: int


def normalize_opening_hours(raw: Any) -> dict[str, list[dict[str, str]]]:
    if not isinstance(raw, dict):
        return {day: [] for day in CANONICAL_DAYS}

    normalized = {day: [] for day in CANONICAL_DAYS}

    if any(day in raw for day in CANONICAL_DAYS):
        for day in CANONICAL_DAYS:
            value = raw.get(day)
            if not isinstance(value, list):
                continue

            entries: list[dict[str, str]] = []
            for item in value:
                if not isinstance(item, dict):
                    continue
                open_time = item.get("open")
                close_time = item.get("close")
                if isinstance(open_time, str) and isinstance(close_time, str):
                    entries.append({"open": open_time, "close": close_time})
            normalized[day] = entries
        return normalized

    osm_opening_hours = raw.get("osm_opening_hours")
    if not isinstance(osm_opening_hours, str):
        return normalized

    match = OSM_OPENING_HOURS_PATTERN.match(osm_opening_hours.strip())
    if not match:
        return normalized

    start_day, end_day, open_time, close_time = match.groups()
    start_idx = OSM_DAY_INDEX[start_day]
    end_idx = OSM_DAY_INDEX[end_day]

    if start_idx <= end_idx:
        day_indices = range(start_idx, end_idx + 1)
    else:
        day_indices = list(range(start_idx, len(CANONICAL_DAYS))) + list(
            range(0, end_idx + 1)
        )

    for day_idx in day_indices:
        normalized[CANONICAL_DAYS[day_idx]] = [{"open": open_time, "close": close_time}]

    return normalized


class CatalogService:
    def __init__(self, connection: Connection[Any]) -> None:
        self.connection = connection

    def list_categories(self) -> list[dict[str, str | None]]:
        sql = """
            SELECT id::text, slug::text AS slug, name, icon
            FROM business_categories
            ORDER BY name ASC
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql)
            rows = cursor.fetchall()
        return [dict(row) for row in rows]

    def list_businesses(self, filters: BusinessQueryFilters) -> dict[str, Any]:
        where_clauses = ["b.status = 'published'"]
        where_params: list[Any] = []

        if filters.category:
            where_clauses.append(
                """
                EXISTS (
                    SELECT 1
                    FROM business_category_assignments bca
                    JOIN business_categories c ON c.id = bca.category_id
                    WHERE bca.business_id = b.id
                      AND c.slug = %s
                )
                """
            )
            where_params.append(filters.category)

        if filters.zone:
            where_clauses.append("b.zone ILIKE %s")
            where_params.append(f"%{filters.zone}%")

        if filters.near_lat is not None and filters.near_lng is not None:
            where_clauses.append(
                """
                ST_DWithin(
                    bl.geog_point,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                    %s
                )
                """
            )
            where_params.extend([filters.near_lng, filters.near_lat, filters.radius_m])

        query_pattern = None
        if filters.q:
            query_pattern = f"%{filters.q}%"
            where_clauses.append(
                """
                (
                    b.name ILIKE %s
                    OR b.description ILIKE %s
                    OR b.zone ILIKE %s
                    OR EXISTS (
                        SELECT 1
                        FROM business_category_assignments bca
                        JOIN business_categories c ON c.id = bca.category_id
                        WHERE bca.business_id = b.id
                          AND (
                            c.name ILIKE %s
                            OR c.slug::text ILIKE %s
                          )
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM products p
                        WHERE p.business_id = b.id
                          AND p.status = 'active'
                          AND (
                            p.name ILIKE %s
                            OR COALESCE(p.description, '') ILIKE %s
                          )
                    )
                )
                """
            )
            where_params.extend([query_pattern] * 7)

        where_sql = " AND ".join(clause.strip() for clause in where_clauses)

        count_sql = f"""
            SELECT COUNT(DISTINCT b.id) AS total_items
            FROM businesses b
            JOIN business_locations bl ON bl.business_id = b.id
            WHERE {where_sql}
        """
        with self.connection.cursor() as cursor:
            cursor.execute(count_sql, where_params)
            count_row = cursor.fetchone()
            total_items = int(count_row["total_items"]) if count_row else 0

        offset = (filters.page - 1) * filters.page_size
        distance_expression = """
            CASE
                WHEN %s::double precision IS NOT NULL AND %s::double precision IS NOT NULL THEN
                    ST_Distance(
                        bl.geog_point,
                        ST_SetSRID(
                            ST_MakePoint(%s::double precision, %s::double precision),
                            4326
                        )::geography
                    )::int
                ELSE NULL
            END AS distance_m
        """
        distance_params = [
            filters.near_lat,
            filters.near_lng,
            filters.near_lng,
            filters.near_lat,
        ]

        if filters.sort == "distance":
            order_sql = "distance_m ASC NULLS LAST, b.rating_avg DESC, b.name ASC"
            order_params: list[Any] = []
        elif filters.sort == "rating":
            order_sql = "b.rating_avg DESC, b.rating_count DESC, b.name ASC"
            order_params = []
        else:
            if query_pattern:
                order_sql = """
                    CASE
                        WHEN b.name ILIKE %s THEN 3
                        WHEN EXISTS (
                            SELECT 1
                            FROM business_category_assignments bca
                            JOIN business_categories c ON c.id = bca.category_id
                            WHERE bca.business_id = b.id
                              AND (c.name ILIKE %s OR c.slug::text ILIKE %s)
                        ) THEN 2
                        WHEN EXISTS (
                            SELECT 1
                            FROM products p
                            WHERE p.business_id = b.id
                              AND p.status = 'active'
                              AND (p.name ILIKE %s OR COALESCE(p.description, '') ILIKE %s)
                        ) THEN 1
                        ELSE 0
                    END DESC,
                    b.rating_avg DESC,
                    b.rating_count DESC,
                    b.name ASC
                """
                order_params = [query_pattern] * 5
            else:
                order_sql = "b.rating_avg DESC, b.rating_count DESC, b.name ASC"
                order_params = []

        list_sql = f"""
            SELECT
                b.id::text AS id,
                b.slug::text AS slug,
                b.name,
                b.description,
                b.zone,
                b.address,
                b.rating_avg::float8 AS rating_avg,
                b.rating_count,
                b.whatsapp_number,
                NULL::boolean AS is_open_now,
                {distance_expression},
                (
                    SELECT COALESCE(
                        array_agg(DISTINCT lower(c.slug::text) ORDER BY lower(c.slug::text)),
                        ARRAY[]::text[]
                    )
                    FROM business_category_assignments bca
                    JOIN business_categories c ON c.id = bca.category_id
                    WHERE bca.business_id = b.id
                ) AS categories,
                (
                    SELECT bi.image_url
                    FROM business_images bi
                    WHERE bi.business_id = b.id
                    ORDER BY
                        CASE
                            WHEN bi.kind = 'cover' THEN 0
                            WHEN bi.kind = 'gallery' THEN 1
                            ELSE 2
                        END,
                        bi.position ASC
                    LIMIT 1
                ) AS cover_image_url,
                json_build_object(
                    'latitude', bl.latitude::float8,
                    'longitude', bl.longitude::float8
                ) AS location,
                false AS is_favorited
            FROM businesses b
            JOIN business_locations bl ON bl.business_id = b.id
            WHERE {where_sql}
            ORDER BY {order_sql}
            LIMIT %s
            OFFSET %s
        """

        list_params: list[Any] = []
        list_params.extend(distance_params)
        list_params.extend(where_params)
        list_params.extend(order_params)
        list_params.extend([filters.page_size, offset])

        with self.connection.cursor() as cursor:
            cursor.execute(list_sql, list_params)
            rows = cursor.fetchall()

        items = [self._serialize_business_list_item(row) for row in rows]
        total_pages = ceil(total_items / filters.page_size) if total_items > 0 else 0
        return {
            "items": items,
            "pagination": {
                "page": filters.page,
                "page_size": filters.page_size,
                "total_items": total_items,
                "total_pages": total_pages,
            },
        }

    def get_business_detail(self, identifier: str) -> dict[str, Any] | None:
        base_sql = """
            SELECT
                b.id::text AS id,
                b.slug::text AS slug,
                b.name,
                b.description,
                b.phone,
                b.whatsapp_number,
                b.email,
                b.website,
                b.address,
                b.zone,
                b.rating_avg::float8 AS rating_avg,
                b.rating_count,
                b.is_verified,
                bl.latitude::float8 AS latitude,
                bl.longitude::float8 AS longitude,
                bl.opening_hours
            FROM businesses b
            JOIN business_locations bl ON bl.business_id = b.id
            WHERE b.status = 'published'
              AND (b.slug = %s OR b.id::text = %s)
            LIMIT 1
        """

        with self.connection.cursor() as cursor:
            cursor.execute(base_sql, [identifier, identifier])
            business_row = cursor.fetchone()

            if business_row is None:
                return None

            business_id = business_row["id"]
            cursor.execute(
                """
                SELECT c.slug::text AS slug, c.name
                FROM business_category_assignments bca
                JOIN business_categories c ON c.id = bca.category_id
                WHERE bca.business_id = %s
                ORDER BY bca.relevance_score ASC, c.name ASC
                """,
                [business_id],
            )
            categories = [dict(row) for row in cursor.fetchall()]

            cursor.execute(
                """
                SELECT image_url AS url, kind::text AS kind, position
                FROM business_images
                WHERE business_id = %s
                ORDER BY position ASC
                """,
                [business_id],
            )
            images = [dict(row) for row in cursor.fetchall()]

            cursor.execute(
                """
                SELECT
                    id::text AS id,
                    name,
                    description,
                    price,
                    currency,
                    is_featured
                FROM products
                WHERE business_id = %s
                  AND status = 'active'
                ORDER BY is_featured DESC, name ASC
                """,
                [business_id],
            )
            products = []
            for row in cursor.fetchall():
                product = dict(row)
                if product["price"] is not None:
                    product["price"] = float(product["price"])
                products.append(product)

        opening_hours = normalize_opening_hours(business_row["opening_hours"])
        return {
            "id": business_row["id"],
            "slug": business_row["slug"],
            "name": business_row["name"],
            "description": business_row["description"],
            "phone": business_row["phone"],
            "whatsapp_number": business_row["whatsapp_number"],
            "email": business_row["email"],
            "website": business_row["website"],
            "address": business_row["address"],
            "zone": business_row["zone"],
            "rating_avg": business_row["rating_avg"],
            "rating_count": business_row["rating_count"],
            "is_verified": bool(business_row["is_verified"]),
            "categories": categories,
            "location": {
                "latitude": business_row["latitude"],
                "longitude": business_row["longitude"],
            },
            "opening_hours": opening_hours,
            "images": images,
            "products": products,
            "is_favorited": False,
        }

    def list_business_reviews(
        self,
        identifier: str,
        filters: ReviewQueryFilters,
    ) -> dict[str, Any] | None:
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id::text AS id
                FROM businesses
                WHERE status = 'published'
                  AND (slug = %s OR id::text = %s)
                LIMIT 1
                """,
                [identifier, identifier],
            )
            business = cursor.fetchone()
            if business is None:
                return None

            business_id = business["id"]
            cursor.execute(
                """
                SELECT
                    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float8 AS rating_avg,
                    COUNT(*)::int AS rating_count
                FROM reviews r
                WHERE r.business_id = %s
                  AND r.status = 'published'
                """,
                [business_id],
            )
            summary_row = cursor.fetchone()

            cursor.execute(
                """
                SELECT COUNT(*)::int AS total_items
                FROM reviews r
                WHERE r.business_id = %s
                  AND r.status = 'published'
                """,
                [business_id],
            )
            count_row = cursor.fetchone()
            total_items = int(count_row["total_items"]) if count_row else 0
            total_pages = ceil(total_items / filters.page_size) if total_items > 0 else 0
            offset = (filters.page - 1) * filters.page_size

            cursor.execute(
                """
                SELECT
                    r.id::text AS id,
                    r.rating,
                    r.comment,
                    r.status::text AS status,
                    r.visited_at,
                    r.created_at,
                    u.name AS author_name,
                    u.avatar_url AS author_avatar_url
                FROM reviews r
                JOIN users u ON u.id = r.user_id
                WHERE r.business_id = %s
                  AND r.status = 'published'
                ORDER BY r.created_at DESC
                LIMIT %s
                OFFSET %s
                """,
                [business_id, filters.page_size, offset],
            )
            rows = cursor.fetchall()

        items = []
        for row in rows:
            item = dict(row)
            item["author"] = {
                "name": item.pop("author_name"),
                "avatar_url": item.pop("author_avatar_url"),
            }
            if item["visited_at"] is not None:
                item["visited_at"] = item["visited_at"].isoformat()
            item["created_at"] = item["created_at"].isoformat()
            items.append(item)

        summary = {
            "rating_avg": summary_row["rating_avg"] if summary_row else 0.0,
            "rating_count": summary_row["rating_count"] if summary_row else 0,
        }
        return {
            "items": items,
            "summary": summary,
            "pagination": {
                "page": filters.page,
                "page_size": filters.page_size,
                "total_items": total_items,
                "total_pages": total_pages,
            },
        }

    @staticmethod
    def _serialize_business_list_item(row: dict[str, Any]) -> dict[str, Any]:
        location = row["location"]
        return {
            "id": row["id"],
            "slug": row["slug"],
            "name": row["name"],
            "description": row["description"],
            "zone": row["zone"],
            "address": row["address"],
            "rating_avg": row["rating_avg"],
            "rating_count": row["rating_count"],
            "whatsapp_number": row["whatsapp_number"],
            "is_open_now": row["is_open_now"],
            "distance_m": row["distance_m"],
            "categories": row["categories"] or [],
            "cover_image_url": row["cover_image_url"],
            "location": {
                "latitude": location["latitude"],
                "longitude": location["longitude"],
            },
            "is_favorited": False,
        }
