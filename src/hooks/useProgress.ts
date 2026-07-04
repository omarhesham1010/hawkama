import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadScormProgress, resetScormProgress, saveScormProgress, terminateScorm } from '../lib/scorm2004';

const STORAGE_PREFIX = 'gov-progress-v2';

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

function storageKey(courseId: string) {
  return `${STORAGE_PREFIX}:${courseId}`;
}

function load(courseId: string): ProgressState {
  if (typeof window === 'undefined') return EMPTY;
  if (courseId === 'governance-ch1') {
    const scormState = loadScormProgress();
    if (scormState) return { ...EMPTY, ...scormState };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(courseId));
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<ProgressState>) };
  } catch {
    return EMPTY;
  }
}

/** Persistent learner progress: completion, activity badges, quiz score, resume point. */
export function useProgress(totalSections: number, courseId = 'governance-ch1') {
  const [state, setState] = useState<ProgressState>(() => load(courseId));

  useEffect(() => {
    setState(load(courseId));
  }, [courseId]);

  useEffect(() => {
    window.localStorage.setItem(storageKey(courseId), JSON.stringify(state));
    if (courseId === 'governance-ch1') saveScormProgress(state, totalSections);
  }, [courseId, state, totalSections]);

  useEffect(() => {
    const onUnload = () => terminateScorm();
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
    };
  }, []);

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
    window.localStorage.removeItem(storageKey(courseId));
    if (courseId === 'governance-ch1') resetScormProgress();
  }, [courseId]);

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
