# AGENTS.md

## Propósito general
Construir una **web app mobile-first** para explorar negocios locales de Tepic, inspirada visualmente en experiencias tipo Uber / Didi / Rappi por su claridad, rapidez y facilidad de uso, pero adaptada a un catálogo de negocios locales.

La plataforma debe permitir que usuarios autenticados puedan:
- descubrir negocios locales,
- ver información relevante (horarios, ubicación, descripción, fotos, catálogo, reseñas),
- buscar por categoría, zona, cercanía y productos,
- guardar favoritos,
- contactar al negocio por WhatsApp,
- administrar su cuenta.

## Alcance del proyecto
Este repositorio está enfocado en un **MVP funcional y utilizable por usuarios reales**.  
La prioridad es entregar una experiencia clara, rápida, consistente y fácil de mantener.

## Referencia visual
Las imágenes del paquete `stitch_reference/` deben usarse **solo como referencia visual y de experiencia**:
- paleta vibrante,
- tarjetas limpias,
- navegación simple,
- CTA claros,
- diseño mobile-first,
- uso claro de mapas, listados y fichas.

**No replicar literalmente** las imágenes ni asumir que sus componentes representan funcionalidades definitivas.  
La referencia visual debe adaptarse a las necesidades reales del producto.

---

# MVP inicial

## Funcionalidades incluidas en MVP
1. Registro de usuario
2. Inicio de sesión
3. Gestión básica de sesión
4. Listado de negocios
5. Vista de detalle de negocio
6. Búsqueda por texto
7. Filtro por categoría
8. Filtro por zona
9. Búsqueda “cerca de mí”
10. Favoritos
11. CTA a WhatsApp
12. Perfil básico de usuario
13. Reseñas de negocios

## Fuera del MVP
No implementar estas funcionalidades salvo instrucción explícita:
- chat interno
- recomendaciones inteligentes
- panel complejo para negocios
- app nativa
- OpenSearch / Elastic
- automatizaciones avanzadas de WhatsApp
- sistema avanzado de notificaciones
- arquitectura multi-tenant
- dashboards administrativos complejos
- pagos en línea
- promociones/cupones
- gamificación

---

# Principios de implementación

1. **Simplicidad sobre complejidad prematura**
2. **Web app primero**
3. **Mobile-first siempre**
4. **Documentar antes de escalar**
5. **No inventar requisitos**
6. **No introducir herramientas innecesarias**
7. **Priorizar entregables verificables**
8. **Mantener contratos claros entre frontend y backend**
9. **No optimizar para escalas hipotéticas sin evidencia**
10. **Cada agente debe dejar artefactos claros y reutilizables**

---

# Stack base obligatorio

## Frontend
- Next.js
- React
- TypeScript
- Enfoque responsive mobile-first

## Backend
- FastAPI
- Python
- REST API
- JWT para autenticación

## Base de datos
- PostgreSQL
- PostGIS para búsquedas geográficas

## Storage
- S3-compatible storage para imágenes y medios

## Infraestructura local
- Docker Compose

## Notas de stack
- No usar GraphQL en MVP
- No usar Expo o app híbrida en MVP
- No usar Elastic/OpenSearch en MVP
- No agregar servicios externos adicionales sin justificarlo en `docs/decisions/`

---

# Estructura de documentación esperada

Todos los agentes deben trabajar y mantener actualizados los artefactos en `docs/`.

## Estructura mínima esperada
```text
docs/
  product/
    brief.md
    backlog.md
    acceptance-criteria.md
  design/
    navigation.md
    ui-guidelines.md
  backend/
    api-spec.md
    data-model.md
  infra/
    local-setup.md
    deployment.md
  testing/
    test-plan.md
    test-cases.md
  decisions/