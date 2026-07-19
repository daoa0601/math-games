CREATE TABLE `client_metrics` (
	`id` text PRIMARY KEY,
	`player_id` text,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`game_id` text,
	`level_id` text,
	`value` integer,
	`payload_json` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_client_metrics_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `client_metrics_kind_name_created_idx` ON `client_metrics` (`kind`,`name`,`created_at`);--> statement-breakpoint
CREATE INDEX `client_metrics_player_created_idx` ON `client_metrics` (`player_id`,`created_at`);