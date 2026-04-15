# Acceptance Criteria

## Convenciones
- Todos los criterios estan escritos para el MVP.
- Cada feature debe cubrir exito, vacio y error cuando aplique.
- Las respuestas de backend deben respetar los contratos de `docs/backend/api-spec.md`.
- La experiencia debe construirse como una sola web app responsive, mobile-first, con desktop como adaptacion del mismo producto.
- La implementacion frontend debe seguir la decision canonica de `docs/decisions/frontend-stack.md`.

## Registro

### Escenario: registro exitoso
- Dado que soy un visitante sin sesion
- Cuando completo nombre, email y password validos
- Entonces el sistema crea mi cuenta
- Y me autentica automaticamente o me redirige a iniciar sesion con confirmacion visible

### Escenario: email ya registrado
- Dado que intento crear una cuenta con un email existente
- Cuando envio el formulario
- Entonces veo un mensaje claro indicando que ese email ya esta en uso
- Y no se crea una cuenta duplicada

### Escenario: validaciones de formulario
- Dado que el formulario de registro esta abierto
- Cuando dejo campos obligatorios vacios o un email invalido
- Entonces el boton principal no debe avanzar o debe mostrar errores inline
- Y el mensaje debe indicar exactamente que corregir

## Inicio de sesion

### Escenario: login exitoso
- Dado que tengo una cuenta valida
- Cuando ingreso email y password correctos
- Entonces entro a la aplicacion autenticada
- Y puedo acceder a favoritos y perfil

### Escenario: credenciales invalidas
- Dado que intento iniciar sesion con datos incorrectos
- Cuando envio el formulario
- Entonces veo un mensaje de error entendible
- Y el sistema no revela si el fallo fue por email o password

### Escenario: sesion persistente
- Dado que ya inicie sesion anteriormente
- Cuando regreso a la app con un token valido
- Entonces debo continuar autenticado sin volver a loguearme

## Home y exploracion

### Escenario: carga inicial con contenido util
- Dado que abro la app autenticado o como visitante
- Cuando se carga la pantalla inicial
- Entonces veo buscador, categorias y negocios destacados o cercanos
- Y la pantalla principal presenta al menos una accion clara en menos de dos toques

### Escenario: estado vacio por falta de datos
- Dado que no existen negocios disponibles para una seccion
- Cuando entro a la home o a un listado
- Entonces veo un estado vacio explicito
- Y recibo una accion para reintentar, limpiar filtros o volver a explorar

### Escenario: error de carga
- Dado que la API de negocios falla
- Cuando intento entrar a la home o al listado
- Entonces veo un mensaje de error no tecnico
- Y existe una accion visible para reintentar

## Busqueda por texto

### Escenario: busqueda con coincidencias
- Dado que estoy en home o buscar
- Cuando escribo un termino relacionado con negocio, categoria o producto
- Entonces veo resultados relevantes ordenados por coincidencia
- Y el termino permanece visible en el campo de busqueda

### Escenario: busqueda sin coincidencias
- Dado que realizo una busqueda sin resultados
- Cuando la API responde vacio
- Entonces veo el mensaje "No encontramos negocios con esos filtros"
- Y puedo limpiar la busqueda o cambiar categoria/zona

## Filtros por categoria y zona

### Escenario: aplicar categoria
- Dado que estoy viendo un listado de negocios
- Cuando selecciono una categoria
- Entonces el listado y el mapa, si esta visible, se actualizan segun esa categoria
- Y el chip seleccionado queda visualmente activo

### Escenario: aplicar zona
- Dado que estoy viendo negocios
- Cuando selecciono una zona valida
- Entonces solo veo negocios de esa zona
- Y la zona seleccionada queda reflejada en la UI

### Escenario: combinar filtros
- Dado que ya aplique una categoria
- Cuando agrego una zona o termino de busqueda
- Entonces el sistema combina los filtros
- Y muestra un estado vacio si no hay coincidencias

## Cerca de mi

### Escenario: geolocalizacion aceptada
- Dado que otorgo permiso de ubicacion
- Cuando activo "Cerca de mi"
- Entonces veo negocios ordenados o filtrados por distancia
- Y cada tarjeta puede mostrar una distancia aproximada

### Escenario: geolocalizacion denegada
- Dado que rechazo el permiso de ubicacion
- Cuando intento usar "Cerca de mi"
- Entonces el sistema informa que no pudo acceder a mi ubicacion
- Y me ofrece continuar por zona sin bloquear la exploracion

## Vista de mapa

