ALTER TABLE "messages"
ADD COLUMN "group_member_id" uuid REFERENCES "group_members"("id");

ALTER TABLE "messages"
ADD COLUMN "role" text NOT NULL DEFAULT 'assistant';

