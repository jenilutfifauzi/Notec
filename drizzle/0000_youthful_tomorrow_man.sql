CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount_idr` integer NOT NULL,
	`transaction_date` text NOT NULL,
	`note` text,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tx_date_type` ON `transactions` (`transaction_date`, `type`, `deleted_at`);
--> statement-breakpoint
CREATE INDEX `idx_cat_type` ON `categories` (`type`, `archived_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cat_unique_active` ON `categories` (`type`, lower(`name`)) WHERE `archived_at` IS NULL;
