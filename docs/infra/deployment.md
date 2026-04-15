# Deployment

## Objetivo
- Definir donde vive cada parte del MVP y que variables necesita cada ambiente.
- Evitar que los agentes mezclen frontend, backend y base de datos en el mismo destino sin una decision explicita.

## Arquitectura de despliegue

### Manifiestos
- `frontend/vercel.json` fija el comportamiento esperado del frontend en Vercel.
- `render.yaml` declara el backend FastAPI y la base PostgreSQL/PostGIS para Render.
- Los workspaces Hobby de Render no soportan Preview Environments; para este repo el Blueprint debe desplegar el servicio principal sin bloque `previews`.
- Si mas adelante se sube de plan, se puede reintroducir Preview Environments con `previews.generation: automatic`.

### Frontend
- Next.js en Vercel.
- Despliegue recomendado por Git; Vercel detecta el framework automaticamente.
- Usar la raiz del frontend como proyecto Vercel o un directorio especifico si el repo evoluciona a monorepo.

### Backend
- FastAPI en Render como web service gratuito.
- El backend expone una URL publica para ser consumida por el frontend.
- Build command: `pip install -r backend/requirements.txt`
- Start command en Render: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Base de datos
- PostgreSQL en Render Postgres.
- Habilitar `PostGIS` y `citext`.
- La URL de conexion del backend apunta al servicio de Render, no a la instancia local.

## Ambientes
- `local`
- `preview`
- `production`

## Flujo recomendado
1. Desarrollar localmente con `.env`.
2. Correr bootstrap y migraciones en la base local.
3. Desplegar backend y base en Render para preview compartido usando `render.yaml`.
4. Desplegar frontend en Vercel usando `frontend/vercel.json`.
5. Configurar variables de entorno en Vercel y Render por ambiente.

## Variables sensibles

### Frontend en Vercel
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
- `NEXT_PUBLIC_APP_ENV` si el frontend necesita distinguir entorno visualmente

### Backend en Render
- `APP_ENV`
- `BACKEND_CORS_ORIGINS`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ALGORITHM`
- `JWT_EXPIRE_MINUTES`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

## Limitaciones del plan gratuito
- Los web services gratuitos en Render se detienen tras 15 minutos sin trafico entrante.
- El plan gratuito es adecuado para preview, pruebas internas y MVP ligero.
- Si el uso real crece, la infraestructura debe moverse a planes pagados sin cambiar contratos.

## Comandos y rutas
- El frontend se despliega con Vercel desde la raiz del proyecto frontend.
- El backend se levanta con `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` en Render.

## Reglas para agentes
- No asumir que Vercel va a alojar FastAPI.
- No asumir que la base local es la misma que la base de preview o produccion.
- No introducir otro proveedor de hosting sin registrarlo en `docs/decisions/`.
