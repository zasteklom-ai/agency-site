CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`cottage_id` bigint unsigned NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`status` enum('BOOKED','BLOCKED','AVAILABLE','CANCELLED') NOT NULL DEFAULT 'BOOKED',
	`source` enum('MANUAL','AVITO','CIAN','ICAL') NOT NULL DEFAULT 'MANUAL',
	`external_uid` varchar(128),
	`price_override` int,
	`comment` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_cottage_id_cottages_id_fk` FOREIGN KEY (`cottage_id`) REFERENCES `cottages`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bookings_external` ON `bookings` (`cottage_id`,`source`,`external_uid`);
--> statement-breakpoint
CREATE INDEX `idx_bookings_cottage_range` ON `bookings` (`cottage_id`,`start_date`);
--> statement-breakpoint
ALTER TABLE `cottages` ADD `ical_export_token` varchar(64), ADD `ical_import_avito_url` varchar(1024), ADD `ical_import_cian_url` varchar(1024);
--> statement-breakpoint
ALTER TABLE `leads` ADD `check_in` timestamp NULL, ADD `check_out` timestamp NULL, ADD `guests` int;
