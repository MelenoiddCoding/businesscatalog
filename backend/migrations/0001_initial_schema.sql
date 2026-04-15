BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE business_status AS ENUM ('draft', 'published', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE product_status AS ENUM ('active', 'paused', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE review_status AS ENUM ('pending', 'published', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE business_image_kind AS ENUM ('cover', 'gallery', 'menu', 'stitch_ref');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY,
    name varchar(120) NOT NULL,
    email citext NOT NULL UNIQUE,
    phone varchar(20),
    password_hash varchar(255) NOT NULL,
    avatar_url text,
    role user_role NOT NULL DEFAULT 'customer',
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash varchar(255) NOT NULL,
    user_agent text,
    ip_address inet,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_categories (
    id uuid PRIMARY KEY,
    slug citext NOT NULL UNIQUE,
    name varchar(80) NOT NULL,
    icon varchar(80),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS businesses (
    id uuid PRIMARY KEY,
    name varchar(160) NOT NULL,
    slug citext NOT NULL UNIQUE,
    description text NOT NULL,
    phone varchar(20),
    whatsapp_number varchar(20),
    email varchar(120),
    website text,
    address text NOT NULL,
    zone varchar(120) NOT NULL,
    rating_avg numeric(2,1) NOT NULL DEFAULT 0,
    rating_count integer NOT NULL DEFAULT 0,
    is_verified boolean NOT NULL DEFAULT false,
    status business_status NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS businesses_zone_idx ON businesses (zone);
CREATE INDEX IF NOT EXISTS businesses_name_idx ON businesses (name);

CREATE TABLE IF NOT EXISTS business_locations (
    id uuid PRIMARY KEY,
    business_id uuid NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    latitude numeric(10,6) NOT NULL,
    longitude numeric(10,6) NOT NULL,
    geog_point geography(point, 4326) NOT NULL,
    opening_hours jsonb,
    pickup_available boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_locations_geog_point_idx
    ON business_locations
    USING GIST (geog_point);

CREATE TABLE IF NOT EXISTS business_category_assignments (
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE,
    relevance_score smallint NOT NULL DEFAULT 1,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (business_id, category_id)
);

CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    sku varchar(60),
    name varchar(160) NOT NULL,
    description text,
    price numeric(10,2),
    currency char(3) NOT NULL DEFAULT 'MXN',
    tags text[],
    is_featured boolean NOT NULL DEFAULT false,
    status product_status NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_business_id_idx ON products (business_id);
CREATE INDEX IF NOT EXISTS products_status_business_id_idx ON products (status, business_id);
CREATE INDEX IF NOT EXISTS products_tags_idx ON products USING GIN (tags);
CREATE INDEX IF NOT EXISTS products_tsv_idx
    ON products
    USING GIN (to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, '')));

CREATE TABLE IF NOT EXISTS product_images (
    id uuid PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    alt_text varchar(160),
    position smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS business_images (
    id uuid PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    caption varchar(160),
    kind business_image_kind NOT NULL DEFAULT 'gallery',
    position smallint NOT NULL DEFAULT 0,
    source_reference jsonb
);

CREATE INDEX IF NOT EXISTS business_images_business_id_idx ON business_images (business_id);
CREATE UNIQUE INDEX IF NOT EXISTS business_images_cover_unique_idx
    ON business_images (business_id)
    WHERE kind = 'cover';

CREATE TABLE IF NOT EXISTS favorites (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, business_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    photos text[],
    status review_status NOT NULL DEFAULT 'pending',
    visited_at date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_business_created_idx
    ON reviews (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON reviews (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_unique_active_per_user_business_idx
    ON reviews (business_id, user_id)
    WHERE status <> 'rejected';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_business_location_geog_point()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.geog_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_business_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    target_business_id uuid;
    old_business_id uuid;
    avg_rating numeric(2,1);
    review_count integer;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_business_id := OLD.business_id;
    ELSE
        target_business_id := NEW.business_id;
    END IF;

    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0), COUNT(*)::integer
    INTO avg_rating, review_count
    FROM reviews
    WHERE business_id = target_business_id
      AND status = 'published';

    UPDATE businesses
    SET rating_avg = avg_rating,
        rating_count = review_count
    WHERE id = target_business_id;

    IF TG_OP = 'UPDATE' AND OLD.business_id IS DISTINCT FROM NEW.business_id THEN
        old_business_id := OLD.business_id;

        SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0), COUNT(*)::integer
        INTO avg_rating, review_count
        FROM reviews
        WHERE business_id = old_business_id
          AND status = 'published';

        UPDATE businesses
        SET rating_avg = avg_rating,
            rating_count = review_count
        WHERE id = old_business_id;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS businesses_set_updated_at ON businesses;
CREATE TRIGGER businesses_set_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS business_locations_set_updated_at ON business_locations;
CREATE TRIGGER business_locations_set_updated_at
BEFORE UPDATE ON business_locations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS business_locations_sync_geog_point ON business_locations;
CREATE TRIGGER business_locations_sync_geog_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON business_locations
FOR EACH ROW EXECUTE FUNCTION sync_business_location_geog_point();

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS reviews_set_updated_at ON reviews;
CREATE TRIGGER reviews_set_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS reviews_refresh_business_rating ON reviews;
CREATE TRIGGER reviews_refresh_business_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION refresh_business_rating();

COMMIT;
