from __future__ import annotations

import sys
import unittest
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app, get_catalog_service, get_optional_auth_context  # noqa: E402
from app.services.catalog import BusinessQueryFilters, ReviewQueryFilters  # noqa: E402


class FakeCatalogService:
    def __init__(self) -> None:
        self.last_business_filters: BusinessQueryFilters | None = None
        self.last_review_filters: ReviewQueryFilters | None = None

    def list_categories(self) -> list[dict[str, str | None]]:
        return [
            {
                "id": "00000000-0000-0000-0000-000000000101",
                "slug": "restaurant",
                "name": "Restaurant",
                "icon": "restaurant",
            }
        ]

    def list_businesses(
        self,
        filters: BusinessQueryFilters,
        viewer_user_id: str | None = None,
    ) -> dict[str, Any]:
        self.last_business_filters = filters
        _ = viewer_user_id
        return {
            "items": [
                {
                    "id": "00000000-0000-0000-0000-000000000311",
                    "slug": "el-antojito-tepic",
                    "name": "El Antojito",
                    "description": "Mexican restaurant",
                    "zone": "Centro",
                    "address": "Avenida Mexico 614 A",
                    "rating_avg": 4.6,
                    "rating_count": 12,
                    "whatsapp_number": "+523111622020",
                    "is_open_now": None,
                    "distance_m": 850,
                    "categories": ["restaurant"],
                    "cover_image_url": None,
                    "location": {"latitude": 21.519026, "longitude": -104.888759},
                    "is_favorited": False,
                }
            ],
            "pagination": {
                "page": filters.page,
                "page_size": filters.page_size,
                "total_items": 1,
                "total_pages": 1,
            },
        }

    def get_business_detail(
        self,
        slug: str,
        viewer_user_id: str | None = None,
    ) -> dict[str, Any] | None:
        _ = viewer_user_id
        if slug == "missing":
            return None
        return {
            "id": "00000000-0000-0000-0000-000000000311",
            "slug": "el-antojito-tepic",
            "name": "El Antojito",
            "description": "Mexican restaurant",
            "phone": "+523111622020",
            "whatsapp_number": "+523111622020",
            "email": None,
            "website": None,
            "address": "Avenida Mexico 614 A",
            "zone": "Centro",
            "rating_avg": 4.6,
            "rating_count": 12,
            "is_verified": False,
            "categories": [{"slug": "restaurant", "name": "Restaurant"}],
            "location": {"latitude": 21.519026, "longitude": -104.888759},
            "opening_hours": {"monday": []},
            "images": [],
            "products": [],
            "is_favorited": False,
        }

    def list_business_reviews(
        self,
        slug: str,
        filters: ReviewQueryFilters,
    ) -> dict[str, Any] | None:
        self.last_review_filters = filters
        if slug == "missing":
            return None
        return {
            "items": [],
            "summary": {"rating_avg": 0.0, "rating_count": 0},
            "pagination": {
                "page": filters.page,
                "page_size": filters.page_size,
                "total_items": 0,
                "total_pages": 0,
            },
        }


class CatalogPublicApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.fake_catalog = FakeCatalogService()
        app.dependency_overrides[get_catalog_service] = lambda: self.fake_catalog
        app.dependency_overrides[get_optional_auth_context] = lambda: None
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_health_endpoint_is_still_available(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertIn("database_configured", payload)

    def test_get_categories_returns_public_list(self) -> None:
        response = self.client.get("/categories")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["items"]), 1)
        self.assertEqual(payload["items"][0]["slug"], "restaurant")

    def test_get_businesses_requires_near_lat_and_near_lng_together(self) -> None:
        response = self.client.get("/businesses", params={"near_lat": 21.5})
        self.assertEqual(response.status_code, 422)
        payload = response.json()
        self.assertEqual(payload["error"]["code"], "VALIDATION_ERROR")

    def test_get_businesses_requires_coordinates_for_distance_sort(self) -> None:
        response = self.client.get("/businesses", params={"sort": "distance"})
        self.assertEqual(response.status_code, 422)
        payload = response.json()
        self.assertEqual(payload["error"]["code"], "VALIDATION_ERROR")

    def test_get_businesses_applies_filters_and_pagination(self) -> None:
        response = self.client.get(
            "/businesses",
            params={
                "q": "antojito",
                "category": "restaurant",
                "zone": "Centro",
                "near_lat": 21.5190,
                "near_lng": -104.8887,
                "radius_m": 5000,
                "sort": "relevance",
                "page": 2,
                "page_size": 10,
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["pagination"]["page"], 2)
        self.assertEqual(payload["pagination"]["page_size"], 10)
        self.assertEqual(self.fake_catalog.last_business_filters.category, "restaurant")
        self.assertEqual(self.fake_catalog.last_business_filters.zone, "Centro")

    def test_get_business_detail_returns_404_when_not_found(self) -> None:
        response = self.client.get("/businesses/missing")
        self.assertEqual(response.status_code, 404)
        payload = response.json()
        self.assertEqual(payload["error"]["code"], "BUSINESS_NOT_FOUND")

    def test_get_business_detail_returns_payload(self) -> None:
        response = self.client.get("/businesses/el-antojito-tepic")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["slug"], "el-antojito-tepic")
        self.assertIn("location", payload)

    def test_get_business_reviews_paginates(self) -> None:
        response = self.client.get(
            "/businesses/el-antojito-tepic/reviews",
            params={"page": 2, "page_size": 5},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["pagination"]["page"], 2)
        self.assertEqual(self.fake_catalog.last_review_filters.page_size, 5)


if __name__ == "__main__":
    unittest.main()
