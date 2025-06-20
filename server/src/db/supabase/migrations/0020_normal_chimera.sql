ALTER TABLE "workspace_invitations" DROP CONSTRAINT "workspace_invitations_invited_by_user_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_user_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Drop the default value constraint first
ALTER TABLE "public"."workspace_invitations" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint

-- Then convert the status column to text
ALTER TABLE "public"."workspace_invitations" ALTER COLUMN "status" SET DATA TYPE text;
--> statement-breakpoint

-- Now we can safely drop the type
DROP TYPE "public"."invitation_status";
--> statement-breakpoint

-- Create the new enum type
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'revoked');
--> statement-breakpoint

-- Convert the column back to the new enum type
ALTER TABLE "public"."workspace_invitations" ALTER COLUMN "status" SET DATA TYPE "public"."invitation_status" USING "status"::"public"."invitation_status";
--> statement-breakpoint

-- Restore the default value
ALTER TABLE "public"."workspace_invitations" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."invitation_status";