### Escenario: mapa con negocios
- Dado que existen negocios con coordenadas validas
- Cuando entro a la vista de mapa
- Entonces veo marcadores por negocio
- Y al tocar un marcador aparece una ficha resumida con CTA rapido

### Escenario: negocio sin coordenadas
- Dado que un negocio no tiene coordenadas
- Cuando consulto la vista de mapa
- Entonces ese negocio no debe romper la pantalla
- Y debe seguir disponible en la vista de listado si cumple el resto de datos minimos

## Ficha de negocio

### Escenario: detalle completo
- Dado que selecciono un negocio del listado o del mapa
- Cuando abro su ficha
- Entonces veo nombre, categoria, descripcion, direccion, horario, galeria, catalogo, reseñas y CTA principal
- Y el contenido mas importante aparece antes del primer scroll largo

### Escenario: horarios y estado operativo
- Dado que un negocio tiene horarios configurados
- Cuando entro a su ficha
- Entonces veo los horarios en formato local entendible
- Y si existe esa logica tambien veo si esta abierto o cerrado ahora

### Escenario: placeholders por contenido faltante
- Dado que un negocio aun no tiene galeria completa o catalogo completo
- Cuando entro a la ficha
- Entonces la UI muestra placeholders o secciones omitidas con orden consistente
- Y nunca muestra imagenes rotas o bloques vacios sin contexto

## Favoritos

### Escenario: guardar favorito autenticado
- Dado que estoy autenticado
- Cuando toco el control de favorito en una tarjeta o ficha
- Entonces el negocio queda guardado en mi cuenta
- Y veo confirmacion visual inmediata

### Escenario: intento guardar sin sesion
- Dado que no he iniciado sesion
- Cuando intento guardar un favorito
- Entonces el sistema me pide autenticarme
- Y no pierde el contexto de la pantalla actual

### Escenario: listar favoritos
- Dado que ya tengo favoritos guardados
- Cuando entro a la seccion Favoritos
- Entonces veo mis negocios guardados con acceso directo a su ficha

### Escenario: favoritos vacios
- Dado que no tengo favoritos
- Cuando entro a la seccion Favoritos
- Entonces veo un estado vacio claro
- Y una accion para volver a explorar negocios

## WhatsApp CTA

### Escenario: apertura de WhatsApp con mensaje contextual
- Dado que un negocio tiene `whatsapp_number` valido
- Cuando toco el CTA principal de WhatsApp
- Entonces se abre WhatsApp o su version web con un mensaje prellenado
- Y el mensaje incluye el nombre del negocio y una referencia contextual al producto o categoria si aplica

### Escenario: numero invalido o ausente
- Dado que el negocio no tiene numero valido para WhatsApp
- Cuando entro a su ficha
- Entonces el CTA de WhatsApp no debe mostrarse como accion disponible
- O debe mostrarse deshabilitado con una explicacion clara

## Reseñas

### Escenario: ver reseñas publicadas
- Dado que un negocio tiene reseñas aprobadas
- Cuando entro a su ficha
- Entonces veo la calificacion promedio, el numero de reseñas y comentarios visibles

### Escenario: publicar reseña autenticado
- Dado que estoy autenticado
- Cuando envio una calificacion valida y un comentario dentro de las reglas
- Entonces la reseña se registra
- Y la UI confirma si se publico o quedo pendiente de moderacion

### Escenario: publicar reseña sin sesion
- Dado que no estoy autenticado
- Cuando intento enviar una reseña
- Entonces el sistema solicita inicio de sesion antes de continuar

## Perfil de usuario

### Escenario: ver perfil basico
- Dado que estoy autenticado
- Cuando entro a Perfil
- Entonces veo mis datos basicos y accesos a favoritos y cierre de sesion

### Escenario: editar perfil
- Dado que estoy autenticado
- Cuando actualizo mi nombre, telefono o avatar con datos validos
- Entonces el sistema guarda los cambios
- Y veo confirmacion de actualizacion exitosa

## Reglas UX y accesibilidad obligatorias
- El CTA principal de cada ficha debe ser WhatsApp si el negocio tiene numero valido.
- Todo boton de WhatsApp debe incluir `aria-label` con nombre del negocio.
- El contraste de texto principal debe cumplir minimo 4.5:1.
- Si el usuario tiene `prefers-reduced-motion`, los rebotes o animaciones decorativas deben reducirse o deshabilitarse.
- Ninguna pantalla del MVP debe depender exclusivamente del mapa para completar una tarea.
