# B1 Consistency Review

## Scope
- Fecha de revision: 2026-04-15.
- Alcance: bloque B1 de catalogo publico (`/health`, `/categories`, `/businesses`, `/businesses/{slug}`, busqueda/filtros publicos).
- Restricciones: sin auth/favoritos/perfil/resenas de escritura, sin cambios de Render/Vercel.

## Findings
1. `P0` Estado de implementacion en docs desactualizado:
   - `docs/backend/api-spec.md` todavia declara que solo `GET /health` esta implementado.
   - El codigo backend ya expone `GET /categories`, `GET /businesses`, `GET /businesses/{identifier}` y `GET /businesses/{identifier}/reviews`.
2. `P1` Divergencia de identificador en detalle/reviews:
   - Docs canonicos de B1 definen rutas publicas con `slug`.
   - Backend acepta `identifier` (slug o id UUID) para detalle y reviews.
3. `P1` Frontend B1 de Home/Listado ya existe y consume endpoints publicos reales:
   - Hay flujo funcional de Home/Listado con busqueda, filtros categoria/zona/cercania y estados loading/empty/error.
   - No se implementan auth/favoritos/perfil/resenas de escritura, alineado a alcance B1.
4. `P1` Gaps de pruebas:
   - No hay pruebas automatizadas backend/frontend para validar B1.
   - `docs/testing/test-plan.md` y `docs/testing/test-cases.md` siguen incluyendo alcance fuera de B1/MVP vigente (mapa dedicado, envio de resena, edicion de perfil).
5. `P2` Divergencia documental menor de migraciones:
   - Existe `backend/migrations/0004_public_catalog_indexes.sql`.
   - Algunos docs de estado base siguen mencionando solo `0001`, `0002`, `0003`.

## Consistency Matrix (B1)
- `GET /health`: consistente en docs y codigo.
- `GET /categories`: implementado en backend; cliente frontend lo consume.
- `GET /businesses` (q/category/zone/near/radius/sort/paginacion): implementado en backend; Home/Listado lo consume.
- `GET /businesses/{slug}`: implementado en backend con parametro `identifier` (slug/id), no estrictamente igual al contrato documental actual.
- `GET /businesses/{slug}/reviews`: implementado en backend con parametro `identifier` (slug/id), no estrictamente igual al contrato documental actual.

## Blockers (actionable)
1. Alinear contrato de identificador para detalle/reviews:
   - Opcion A: mantener `slug` canonico y restringir backend a slug.
   - Opcion B: oficializar `identifier` en docs y criterios.
2. Actualizar `docs/backend/api-spec.md` (estado de implementacion y matriz) para evitar decisiones sobre informacion obsoleta.
3. Agregar pruebas minimas de B1:
   - Backend: filtros por `category`/`zone`, cercania, paginacion y `404` en no publicado.
   - Frontend: smoke del flujo Home/Listado y estados loading/empty/error.
4. Limpiar docs de testing fuera de alcance B1/MVP vigente:
   - Quitar mapa dedicado, envio de resena y edicion de perfil del bloque actual.

## Recommended Next Step
- Ejecutar un mini cierre de consistencia docs-codigo en este orden: (1) contrato de identificador, (2) estado real de B1 en `api-spec`, (3) pruebas minimas backend/frontend, (4) limpieza de plan/casos de prueba.
