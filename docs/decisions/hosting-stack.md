# Hosting Stack Decision

## Estado
Canónico para el MVP y entornos de preview.

## Decisión
- Frontend Next.js en Vercel.
- Backend FastAPI en Render como web service gratuito.
- PostgreSQL en Render Postgres como datastore gratuito.

## Motivo
- Vercel detecta Next.js de forma nativa y soporta despliegues por Git o por CLI con flujo simple.
- Render soporta web services gratuitos en Python y bases PostgreSQL gratuitas.
- Render Postgres soporta `PostGIS`, que el modelo de datos necesita para busquedas geograficas.
- Esta division mantiene el frontend separado del backend y evita forzar FastAPI dentro de Vercel.

## Implicaciones
- Vercel se usa solo para la app web, no para la API FastAPI.
- El backend expone una URL publica independiente y el frontend consume esa URL via `NEXT_PUBLIC_API_URL`.
- La base de datos ya no depende de una instancia local para desarrollo compartido o preview.
- Los entornos gratuitos tienen limites y pueden suspenderse o hacer spin down; sirven para MVP, preview y validacion interna, no para cargas altas.
- El backend y la base quedan declarados en `render.yaml`; el frontend queda declarado en `frontend/vercel.json`.

## Variables por entorno
- `NEXT_PUBLIC_API_URL` apunta al backend de Render.
- `DATABASE_URL` apunta al Postgres de Render.
- `JWT_SECRET` vive en el backend.
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` o la variable del proveedor de mapas vive en Vercel.

## Referencias
- `docs/infra/deployment.md`
- `docs/infra/local-setup.md`
