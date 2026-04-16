# B2 Exit Report (2026-04-15)

## Objetivo
Registrar evidencia formal de cierre para B2 (`Auth + Favoritos + Perfil basico`) sin expandir alcance funcional.

## Estado de migracion 0007
- Migracion objetivo: `backend/migrations/0007_b2_auth_favorites_indexes.sql`
- Resultado: `APPLIED`

Validacion ejecutada en base objetivo:
- `schema_migrations` contiene:
  - `0001_initial_schema.sql`
  - `0002_seed_core.sql`
  - `0003_seed_tepic_businesses.sql`
  - `0004_public_catalog_indexes.sql`
  - `0005_seed_b1_public_catalog.sql`
  - `0006_seed_b1_real_images.sql`
  - `0007_b2_auth_favorites_indexes.sql`

Indices requeridos:
- `sessions_refresh_token_hash_key`: `OK`
- `favorites_user_created_at_idx`: `OK`

## Smoke B2 (segun `docs/testing/b2-auth-favorites-profile-smoke-e2e.md`)
Resultado global: `OK`

### Backend smoke (API)
Checks ejecutados y en `OK`:
- registro `201` y duplicado `409`
- login valido `200` e invalido `401`
- refresh valido `200` e invalido `401`
- `GET /me` con token `200` y sin token `401`
- favoritos:
  - `POST /favorites/{businessId_publicado}` `201`
  - duplicado `409`
  - `GET /favorites` incluye negocio guardado
  - `DELETE /favorites/{businessId_publicado}` `204`
  - `POST`/`DELETE` sin token `401`
  - `POST /favorites/{businessId_no_publicado}` `404`
- logout `204` y token revocado para `/me` (`401`)

### Regresion B1 durante smoke de salida
Checks API en `OK`:
- `GET /categories` `200`
- `GET /businesses` `200`
- `GET /businesses/{slug}` `200`
- `GET /businesses/{slug}/reviews` `200`

### Evidencia tecnica adicional
- `python -m unittest discover -s backend\\tests -p "test_auth*.py"` -> `OK` (3 tests)
- `python -m unittest discover -s backend\\tests -p "test_catalog_public*.py"` -> `OK` (15 tests)
- `npm run build` (frontend) -> `OK`

## Deriva documental corregida
- `docs/backend/data-model.md`: estado de bloque actualizado a B2 cerrado.
- `docs/testing/test-plan.md`: objetivo actualizado de "abrir B2" a "cerrar B2".
- `docs/testing/b2-consistency-review.md`: gaps de salida marcados como resueltos.

## Dictamen de cierre
- B2 puede declararse cerrado: `SI`
- Bloqueadores reales pendientes de salida: `NINGUNO`
