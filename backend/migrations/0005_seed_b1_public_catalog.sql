BEGIN;

-- Minimal, reproducible B1 seed for local development.
-- Keeps scope in public catalog: list/detail/filters/reviews (read-only flows).

INSERT INTO users (id, name, email, password_hash, role)
VALUES
    (
        '00000000-0000-0000-0000-000000000901',
        'Cliente Uno',
        'cliente.uno@example.com',
        '$2b$12$000000000000000000000.u4v8Qw8w5x7P4V5bR3y8mM3K7R6m',
        'customer'
    ),
    (
        '00000000-0000-0000-0000-000000000902',
        'Cliente Dos',
        'cliente.dos@example.com',
        '$2b$12$000000000000000000000.u4v8Qw8w5x7P4V5bR3y8mM3K7R6m',
        'customer'
    )
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role;

INSERT INTO businesses (
    id,
    name,
    slug,
    description,
    address,
    zone,
    status,
    whatsapp_number
)
VALUES (
    '00000000-0000-0000-0000-000000000399',
    'Negocio Borrador Tepic',
    'negocio-borrador-tepic',
    'Negocio no publicado para verificar 404 de detalle publico.',
    'Calle Falsa 123, Tepic, Nayarit',
    'Centro',
    'draft',
    NULL
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    zone = EXCLUDED.zone,
    status = EXCLUDED.status;

INSERT INTO business_images (id, business_id, image_url, kind, position, caption)
SELECT
    '00000000-0000-0000-0000-000000000511',
    b.id,
    'https://images.example.com/el-antojito-cover.jpg',
    'cover',
    0,
    'Portada El Antojito'
FROM businesses b
WHERE b.slug = 'el-antojito-tepic'
  AND NOT EXISTS (
      SELECT 1
      FROM business_images bi
      WHERE bi.business_id = b.id
        AND bi.kind = 'cover'
  );

INSERT INTO business_images (id, business_id, image_url, kind, position, caption)
SELECT
    '00000000-0000-0000-0000-000000000512',
    b.id,
    'https://images.example.com/cafe-parroquia-cover.jpg',
    'cover',
    0,
    'Portada Cafe la Parroquia'
FROM businesses b
WHERE b.slug = 'cafe-la-parroquia-tepic'
  AND NOT EXISTS (
      SELECT 1
      FROM business_images bi
      WHERE bi.business_id = b.id
        AND bi.kind = 'cover'
  );

INSERT INTO business_images (id, business_id, image_url, kind, position, caption)
SELECT
    '00000000-0000-0000-0000-000000000513',
    b.id,
    'https://images.example.com/sopa-piezzi-cover.jpg',
    'cover',
    0,
    'Portada La Sopa de Piezzi'
FROM businesses b
WHERE b.slug = 'la-sopa-de-piezzi-tepic'
  AND NOT EXISTS (
      SELECT 1
      FROM business_images bi
      WHERE bi.business_id = b.id
        AND bi.kind = 'cover'
  );

INSERT INTO products (
    id,
    business_id,
    name,
    description,
    price,
    currency,
    is_featured,
    status
)
SELECT
    '00000000-0000-0000-0000-000000000611',
    b.id,
    'Taco Gobernador',
    'Platillo destacado para pruebas de busqueda por producto.',
    145.00,
    'MXN',
    true,
    'active'
FROM businesses b
WHERE b.slug = 'el-antojito-tepic'
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status;

INSERT INTO products (
    id,
    business_id,
    name,
    description,
    price,
    currency,
    is_featured,
    status
)
SELECT
    '00000000-0000-0000-0000-000000000612',
    b.id,
    'Cafe de Olla',
    'Bebida insignia para pruebas de listado y detalle.',
    48.00,
    'MXN',
    true,
    'active'
FROM businesses b
WHERE b.slug = 'cafe-la-parroquia-tepic'
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status;

INSERT INTO reviews (
    id,
    business_id,
    user_id,
    rating,
    comment,
    status,
    visited_at
)
SELECT
    '00000000-0000-0000-0000-000000000711',
    b.id,
    '00000000-0000-0000-0000-000000000901',
    5,
    'Excelente atencion y comida.',
    'published',
    DATE '2026-04-10'
FROM businesses b
WHERE b.slug = 'el-antojito-tepic'
ON CONFLICT (business_id, user_id) WHERE status <> 'rejected'
DO UPDATE
SET rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    status = EXCLUDED.status,
    visited_at = EXCLUDED.visited_at;

INSERT INTO reviews (
    id,
    business_id,
    user_id,
    rating,
    comment,
    status,
    visited_at
)
SELECT
    '00000000-0000-0000-0000-000000000712',
    b.id,
    '00000000-0000-0000-0000-000000000902',
    4,
    'Buen servicio y tiempos adecuados.',
    'published',
    DATE '2026-04-11'
FROM businesses b
WHERE b.slug = 'el-antojito-tepic'
ON CONFLICT (business_id, user_id) WHERE status <> 'rejected'
DO UPDATE
SET rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    status = EXCLUDED.status,
    visited_at = EXCLUDED.visited_at;

COMMIT;
