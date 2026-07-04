import { getSlidesForCourse } from '../data/slides';

const STORAGE_PREFIX = 'gov-progress-v2';

export interface ChapterProgress {
  percent: number;
  started: boolean;
  completed: boolean;
  quizScore: number | null;
}

/**
 * Reads the persisted progress of the built chapter (governance-ch1) so the
 * platform home can show live "how much is done / started / finished" data.
 */
function storageKey(courseId: string) {
  return `${STORAGE_PREFIX}:${courseId}`;
}

export function readChapterProgress(courseId = 'governance-ch1'): ChapterProgress {
  const slides = getSlidesForCourse(courseId);
  const total = slides.length;
  const lastSlideId = slides[total - 1]?.id;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(courseId)) : null;
    if (!raw) return { percent: 0, started: false, completed: false, quizScore: null };
    const data = JSON.parse(raw) as {
      completed?: string[];
      quizScore?: number | null;
    };
    const done = data.completed?.length ?? 0;
    const percent = total ? Math.round((done / total) * 100) : 0;
    return {
      percent,
      started: done > 0,
      completed: Boolean((lastSlideId && data.completed?.includes(lastSlideId)) || (total > 0 && done >= total)),
      quizScore: data.quizScore ?? null,
    };
  } catch {
    return { percent: 0, started: false, completed: false, quizScore: null };
  }
}
