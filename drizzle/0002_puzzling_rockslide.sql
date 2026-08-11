CREATE TABLE `evaluator_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` text NOT NULL,
	`isRevoked` boolean NOT NULL DEFAULT false,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluator_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `evaluator_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `evaluator_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviteId` int NOT NULL,
	`applicationId` int NOT NULL,
	`scoreCustomerImpact` int NOT NULL DEFAULT 0,
	`scoreOperatingHistory` int NOT NULL DEFAULT 0,
	`scoreFounderNarrative` int NOT NULL DEFAULT 0,
	`scoreFundUse` int NOT NULL DEFAULT 0,
	`scoreNinetyDayImpact` int NOT NULL DEFAULT 0,
	`notes` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluator_scores_id` PRIMARY KEY(`id`)
);
