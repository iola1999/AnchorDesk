ALTER TABLE "message_citations" ALTER COLUMN "anchor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_citations" ALTER COLUMN "document_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_citations" ALTER COLUMN "document_version_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_citations" ALTER COLUMN "document_path" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_citations" ALTER COLUMN "page_no" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_citations" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "message_citations" ADD COLUMN "source_domain" text;--> statement-breakpoint
ALTER TABLE "message_citations" ADD COLUMN "source_title" text;