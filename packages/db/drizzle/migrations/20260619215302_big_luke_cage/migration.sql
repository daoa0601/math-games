CREATE INDEX `classroom_members_player_idx` ON `classroom_members` (`player_id`);--> statement-breakpoint
CREATE INDEX `game_attempts_player_game_created_idx` ON `game_attempts` (`player_id`,`game_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `leaderboard_scope_game_level_score_idx` ON `leaderboard_entries` (`scope`,`game_id`,`level_id`,`score`);