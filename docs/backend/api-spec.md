# API Spec

## Estado del documento
Este documento es el contrato REST canonico para el MVP.

- Estado backend actual (2026-04-15): implementados `GET /health`, `GET /categories`, `GET /businesses`, `GET /businesses/{slug}` y `GET /businesses/{slug}/reviews`.
- Estado de orquestacion: los endpoints de auth, businesses, favorites y reviews quedan definidos aqui para eliminar ambiguedad entre frontend, backend y data.

## Convenciones globales
- Base path: `/`
- Formato: `application/json`
- Auth: `Authorization: Bearer <access_token>` para endpoints protegidos.
- Identificadores:
  - `business.slug` para rutas publicas de detalle.
  - `business.id` (uuid) para mutaciones autenticadas como favoritos y reseÃ±as.
- Timezone de referencia para horarios en UI: `America/Mexico_City`.
- Visibilidad de datos en capa publica:
  - Solo negocios `published` en `GET /businesses` y `GET /businesses/{slug}`.
  - Solo productos `active` en detalle de negocio.
  - Solo rese�as `published` en `GET /businesses/{slug}/reviews`.
- Personalizacion sin sesion:
  - `is_favorited` se devuelve siempre.
  - Si no hay sesion valida, `is_favorited` debe ser `false`.

## Envelope de error
Todas las respuestas de error deben seguir:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Health
### `GET /health`
Publico.

Respuesta `200`:

```json
{
  "status": "ok",
  "environment": "local",
  "app_name": "Tepic Catalog",
  "database_configured": true
}
```

## Auth
### `POST /auth/register`
Publico. Crea usuario customer.

Request:

```json
{
  "name": "Ana Perez",
  "email": "ana@example.com",
  "password": "super-secret-123",
  "phone": "+523111234567"
}
```

Respuesta `201`:

```json
{
  "user": {
    "id": "uuid",
    "name": "Ana Perez",
    "email": "ana@example.com",
    "phone": "+523111234567",
    "avatar_url": null
  },
  "access_token": "jwt",
  "refresh_token": "opaque-or-jwt",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Errores: `409` email existente, `422` validacion.

### `POST /auth/login`
Publico.

Request:

```json
{
  "email": "ana@example.com",
  "password": "super-secret-123"
}
```

Respuesta `200`: mismo shape que `POST /auth/register`.
Errores: `401` credenciales invalidas.

### `POST /auth/refresh`
Publico con `refresh_token`.

Request:

```json
{
  "refresh_token": "opaque-or-jwt"
}
```

Respuesta `200`:

```json
{
  "access_token": "jwt",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Errores: `401` token invalido/expirado.

### `POST /auth/logout`
Protegido. Invalida sesion actual.

Respuesta `204`.

### `GET /me`
Protegido.

Respuesta `200`:

```json
{
  "id": "uuid",
  "name": "Ana Perez",
  "email": "ana@example.com",
  "phone": "+523111234567",
  "avatar_url": null,
  "created_at": "2026-04-15T00:00:00Z"
}
```

### `PATCH /me`
Post-MVP (fuera del alcance MVP actual). No implementar en el bloque vigente.

Protegido.

Request:

```json
{
  "name": "Ana P.",
  "phone": "+523111234567",
  "avatar_url": "https://cdn.example/avatar.jpg"
}
```

Respuesta `200`: mismo shape de `GET /me`.

## Catalogo
### `GET /categories`
Publico.

Respuesta `200`:

```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "restaurant",
      "name": "Restaurant",
      "icon": "restaurant"
    }
  ]
}
```

### `GET /businesses`
Publico. Lista paginada para home, buscar y filtros del MVP.

Query params:
- `q` (string; busca por nombre de negocio, categoria y producto)
- `category` (slug)
- `zone` (string)
- `near_lat` (decimal)
- `near_lng` (decimal)
- `radius_m` (int, default `5000`, max `20000`)
- `sort` (`relevance` | `distance` | `rating`)
- `page` (default `1`)
- `page_size` (default `20`, max `50`)

Respuesta `200`:

```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "el-antojito-tepic",
      "name": "El Antojito",
      "description": "Mexican restaurant...",
      "zone": "Centro",
      "address": "Avenida Mexico 614 A...",
      "rating_avg": 4.6,
      "rating_count": 12,
      "whatsapp_number": "+523111622020",
      "is_open_now": null,
      "distance_m": 850,
      "categories": ["restaurant"],
      "cover_image_url": "https://cdn.example/business/cover.jpg",
      "location": {
        "latitude": 21.519026,
        "longitude": -104.888759
      },
      "is_favorited": false
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

### `GET /businesses/{slug}`
Publico.


Respuesta `200`:

```json
{
  "id": "uuid",
  "slug": "el-antojito-tepic",
  "name": "El Antojito",
  "description": "Mexican restaurant...",
  "phone": "+523111622020",
  "whatsapp_number": "+523111622020",
  "email": null,
  "website": null,
  "address": "Avenida Mexico 614 A...",
  "zone": "Centro",
  "rating_avg": 4.6,
  "rating_count": 12,
  "is_verified": false,
  "categories": [
    { "slug": "restaurant", "name": "Restaurant" }
  ],
  "location": {
    "latitude": 21.519026,
    "longitude": -104.888759
  },
  "opening_hours": {},
  "images": [
    { "url": "https://cdn.example/business/cover.jpg", "kind": "cover", "position": 0 }
  ],
  "products": [
    { "id": "uuid", "name": "Producto", "description": null, "price": 120, "currency": "MXN", "is_featured": true }
  ],
  "is_favorited": false
}
```

Errores: `404` no existe o no publicado.

Nota de alineacion con data model:
- `opening_hours` puede venir de `business_locations.opening_hours` con shape canonico JSON por dia.
- Si el seed legado trae horario en formato string, backend debe normalizar al shape JSON canonico antes de responder.

## Favorites
### `GET /favorites`
Protegido.

Respuesta `200`:

```json
{
  "items": [
    {
      "business_id": "uuid",
      "slug": "el-antojito-tepic",
      "name": "El Antojito",
      "zone": "Centro",
      "cover_image_url": "https://cdn.example/business/cover.jpg",
      "created_at": "2026-04-15T00:00:00Z"
    }
  ]
}
```

### `POST /favorites/{businessId}`
Protegido.

Respuesta `201`:

```json
{
  "business_id": "uuid",
  "created_at": "2026-04-15T00:00:00Z"
}
```

Errores: `404` negocio no publicado, `409` ya existe.

### `DELETE /favorites/{businessId}`
Protegido.

Respuesta `204`.

## Reviews
### `GET /businesses/{slug}/reviews`
Publico. Solo reseÃ±as `published`.

Query params:
- `page` (default `1`)
- `page_size` (default `20`, max `50`)

Respuesta `200`:

```json
{
  "items": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Excelente",
      "status": "published",
      "visited_at": "2026-04-14",
      "author": {
        "name": "Ana P.",
        "avatar_url": null
      },
      "created_at": "2026-04-15T00:00:00Z"
    }
  ],
  "summary": {
    "rating_avg": 4.6,
    "rating_count": 12
  },
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

