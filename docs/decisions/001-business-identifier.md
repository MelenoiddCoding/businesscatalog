# 001 - Business Identifier Publico

## Estado
Aceptada (2026-04-15)

## Contexto
- En B1 surgio ambiguedad entre dos contratos para detalle y reseñas publicas:
  - `GET /businesses/{slug}` (producto/docs iniciales),
  - `GET /businesses/{identifier}` aceptando `slug` o `id` UUID (compatibilidad temporal).
- Esta ambiguedad complica pruebas, telemetria y evoluciones de API en B2.
- El MVP requiere un contrato simple y estable para consumidores web.

## Opciones evaluadas
1. Mantener identificador mixto (`slug` + `id` UUID) de forma permanente.
2. Estandarizar solo `id` UUID para endpoints publicos.
3. Estandarizar solo `slug` para lectura publica y reservar `id` para mutaciones autenticadas internas.

## Decision
Se adopta la opcion 3:
- `slug` es el identificador canonico y unico para lectura publica:
  - `GET /businesses/{slug}`
  - `GET /businesses/{slug}/reviews`
- `id` UUID queda reservado para mutaciones autenticadas (favoritos/reseñas de escritura) cuando entren en alcance.
- No se mantiene contrato mixto en B1 endurecido.

## Consecuencias
- Beneficios:
  - URL publicas legibles y estables.
  - Contrato mas simple para frontend y QA.
  - Menor ambiguedad en validaciones y pruebas.
- Coste:
  - Cualquier cliente que usaba UUID en detalle/reviews debe migrar a slug.
- Mitigacion:
  - Documentar el cambio en `docs/backend/api-spec.md` y `docs/backend/data-model.md`.
  - Mantener pruebas de integracion centradas en slug.

