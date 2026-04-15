# Test Plan

## Objetivo
- Validar que la web app funciona como experiencia mobile-first y sigue siendo utilizable en desktop.
- Confirmar que la documentacion y la implementacion respetan los contratos canonicos.
- Abrir B2 con foco estricto en Auth + Favoritos + Perfil basico sin regresiones de B1.

## Referencias operativas
- Revision de consistencia B2: `docs/testing/b2-consistency-review.md`.
- Smoke B2: `docs/testing/b2-auth-favorites-profile-smoke-e2e.md`.

## Alcance
- Regresion critica de B1:
  - Home/listado, detalle por `slug`, resenas publicas, busqueda y filtros.
- Flujos B2:
  - registro,
  - login,
  - persistencia y refresh de sesion,
  - logout,
  - favoritos (listar/agregar/quitar),
  - perfil basico (`GET /me`, solo lectura).
- No incluye en B2:
  - OAuth/social login,
  - recuperacion de password,
  - edicion de perfil (`PATCH /me`),
  - escritura de resenas.

## Smoke de entrada
- Ejecutar `docs/testing/b1-public-catalog-smoke-e2e.md` como precondicion para iniciar B2.

## Smoke de salida B2 (propuesto)
- Ejecutar checklist completo en `docs/testing/b2-auth-favorites-profile-smoke-e2e.md`.
- Resultado esperado por bloque:
  - Auth en `OK`.
  - Perfil basico en `OK`.
  - Favoritos en `OK`.
  - Regresion B1 en `OK`.

## Estrategia
- Pruebas de integracion backend con Postgres/PostGIS real para auth, favorites y me.
- Pruebas funcionales frontend para:
  - guardas de rutas protegidas,
  - persistencia de sesion,
  - estados vacio/error en favoritos.
- Pruebas de regresion B1 en endpoints y UI critica.
- Pruebas de seguridad basica:
  - rutas protegidas sin token,
  - token expirado/refresh invalido,
  - logout y reuso de sesion revocada.
- Pruebas responsive y accesibilidad minima en auth/favoritos/perfil.

## Casos minimos
- Un visitante puede registrarse y luego iniciar sesion.
- Un usuario autenticado puede cerrar sesion y deja de acceder a rutas protegidas.
- Un usuario autenticado puede agregar un negocio publicado a favoritos y verlo en su lista.
- Un usuario autenticado puede quitar un favorito y observar lista vacia cuando aplica.
- Un visitante no autenticado no puede operar favoritos ni ver perfil.
- `GET /me` refleja el usuario autenticado y no permite edicion en B2.
- Las pantallas de auth/favoritos/perfil mantienen claridad en mobile y desktop.
- El smoke B1 sigue en `OK` tras implementar B2.

## Exit criteria B2
- Smoke B1 de entrada en `OK`.
- Smoke B2 de salida en `OK` (segun `docs/testing/b2-auth-favorites-profile-smoke-e2e.md`).
- Sin regresiones de contratos en `docs/backend/api-spec.md`.
- Casos `MUST` de acceptance para Registro, Inicio de sesion, Gestion de sesion, Favoritos y Perfil basico en `OK`.
