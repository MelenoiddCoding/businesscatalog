from collections.abc import Generator

import psycopg
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg.rows import dict_row

from app.core.settings import get_settings
from app.services.catalog import BusinessQueryFilters, CatalogService, ReviewQueryFilters


settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


def _build_error(
    code: str,
    message: str,
    details: dict[str, object] | None = None,
) -> dict[str, object]:
    return {"error": {"code": code, "message": message, "details": details or {}}}


def _raise_http_error(
    status_code: int,
    code: str,
    message: str,
    details: dict[str, object] | None = None,
) -> None:
    raise HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message, "details": details or {}},
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    _ = request
    return JSONResponse(
        status_code=422,
        content=_build_error(
            code="VALIDATION_ERROR",
            message="Invalid request parameters.",
            details={"errors": exc.errors()},
        ),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    _ = request
    if isinstance(exc.detail, dict):
        code = str(exc.detail.get("code", "HTTP_ERROR"))
        message = str(exc.detail.get("message", "Request failed."))
        details = exc.detail.get("details", {})
        if not isinstance(details, dict):
            details = {}
    else:
        code = "HTTP_ERROR"
        message = str(exc.detail)
        details = {}

    return JSONResponse(
        status_code=exc.status_code,
        content=_build_error(code=code, message=message, details=details),
    )


def get_db_connection() -> Generator[psycopg.Connection[dict], None, None]:
    if not settings.database_url:
        _raise_http_error(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="Database is not configured.",
        )
    try:
        connection = psycopg.connect(settings.database_url, row_factory=dict_row)
    except psycopg.Error as exc:
        _raise_http_error(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="Database connection failed.",
            details={"reason": str(exc)},
        )

    try:
        yield connection
    finally:
        connection.close()


def get_catalog_service(
    connection: psycopg.Connection[dict] = Depends(get_db_connection),
) -> CatalogService:
    return CatalogService(connection)


def _validate_business_search(
    sort: str,
    near_lat: float | None,
    near_lng: float | None,
) -> None:
    if (near_lat is None) != (near_lng is None):
        _raise_http_error(
            status_code=422,
            code="VALIDATION_ERROR",
            message="near_lat and near_lng must be provided together.",
        )
    if sort == "distance" and (near_lat is None or near_lng is None):
        _raise_http_error(
            status_code=422,
            code="VALIDATION_ERROR",
            message="sort=distance requires near_lat and near_lng.",
        )


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "environment": settings.app_environment,
        "app_name": settings.app_name,
        "database_configured": bool(settings.database_url),
    }


@app.get("/categories")
def list_categories(
    catalog_service: CatalogService = Depends(get_catalog_service),
) -> dict[str, object]:
    return {"items": catalog_service.list_categories()}


@app.get("/businesses")
def list_businesses(
    q: str | None = Query(default=None, min_length=1, max_length=120),
    category: str | None = Query(default=None, min_length=1, max_length=80),
    zone: str | None = Query(default=None, min_length=1, max_length=120),
    near_lat: float | None = Query(default=None, ge=-90, le=90),
    near_lng: float | None = Query(default=None, ge=-180, le=180),
    radius_m: int = Query(default=5000, ge=1, le=20000),
    sort: str = Query(default="relevance", pattern="^(relevance|distance|rating)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    catalog_service: CatalogService = Depends(get_catalog_service),
) -> dict[str, object]:
    _validate_business_search(sort=sort, near_lat=near_lat, near_lng=near_lng)

    filters = BusinessQueryFilters(
        q=q,
        category=category,
        zone=zone,
        near_lat=near_lat,
        near_lng=near_lng,
        radius_m=radius_m,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return catalog_service.list_businesses(filters)


@app.get("/businesses/{identifier}")
def get_business_detail(
    identifier: str,
    catalog_service: CatalogService = Depends(get_catalog_service),
) -> dict[str, object]:
    business = catalog_service.get_business_detail(identifier)
    if business is None:
        _raise_http_error(
            status_code=404,
            code="BUSINESS_NOT_FOUND",
            message="Business not found or not published.",
        )
    return business


@app.get("/businesses/{identifier}/reviews")
def get_business_reviews(
    identifier: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    catalog_service: CatalogService = Depends(get_catalog_service),
) -> dict[str, object]:
    filters = ReviewQueryFilters(page=page, page_size=page_size)
    reviews = catalog_service.list_business_reviews(identifier=identifier, filters=filters)
    if reviews is None:
        _raise_http_error(
            status_code=404,
            code="BUSINESS_NOT_FOUND",
            message="Business not found or not published.",
        )
    return reviews
