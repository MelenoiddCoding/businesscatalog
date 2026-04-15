# B2 Auth + Favorites + Perfil Basico Smoke E2E

## Objetivo
Validar extremo a extremo el bloque B2 (auth + favoritos + perfil basico) sin romper B1.

## Alcance
- Incluido:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /me`
  - `GET /favorites`
  - `POST /favorites/{businessId}`
  - `DELETE /favorites/{businessId}`
  - Flujos frontend minimos de auth, favoritos y perfil basico
  - Checkpoints de regresion B1 criticos
- Excluido:
  - OAuth/social login
  - recuperacion de password
  - edicion de perfil (`PATCH /me`)
  - escritura de resenas

## Prerrequisitos
1. Smoke B1 en `OK` usando `docs/testing/b1-public-catalog-smoke-e2e.md`.
2. Base local preparada y migraciones aplicadas (incluyendo `0007_b2_auth_favorites_indexes.sql`).
3. Backend corriendo en `http://localhost:8000`.
4. Frontend corriendo en `http://localhost:3000`.

## Datos de prueba minimos
- Usuario nuevo:
  - `name`: `Ana QA`
  - `email`: `ana.qa+<timestamp>@example.com`
  - `password`: `super-secret-123`
- Negocio publicado semilla para favoritos:
  - `el-antojito-tepic` (usar `id` obtenido de `GET /businesses`).
- Negocio no publicado para 404:
  - `negocio-borrador-tepic` (usar `id` real de DB si aplica en pruebas de favoritos).

## Checklist smoke backend
1. Registro:
   - `POST /auth/register` con payload valido responde `201`.
   - segundo registro con mismo email responde `409`.
2. Login:
   - `POST /auth/login` con credenciales validas responde `200` y devuelve `access_token` + `refresh_token`.
   - login con password invalido responde `401`.
3. Refresh:
   - `POST /auth/refresh` con refresh valido responde `200` y devuelve nuevo `access_token`.
   - refresh token invalido/expirado responde `401`.
4. Perfil:
   - `GET /me` con bearer valido responde `200` con shape canonico.
   - `GET /me` sin token responde `401`.
5. Favoritos:
   - `POST /favorites/{businessId_publicado}` con token responde `201`.
   - segundo `POST` al mismo negocio responde `409`.
   - `GET /favorites` con token incluye el negocio guardado.
   - `DELETE /favorites/{businessId_publicado}` con token responde `204`.
   - `POST /favorites/{businessId_publicado}` sin token responde `401`.
   - `DELETE /favorites/{businessId_publicado}` sin token responde `401`.
   - `POST /favorites/{businessId_no_publicado}` responde `404`.

## Checklist smoke frontend
1. Ruta protegida sin sesion:
   - abrir `/favorites` o `/profile` redirige a auth.
   - se conserva ruta destino para retorno post-login.
2. Registro/login:
   - usuario puede registrarse e iniciar sesion.
   - errores de validacion y credenciales invalidas son visibles y no tecnicos.
3. Perfil basico:
   - pantalla de perfil muestra datos de `GET /me`.
   - no existe flujo de edicion en B2.
4. Favoritos:
   - usuario autenticado puede guardar/quitar favorito desde UI.
   - lista de favoritos muestra estado vacio cuando no hay items.
   - en token expirado, se limpia sesion y se redirige a auth en rutas protegidas.
5. Logout:
   - desde perfil se cierra sesion.
   - rutas protegidas vuelven a requerir login.

## Checkpoints de regresion B1 (obligatorios)
1. `GET /categories`, `GET /businesses`, `GET /businesses/{slug}`, `GET /businesses/{slug}/reviews` siguen respondiendo y sin cambio de shape.
2. Home/listado y detalle publico siguen funcionales para visitante sin sesion.
3. CTA WhatsApp en ficha sigue disponible solo cuando hay numero valido.

## Evidencia minima requerida
- Backend:
  - salida de pruebas B2 (cuando existan), por ejemplo:
    - `python -m unittest discover -s backend\\tests -p "test_auth*.py"`
    - `python -m unittest discover -s backend\\tests -p "test_favorites*.py"`
  - salida de regresion B1:
    - `python -m unittest discover -s backend\\tests -p "test_catalog_public*.py"`
- Frontend:
  - `npm run build`
  - evidencia manual de flujo B2 (capturas o log por paso).

## Plantilla de reporte rapido
- Fecha:
- Responsable:
- Resultado global: `OK` | `FAIL`
- Fallas bloqueantes:
  - [ ] Ninguna
  - [ ] Si (detallar)
- Resultado por bloque:
  - Auth: `OK` | `FAIL`
  - Perfil: `OK` | `FAIL`
  - Favoritos: `OK` | `FAIL`
  - Regresion B1: `OK` | `FAIL`
