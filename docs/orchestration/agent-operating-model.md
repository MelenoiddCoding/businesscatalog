# Agent Operating Model

## Objetivo
Convertir `AGENTS.md` en una operacion ejecutable. Este documento define como se coordinan los agentes, que insumos necesitan, que entregan y cuando pueden avanzar sin bloquear al resto del proyecto.

## Lo que aun faltaba
Para orquestar agentes de forma real, no basta con nombrar roles. Hacen falta estos bloques:

1. Un backlog unico y priorizado para que todos trabajen sobre el mismo alcance.
2. Contratos de entrada/salida por agente para evitar handoffs ambiguos.
3. Documentos canonicos dentro de `docs/` para que los artefactos no queden dispersos.
4. Reglas de dependencias y desbloqueo entre frontend, backend, datos e infraestructura.
5. Definicion de listo y definicion de hecho por entregable.
6. Entorno local reproducible para que todos prueben sobre la misma base.
7. Mecanismo de validacion comun: acceptance criteria, test plan y seeds.

## Agentes y ownership

### 1. Product Agent
Owner de:
- `docs/product/brief.md`
- `docs/product/backlog.md`
- `docs/product/acceptance-criteria.md`

Entrada:
- Vision del producto
- Referencias Stitch
- Restricciones de MVP en `AGENTS.md`

Salida minima:
- Historias priorizadas por sprint
- User journeys end-to-end
- Criterios Gherkin por feature
- Alcance MVP vs fuera de MVP

### 2. Design / UX Agent
Owner de:
- `docs/design/navigation.md`
- `docs/design/ui-guidelines.md`

Entrada:
- Backlog priorizado
- Referencia visual Stitch

Salida minima:
- Sitemap y flujo de navegacion mobile-first
- Reglas visuales reutilizables
- Estados vacio/loading/error
- Copy y microinteracciones base

### 3. Backend Agent
Owner de:
- `docs/backend/api-spec.md`
- `docs/backend/data-model.md`

Entrada:
- Backlog validado
- Acceptance criteria
- Modelo de datos

Salida minima:
- Endpoints REST con request/response examples
- Reglas de auth y permisos
- Errores esperados por endpoint
- Contratos para favoritos, resenas, busqueda y detalle

### 4. Infra / Data Agent
Owner de:
- `docs/infra/local-setup.md`
- `docs/infra/deployment.md`
- `docs/testing/test-plan.md` en conjunto con Backend

Entrada:
- API spec
- Data model
- Requisitos de storage, DB y variables de entorno

Salida minima:
- Docker Compose reproducible
- Variables de entorno documentadas
- Migraciones y seeds base
- Flujo de despliegue a staging/produccion

## Dependencias entre agentes
Orden recomendado de ejecucion:

1. Product define backlog y criterios.
2. Design aterriza navegacion y patrones UI.
3. Backend congela contratos minimos sobre ese backlog.
4. Infra/Data habilita entorno local, DB, migraciones y seeds.
5. Frontend implementa sobre contratos ya estabilizados.
6. Testing valida contra acceptance criteria y casos base.

Regla operativa:
- Frontend no debe inventar contratos.
- Backend no debe ampliar alcance sin pasar por backlog.
- Infra no debe meter servicios nuevos sin justificacion en `docs/decisions/`.

## Definicion de listo
Una tarea puede entrar a desarrollo si cumple todo esto:

- Tiene historia o requirement claro en `docs/product/backlog.md`.
- Tiene criterio de aceptacion en `docs/product/acceptance-criteria.md`.
- Tiene impacto identificado en UI, API y datos.
- Tiene decision tomada si introduce dependencias nuevas.
- Tiene datos de prueba minimos definidos.

## Definicion de hecho
Una tarea se considera terminada cuando:

- El artefacto documental correspondiente fue actualizado.
- La implementacion corre en local.
- Hay validacion minima automatizada o checklist manual ejecutado.
- No rompe contratos acordados.
- El siguiente agente puede continuar sin abrir preguntas basicas.

## Artefactos minimos a crear de inmediato
Estos son los documentos faltantes para arrancar bien:

- `docs/product/brief.md`
- `docs/product/backlog.md`
- `docs/product/acceptance-criteria.md`
- `docs/design/navigation.md`
- `docs/design/ui-guidelines.md`
- `docs/backend/api-spec.md`
- `docs/backend/data-model.md`
- `docs/infra/local-setup.md`
- `docs/infra/deployment.md`
- `docs/testing/test-plan.md`
- `docs/testing/test-cases.md`

## Ritual de trabajo recomendado
- Una fuente de verdad: todo acuerdo vive en `docs/`.
- Iteraciones cortas: bloques de trabajo de 1 semana.
- Handoff explicito: cada agente entrega "hecho", "pendiente", "riesgos".
- Cambios de alcance: se registran en `docs/decisions/`.
- Cierre por feature: validar producto, API, datos y prueba antes de abrir otra feature grande.

## Riesgos actuales del proyecto
- No existe aun backlog formal.
- No existe aun API spec.
- No existe aun estructura de docs operando como fuente de verdad.
- `data-model.md` esta fuera de `docs/backend/`, lo cual rompe el ownership definido.
- No existe local setup documentado para que varios agentes trabajen sin divergencias.

## Siguiente secuencia recomendada
1. Crear `docs/product/brief.md`, `docs/product/backlog.md` y `docs/product/acceptance-criteria.md`.
2. Mover o replicar el modelo de datos hacia `docs/backend/data-model.md`.
3. Definir `docs/backend/api-spec.md` antes de escribir frontend real.
4. Documentar `docs/infra/local-setup.md` con Docker Compose, `.env` y servicios requeridos.
5. Crear `docs/testing/test-plan.md` para validar el MVP desde el primer sprint.
