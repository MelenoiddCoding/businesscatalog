# Backlog

## Convenciones
- Prioridad `MUST`: bloquea salida del MVP.
- Prioridad `SHOULD`: entra al MVP si no compromete fecha ni estabilidad.
- Prioridad `COULD`: queda preparada, pero no bloquea lanzamiento.
- Todos los items deben mapearse a API, datos, diseno y pruebas antes de desarrollo.

## Sprint 0 - Fundaciones del producto

### P0-01 Brief y alcance MVP
- Prioridad: `MUST`
- Historia: Como equipo de producto quiero un brief compartido para que todos construyamos el mismo MVP.
- Entregable: `docs/product/brief.md`

### P0-02 Backlog priorizado
- Prioridad: `MUST`
- Historia: Como equipo de ejecucion quiero un backlog ordenado por valor y dependencias para planear sprints sin ambiguedad.
- Entregable: `docs/product/backlog.md`

### P0-03 Criterios de aceptacion
- Prioridad: `MUST`
- Historia: Como QA y desarrollo quiero criterios verificables para validar cada feature sin interpretacion subjetiva.
- Entregable: `docs/product/acceptance-criteria.md`

### P0-04 Arquitectura documental
- Prioridad: `MUST`
- Historia: Como orquestador del proyecto quiero ownership claro por documento para evitar handoffs ambiguos.
- Dependencia: `docs/orchestration/agent-operating-model.md`

## MVP - Historias priorizadas

### Epic A - Autenticacion y sesion

#### A-01 Registro por email
- Prioridad: `MUST`
- Historia: Como visitante quiero crear una cuenta con email y password para guardar favoritos y administrar mi perfil.
- Dependencias: API auth, validaciones, storage de sesion.

#### A-02 Inicio de sesion
- Prioridad: `MUST`
- Historia: Como usuario registrado quiero iniciar sesion para recuperar mis favoritos y actividad.
- Dependencias: API auth, JWT, manejo de errores.

#### A-03 Persistencia de sesion
- Prioridad: `MUST`
- Historia: Como usuario quiero mantener mi sesion activa entre visitas para no autenticarme cada vez.
- Dependencias: refresh/session strategy, guardas de frontend.

#### A-04 Cierre de sesion
- Prioridad: `MUST`
- Historia: Como usuario quiero cerrar sesion desde perfil para proteger mi cuenta en dispositivos compartidos.

### Epic B - Descubrimiento de negocios

#### B-01 Home con acceso rapido
- Prioridad: `MUST`
- Historia: Como usuario quiero ver categorias, buscador y negocios destacados desde el inicio para encontrar opciones en pocos toques.
- Dependencias: seeds, diseno de home, endpoint de negocios.

#### B-02 Listado de negocios
- Prioridad: `MUST`
- Historia: Como usuario quiero ver un listado scrolleable de negocios con informacion resumida para comparar opciones rapidamente.
- Dependencias: endpoint paginado, tarjetas de negocio.

#### B-03 Busqueda por texto
- Prioridad: `MUST`
- Historia: Como usuario quiero buscar por nombre, categoria o producto para encontrar negocios relevantes mas rapido.
- Dependencias: indexacion de texto, API de busqueda.

#### B-04 Filtro por categoria
- Prioridad: `MUST`
- Historia: Como usuario quiero filtrar por categoria para reducir ruido y ver solo negocios de mi interes.

#### B-05 Filtro por zona
- Prioridad: `MUST`
- Historia: Como usuario quiero filtrar por zona para encontrar opciones cercanas a donde estoy o a donde voy.

#### B-06 Cerca de mi
- Prioridad: `MUST`
- Historia: Como usuario quiero ordenar o filtrar por cercania para descubrir negocios utiles alrededor de mi ubicacion actual.
- Dependencias: permisos de geolocalizacion, PostGIS, fallback por zona.

#### B-07 Vista de mapa
- Prioridad: `SHOULD`
- Historia: Como usuario quiero ver negocios sobre mapa para entender mejor su distribucion por zona.
- Dependencias: coordenadas, diseno bottom sheet.

### Epic C - Ficha de negocio

#### C-01 Detalle completo
- Prioridad: `MUST`
- Historia: Como usuario quiero abrir la ficha de un negocio para validar si me conviene visitarlo o escribirle.
- Incluye: nombre, categoria, descripcion, direccion, horario, reseñas, galeria, catalogo y CTA.

#### C-02 Galeria de imagenes
- Prioridad: `MUST`
- Historia: Como usuario quiero ver fotos del negocio para entender mejor su oferta y generar confianza.

#### C-03 Catalogo de productos destacados
- Prioridad: `MUST`
- Historia: Como usuario quiero ver productos o servicios destacados dentro de la ficha para decidir mas rapido.

#### C-04 Estado abierto/cerrado
- Prioridad: `SHOULD`
- Historia: Como usuario quiero saber si el negocio esta abierto ahora para no perder tiempo.

### Epic D - Acciones de usuario

#### D-01 Guardar en favoritos
- Prioridad: `MUST`
- Historia: Como usuario autenticado quiero guardar un negocio en favoritos para revisarlo despues.

#### D-02 Quitar de favoritos
- Prioridad: `MUST`
- Historia: Como usuario autenticado quiero quitar negocios de favoritos para mantener mi lista util.

#### D-03 Ver lista de favoritos
- Prioridad: `MUST`
- Historia: Como usuario autenticado quiero ver todos mis favoritos en una sola pantalla para reabrirlos rapido.

#### D-04 CTA a WhatsApp
- Prioridad: `MUST`
- Historia: Como usuario quiero escribir al negocio por WhatsApp con un mensaje prellenado para ahorrar tiempo.

#### D-05 Compartir negocio
- Prioridad: `COULD`
- Historia: Como usuario quiero compartir un negocio por enlace para recomendarlo a otra persona.

### Epic E - Reseñas y confianza

#### E-01 Ver reseñas
- Prioridad: `MUST`
- Historia: Como usuario quiero leer reseñas para evaluar la confianza del negocio.

#### E-02 Publicar reseña
- Prioridad: `SHOULD`
- Historia: Como usuario autenticado quiero dejar una calificacion y comentario para ayudar a otros usuarios.

#### E-03 Promedio de calificacion
- Prioridad: `MUST`
- Historia: Como usuario quiero ver la calificacion promedio para evaluar rapido una opcion.

### Epic F - Perfil de usuario

#### F-01 Ver perfil
- Prioridad: `MUST`
- Historia: Como usuario quiero consultar mis datos basicos y accesos de cuenta desde una sola pantalla.

#### F-02 Editar perfil
- Prioridad: `SHOULD`
- Historia: Como usuario quiero actualizar mi nombre, telefono y avatar para mantener mi cuenta vigente.

## Priorizacion de entrega recomendada
1. Autenticacion basica.
2. Home, listado y busqueda.
3. Filtros por categoria y zona.
4. Ficha de negocio.
5. WhatsApp CTA.
6. Favoritos.
7. Cerca de mi.
8. Reseñas.
9. Mapa.
10. Edicion de perfil.

## Dependencias transversales
- Datos: seeds con negocios, categorias, zonas, coordenadas e imagenes.
- API: endpoints de auth, negocios, filtros, favoritos, reseñas y perfil.
- Infra: Docker Compose, Postgres/PostGIS, storage local o S3-compatible.
- QA: casos criticos desde registro hasta tap en WhatsApp.

## Fuera del MVP
- Chat interno.
- Checkout o pagos.
- Promociones y cupones.
- Recomendador.
- Panel administrativo complejo.
- Multiciudad.
