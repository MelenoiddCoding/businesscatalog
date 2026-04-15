from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

import psycopg
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.settings import get_settings
from app.main import app


class AuthFavoritesIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        settings = get_settings()
        if not settings.database_url:
            raise unittest.SkipTest("DATABASE_URL is not configured.")
        if not settings.jwt_secret:
            raise unittest.SkipTest("JWT_SECRET is not configured.")

        cls.database_url = settings.database_url
        cls.client = TestClient(app)
        cls.email_prefix = f"b2-int-{uuid4().hex[:8]}"

    @classmethod
    def tearDownClass(cls) -> None:
        with psycopg.connect(cls.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM users
                    WHERE email::text ILIKE %s
                    """,
                    [f"{cls.email_prefix}%"],
                )
            connection.commit()

    def _register_user(self, *, suffix: str | None = None) -> dict[str, object]:
        user_suffix = suffix or uuid4().hex[:8]
        email = f"{self.email_prefix}-{user_suffix}@example.com"
        response = self.client.post(
            "/auth/register",
            json={
                "name": "B2 Integration User",
                "email": email,
                "password": "super-secret-123",
                "phone": "+523111000111",
            },
        )
        self.assertEqual(response.status_code, 201)
        return response.json()

    def _get_business_id_by_slug(self, slug: str) -> str:
        with psycopg.connect(self.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id::text FROM businesses WHERE slug = %s LIMIT 1",
                    [slug],
                )
                row = cursor.fetchone()
        self.assertIsNotNone(row)
        return row[0]

    def test_register_login_refresh_logout_me(self) -> None:
        registered = self._register_user()
        access_token = registered["access_token"]
        refresh_token = registered["refresh_token"]

        me_response = self.client.get(
            "/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()["email"], registered["user"]["email"])

        login_response = self.client.post(
            "/auth/login",
            json={
                "email": registered["user"]["email"],
                "password": "super-secret-123",
            },
        )
        self.assertEqual(login_response.status_code, 200)
        login_payload = login_response.json()

        refresh_response = self.client.post(
            "/auth/refresh",
            json={"refresh_token": login_payload["refresh_token"]},
        )
        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn("access_token", refresh_response.json())

        logout_response = self.client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {login_payload['access_token']}"},
        )
        self.assertEqual(logout_response.status_code, 204)

        me_after_logout = self.client.get(
            "/me",
            headers={"Authorization": f"Bearer {login_payload['access_token']}"},
        )
        self.assertEqual(me_after_logout.status_code, 401)
        self.assertEqual(me_after_logout.json()["error"]["code"], "AUTH_UNAUTHORIZED")

        refresh_after_logout = self.client.post(
            "/auth/refresh",
            json={"refresh_token": login_payload["refresh_token"]},
        )
        self.assertEqual(refresh_after_logout.status_code, 401)
        self.assertEqual(
            refresh_after_logout.json()["error"]["code"],
            "INVALID_REFRESH_TOKEN",
        )

        previous_refresh_after_new_login = self.client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        self.assertEqual(previous_refresh_after_new_login.status_code, 200)

    def test_login_with_invalid_credentials_returns_401(self) -> None:
        registered = self._register_user()
        response = self.client.post(
            "/auth/login",
            json={
                "email": registered["user"]["email"],
                "password": "wrong-password-123",
            },
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "INVALID_CREDENTIALS")

    def test_favorites_add_list_delete_and_errors(self) -> None:
        registered = self._register_user()
        access_token = registered["access_token"]

        unauthorized_list = self.client.get("/favorites")
        self.assertEqual(unauthorized_list.status_code, 401)

        published_business_id = self._get_business_id_by_slug("el-antojito-tepic")
        draft_business_id = self._get_business_id_by_slug("negocio-borrador-tepic")

        add_response = self.client.post(
            f"/favorites/{published_business_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(add_response.status_code, 201)
        add_payload = add_response.json()
        self.assertEqual(add_payload["business_id"], published_business_id)

        duplicate_response = self.client.post(
            f"/favorites/{published_business_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(duplicate_response.status_code, 409)
        self.assertEqual(
            duplicate_response.json()["error"]["code"],
            "FAVORITE_ALREADY_EXISTS",
        )

        public_without_session = self.client.get("/businesses")
        self.assertEqual(public_without_session.status_code, 200)
        plain_item = next(
            (
                item
                for item in public_without_session.json()["items"]
                if item["id"] == published_business_id
            ),
            None,
        )
        self.assertIsNotNone(plain_item)
        self.assertFalse(plain_item["is_favorited"])

        public_with_session = self.client.get(
            "/businesses",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(public_with_session.status_code, 200)
        personalized_item = next(
            (
                item
                for item in public_with_session.json()["items"]
                if item["id"] == published_business_id
            ),
            None,
        )
        self.assertIsNotNone(personalized_item)
        self.assertTrue(personalized_item["is_favorited"])

        list_response = self.client.get(
            "/favorites",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(list_response.status_code, 200)
        items = list_response.json()["items"]
        self.assertTrue(any(item["business_id"] == published_business_id for item in items))

        missing_business_response = self.client.post(
            f"/favorites/{draft_business_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(missing_business_response.status_code, 404)
        self.assertEqual(
            missing_business_response.json()["error"]["code"],
            "BUSINESS_NOT_FOUND",
        )

        delete_response = self.client.delete(
            f"/favorites/{published_business_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(delete_response.status_code, 204)

        list_after_delete = self.client.get(
            "/favorites",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(list_after_delete.status_code, 200)
        items_after_delete = list_after_delete.json()["items"]
        self.assertFalse(
            any(item["business_id"] == published_business_id for item in items_after_delete)
        )


if __name__ == "__main__":
    unittest.main()
