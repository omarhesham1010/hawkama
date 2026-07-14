export interface CourseLocation {
  bag: number;
  chapter: number;
}

const COURSE_LOCATIONS: Readonly<Record<string, CourseLocation>> = {
  'governance-intro': { bag: 1, chapter: 0 },
  'governance-ch1': { bag: 1, chapter: 1 },
  'governance-ch2': { bag: 1, chapter: 2 },
  'governance-ch3': { bag: 1, chapter: 3 },
  'emergency-intro': { bag: 2, chapter: 0 },
  'emergency-ch1': { bag: 2, chapter: 1 },
  'emergency-ch2': { bag: 2, chapter: 2 },
  'emergency-ch3': { bag: 2, chapter: 3 },
  'emergency-ch4': { bag: 2, chapter: 4 },
  // Archived previous-version content, not linked from the UI -- kept on a
  // bag number that can't collide with a real, navigable bag.
  'compliance-risk-ch1': { bag: 99, chapter: 1 },
};

const COURSE_IDS_BY_LOCATION = new Map(
  Object.entries(COURSE_LOCATIONS).map(([courseId, location]) => [
    `${location.bag}:${location.chapter}`,
    courseId,
  ]),
);

export function courseLocation(courseId: string): CourseLocation {
  return COURSE_LOCATIONS[courseId] ?? COURSE_LOCATIONS['governance-intro'];
}

export function courseIdFromLocation(bag: number, chapter: number) {
  return COURSE_IDS_BY_LOCATION.get(`${bag}:${chapter}`);
}

export function courseHash(courseId: string, slide = 1) {
  const location = courseLocation(courseId);
  const safeSlide = Math.max(1, Math.trunc(slide) || 1);
  return `#/bag/${location.bag}/chapter/${location.chapter}/slide/${safeSlide}`;
}
