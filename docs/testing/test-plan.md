# Test Plan

## Objetivo
- Validar que la web app funciona como experiencia mobile-first y sigue siendo utilizable en desktop.
- Confirmar que la documentacion y la implementacion respetan el stack frontend canonico.

## Alcance
- Autenticacion.
- Home y busqueda.
- Filtros por categoria, zona y cercania.
- Mapa.
- Detalle de negocio.
- Favoritos.
- Reseñas.
- Perfil.
- Estados de carga, vacio y error.
- Adaptacion responsive entre mobile y desktop.

## Estrategia
- Pruebas funcionales para flujos principales.
- Pruebas de responsive layout en anchos de mobile, tablet y desktop.
- Pruebas de accesibilidad para contraste, focus visible, labels y keyboard navigation.
- Pruebas de formularios con `React Hook Form` y validacion `Zod`.
- Pruebas de cache, refetch e invalidacion con `React Query`.
- Validacion de transiciones con motion reducido cuando `prefers-reduced-motion` este activo.
- Pruebas CORS desde frontend Vercel permitido y desde origen no permitido.
- Pruebas de seed para confirmar presencia de 5 negocios iniciales en listados y filtros.

## Casos minimos
- Un usuario puede registrarse y entrar.
- Un usuario puede buscar negocios por texto.
- Un usuario puede filtrar por categoria y zona.
- Un usuario puede usar cercania cuando concede permiso.
- Un usuario puede abrir un negocio desde lista o mapa.
- Un usuario puede guardar y quitar favoritos.
- Un usuario puede ver y enviar reseñas.
- Un usuario puede contactar por WhatsApp si el negocio tiene numero valido.
- La misma pantalla sigue siendo clara en mobile y desktop.
- Las migraciones remotas se aplican con `PGSSLMODE=require` sin errores.
- El backend rechaza origenes no permitidos por CORS.
