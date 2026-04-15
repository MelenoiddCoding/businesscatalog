# Database Bootstrap

## Estado local esperado
- PostgreSQL ya puede estar corriendo en la maquina local.
- El archivo `.env` puede contener la conexion al servidor de PostgreSQL, pero eso no implica que la base de datos destino ya exista.
- Los agentes no deben asumir que el esquema, las tablas o las extensiones ya estan creadas.

## Fuente de verdad
- `docs/backend/data-model.md` define el modelo canonico de datos.
- Las migraciones futuras deben derivarse de ese documento.
- Ningun agente debe crear tablas manualmente si existe una ruta de migraciones.

## Bootstrap esperado
1. Conectarse al servidor local usando `DATABASE_URL`.
2. Crear la base de datos destino si aun no existe.
3. Habilitar extensiones requeridas, al menos `postgis` y `citext`.
4. Ejecutar migraciones en el orden del modelo canonico.
5. Cargar seeds minimos de desarrollo y staging local.
6. Verificar que las consultas base funcionen para auth, negocios, categorias, favoritos y reseñas.

## Comando recomendado
```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\bootstrap-db.ps1
```

Opcionalmente se puede indicar otro archivo de entorno:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\bootstrap-db.ps1 -EnvPath .\.env
```

El script es idempotente para la base y las extensiones.

## Comando de migraciones
```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\migrate-db.ps1
```

## Variables relevantes
- `DATABASE_URL`
- `POSTGRES_DB` si se usa una separacion explicita entre servidor y base destino
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## Reglas para agentes
- Si la conexion al servidor existe pero la base de datos destino no, reportar eso y crearla solo si el flujo de trabajo lo permite.
- Si las migraciones faltan, no inventar estructura local a mano.
- Si faltan permisos para crear la base o extensiones, devolver el comando o privilegio exacto que hace falta.
- No cambiar el nombre de la base sin una decision documentada.
- No introducir bases adicionales para MVP.

## Verificacion minima
- La aplicacion puede leer y escribir en la base local.
- El backend puede arrancar y resolver auth.
- El catalogo puede consultar negocios publicados.
- La extension geografica esta disponible para busquedas por cercania.
