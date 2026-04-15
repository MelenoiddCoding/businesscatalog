BEGIN;

-- OSM-backed initial seed for Tepic businesses.
-- Sources are documented in docs/backend/seed-data.md.

INSERT INTO business_categories (id, slug, name, icon)
VALUES
    ('00000000-0000-0000-0000-000000000101', 'restaurant', 'Restaurant', 'restaurant'),
    ('00000000-0000-0000-0000-000000000102', 'cafe', 'Cafe', 'local_cafe'),
    ('00000000-0000-0000-0000-000000000103', 'fast-food', 'Fast Food', 'fastfood')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon;

WITH seeded_businesses AS (
    INSERT INTO businesses (
        id,
        name,
        slug,
        description,
        phone,
        whatsapp_number,
        website,
        address,
        zone,
        is_verified,
        status
    )
    VALUES
        (
            '00000000-0000-0000-0000-000000000311',
            'El Antojito',
            'el-antojito-tepic',
            'Mexican restaurant in Tepic sourced from OpenStreetMap seed data.',
            '+523111622020',
            '+523111622020',
            NULL,
            'Avenida Mexico 614 A, Tepic, Nayarit, 63050',
            'Centro',
            false,
            'published'
        ),
        (
            '00000000-0000-0000-0000-000000000312',
            'Cafe la Parroquia',
            'cafe-la-parroquia-tepic',
            'Cafe and breakfast option in Tepic sourced from OpenStreetMap seed data.',
            '+523112170262',
            '+523112170262',
            NULL,
            'Emiliano Zapata 270, Tepic, Nayarit, 63000',
            'Centro',
            false,
            'published'
        ),
        (
            '00000000-0000-0000-0000-000000000313',
            'La Sopa de Piezzi',
            'la-sopa-de-piezzi-tepic',
            'Seafood and mexican restaurant in Tepic sourced from OpenStreetMap seed data.',
            '+523112147983',
            '+523111330202',
            NULL,
            'Avenida Insurgentes 165, Tepic, Nayarit',
            'Insurgentes',
            false,
            'published'
        ),
        (
            '00000000-0000-0000-0000-000000000314',
            'Carl''s Jr. Colosio',
            'carls-jr-avenida-colosio-tepic',
            'Fast food burger option in Tepic sourced from OpenStreetMap seed data.',
            '+528007322757',
            '+528007322757',
            'https://www.carlsjr.com.mx',
            'Avenida Colosio 680, Tepic, Nayarit, 63175',
            'Colosio',
            false,
            'published'
        ),
        (
            '00000000-0000-0000-0000-000000000315',
            'Loma42',
            'loma42-tepic',
            'Mexican restaurant in Tepic sourced from OpenStreetMap seed data.',
            NULL,
            NULL,
            NULL,
            'Paseo de la Loma, Tepic, Nayarit',
            'La Loma',
            false,
            'published'
        )
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        phone = EXCLUDED.phone,
        whatsapp_number = EXCLUDED.whatsapp_number,
        website = EXCLUDED.website,
        address = EXCLUDED.address,
        zone = EXCLUDED.zone,
        status = EXCLUDED.status
    RETURNING id, slug
),
all_seeded_businesses AS (
    SELECT id, slug
    FROM seeded_businesses
    UNION
    SELECT b.id, b.slug
    FROM businesses b
    WHERE b.slug IN (
        'el-antojito-tepic',
        'cafe-la-parroquia-tepic',
        'la-sopa-de-piezzi-tepic',
        'carls-jr-avenida-colosio-tepic',
        'loma42-tepic'
    )
)
INSERT INTO business_locations (
    id,
    business_id,
    latitude,
    longitude,
    opening_hours,
    pickup_available
)
SELECT
    CASE b.slug
        WHEN 'el-antojito-tepic' THEN '00000000-0000-0000-0000-000000000411'::uuid
        WHEN 'cafe-la-parroquia-tepic' THEN '00000000-0000-0000-0000-000000000412'::uuid
        WHEN 'la-sopa-de-piezzi-tepic' THEN '00000000-0000-0000-0000-000000000413'::uuid
        WHEN 'carls-jr-avenida-colosio-tepic' THEN '00000000-0000-0000-0000-000000000414'::uuid
        WHEN 'loma42-tepic' THEN '00000000-0000-0000-0000-000000000415'::uuid
    END,
    b.id,
    CASE b.slug
        WHEN 'el-antojito-tepic' THEN 21.5190269
        WHEN 'cafe-la-parroquia-tepic' THEN 21.5118420
        WHEN 'la-sopa-de-piezzi-tepic' THEN 21.5032784
        WHEN 'carls-jr-avenida-colosio-tepic' THEN 21.4920409
        WHEN 'loma42-tepic' THEN 21.5040975
    END,
    CASE b.slug
        WHEN 'el-antojito-tepic' THEN -104.8887590
        WHEN 'cafe-la-parroquia-tepic' THEN -104.8968007
        WHEN 'la-sopa-de-piezzi-tepic' THEN -104.8922364
        WHEN 'carls-jr-avenida-colosio-tepic' THEN -104.8659292
        WHEN 'loma42-tepic' THEN -104.9017411
    END,
    CASE b.slug
        WHEN 'el-antojito-tepic' THEN '{"osm_opening_hours":"Tu-Su 12:00-00:00"}'::jsonb
        WHEN 'cafe-la-parroquia-tepic' THEN '{"osm_opening_hours":"Tu-Su 07:30-14:00"}'::jsonb
        WHEN 'la-sopa-de-piezzi-tepic' THEN '{"osm_opening_hours":"Mo-Su 07:30-16:30"}'::jsonb
        ELSE NULL
    END,
    true
FROM all_seeded_businesses b
ON CONFLICT (business_id) DO UPDATE
SET latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    opening_hours = EXCLUDED.opening_hours,
    pickup_available = EXCLUDED.pickup_available;

INSERT INTO business_category_assignments (business_id, category_id, relevance_score)
SELECT
    b.id,
    c.id,
    1
FROM (
    VALUES
        ('el-antojito-tepic', 'restaurant'),
        ('cafe-la-parroquia-tepic', 'cafe'),
        ('la-sopa-de-piezzi-tepic', 'restaurant'),
        ('carls-jr-avenida-colosio-tepic', 'fast-food'),
        ('loma42-tepic', 'restaurant')
) AS mapping(business_slug, category_slug)
JOIN businesses b
    ON b.slug = mapping.business_slug
JOIN business_categories c
    ON c.slug = mapping.category_slug
ON CONFLICT (business_id, category_id) DO UPDATE
SET relevance_score = EXCLUDED.relevance_score;

COMMIT;
