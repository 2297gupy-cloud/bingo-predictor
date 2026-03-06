CREATE TABLE `ai_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`predDate` varchar(10) NOT NULL,
	`sourceHour` varchar(5) NOT NULL,
	`targetHour` varchar(5) NOT NULL,
	`goldenBalls` varchar(20) NOT NULL,
	`aiReasoning` text,
	`isManual` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_predictions_id` PRIMARY KEY(`id`)
);
