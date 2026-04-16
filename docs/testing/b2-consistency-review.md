# B2 Consistency Review

## Scope
- Fecha de revision: 2026-04-15.
- Alcance: B2 (`auth + favorites + perfil basico`) y regresion minima de B1.
- Restriccion: sin expansion de features fuera de B2.

## Source of truth
- `docs/product/acceptance-criteria.md`
- `docs/backend/api-spec.md`
- `docs/backend/data-model.md`
- `docs/testing/test-plan.md`

## Hallazgos (codigo vs docs)
1. `P0` Implementacion B2 alineada en backend:
   - Existen rutas para `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, `GET/POST/DELETE /favorites` en `backend/app/main.py`.
2. `P0` Implementacion B2 alineada en frontend:
   - Existen rutas/pantallas minimas `/auth`, `/favorites`, `/profile`.
   - Existe integracion de favoritos en listado y ficha de negocio.
3. `P1` Modelo de datos soporta B2 y se endurece con migracion incremental:
   - `users`, `sessions`, `favorites` en `0001_initial_schema.sql`.
   - hardening en `0007_b2_auth_favorites_indexes.sql`.
4. `P1` Cobertura de pruebas backend para B2 agregada:
   - `backend/tests/test_auth_favorites_integration.py`.
5. `P1` Documentacion de smoke B2 agregada:
   - `docs/testing/b2-auth-favorites-profile-smoke-e2e.md`.

## Consistency matrix (B2)
- `POST /auth/register`: doc `OK` / codigo `OK`.
- `POST /auth/login`: doc `OK` / codigo `OK`.
- `POST /auth/refresh`: doc `OK` / codigo `OK`.
- `POST /auth/logout`: doc `OK` / codigo `OK`.
- `GET /me`: doc `OK` / codigo `OK`.
- `GET /favorites`: doc `OK` / codigo `OK`.
- `POST /favorites/{businessId}`: doc `OK` / codigo `OK`.
- `DELETE /favorites/{businessId}`: doc `OK` / codigo `OK`.
- Guardas frontend para rutas protegidas: doc `OK` / codigo `OK`.

## Cierre de salida (2026-04-15)
1. Migracion `0007_b2_auth_favorites_indexes.sql` aplicada en la base objetivo y registrada en `schema_migrations`.
2. Verificacion de indices `sessions_refresh_token_hash_key` y `favorites_user_created_at_idx` en `OK`.
3. Smoke B2 ejecutado con resultado global `OK` y evidencia en `docs/testing/b2-exit-report-2026-04-15.md`.
4. Gate de regresion B1 ejecutado en `OK` durante el cierre de B2.

## Siguiente paso recomendado
1. Mantener el mismo gate de smoke/regresion para cualquier cambio futuro que toque auth, favoritos o perfil.
