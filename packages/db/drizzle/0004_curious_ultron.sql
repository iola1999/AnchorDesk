CREATE TABLE "workspace_directories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(255) NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "workspace_directories" ADD CONSTRAINT "workspace_directories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_directories" ADD CONSTRAINT "workspace_directories_parent_id_workspace_directories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workspace_directories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_directories_workspace_path_uid" ON "workspace_directories" USING btree ("workspace_id","path");--> statement-breakpoint
CREATE INDEX "workspace_directories_workspace_parent_idx" ON "workspace_directories" USING btree ("workspace_id","parent_id");--> statement-breakpoint
CREATE INDEX "workspace_directories_workspace_deleted_idx" ON "workspace_directories" USING btree ("workspace_id","deleted_at");