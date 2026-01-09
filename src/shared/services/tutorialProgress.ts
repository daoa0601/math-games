import { z } from 'zod';
import { TypedStorage } from '../utils/TypedStorage';

const TutorialProgressSchema = z.object({
  completedTutorials: z.record(z.string(), z.boolean()),
  skippedTutorials: z.record(z.string(), z.boolean()),
  lastCompletedStep: z.record(z.string(), z.number()),
});

type TutorialProgress = z.infer<typeof TutorialProgressSchema>;

const defaultProgress: TutorialProgress = {
  completedTutorials: {},
  skippedTutorials: {},
  lastCompletedStep: {},
};

const storage = new TypedStorage(
  'tutorial-progress',
  TutorialProgressSchema,
  defaultProgress
);

export function isTutorialCompleted(gameId: string): boolean {
  const progress = storage.get();
  return progress.completedTutorials[gameId] ?? false;
}

export function isTutorialSkipped(gameId: string): boolean {
  const progress = storage.get();
  return progress.skippedTutorials[gameId] ?? false;
}

export function shouldShowTutorial(gameId: string): boolean {
  // Optimized: single storage read instead of two
  const progress = storage.get();
  return !(progress.completedTutorials[gameId] || progress.skippedTutorials[gameId]);
}

export function markTutorialCompleted(gameId: string): void {
  const progress = storage.get();
  storage.set({
    ...progress,
    completedTutorials: { ...progress.completedTutorials, [gameId]: true },
  });
}

export function markTutorialSkipped(gameId: string): void {
  const progress = storage.get();
  storage.set({
    ...progress,
    skippedTutorials: { ...progress.skippedTutorials, [gameId]: true },
  });
}

export function resetTutorialProgress(gameId?: string): void {
  if (gameId) {
    const progress = storage.get();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [gameId]: _completed, ...completedRest } = progress.completedTutorials;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [gameId]: _skipped, ...skippedRest } = progress.skippedTutorials;
    storage.set({
      ...progress,
      completedTutorials: completedRest,
      skippedTutorials: skippedRest,
    });
  } else {
    storage.set(defaultProgress);
  }
}
