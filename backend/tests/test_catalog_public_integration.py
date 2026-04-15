from __future__ import annotations

import sys
import unittest
from pathlib import Path

import psycopg
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.settings import get_settings
from app.main import app


class CatalogPublicIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        settings = get_settings()
        if not settings.database_url:
            raise unittest.SkipTest("DATABASE_URL is not configured.")

        cls.database_url = settings.database_url
        cls.client = TestClient(app)
        cls._assert_required_migrations()
        cls._assert_postgis_enabled()

    @classmethod
    def _assert_required_migrations(cls) -> None:
        required = {
            "0001_initial_schema.sql",
            "0002_seed_core.sql",
            "0003_seed_tepic_businesses.sql",
            "0004_public_catalog_indexes.sql",
            "0005_seed_b1_public_catalog.sql",
        }
        with psycopg.connect(cls.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT filename FROM schema_migrations")
                rows = cursor.fetchall()
        applied = {row[0] for row in rows}
        missing = sorted(required - applied)
        if missing:
            raise AssertionError(
                "Missing required migrations for B1 integration tests: "
                + ", ".join(missing)
            )

    @classmethod
    def _assert_postgis_enabled(cls) -> None:
        with psycopg.connect(cls.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT postgis_full_version()")
                value = cursor.fetchone()
        if value is None:
            raise AssertionError("PostGIS extension must be enabled.")

    def test_categories_returns_seeded_public_categories(self) -> None:
        response = self.client.get("/categories")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        slugs = {item["slug"] for item in payload["items"]}
        self.assertIn("restaurant", slugs)
        self.assertIn("cafe", slugs)

    def test_businesses_returns_only_published(self) -> None:
        response = self.client.get("/businesses")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        slugs = {item["slug"] for item in payload["items"]}
        self.assertIn("el-antojito-tepic", slugs)
        self.assertNotIn("negocio-borrador-tepic", slugs)

    def test_businesses_supports_text_category_zone_filters(self) -> None:
        by_text = self.client.get("/businesses", params={"q": "gobernador"})
        self.assertEqual(by_text.status_code, 200)
        text_slugs = {item["slug"] for item in by_text.json()["items"]}
        self.assertIn("el-antojito-tepic", text_slugs)

        by_category = self.client.get("/businesses", params={"category": "cafe"})
        self.assertEqual(by_category.status_code, 200)
        for item in by_category.json()["items"]:
            self.assertIn("cafe", item["categories"])

        by_zone = self.client.get("/businesses", params={"zone": "Centro"})
        self.assertEqual(by_zone.status_code, 200)
        for item in by_zone.json()["items"]:
            self.assertIn("Centro", item["zone"])

    def test_businesses_supports_distance_filter_and_sort(self) -> None:
        response = self.client.get(
            "/businesses",
            params={
                "near_lat": 21.5190269,
                "near_lng": -104.8887590,
                "radius_m": 1500,
                "sort": "distance",
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(len(payload["items"]), 1)
        for item in payload["items"]:
            self.assertIsNotNone(item["distance_m"])
            self.assertLessEqual(item["distance_m"], 1500)

    def test_businesses_supports_pagination(self) -> None:
        response = self.client.get("/businesses", params={"page": 2, "page_size": 2})
        self.assertEqual(response.status_code, 200)
        pagination = response.json()["pagination"]
        self.assertEqual(pagination["page"], 2)
        self.assertEqual(pagination["page_size"], 2)
        self.assertGreaterEqual(pagination["total_items"], 5)

    def test_business_detail_works_and_unpublished_returns_404(self) -> None:
        ok_response = self.client.get("/businesses/el-antojito-tepic")
        self.assertEqual(ok_response.status_code, 200)
        payload = ok_response.json()
        self.assertEqual(payload["slug"], "el-antojito-tepic")
        self.assertIn("opening_hours", payload)

        not_found = self.client.get("/businesses/negocio-borrador-tepic")
        self.assertEqual(not_found.status_code, 404)
        self.assertEqual(not_found.json()["error"]["code"], "BUSINESS_NOT_FOUND")

    def test_business_reviews_returns_only_published_and_404_for_unpublished(self) -> None:
        response = self.client.get(
            "/businesses/el-antojito-tepic/reviews",
            params={"page": 1, "page_size": 10},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(payload["summary"]["rating_count"], 2)
        for review in payload["items"]:
            self.assertEqual(review["status"], "published")

        not_found = self.client.get("/businesses/negocio-borrador-tepic/reviews")
        self.assertEqual(not_found.status_code, 404)
        self.assertEqual(not_found.json()["error"]["code"], "BUSINESS_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
