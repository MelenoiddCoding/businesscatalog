# Test Plan

## Objetivo
- Validar que la web app funciona como experiencia mobile-first y sigue siendo utilizable en desktop.
- Confirmar que la documentacion y la implementacion respetan el stack frontend canonico.
- Endurecer B1 del catalogo publico antes de avanzar a B2.

## Alcance
- Home y busqueda publica.
- Filtros por categoria, zona y cercania.
- Detalle de negocio publico por `slug`.
- Reseñas publicas de lectura.
- Estados de carga, vacio y error.
- Adaptacion responsive entre mobile y desktop.
- No incluye auth, favoritos, perfil ni escritura de reseñas en esta etapa.

## Smoke B1
- Ejecutar el smoke definido en `docs/testing/b1-public-catalog-smoke-e2e.md` como puerta de salida antes de iniciar B2.

## Estrategia
- Pruebas funcionales para flujos principales de catalogo publico.
- Pruebas de responsive layout en anchos de mobile, tablet y desktop.
- Pruebas de accesibilidad para contraste, focus visible, labels y keyboard navigation.
- Pruebas de cache y refetch del flujo de listado.
- Validacion de transiciones con motion reducido cuando `prefers-reduced-motion` este activo.
- Pruebas CORS desde frontend permitido y desde origen no permitido.
- Pruebas de seed para confirmar presencia de negocios publicados, al menos una portada, productos activos y reseñas publicadas.

## Casos minimos
- Un usuario puede buscar negocios por texto.
- Un usuario puede filtrar por categoria y zona.
- Un usuario puede usar cercania cuando concede permiso.
- Un usuario puede abrir un negocio desde lista.
- Un usuario puede ver reseñas publicas.
- Un usuario puede contactar por WhatsApp si el negocio tiene numero valido.
- La misma pantalla sigue siendo clara en mobile y desktop.
- Las migraciones remotas se aplican con `PGSSLMODE=require` sin errores.
- El backend rechaza origenes no permitidos por CORS.
