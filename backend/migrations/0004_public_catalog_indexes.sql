BEGIN;

-- B1 public catalog performance indexes.
-- Keeps scope limited to read-heavy listing/detail filters.

CREATE INDEX IF NOT EXISTS businesses_status_zone_idx
    ON businesses (status, zone);

CREATE INDEX IF NOT EXISTS businesses_tsv_idx
    ON businesses
    USING GIN (to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS business_category_assignments_category_business_idx
    ON business_category_assignments (category_id, business_id);

CREATE INDEX IF NOT EXISTS business_images_business_kind_position_idx
    ON business_images (business_id, kind, position);

CREATE INDEX IF NOT EXISTS reviews_published_business_created_idx
    ON reviews (business_id, created_at DESC)
    WHERE status = 'published';

COMMIT;