### `POST /businesses/{businessId}/reviews`
Post-MVP (fuera del alcance MVP actual). No implementar en el bloque vigente.

Protegido.

Request:

```json
{
  "rating": 5,
  "comment": "Excelente servicio",
  "visited_at": "2026-04-14"
}
```

Respuesta `201`:

```json
{
  "id": "uuid",
  "business_id": "uuid",
  "rating": 5,
  "comment": "Excelente servicio",
  "status": "pending",
  "visited_at": "2026-04-14",
  "created_at": "2026-04-15T00:00:00Z"
}
```

Errores: `409` reseÃ±a activa duplicada para mismo usuario-negocio, `422` validacion.

## Siguiente bloque implementable (backend)
### Bloque B1: Catalogo publico base
Objetivo:
- Habilitar el flujo minimo navegable del MVP sin auth: categorias, listado, detalle y reseñas publicas.

Alcance:
- `GET /categories`
- `GET /businesses`
- `GET /businesses/{slug}`
- `GET /businesses/{slug}/reviews`

Validaciones y reglas de negocio:
- `GET /categories`
  - Devolver `id`, `slug`, `name`, `icon`.
  - Orden recomendado: `name` asc.
- `GET /businesses`
  - `page >= 1`, `page_size` entre `1` y `50`.
  - `q` aplica busqueda textual sobre nombre de negocio, categoria y productos.
  - `radius_m` default `5000`, max `20000`.
  - Si llega `sort=distance`, `near_lat` y `near_lng` son obligatorios.
  - Si llega `near_lat` debe llegar `near_lng` (y viceversa).
  - Solo incluir negocios `published`.
  - `cover_image_url` toma imagen `kind=cover`; fallback a primera `gallery`; si no hay imagen devolver `null`.
- `GET /businesses/{slug}`
  - Solo responde negocios `published`; en otro caso `404`.
  - `products` solo con `status=active`.
  - `images` ordenadas por `position` asc.
  - `opening_hours` normalizado al shape JSON canonico.
- `GET /businesses/{slug}/reviews`
  - Solo reseñas `published`.
  - Orden por `created_at desc`.
  - `summary.rating_avg` y `summary.rating_count` deben reflejar solo publicadas.

Criterios de terminado:
- Los 4 endpoints responden con los shapes definidos en este documento.
- Existen pruebas de integracion para:
  - filtros por `category` y `zone`,
  - paginacion de `businesses` y `reviews`,
  - busqueda por cercania (`near_lat`, `near_lng`, `radius_m`),
  - manejo de `404` para slug no publicado.
- Seeds actuales (`0002`, `0003`) permiten probar manualmente todo el bloque sin datos adicionales.
- `GET /health` permanece sin cambios.

## Matriz de estado (orquestacion)
- `GET /health`: implementado.
- Bloque B1 publico implementado: `GET /categories`, `GET /businesses`, `GET /businesses/{slug}`, `GET /businesses/{slug}/reviews`.
- Endpoints protegidos fuera de B1: pendientes segun alcance MVP.

## Endpoints Post-MVP (documentados, no activos en MVP vigente)
- `PATCH /me` (edicion de perfil).
- `POST /businesses/{businessId}/reviews` (publicar resenas desde cliente).


