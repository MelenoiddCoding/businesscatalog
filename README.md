# Tepic Catalog

Web app mobile-first para descubrir negocios locales de Tepic.

## Quickstart local

1. Copia `.env.example` a `.env` y ajusta credenciales si hace falta.
2. Asegura que PostgreSQL este corriendo localmente y que `psql` este disponible en tu PATH.
3. Prepara la base de datos con:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\bootstrap-db.ps1
```

4. Aplica las migraciones con:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\migrate-db.ps1
```

5. Levanta el backend con:

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

6. Levanta el frontend con:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
cd frontend
npm install
npm run dev
```

## Despliegue

- `frontend/vercel.json` fija el frontend para Vercel.
- `render.yaml` fija el backend FastAPI y la base PostgreSQL/PostGIS para Render.
- Para migraciones remotas (Render): `PGSSLMODE=require` + `scripts/migrate-db.ps1`.

## Documentacion canonica

- [Frontend stack](docs/decisions/frontend-stack.md)
- [Hosting stack](docs/decisions/hosting-stack.md)
- [UI guidelines](docs/design/ui-guidelines.md)
- [Navigation](docs/design/navigation.md)
- [Local setup](docs/infra/local-setup.md)
- [Database bootstrap](docs/infra/database-bootstrap.md)
- [Deployment](docs/infra/deployment.md)
- [Agent readiness](docs/infra/agent-readiness.md)
- [Seed data](docs/backend/seed-data.md)
