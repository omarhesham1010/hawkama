import type { ProgressState } from '../hooks/useProgress';

type ScormApi = {
  Initialize: (param: string) => string;
  Terminate: (param: string) => string;
  GetValue: (key: string) => string;
  SetValue: (key: string, value: string) => string;
  Commit: (param: string) => string;
  GetLastError?: () => string;
};

const MAX_DEPTH = 500;

let api: ScormApi | null | undefined;
let initialized = false;
let finished = false;

function findApi(win: Window | null): ScormApi | null {
  let current = win;
  let depth = 0;

  while (current && depth < MAX_DEPTH) {
    const candidate = (current as Window & { API_1484_11?: ScormApi }).API_1484_11;
    if (candidate) return candidate;
    if (current.parent === current) break;
    current = current.parent;
    depth += 1;
  }

  return null;
}

function getApi() {
  if (api !== undefined) return api;
  if (typeof window === 'undefined') {
    api = null;
    return api;
  }

  api = findApi(window);
  if (!api && window.opener) api = findApi(window.opener);
  return api;
}

export function hasScormApi() {
  return Boolean(getApi());
}

export function initializeScorm() {
  const scorm = getApi();
  if (!scorm || initialized) return Boolean(scorm);
  initialized = scorm.Initialize('') === 'true';
  if (initialized) {
    scorm.SetValue('cmi.completion_status', 'incomplete');
    scorm.SetValue('cmi.exit', 'suspend');
    scorm.Commit('');
  }
  return initialized;
}

function getValue(key: string) {
  const scorm = getApi();
  if (!scorm || !initializeScorm()) return '';
  return scorm.GetValue(key) || '';
}

function setValue(key: string, value: string) {
  const scorm = getApi();
  if (!scorm || !initializeScorm()) return;
  scorm.SetValue(key, value);
}

export function loadScormProgress(): Partial<ProgressState> | null {
  if (!initializeScorm()) return null;
  const raw = getValue('cmi.suspend_data');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<ProgressState>;
  } catch {
    return null;
  }
}

export function saveScormProgress(state: ProgressState, totalSections: number) {
  if (!initializeScorm()) return;

  const completedCount = Math.min(state.completed.length, totalSections);
  const progress = totalSections > 0 ? completedCount / totalSections : 0;
  const isComplete = progress >= 1;

  setValue('cmi.suspend_data', JSON.stringify(state));
  if (state.lastSectionId) setValue('cmi.location', state.lastSectionId);
  setValue('cmi.progress_measure', progress.toFixed(4));
  setValue('cmi.completion_status', isComplete ? 'completed' : 'incomplete');
  setValue('cmi.exit', isComplete ? 'normal' : 'suspend');

  if (state.quizScore != null) {
    const scaled = Math.max(0, Math.min(1, state.quizScore / 100));
    setValue('cmi.score.min', '0');
    setValue('cmi.score.max', '100');
    setValue('cmi.score.raw', String(state.quizScore));
    setValue('cmi.score.scaled', scaled.toFixed(4));
    setValue('cmi.success_status', state.quizScore >= 80 ? 'passed' : 'failed');
  } else {
    setValue('cmi.success_status', 'unknown');
  }

  getApi()?.Commit('');
}

export function resetScormProgress() {
  if (!initializeScorm()) return;
  setValue('cmi.suspend_data', '');
  setValue('cmi.location', '');
  setValue('cmi.progress_measure', '0');
  setValue('cmi.completion_status', 'incomplete');
  setValue('cmi.success_status', 'unknown');
  getApi()?.Commit('');
}

export function terminateScorm() {
  const scorm = getApi();
  if (!scorm || !initialized || finished) return;
  scorm.Commit('');
  scorm.Terminate('');
  finished = true;
}
