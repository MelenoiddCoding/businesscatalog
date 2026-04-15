# Local Setup

## Objetivo
- Levantar el frontend y el backend localmente con contratos estables para desarrollo del MVP.
- Mantener el frontend alineado con la decision canonica de `docs/decisions/frontend-stack.md`.
- Documentar claramente el estado de la base de datos local y el bootstrap esperado.
- Evitar bloqueos por infraestructura no versionada en el repo.

## Servicios requeridos
- Frontend en Next.js con React y TypeScript.
- Backend REST en FastAPI.
- PostgreSQL con PostGIS.
- Storage S3-compatible para imagenes.

## Stack frontend esperado
- `Tailwind CSS`
- `shadcn/ui`
- `Radix UI`
- `Framer Motion`
- `React Query`
- `Zustand`
- `Zod`
- `React Hook Form`

## Variables de entorno
- `APP_ENV`
- `BACKEND_CORS_ORIGINS`
- `BACKEND_CORS_ORIGIN_REGEX` (opcional para dominios dinamicos en preview)
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` o la variable equivalente que use el proveedor de mapa elegido
- `JWT_SECRET` o el conjunto de secretos definido por backend
- `DATABASE_URL`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

## Prerrequisitos locales
- Node.js y npm para frontend.
- Python 3.11+ para backend.
- `psql` en PATH para ejecutar scripts de base.
- Instancia local de PostgreSQL con PostGIS disponible.

## Arranque local
- Copiar `.env.example` a `.env` y ajustar credenciales si hace falta.
- Copiar `frontend/.env.example` a `frontend/.env.local` para que Next.js lea las variables del frontend.
- Instalar dependencias del frontend una sola vez con el gestor elegido por el repositorio.
- Confirmar que PostgreSQL/PostGIS local este arriba y accesible con las variables `POSTGRES_*` de `.env`.
- Preparar la base local con `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-db.ps1`.
- Aplicar migraciones con `powershell -ExecutionPolicy Bypass -File .\scripts\migrate-db.ps1`.
- Levantar el backend desde `backend` con `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.
- Arrancar el frontend en modo desarrollo.
- Verificar que la home cargue, que login funcione y que el layout responsive se vea bien en mobile y desktop.

## Arranque compartido en preview
- Frontend en Vercel.
- Backend en Render.
- Base de datos en Render Postgres.
- El frontend se gobierna con `frontend/vercel.json` y el backend/DB con `render.yaml`.
- Usar las mismas variables de entorno que en local, pero apuntando a servicios remotos.
- Ejecutar migraciones remotas con `PGSSLMODE=require` antes de iniciar trabajo de features.

## Notas operativas
- No introducir una segunda implementacion frontend para mobile.
- Si se usan componentes de `shadcn/ui`, deben mantenerse como componentes de aplicacion dentro del repo.
- `Framer Motion` no debe usarse para animar todo; solo interacciones con impacto real.
- A la fecha (2026-04-15) el repo no incluye `docker-compose.yml`; para no bloquear MVP el flujo canonico local usa PostgreSQL ya disponible y scripts de bootstrap/migracion.
- La contradiccion con el stack base se registra en `docs/decisions/local-dev-database-runtime.md`.
- El flujo de base de datos local esta documentado en `docs/infra/database-bootstrap.md`.
- La arquitectura de despliegue esta documentada en `docs/infra/deployment.md`.
