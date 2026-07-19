import { useCallback, useState } from 'react';

const STORAGE_KEY = 'learner-profile-v1';

export type LearnerGender = 'male' | 'female';

export interface LearnerProfile {
  name: string;
  gender: LearnerGender;
}

function load(): LearnerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LearnerProfile>;
    if (!parsed.name || (parsed.gender !== 'male' && parsed.gender !== 'female')) return null;
    return { name: parsed.name, gender: parsed.gender };
  } catch {
    return null;
  }
}

/** One-time "who are you" gate, asked before the learner reaches the
 *  platform home or any chapter -- stored locally so it never repeats on
 *  the same device/browser. */
export function useLearnerProfile() {
  const [profile, setProfile] = useState<LearnerProfile | null>(() => load());

  const saveProfile = useCallback((next: LearnerProfile) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProfile(next);
  }, []);

  return { profile, saveProfile };
}
