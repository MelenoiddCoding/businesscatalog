# UI Guidelines

## Direccion visual
- La experiencia debe sentirse mobile-first, rapida y clara, con adaptacion natural a desktop.
- La base visual es utilitaria, no ornamental: mucho aire, jerarquia fuerte, bordes suaves y componentes funcionales.
- La referencia principal es la experiencia tipo Uber, Didi y Rappi, pero aplicada a un directorio local.
- La paleta base toma como ancla el naranja del producto y superficies neutras claras y oscuras.
- La tipografia recomendada es `Plus Jakarta Sans` para mantener cercania con las referencias visuales.

## Stack frontend canonico
- `Tailwind CSS` para estilos y composicion.
- `shadcn/ui` como biblioteca base de componentes.
- `Radix UI` como primitives de accesibilidad y comportamiento.
- `Framer Motion` solo para transiciones que mejoren comprension o feedback.
- `React Query` para datos remotos y cache.
- `Zustand` para estado local ligero de UI.
- `Zod` para validacion de contratos y formularios.
- `React Hook Form` para formularios del MVP.

## Sistema visual base
- Priorizar layouts sobre tarjetas cuando la pantalla lo permita.
- Usar cards solo cuando la informacion necesite agrupacion tactil o accion directa.
- Los filtros deben sentirse ligeros: chips, barras o sheets, no paneles pesados.
- Los estados vacios deben ser claros, utiles y accionables.
- El mapa puede ser un modo de exploracion, pero nunca debe bloquear el flujo principal.

## Reglas de composicion mobile-first
- La primera pantalla debe resolver orientacion, busqueda y acceso a negocios sin exceso de ruido.
- Navegacion principal en mobile: barra inferior fija.
- Listados en una columna, con tarjetas de alto contraste y objetivos tactiles amplios.
- Filtros y acciones secundarias deben caber en chips horizontales, sheets o drawers.
- Las fichas de negocio deben priorizar portada, nombre, categoria, horario, distancia y CTA principal.

## Adaptacion desktop
- En desktop el mismo sistema debe ganar densidad, no cambiar de producto.
- Se puede usar layout de dos columnas para listado + mapa o listado + detalle.
- La navegacion puede moverse a top nav o sidebar, pero manteniendo las mismas secciones.
- Los componentes no deben duplicarse por plataforma; solo cambian variantes por breakpoint.

## Componentes base
- `Button`, `Badge`, `Card`, `Sheet`, `Dialog`, `DropdownMenu`, `Tabs`, `Tooltip`, `Input`, `Textarea`, `Select`, `Accordion`, `Separator`, `Skeleton`, `Toast`.
- `BusinessCard`, `CategoryChip`, `BottomNav`, `MapPinCard`, `ReviewItem`, `FilterSheet`, `AuthForm`, `ProfileCard`.
- Las variantes deben mantenerse pequeñas y coherentes.

## Iconografia y medios
- Usar `Material Symbols Outlined` como iconografia principal para mantener continuidad con las referencias.
- No mezclar familias de iconos sin una necesidad clara.
- Las imagenes deben ser reales, locales y utiles para narrar el negocio, no decoracion vacia.

## Copy y microinteracciones
- El copy debe ser breve, directo y utilitario.
- Evitar lenguaje aspiracional si la pantalla es de operacion o exploracion.
- `Framer Motion` solo para:
  - entrada de secciones,
  - expansion de sheets,
  - transiciones entre listado, detalle y mapa,
  - feedback de favoritos y CTA.
- Reducir o desactivar motion decorativo si `prefers-reduced-motion` esta activo.

## Criterios de calidad visual
- El producto debe seguir siendo claro si se elimina el motion.
- El primer viewport debe mostrar marca, orientacion y accion principal.
- El desktop no debe parecer un dashboard generico.
- La experiencia no debe depender del mapa para completar tareas basicas.
