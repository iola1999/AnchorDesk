ALTER TABLE "users" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "users"
SET "is_super_admin" = true
WHERE "id" = (
	SELECT "id"
	FROM "users"
	ORDER BY "created_at" ASC, "id" ASC
	LIMIT 1
);--> statement-breakpoint
CREATE UNIQUE INDEX "users_single_super_admin_uid" ON "users" USING btree ("is_super_admin") WHERE "users"."is_super_admin" = true;
