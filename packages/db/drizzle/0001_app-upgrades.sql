CREATE TABLE "app_upgrades" (
	"upgrade_key" varchar(160) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"status" varchar(32) DEFAULT 'completed' NOT NULL,
	"blocking" boolean DEFAULT true NOT NULL,
	"safe_in_dev_startup" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"metadata_json" jsonb,
	"applied_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
