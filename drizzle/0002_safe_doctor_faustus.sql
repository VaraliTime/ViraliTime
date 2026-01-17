CREATE TABLE `siteConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteName` varchar(255) NOT NULL DEFAULT 'ViraliTime',
	`siteDescription` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteConfig_id` PRIMARY KEY(`id`)
);
