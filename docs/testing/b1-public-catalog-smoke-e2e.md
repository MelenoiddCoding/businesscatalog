# B1 Public Catalog Smoke E2E

## Objetivo
Validar rapidamente que el flujo publico del catalogo funciona extremo a extremo antes de avanzar a B2.

## Alcance
- Incluido:
  - `GET /health`
  - `GET /categories`
  - `GET /businesses` (texto/categoria/zona/cercania/paginacion)
  - `GET /businesses/{slug}`
  - `GET /businesses/{slug}/reviews`
  - Home/Listado frontend con estados `loading`, `empty`, `error`
- Excluido:
  - auth
  - favoritos
  - perfil
  - escritura de reseñas

## Prerrequisitos
1. Base local preparada:
   - `powershell -ExecutionPolicy Bypass -File .\\scripts\\bootstrap-db.ps1`
   - `powershell -ExecutionPolicy Bypass -File .\\scripts\\migrate-db.ps1`
2. Backend corriendo en `http://localhost:8000`.
3. Frontend corriendo en `http://localhost:3000`.

## Checklist Smoke
1. Health:
   - `GET /health` responde `200` y `database_configured=true`.
2. Categorias:
   - `GET /categories` responde `200` y trae al menos `restaurant` y `cafe`.
3. Listado base:
   - `GET /businesses` responde `200` con `items` y `pagination`.
   - no incluye negocios `draft`.
4. Filtros publicos:
   - `q=gobernador` devuelve `el-antojito-tepic`.
   - `category=cafe` devuelve solo negocios con categoria `cafe`.
   - `zone=Centro` devuelve negocios de zona centro.
   - con `near_lat`, `near_lng`, `sort=distance` devuelve `distance_m` no nulo.
5. Detalle:
   - `GET /businesses/el-antojito-tepic` responde `200`.
   - `GET /businesses/negocio-borrador-tepic` responde `404`.
6. Reseñas:
   - `GET /businesses/el-antojito-tepic/reviews` responde `200` y solo `published`.
   - `GET /businesses/negocio-borrador-tepic/reviews` responde `404`.
7. Frontend Home/Listado:
   - carga listado inicial.
   - aplicar busqueda y filtros actualiza resultados.
   - si backend cae, muestra estado `error` con accion de reintento.
   - con filtros sin match, muestra estado `empty`.

## Evidencia minima
- Captura o log de:
  - `python -m unittest discover -s backend\\tests -p \"test_catalog_public*.py\"`
  - `npm run build` en `frontend`
- Nota de resultado por paso del checklist (`OK` o `FAIL`) en PR/issue.
