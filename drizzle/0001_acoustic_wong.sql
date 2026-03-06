CREATE TABLE `bingo_draws` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawTerm` varchar(20) NOT NULL,
	`drawDate` varchar(10) NOT NULL,
	`drawTime` varchar(5) NOT NULL,
	`numbers` text NOT NULL,
	`drawOrder` text NOT NULL,
	`special` int NOT NULL,
	`bigSmall` varchar(4) NOT NULL,
	`oddEven` varchar(4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bingo_draws_id` PRIMARY KEY(`id`),
	CONSTRAINT `bingo_draws_drawTerm_unique` UNIQUE(`drawTerm`)
);
