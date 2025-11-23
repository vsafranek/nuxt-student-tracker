ALTER TABLE "group_members"
ADD COLUMN "last_active_at" timestamp DEFAULT now();

UPDATE "group_members"
SET "last_active_at" = COALESCE("last_active_at", now());

