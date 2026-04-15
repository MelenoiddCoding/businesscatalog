# Seed Data

## Objetivo
- Definir el seed inicial minimo para entorno local, preview y validacion temprana del MVP.
- Mantener trazabilidad de la fuente de datos para los negocios iniciales de Tepic.

## Seed inicial Tepic (0003)
- Migracion: `backend/migrations/0003_seed_tepic_businesses.sql`
- Registros incluidos:
  - 3 categorias (`restaurant`, `cafe`, `fast-food`)
  - 5 negocios publicados
  - 5 ubicaciones geograficas
  - 5 asignaciones negocio-categoria

## Negocios incluidos
1. El Antojito (`el-antojito-tepic`)
2. Cafe la Parroquia (`cafe-la-parroquia-tepic`)
3. La Sopa de Piezzi (`la-sopa-de-piezzi-tepic`)
4. Carl's Jr. Colosio (`carls-jr-avenida-colosio-tepic`)
5. Loma42 (`loma42-tepic`)

## Fuentes publicas
- El Antojito: https://www.openstreetmap.org/node/4258764790
- Cafe la Parroquia: https://www.openstreetmap.org/node/4999771521
- La Sopa de Piezzi: https://www.openstreetmap.org/node/6053818849
- Carl's Jr. (Avenida Colosio): https://www.openstreetmap.org/node/6709201763
- Loma42: https://www.openstreetmap.org/way/902181754

## Reglas para agentes
- No reemplazar este seed con datos inventados.
- Si se modifica informacion de estos negocios, dejar la justificacion y la fuente en este mismo documento.
- Si se agregan nuevos seeds, usar nueva migracion SQL incremental (`0004`, `0005`, ...), no editar retrospectivamente seeds ya aplicados.
