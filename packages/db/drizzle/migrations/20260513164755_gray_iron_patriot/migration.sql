CREATE TABLE `daily_challenges` (
	`challenge_date` text PRIMARY KEY,
	`game_id` text NOT NULL,
	`seed` text NOT NULL,
	`config_json` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_progress` (
	`player_id` text NOT NULL,
	`game_id` text NOT NULL,
	`level_id` text NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `game_progress_pk` PRIMARY KEY(`player_id`, `game_id`, `level_id`),
	CONSTRAINT `fk_game_progress_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `player_achievements` (
	`player_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `player_achievements_pk` PRIMARY KEY(`player_id`, `achievement_id`),
	CONSTRAINT `fk_player_achievements_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY,
	`display_name` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`grade_band` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_challenges_seed_idx` ON `daily_challenges` (`seed`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_display_name_idx` ON `players` (`display_name`);