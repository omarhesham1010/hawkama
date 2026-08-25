import { useCallback, useState } from 'react';
import type { CourseTwoGroup } from '../components/course2/CourseTwoSidebar';

// Only the standalone per-course SCORM package build (scripts/build-static.mjs
// --course=N) turns this on -- see that file's VITE_SEQUENTIAL_LOCK define.
// The default multi-course build (what hawkama.vercel.app deploys) and local
// dev both leave it unset, so navigation stays fully open there for review,
// exactly as before this lock existed.
const SEQUENTIAL_LOCK_ENABLED = import.meta.env.VITE_SEQUENTIAL_LOCK === 'true';

/** Shared "must finish each slide before the next unlocks" state for every
 *  single-link #/course/N shell. Slide 0 is always reachable; a slide's
 *  narration finishing (or, for activity/quiz slides, the activity/quiz
 *  completing) unlocks the slide right after it -- see CourseTwoPlayer.tsx's
 *  own useEffect/onActivityDone/onQuizComplete, which call `onUnlockSlide`
 *  with the id of the slide that just became "done". */
export function useSequentialLock(groups: CourseTwoGroup[]) {
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);

  const onUnlockSlide = useCallback(
    (slideId: string) => {
      for (const group of groups) {
        const localIndex = group.slides.findIndex((s) => s.id === slideId);
        if (localIndex !== -1) {
          const globalIndex = group.startIndex + localIndex;
          setMaxUnlockedIndex((current) => Math.max(current, globalIndex + 1));
          return;
        }
      }
    },
    [groups],
  );

  const onResetSequentialLocks = useCallback(() => setMaxUnlockedIndex(0), []);

  return {
    enabled: SEQUENTIAL_LOCK_ENABLED,
    maxUnlockedIndex: SEQUENTIAL_LOCK_ENABLED ? maxUnlockedIndex : undefined,
    onUnlockSlide,
    onResetSequentialLocks,
  };
}
