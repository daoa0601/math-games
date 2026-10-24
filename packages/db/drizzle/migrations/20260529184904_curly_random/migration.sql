CREATE TABLE `player_daily_selections` (
	`player_id` text NOT NULL,
	`challenge_date` text NOT NULL,
	`game_id` text NOT NULL,
	`level_id` text NOT NULL,
	`seed` text NOT NULL,
	`config_json` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `player_daily_selections_pk` PRIMARY KEY(`player_id`, `challenge_date`),
	CONSTRAINT `fk_player_daily_selections_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
