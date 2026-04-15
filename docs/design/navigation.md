# Navigation

## Principio rector
- Una sola web app responsive, mobile-first, con la misma estructura funcional en mobile y desktop.
- Cambia la composicion, no el producto.

## Sitemap
- `Inicio`
- `Buscar`
- `Mapa`
- `Favoritos`
- `Perfil`
- `Detalle de negocio`
- `Auth` (`Login` y `Registro`)

## Navegacion mobile
- Barra inferior fija con 4 o 5 destinos maximos.
- `Inicio` y `Buscar` deben estar siempre accesibles.
- `Mapa` puede actuar como vista o modo de exploracion, pero no como unica forma de navegar.
- Los filtros deben abrirse en chips o bottom sheets.
- El detalle de negocio puede presentarse como pagina completa o sheet expandible segun el flujo.

## Navegacion desktop
- `Inicio`, `Buscar`, `Mapa`, `Favoritos` y `Perfil` siguen siendo las secciones principales.
- La navegacion puede migrar a top nav, sidebar o combinacion de ambas.
- En pantallas amplias se recomienda:
  - listado a la izquierda,
  - mapa o detalle a la derecha,
  - filtros visibles sin ocultar la accion principal.

## Flujos principales
- Descubrir negocios desde home.
- Buscar por texto, categoria, zona o cercania.
- Abrir ficha de negocio.
- Guardar y revisar favoritos.
- Contactar por WhatsApp.
- Editar perfil basico.

## Estados especiales
- Si no hay resultados, mostrar accion para limpiar filtros o volver a explorar.
- Si la geolocalizacion falla, ofrecer fallback por zona sin bloquear el resto de la app.
- Si no hay informacion suficiente para mapa, mantener el listado como fuente principal.
- Las rutas protegidas deben redirigir a auth sin perder contexto.
