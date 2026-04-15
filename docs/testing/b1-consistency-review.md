# B1 Consistency Review

## Scope
- Fecha de revision: 2026-04-15.
- Alcance: bloque B1 de catalogo publico (`/health`, `/categories`, `/businesses`, `/businesses/{slug}`, `/businesses/{slug}/reviews`).
- Restricciones: sin auth/favoritos/perfil/resenas de escritura, sin cambios de Render/Vercel.

## Findings (estado actual)
1. `P0` Contrato de identificador cerrado:
   - Se adopto `slug` como identificador canonico para detalle y reseñas publicas.
   - Backend y docs ya estan alineados a `GET /businesses/{slug}` y `GET /businesses/{slug}/reviews`.
2. `P0` Estado de implementacion B1 actualizado en docs:
   - `docs/backend/api-spec.md` refleja endpoints publicos implementados.
3. `P1` Cobertura de pruebas:
   - Existen pruebas de API para contrato B1.
   - Existen pruebas de integracion contra PostgreSQL/PostGIS real.
4. `P1` Seed local reproducible:
   - Se agrego migracion incremental con datos minimos para validar listado, filtros, detalle, reseñas y 404 de no publicado.
5. `P2` Plan de pruebas actualizado a hardening B1:
   - `docs/testing/test-plan.md` y `docs/testing/b1-public-catalog-smoke-e2e.md` ya delimitan alcance B1.

## Consistency Matrix (B1)
- `GET /health`: consistente en docs, codigo y pruebas.
- `GET /categories`: consistente en docs, codigo y pruebas.
- `GET /businesses` (q/category/zone/near/radius/sort/paginacion): consistente en docs, codigo y pruebas.
- `GET /businesses/{slug}`: consistente en docs, codigo y pruebas.
- `GET /businesses/{slug}/reviews`: consistente en docs, codigo y pruebas.

## Blockers (actuales)
1. Ejecutar smoke e2e del flujo publico de forma recurrente en CI (por ahora esta documentado, no automatizado).
2. Mantener disciplina para no introducir endpoints protegidos de B2 en branches de hardening B1.

## Recommended Next Step
- Integrar el smoke B1 como gate automatizado de PR y avanzar a B2 solo cuando ese gate quede estable.
