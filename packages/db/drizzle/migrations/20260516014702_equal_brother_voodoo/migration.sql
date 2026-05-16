CREATE TABLE `daily_player_results` (
	`player_id` text NOT NULL,
	`challenge_date` text NOT NULL,
	`game_id` text NOT NULL,
	`level_id` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	CONSTRAINT `daily_player_results_pk` PRIMARY KEY(`player_id`, `challenge_date`),
	CONSTRAINT `fk_daily_player_results_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
