# Product Brief

## Resumen ejecutivo
Tepic Catalog es una web app mobile-first para descubrir negocios locales de Tepic con una experiencia inspirada en Uber, Didi y Rappi por su velocidad, claridad de navegacion y facilidad de uso. La app no es un marketplace transaccional; su objetivo en MVP es ayudar a las personas a encontrar negocios utiles, evaluar su informacion rapidamente y contactar al negocio por WhatsApp con el menor numero de pasos posible.

## Problema
Hoy, descubrir negocios locales en Tepic suele implicar busquedas dispersas en redes sociales, Google Maps, grupos de WhatsApp y recomendaciones informales. Eso genera friccion por cuatro razones:

- La informacion esta incompleta o desactualizada.
- Encontrar negocios por zona, categoria o cercania toma demasiado tiempo.
- Es dificil comparar opciones rapidamente desde el celular.
- El usuario no tiene un flujo consistente para guardar opciones o contactar negocios.

## Oportunidad
Existe espacio para una plataforma local que combine:

- Descubrimiento rapido por categoria, zona y cercania.
- Fichas completas con horarios, ubicacion, fotos, catalogo y reseñas.
- Un CTA primario claro a WhatsApp.
- Una experiencia visual familiar para usuarios acostumbrados a apps de movilidad y delivery.

## Objetivo del MVP
Entregar una experiencia utilizable por usuarios reales que permita:

- Registrarse e iniciar sesion.
- Explorar negocios desde una home clara y mobile-first.
- Buscar por texto, categoria, zona y "cerca de mi".
- Abrir una ficha de negocio con informacion confiable.
- Guardar favoritos.
- Contactar al negocio via WhatsApp.
- Administrar un perfil basico de usuario.
- Leer y publicar reseñas basicas.

## Propuesta de valor
Tepic Catalog reduce el tiempo entre "quiero encontrar algo" y "ya se a quien contactar" a menos de dos interacciones desde la pantalla inicial, priorizando informacion confiable, cercania geografica y contacto directo.

## Usuarios objetivo

### 1. Explorador local
- Residente de Tepic que busca nuevas opciones por antojo, necesidad puntual o conveniencia.
- Necesita ver rapido negocios por categoria, zona y cercania.
- Valora favoritos, horarios, reseñas y fotos.

### 2. Visitante
- Persona que esta temporalmente en Tepic por trabajo, turismo o visita familiar.
- No conoce bien la ciudad ni las zonas.
- Necesita orientarse con mapa, categorias claras y confianza visual.

### 3. Comerciante
- Dueño o responsable del negocio.
- No es foco de implementacion del MVP front-office, pero el modelo debe dejar preparado el camino para catalogos, medios y actualizacion de informacion en fases siguientes.

## Jobs to be done
- Cuando estoy buscando un negocio cercano, quiero encontrar opciones utiles en pocos toques para decidir rapido.
- Cuando encuentro un negocio interesante, quiero validar horario, ubicacion y catalogo antes de escribirle.
- Cuando me interesa volver despues, quiero guardarlo en favoritos sin repetir la busqueda.
- Cuando necesito resolver algo ya, quiero contactar por WhatsApp con un mensaje prellenado y contextual.

## Experiencia objetivo
- Inicio con acceso rapido a categorias, busqueda y negocios cercanos.
- Resultados visibles en lista y/o mapa sin complejidad innecesaria.
- Fichas con jerarquia clara: portada, nombre, categoria, horario, zona, galeria, catalogo, reseñas y CTA.
- Navegacion tabular simple: `Inicio`, `Buscar`, `Mapa`, `Favoritos`, `Perfil`.
- Tono cercano, local y claro, evitando ruido visual y pasos sobrantes.

## Principios de producto
1. Tiempo a valor en maximo dos toques desde la entrada principal.
2. La confianza local pesa mas que la decoracion visual.
3. El CTA principal siempre es contactar por WhatsApp.
4. La experiencia debe sentirse nativa en mobile aunque sea web app.
5. Cada pantalla debe resolver una accion principal.
6. Ninguna feature del MVP depende de IA, pagos o automatizaciones avanzadas.

## Alcance funcional del MVP

### Incluido
- Registro de usuario por email y password.
- Login y sesion basica con JWT.
- Home con categorias destacadas, buscador y negocios sugeridos.
- Listado de negocios con filtros por categoria, zona y texto.
- Vista de mapa con negocios geolocalizados.
- Logica "cerca de mi" basada en permisos del navegador y PostGIS.
- Ficha de negocio con descripcion, horarios, direccion, galeria y catalogo.
- Favoritos para usuarios autenticados.
- Reseñas basicas con puntuacion y comentario.
- Perfil basico para editar nombre, telefono y avatar.
- CTA a WhatsApp con mensaje prellenado.

### Excluido del MVP
- Pedidos en linea.
- Chat interno.
- Recomendaciones personalizadas.
- Panel administrativo complejo.
- Onboarding para comerciantes.
- Automatizaciones avanzadas de WhatsApp.
- Notificaciones push.
- App nativa.
- Multi-ciudad o multi-tenant.

## KPIs iniciales
- 60 por ciento de las sesiones autenticadas abren al menos una ficha de negocio.
- 30 por ciento de las fichas abiertas generan tap en el CTA de WhatsApp.
- 20 negocios activos con informacion completa en staging.
- Tiempo de respuesta de busqueda menor a 500 ms en entorno controlado.
- 25 por ciento de usuarios autenticados guardan al menos un favorito durante su primera semana.

## Requisitos de contenido y datos
- Todo negocio publicado debe tener nombre, categoria, zona, direccion, coordenadas y al menos una imagen.
- Los horarios deben mostrarse con formato local en español.
- El numero de WhatsApp debe estar validado para generar enlaces funcionales.
- Las categorias del MVP deben estar curadas y ser limitadas para evitar ruido.
- La galeria y el catalogo deben tener placeholders cuando falte contenido, nunca huecos rotos.

## Dependencias de producto
- Backend REST con contratos estables para auth, negocios, favoritos y reseñas.
- PostgreSQL + PostGIS para filtros geograficos.
- Storage S3-compatible para imagenes.
- Seeds iniciales con negocios reales o semirrealistas para validar usabilidad.
- Especificacion visual en `docs/design/`.

## Riesgos y mitigaciones
- Riesgo: datos incompletos reducen confianza.
- Mitigacion: reglas de publicacion minima y seeds curados.

- Riesgo: busqueda cerca de mi falla por permisos denegados.
- Mitigacion: fallback por zona y mensaje claro al usuario.

- Riesgo: UX sobrecargada por intentar parecer app de delivery.
- Mitigacion: mantener solo acciones esenciales del catalogo local.

## Criterio de exito de lanzamiento MVP
El MVP se considera listo para pruebas reales cuando un usuario nuevo puede registrarse, encontrar un negocio por categoria o cercania, abrir su ficha, guardarlo en favoritos y abrir WhatsApp sin necesitar asistencia externa.
