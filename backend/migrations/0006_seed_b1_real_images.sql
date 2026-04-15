BEGIN;

-- Replace placeholder cover URLs from B1 seed with real public images.
-- Incremental migration to avoid rewriting already-applied migrations.

UPDATE business_images bi
SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tacos_on_a_plate.jpg',
    caption = 'Tacos on a plate (Wikimedia Commons)'
FROM businesses b
WHERE bi.business_id = b.id
  AND b.slug = 'el-antojito-tepic'
  AND bi.kind = 'cover';

UPDATE business_images bi
SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Blue_coffee_cup_%28Unsplash%29.jpg',
    caption = 'Blue coffee cup (Wikimedia Commons)'
FROM businesses b
WHERE bi.business_id = b.id
  AND b.slug = 'cafe-la-parroquia-tepic'
  AND bi.kind = 'cover';

UPDATE business_images bi
SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Caldo_tlalpe%C3%B1o.JPG',
    caption = 'Caldo tlalpeno (Wikimedia Commons)'
FROM businesses b
WHERE bi.business_id = b.id
  AND b.slug = 'la-sopa-de-piezzi-tepic'
  AND bi.kind = 'cover';

COMMIT;
