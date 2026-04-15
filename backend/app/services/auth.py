from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from psycopg import Connection, errors

from app.core.settings import Settings


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASSWORD_SCHEME = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 310000
REFRESH_TOKEN_EXPIRY_DAYS = 30


def _fetch_first_row(cursor: Any) -> Any:
    rows = cursor.fetchall()
    return rows[0] if rows else None


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * ((4 - len(raw) % 4) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def _to_iso8601(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()


def validate_email(email: str) -> bool:
    return bool(EMAIL_PATTERN.match(email.strip()))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return (
        f"{PASSWORD_SCHEME}${PASSWORD_ITERATIONS}$"
        f"{_b64url_encode(salt)}${_b64url_encode(digest)}"
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        scheme, iteration_str, salt_encoded, digest_encoded = password_hash.split("$", 3)
        if scheme != PASSWORD_SCHEME:
            return False
        iterations = int(iteration_str)
        salt = _b64url_decode(salt_encoded)
        expected_digest = _b64url_decode(digest_encoded)
    except (ValueError, TypeError):
        return False

    computed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(computed, expected_digest)


@dataclass(frozen=True)
class AuthContext:
    user_id: str
    session_id: str


class ServiceError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict[str, object] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}


class AuthService:
    def __init__(self, connection: Connection[Any], settings: Settings) -> None:
        self.connection = connection
        self.settings = settings

    def register_user(
        self,
        *,
        name: str,
        email: str,
        password: str,
        phone: str | None,
        user_agent: str | None,
        ip_address: str | None,
    ) -> dict[str, Any]:
        self._assert_auth_enabled()

        email_value = email.strip().lower()
        if not validate_email(email_value):
            raise ServiceError(
                status_code=422,
                code="VALIDATION_ERROR",
                message="Invalid email format.",
            )

        user_id = str(uuid4())
        user_payload: dict[str, Any] | None = None
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO users (
                        id, name, email, phone, password_hash, role
                    )
                    VALUES (%s, %s, %s, %s, %s, 'customer')
                    RETURNING id::text AS id, name, email::text AS email, phone, avatar_url
                    """,
                    [
                        user_id,
                        name.strip(),
                        email_value,
                        phone.strip() if phone else None,
                        hash_password(password),
                    ],
                )
                row = _fetch_first_row(cursor)
                if row is None:
                    raise ServiceError(
                        status_code=500,
                        code="INTERNAL_ERROR",
                        message="User registration failed.",
                    )
                user_payload = dict(row)
                token_payload = self._create_session_tokens(
                    cursor=cursor,
                    user_id=user_id,
                    user_agent=user_agent,
                    ip_address=ip_address,
                )
            self.connection.commit()
        except errors.UniqueViolation as exc:
            self.connection.rollback()
            raise ServiceError(
                status_code=409,
                code="EMAIL_ALREADY_EXISTS",
                message="Email is already registered.",
            ) from exc
        except ServiceError:
            self.connection.rollback()
            raise

        return {"user": user_payload, **token_payload}

    def login_user(
        self,
        *,
        email: str,
        password: str,
        user_agent: str | None,
        ip_address: str | None,
    ) -> dict[str, Any]:
        self._assert_auth_enabled()

        email_value = email.strip().lower()
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        id::text AS id,
                        name,
                        email::text AS email,
                        phone,
                        avatar_url,
                        password_hash
                    FROM users
                    WHERE email = %s
                    LIMIT 1
                    """,
                    [email_value],
                )
                row = _fetch_first_row(cursor)
                if row is None or not verify_password(password, row["password_hash"]):
                    raise ServiceError(
                        status_code=401,
                        code="INVALID_CREDENTIALS",
                        message="Invalid credentials.",
                    )

                user_id = row["id"]
                cursor.execute(
                    "UPDATE users SET last_login_at = now() WHERE id = %s",
                    [user_id],
                )
                user_payload = {
                    "id": row["id"],
                    "name": row["name"],
                    "email": row["email"],
                    "phone": row["phone"],
                    "avatar_url": row["avatar_url"],
                }
                token_payload = self._create_session_tokens(
                    cursor=cursor,
                    user_id=user_id,
                    user_agent=user_agent,
                    ip_address=ip_address,
                )
            self.connection.commit()
        except ServiceError:
            self.connection.rollback()
            raise

        return {"user": user_payload, **token_payload}

    def refresh_access_token(self, refresh_token: str) -> dict[str, Any]:
        self._assert_auth_enabled()
        refresh_token_value = refresh_token.strip()
        if not refresh_token_value:
            raise ServiceError(
                status_code=401,
                code="INVALID_REFRESH_TOKEN",
                message="Refresh token is invalid or expired.",
            )

        refresh_hash = _hash_refresh_token(refresh_token_value)
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id::text AS session_id, user_id::text AS user_id
                FROM sessions
                WHERE refresh_token_hash = %s
                  AND expires_at > now()
                LIMIT 1
                """,
                [refresh_hash],
            )
            row = _fetch_first_row(cursor)
            if row is None:
                raise ServiceError(
                    status_code=401,
                    code="INVALID_REFRESH_TOKEN",
                    message="Refresh token is invalid or expired.",
                )

        issued_at = datetime.now(UTC)
        access_token = self._encode_access_token(
            user_id=row["user_id"],
            session_id=row["session_id"],
            issued_at=issued_at,
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": self.settings.jwt_expire_minutes * 60,
        }

    def resolve_access_token(
        self,
        access_token: str,
        *,
        raise_on_error: bool,
    ) -> AuthContext | None:
        self._assert_auth_enabled()
        token_value = access_token.strip()
        if not token_value:
            return self._auth_error_or_none(raise_on_error)

        payload = self._decode_access_token(token_value, raise_on_error=raise_on_error)
        if payload is None:
            return None

        user_id = payload.get("sub")
        session_id = payload.get("sid")
        token_type = payload.get("type")
        if (
            token_type != "access"
            or not isinstance(user_id, str)
            or not isinstance(session_id, str)
        ):
            return self._auth_error_or_none(raise_on_error)

        if not self._is_valid_uuid(user_id) or not self._is_valid_uuid(session_id):
            return self._auth_error_or_none(raise_on_error)

        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 1
                FROM sessions
                WHERE id = %s
                  AND user_id = %s
                  AND expires_at > now()
                LIMIT 1
                """,
                [session_id, user_id],
            )
            row = _fetch_first_row(cursor)
        if row is None:
            return self._auth_error_or_none(raise_on_error)

        return AuthContext(user_id=user_id, session_id=session_id)

    def logout(self, *, user_id: str, session_id: str) -> None:
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM sessions
                WHERE id = %s
                  AND user_id = %s
                """,
                [session_id, user_id],
            )
        self.connection.commit()

    def get_profile(self, *, user_id: str) -> dict[str, Any]:
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id::text AS id,
                    name,
                    email::text AS email,
                    phone,
                    avatar_url,
                    created_at
                FROM users
                WHERE id = %s
                LIMIT 1
                """,
                [user_id],
            )
            row = _fetch_first_row(cursor)
        if row is None:
            raise ServiceError(
                status_code=401,
                code="AUTH_UNAUTHORIZED",
                message="Authentication required.",
            )
        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "avatar_url": row["avatar_url"],
            "created_at": _to_iso8601(row["created_at"]),
        }

    def list_favorites(self, *, user_id: str) -> list[dict[str, Any]]:
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    f.business_id::text AS business_id,
                    b.slug::text AS slug,
                    b.name,
                    b.zone,
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
                    f.created_at
                FROM favorites f
                JOIN businesses b ON b.id = f.business_id
                WHERE f.user_id = %s
                  AND b.status = 'published'
                ORDER BY f.created_at DESC
                """,
                [user_id],
            )
            rows = cursor.fetchall()
        items = []
        for row in rows:
            items.append(
                {
                    "business_id": row["business_id"],
                    "slug": row["slug"],
                    "name": row["name"],
                    "zone": row["zone"],
                    "cover_image_url": row["cover_image_url"],
                    "created_at": _to_iso8601(row["created_at"]),
                }
            )
        return items

    def add_favorite(self, *, user_id: str, business_id: str) -> dict[str, Any]:
        if not self._is_valid_uuid(business_id):
            raise ServiceError(
                status_code=422,
                code="VALIDATION_ERROR",
                message="Invalid business identifier.",
            )

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT 1
                    FROM businesses
                    WHERE id = %s
                      AND status = 'published'
                    LIMIT 1
                    """,
                    [business_id],
                )
                business = _fetch_first_row(cursor)
                if business is None:
                    raise ServiceError(
                        status_code=404,
                        code="BUSINESS_NOT_FOUND",
                        message="Business not found or not published.",
                    )

                cursor.execute(
                    """
                    INSERT INTO favorites (user_id, business_id)
                    VALUES (%s, %s)
                    RETURNING business_id::text AS business_id, created_at
                    """,
                    [user_id, business_id],
                )
                row = _fetch_first_row(cursor)
            self.connection.commit()
        except errors.UniqueViolation as exc:
            self.connection.rollback()
            raise ServiceError(
                status_code=409,
                code="FAVORITE_ALREADY_EXISTS",
                message="Business is already in favorites.",
            ) from exc
        except ServiceError:
            self.connection.rollback()
            raise

        if row is None:
            raise ServiceError(
                status_code=500,
                code="INTERNAL_ERROR",
                message="Favorite could not be created.",
            )
        return {
            "business_id": row["business_id"],
            "created_at": _to_iso8601(row["created_at"]),
        }

    def delete_favorite(self, *, user_id: str, business_id: str) -> None:
        if not self._is_valid_uuid(business_id):
            raise ServiceError(
                status_code=422,
                code="VALIDATION_ERROR",
                message="Invalid business identifier.",
            )
        with self.connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM favorites
                WHERE user_id = %s
                  AND business_id = %s
                """,
                [user_id, business_id],
            )
        self.connection.commit()

    def _create_session_tokens(
        self,
        *,
        cursor: Any,
        user_id: str,
        user_agent: str | None,
        ip_address: str | None,
    ) -> dict[str, Any]:
        issued_at = datetime.now(UTC)
        session_id = str(uuid4())
        refresh_token = secrets.token_urlsafe(48)
        refresh_token_hash = _hash_refresh_token(refresh_token)
        session_expires_at = issued_at + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)

        cursor.execute(
            """
            INSERT INTO sessions (
                id, user_id, refresh_token_hash, user_agent, ip_address, expires_at
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            [
                session_id,
                user_id,
                refresh_token_hash,
                user_agent,
                ip_address,
                session_expires_at,
            ],
        )

        access_token = self._encode_access_token(
            user_id=user_id,
            session_id=session_id,
            issued_at=issued_at,
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.settings.jwt_expire_minutes * 60,
        }

    def _encode_access_token(
        self,
        *,
        user_id: str,
        session_id: str,
        issued_at: datetime,
    ) -> str:
        expires_at = issued_at + timedelta(minutes=self.settings.jwt_expire_minutes)
        payload = {
            "sub": user_id,
            "sid": session_id,
            "type": "access",
            "iat": int(issued_at.timestamp()),
            "exp": int(expires_at.timestamp()),
        }
        return self._encode_jwt(payload)

    def _encode_jwt(self, payload: dict[str, Any]) -> str:
        if self.settings.jwt_algorithm != "HS256":
            raise ServiceError(
                status_code=503,
                code="AUTH_CONFIGURATION_ERROR",
                message="Unsupported JWT algorithm.",
            )
        header = {"alg": self.settings.jwt_algorithm, "typ": "JWT"}
        encoded_header = _b64url_encode(
            json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
        )
        encoded_payload = _b64url_encode(
            json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
        )
        signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
        signature = hmac.new(
            self.settings.jwt_secret.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        encoded_signature = _b64url_encode(signature)
        return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

    def _decode_access_token(
        self,
        token: str,
        *,
        raise_on_error: bool,
    ) -> dict[str, Any] | None:
        parts = token.split(".")
        if len(parts) != 3:
            return self._auth_error_or_none(raise_on_error)

        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
        try:
            header = json.loads(_b64url_decode(encoded_header))
            payload = json.loads(_b64url_decode(encoded_payload))
            signature = _b64url_decode(encoded_signature)
        except (ValueError, json.JSONDecodeError):
            return self._auth_error_or_none(raise_on_error)

        if not isinstance(header, dict) or header.get("alg") != self.settings.jwt_algorithm:
            return self._auth_error_or_none(raise_on_error)

        expected_signature = hmac.new(
            self.settings.jwt_secret.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(signature, expected_signature):
            return self._auth_error_or_none(raise_on_error)
        if not isinstance(payload, dict):
            return self._auth_error_or_none(raise_on_error)
        exp = payload.get("exp")
        if not isinstance(exp, int):
            return self._auth_error_or_none(raise_on_error)
        if datetime.now(UTC).timestamp() >= exp:
            return self._auth_error_or_none(raise_on_error)
        return payload

    def _assert_auth_enabled(self) -> None:
        if not self.settings.jwt_secret:
            raise ServiceError(
                status_code=503,
                code="AUTH_CONFIGURATION_ERROR",
                message="Authentication is not configured.",
            )

    @staticmethod
    def _is_valid_uuid(value: str) -> bool:
        try:
            UUID(value)
        except (ValueError, TypeError):
            return False
        return True

    @staticmethod
    def _auth_error_or_none(raise_on_error: bool) -> None:
        if raise_on_error:
            raise ServiceError(
                status_code=401,
                code="AUTH_UNAUTHORIZED",
                message="Authentication required.",
            )
        return None
