ALTER TABLE "student_progress"
ADD COLUMN "group_member_id" uuid REFERENCES "group_members"("id");

