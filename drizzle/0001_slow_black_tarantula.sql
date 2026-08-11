CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('draft','submitted','winner','disqualified') NOT NULL DEFAULT 'draft',
	`legalBusinessName` text,
	`dba` text,
	`entityType` enum('llc','corporation','sole_proprietorship','nonprofit','other'),
	`entityTypeOther` text,
	`stateOfRegistration` text,
	`dateOfFormation` text,
	`businessAddress` text,
	`repName` text,
	`repTitle` text,
	`email` text,
	`phone` text,
	`businessDescription` text,
	`certMember` boolean DEFAULT false,
	`certRegistered` boolean DEFAULT false,
	`certBankAccount` boolean DEFAULT false,
	`certNetProfit` boolean DEFAULT false,
	`certNoW2` boolean DEFAULT false,
	`certBusinessPlan` boolean DEFAULT false,
	`customerImpactNarrative` text,
	`operatingHistory` text,
	`founderNarrative` text,
	`operationMode` enum('full_time','part_time'),
	`ninetyDayImpact` text,
	`certAccuracy` boolean DEFAULT false,
	`certAgreement` boolean DEFAULT false,
	`certConsent` boolean DEFAULT false,
	`certW9` boolean DEFAULT false,
	`signatureName` text,
	`signatureDate` text,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`description` text NOT NULL,
	`amount` int NOT NULL,
	`sortOrder` int DEFAULT 0,
	CONSTRAINT `budget_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploaded_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`fileType` enum('formation_doc','bank_account','profit_loss','business_plan') NOT NULL,
	`originalName` text NOT NULL,
	`storageKey` text NOT NULL,
	`storageUrl` text NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploaded_files_id` PRIMARY KEY(`id`)
);
