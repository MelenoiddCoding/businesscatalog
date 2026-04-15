# Local Dev Database Runtime

## Estado
Aceptada (2026-04-15)

## Contexto
- El stack base del proyecto define Docker Compose para infraestructura local.
- El repo actual no tiene `docker-compose.yml` versionado.
- El MVP necesita seguir avanzando en backend/frontend sin cambiar despliegues de Render o Vercel.

## Decision
- El flujo canonico local para base de datos usa una instancia local de PostgreSQL con PostGIS ya disponible en la maquina del desarrollador.
- El bootstrap y migraciones se ejecutan con:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-db.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\migrate-db.ps1`
- `PGSSLMODE` se mantiene en `disable` en local y solo cambia a `require` para migraciones remotas.

## Consecuencias
- El onboarding local requiere `psql` y acceso a PostgreSQL/PostGIS.
- Se evita agregar infraestructura nueva fuera del alcance MVP en este bloque.
- Un siguiente bloque de infra puede versionar `docker-compose.yml` minimo, sin tocar contratos de API ni despliegue.
