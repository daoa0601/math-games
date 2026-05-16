CREATE TABLE `account_links` (
	`player_id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`magic_link_token` text,
	`token_expires_at` integer,
	`linked_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_account_links_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `leaderboard_entries` (
	`player_id` text NOT NULL,
	`game_id` text NOT NULL,
	`level_id` text NOT NULL,
	`scope` text NOT NULL,
	`score` integer NOT NULL,
	`moves` integer NOT NULL,
	`achieved_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `leaderboard_entries_pk` PRIMARY KEY(`player_id`, `game_id`, `level_id`, `scope`),
	CONSTRAINT `fk_leaderboard_entries_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
