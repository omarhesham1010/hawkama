import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'gov-progress-v1';

export interface ProgressState {
  /** ids of sections the learner marked complete / passed through */
  completed: string[];
  /** ids of finished activities/games */
  activitiesDone: string[];
  /** latest knowledge-check score as a percentage, or null */
  quizScore: number | null;
  /** last section id the learner viewed (for resume) */
  lastSectionId: string | null;
}

const EMPTY: ProgressState = {
  completed: [],
  activitiesDone: [],
  quizScore: null,
  lastSectionId: null,
};

function load(): ProgressState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<ProgressState>) };
  } catch {
    return EMPTY;
  }
}

/** Persistent learner progress: completion, activity badges, quiz score, resume point. */
export function useProgress(totalSections: number) {
  const [state, setState] = useState<ProgressState>(load);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const markComplete = useCallback((id: string) => {
    setState((s) =>
      s.completed.includes(id) ? s : { ...s, completed: [...s.completed, id] },
    );
  }, []);

  const markActivityDone = useCallback((id: string) => {
    setState((s) =>
      s.activitiesDone.includes(id) ? s : { ...s, activitiesDone: [...s.activitiesDone, id] },
    );
  }, []);

  const setQuizScore = useCallback((score: number) => {
    setState((s) => ({ ...s, quizScore: score }));
  }, []);

  const setLastSection = useCallback((id: string) => {
    setState((s) => (s.lastSectionId === id ? s : { ...s, lastSectionId: id }));
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const percent = useMemo(() => {
    if (totalSections === 0) return 0;
    return Math.round((state.completed.length / totalSections) * 100);
  }, [state.completed.length, totalSections]);

  const isComplete = useCallback((id: string) => state.completed.includes(id), [state.completed]);
  const isActivityDone = useCallback(
    (id: string) => state.activitiesDone.includes(id),
    [state.activitiesDone],
  );

  return {
    state,
    percent,
    markComplete,
    markActivityDone,
    setQuizScore,
    setLastSection,
    reset,
    isComplete,
    isActivityDone,
  };
}
