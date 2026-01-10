/**
 * Lesson Types
 *
 * Type definitions for the future lessons feature.
 * These are placeholder types that will be expanded when the feature is implemented.
 */

export type LessonCategory = 'arithmetic' | 'geometry' | 'algebra' | 'logic';
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonContentType = 'text' | 'video' | 'interactive' | 'quiz';

export interface LessonMetadata {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  duration: number; // minutes
  isPremium: boolean;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonContent {
  lessonId: string;
  type: LessonContentType;
  content: string; // Markdown for text, URL for video, JSON for interactive
  order: number;
}

export interface Lesson extends LessonMetadata {
  contents: LessonContent[];
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  progress: number; // 0-100
  lastAccessedAt: string;
}

export interface LessonAccess {
  lessonId: string;
  hasAccess: boolean;
  expiresAt: string | null; // null for permanent access
  purchasedAt: string | null;
}
