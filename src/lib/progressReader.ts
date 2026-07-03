import { course } from '../data/courseContent';

const STORAGE_KEY = 'gov-progress-v1';

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
export function readChapterProgress(): ChapterProgress {
  const total = course.sections.length;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
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
      completed: data.completed?.includes('completion') ?? false,
      quizScore: data.quizScore ?? null,
    };
  } catch {
    return { percent: 0, started: false, completed: false, quizScore: null };
  }
}
