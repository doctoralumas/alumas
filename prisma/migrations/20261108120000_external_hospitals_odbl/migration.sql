-- ODbL data remains isolated from ALUMAS-owned institutions and their relations.
-- No existing table is changed. Apply only after explicit production approval.
CREATE TABLE "ExternalHospital" (
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "locality" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDate" TEXT NOT NULL,
    "licenseUrl" TEXT NOT NULL,
    "inventoryFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalHospital_pkey" PRIMARY KEY ("sourceId"),
    CONSTRAINT "ExternalHospital_osm_id_check" CHECK ("sourceId" ~ '^OSM:(node|way|relation)/[0-9]+$'),
    CONSTRAINT "ExternalHospital_name_check" CHECK (length(btrim("name")) > 0),
    CONSTRAINT "ExternalHospital_lat_check" CHECK ("latitude" BETWEEN 35.5 AND 42.5),
    CONSTRAINT "ExternalHospital_lon_check" CHECK ("longitude" BETWEEN 25 AND 45.2),
    CONSTRAINT "ExternalHospital_source_check" CHECK ("sourceUrl" = 'https://www.openstreetmap.org/' || substring("sourceId" FROM 5)),
    CONSTRAINT "ExternalHospital_license_check" CHECK ("licenseUrl" = 'https://www.openstreetmap.org/copyright'),
    CONSTRAINT "ExternalHospital_fingerprint_check" CHECK ("inventoryFingerprint" ~ '^[0-9a-f]{64}$')
);
CREATE INDEX "ExternalHospital_city_name_idx" ON "ExternalHospital"("city", "name");
-- No anonymous policies: only the backend database role may access this table.
ALTER TABLE "ExternalHospital" ENABLE ROW LEVEL SECURITY;
