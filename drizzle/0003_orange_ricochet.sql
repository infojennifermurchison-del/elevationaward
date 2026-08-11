CREATE TABLE `site_settings` (
	`id` int NOT NULL DEFAULT 1,
	`announcementEnabled` boolean NOT NULL DEFAULT false,
	`announcementBusinessName` text,
	`announcementMessage` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
