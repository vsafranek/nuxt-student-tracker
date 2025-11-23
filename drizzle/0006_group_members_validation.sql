ALTER TABLE "group_members"
ADD COLUMN "last_message_content" text,
ADD COLUMN "last_message_is_relevant" boolean,
ADD COLUMN "last_message_goal_index" integer,
ADD COLUMN "last_message_progress" integer,
ADD COLUMN "last_message_reason" text,
ADD COLUMN "last_message_at" timestamp;

