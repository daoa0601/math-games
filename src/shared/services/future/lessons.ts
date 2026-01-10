/**
 * Lessons Service (Stub)
 *
 * Placeholder service for the future lessons feature.
 * These functions will throw errors until the feature is implemented.
 *
 * Planned implementation:
 * - Lessons stored in Firestore under /lessons/{lessonId}
 * - Content stored in Cloud Storage for videos
 * - Access controlled by payment status
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  Lesson,
  LessonMetadata,
  LessonProgress,
  LessonAccess,
  LessonCategory,
} from '../../types/lessons';

const NOT_IMPLEMENTED = 'Lessons feature not yet implemented';

/**
 * Fetch all available lesson metadata.
 * Does not include full content - use fetchLesson for that.
 */
export async function fetchLessons(): Promise<LessonMetadata[]> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Fetch lessons by category.
 */
export async function fetchLessonsByCategory(
  _category: LessonCategory
): Promise<LessonMetadata[]> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Fetch a single lesson with full content.
 * Requires access check.
 */
export async function fetchLesson(_lessonId: string): Promise<Lesson> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Check if the current user has access to a lesson.
 */
export async function checkLessonAccess(_lessonId: string): Promise<LessonAccess> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Get user's progress for a lesson.
 */
export async function getLessonProgress(_lessonId: string): Promise<LessonProgress | null> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Update user's progress for a lesson.
 */
export async function updateLessonProgress(
  _lessonId: string,
  _progress: Partial<LessonProgress>
): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Mark a lesson as completed.
 */
export async function completeLession(_lessonId: string): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Get all lessons the user has access to.
 */
export async function getAccessibleLessons(): Promise<LessonMetadata[]> {
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Get user's progress for all lessons.
 */
export async function getAllLessonProgress(): Promise<LessonProgress[]> {
  throw new Error(NOT_IMPLEMENTED);
}
