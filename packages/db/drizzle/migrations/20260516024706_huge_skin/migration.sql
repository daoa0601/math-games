CREATE TABLE `assignments` (
	`id` text PRIMARY KEY,
	`classroom_id` text NOT NULL,
	`title` text NOT NULL,
	`game_id` text NOT NULL,
	`level_ids` text NOT NULL,
	`due_date` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_assignments_classroom_id_classrooms_id_fk` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `classroom_members` (
	`classroom_id` text NOT NULL,
	`player_id` text NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `classroom_members_pk` PRIMARY KEY(`classroom_id`, `player_id`),
	CONSTRAINT `fk_classroom_members_classroom_id_classrooms_id_fk` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_classroom_members_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`teacher_player_id` text NOT NULL,
	`join_code` text NOT NULL UNIQUE,
	`grade_band` text,
	`locale` text DEFAULT 'en',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_classrooms_teacher_player_id_players_id_fk` FOREIGN KEY (`teacher_player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `game_attempts` (
	`id` text PRIMARY KEY,
	`player_id` text NOT NULL,
	`game_id` text NOT NULL,
	`level_id` text NOT NULL,
	`score` integer NOT NULL,
	`completed` integer NOT NULL,
	`moves` integer NOT NULL,
	`duration_ms` integer,
	`mode` text DEFAULT 'practice' NOT NULL,
	`completion_json` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT `fk_game_attempts_player_id_players_id_fk` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE
);
