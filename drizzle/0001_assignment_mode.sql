ALTER TABLE "groups"
ADD COLUMN "assignment_mode" text NOT NULL DEFAULT 'uniform',
ADD COLUMN "shared_assignment" text;

UPDATE "groups"
SET "assignment_mode" = 'uniform'
WHERE "assignment_mode" IS NULL;

