# API Spec

## Estado del documento
Este documento es el contrato REST canonico para el MVP.

- Estado backend actual (2026-04-15): implementados `GET /health`, `GET /categories`, `GET /businesses`, `GET /businesses/{slug}`, `GET /businesses/{slug}/reviews`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, `GET /favorites`, `POST /favorites/{businessId}` y `DELETE /favorites/{businessId}`.
- Estado de orquestacion: los endpoints de auth, businesses, favorites y reviews quedan definidos aqui para eliminar ambiguedad entre frontend, backend y data.

## Convenciones globales
- Base path: `/`
- Formato: `application/json`
- Auth: `Authorization: Bearer <access_token>` para endpoints protegidos.
- Identificadores:
  - `business.slug` para rutas publicas de detalle.
  - `business.id` (uuid) para mutaciones autenticadas como favoritos y resenas.
- Timezone de referencia para horarios en UI: `America/Mexico_City`.
- Visibilidad de datos en capa publica:
  - Solo negocios `published` en `GET /businesses` y `GET /businesses/{slug}`.
  - Solo productos `active` en detalle de negocio.
  - Solo resenas `published` en `GET /businesses/{slug}/reviews`.
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
Publico. Solo resenas `published`.

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

Errores: `409` resena activa duplicada para mismo usuario-negocio, `422` validacion.

## Bloques de implementacion (backend)
### Bloque B1: Catalogo publico base (cerrado)
Alcance cerrado:
- `GET /categories`
- `GET /businesses`
- `GET /businesses/{slug}`
- `GET /businesses/{slug}/reviews`

### Bloque B2: Auth + Favoritos + Perfil basico (implementado)
Objetivo:
- Habilitar flujos autenticados minimos del MVP sin expandir alcance funcional.

Alcance:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `GET /favorites`
- `POST /favorites/{businessId}`
- `DELETE /favorites/{businessId}`

Validaciones y reglas de negocio:
- Auth:
  - `POST /auth/register` valida campos requeridos y rechaza email duplicado con `409`.
  - `POST /auth/login` responde `401` para credenciales invalidas sin filtrar detalle sensible.
  - `POST /auth/refresh` renueva access token solo con refresh token valido.
  - `POST /auth/logout` invalida sesion activa y responde `204`.
- Perfil:
  - `GET /me` requiere token valido y devuelve datos basicos de cuenta.
  - `PATCH /me` se mantiene Post-MVP y no entra en B2.
- Favoritos:
  - Todas las rutas requieren sesion autenticada.
  - `POST /favorites/{businessId}` solo permite negocios `published`; `404` si no existe/no publicado; `409` si duplicado.
  - `DELETE /favorites/{businessId}` es idempotente y no rompe flujo de cliente.
  - `GET /favorites` devuelve lista del usuario autenticado con shape definido.
- Personalizacion:
  - Con sesion valida, `is_favorited` en endpoints publicos debe reflejar estado real del usuario.
  - Sin sesion valida, `is_favorited` debe mantenerse en `false`.

Criterios de terminado:
- Todos los endpoints de B2 responden con los shapes y codigos definidos en este documento.
- Existen pruebas de integracion para:
  - registro/login/refresh/logout,
  - `GET /me` autenticado y no autenticado,
  - favoritos add/list/delete con casos `201`, `204`, `404`, `409`, `401`.
- El flujo frontend cubre auth, guardas basicas para Favoritos/Perfil, y manejo de sesion expirada.
- No se introducen endpoints o capacidades fuera de B2.

## Matriz de estado (orquestacion)
- `GET /health`: implementado.
- Bloque B1 publico implementado: `GET /categories`, `GET /businesses`, `GET /businesses/{slug}`, `GET /businesses/{slug}/reviews`.
- Bloque B2 autenticado implementado: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, `GET /favorites`, `POST /favorites/{businessId}`, `DELETE /favorites/{businessId}`.

## Endpoints Post-MVP (documentados, no activos en MVP vigente)
- `PATCH /me` (edicion de perfil).
- `POST /businesses/{businessId}/reviews` (publicar resenas desde cliente).


