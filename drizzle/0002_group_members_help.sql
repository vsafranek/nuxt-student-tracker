ALTER TABLE "group_members"
ADD COLUMN "needs_help" boolean DEFAULT false,
ADD COLUMN "help_requested_at" timestamp;

UPDATE "group_members"
SET "needs_help" = COALESCE("needs_help", false);

