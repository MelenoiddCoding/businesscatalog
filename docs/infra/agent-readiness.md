# Agent Readiness

## Objetivo
- Definir el gate operativo minimo para arrancar trabajo de agentes sobre features.
- Evitar implementaciones sobre entornos incompletos o inconsistentes.

## Gate obligatorio antes de features
1. Backend Render en estado `live` y `GET /health` responde `status=ok`.
2. Migraciones aplicadas sobre la base remota y registradas en `schema_migrations`.
3. Frontend en Vercel consumiendo `NEXT_PUBLIC_API_URL` remota (no localhost).
4. Seed inicial cargado y visible en consultas de negocios/categorias.
5. CORS validado desde dominio Vercel permitido.

## Flujo canonico de migracion remota
1. Configurar variables de sesion:
```powershell
$env:PGSSLMODE='require'
```
2. Ejecutar migraciones:
```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\migrate-db.ps1
```
3. Verificar evidencia minima:
  - `schema_migrations` contiene `0003_seed_tepic_businesses.sql`.
  - `/health` reporta `database_configured=true`.

## Evidencia minima por corrida
- Fecha/hora UTC de ejecucion.
- Commit SHA desplegado.
- Lista de migraciones aplicadas.
- URL de backend validada (`/health`).
- Confirmacion de 5 negocios seed presentes.

## Regla de gobernanza
- Ningun agente debe cambiar stack, hosting o proveedores fuera de `docs/decisions/` sin registrar una nueva decision explicita.
