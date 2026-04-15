# Frontend Stack Decision

## Estado
Canónico para el MVP de Tepic Catalog.

## Decisión
El frontend del proyecto usará este stack:

- `Tailwind CSS`
- `shadcn/ui`
- `Radix UI`
- `Framer Motion` solo donde aporte valor real a la jerarquía o la interacción
- `React Query`
- `Zustand`
- `Zod`
- `React Hook Form`

## Motivo
El producto debe sentirse como una web app mobile-first, pero también funcionar bien en desktop sin convertir la experiencia en un dashboard pesado. Esta combinación permite:

- construir interfaces rápidas y muy personalizables,
- mantener accesibilidad y comportamiento sólido con primitives de `Radix UI`,
- evitar depender de un design system demasiado opinado,
- animar solo las transiciones que mejoran la comprensión o el flujo,
- mantener formularios, validación, estado de UI y datos remotos con responsabilidades claras.

## Implicaciones
- La UI base debe construirse con componentes de `shadcn/ui` y estilos utilitarios de `Tailwind CSS`.
- `Radix UI` se usa como fundamento de accesibilidad y comportamiento de componentes interactivos.
- `Framer Motion` se reserva para entradas, sheets, transiciones entre vistas, estados de expansión y otros casos donde mejore la experiencia.
- `React Query` maneja lectura, cache, invalidación y sincronización de datos remotos.
- `Zustand` maneja estado ligero de UI y sesión de interfaz.
- `Zod` define validación de entradas y contratos de formularios.
- `React Hook Form` maneja los formularios del MVP.

## Reglas
- No introducir librerías de componentes alternativas sin actualizar esta decisión.
- No agregar un segundo stack frontend para mobile o APK en esta fase.
- La misma base debe servir para móvil y desktop, cambiando composición y densidad, no producto.

## Referencias
- La guía de uso visual y de composición vive en `docs/design/ui-guidelines.md`.
- La navegación responsive vive en `docs/design/navigation.md`.
- Los criterios de prueba viven en `docs/testing/test-plan.md`.
