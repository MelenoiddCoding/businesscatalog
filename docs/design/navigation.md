# Navigation

## Principio rector
- Una sola web app responsive, mobile-first, con la misma estructura funcional en mobile y desktop.
- Cambia la composicion, no el producto.
- El MVP se limita a los 13 features definidos en `AGENTS.md`.

## Sitemap MVP
- `Inicio`
- `Buscar`
- `Favoritos`
- `Perfil`
- `Detalle de negocio`
- `Auth` (`Login` y `Registro`)

## Navegacion mobile
- Barra inferior fija con 4 destinos principales: `Inicio`, `Buscar`, `Favoritos`, `Perfil`.
- `Inicio` y `Buscar` deben estar siempre accesibles.
- Los filtros deben abrirse en chips o bottom sheets.
- El detalle de negocio puede presentarse como pagina completa o sheet expandible segun el flujo.

## Navegacion desktop
- `Inicio`, `Buscar`, `Favoritos` y `Perfil` siguen siendo las secciones principales.
- La navegacion puede migrar a top nav, sidebar o combinacion de ambas.
- En pantallas amplias se recomienda:
  - listado a la izquierda,
  - detalle a la derecha,
  - filtros visibles sin ocultar la accion principal.

## Flujos principales MVP
- Descubrir negocios desde home.
- Buscar por texto, categoria, zona o cercania.
- Abrir ficha de negocio.
- Guardar, quitar y revisar favoritos.
- Contactar por WhatsApp.
- Ver perfil basico y cerrar sesion.

## Estados especiales
- Si no hay resultados, mostrar accion para limpiar filtros o volver a explorar.
- Si la geolocalizacion falla, ofrecer fallback por zona sin bloquear el resto de la app.
- Las rutas protegidas deben redirigir a auth sin perder contexto.

## Nota fuera de MVP
- La vista de mapa dedicada no forma parte del MVP actual y no debe condicionar la navegacion principal.
