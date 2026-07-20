import { useCallback, useMemo, useState } from 'react';
import { course } from './data/courseContent';
import type { Theme } from './hooks/useTheme';
import { useProgress } from './hooks/useProgress';
import { useNarrationContext } from './components/audio/NarrationContext';

import { CourseLayout } from './components/layout/CourseLayout';
import { CourseHeader } from './components/layout/CourseHeader';
import { LessonSidebar } from './components/layout/LessonSidebar';
import { SectionNav } from './components/course/SectionNav';

import { WelcomeScreen } from './components/course/WelcomeScreen';
import { ObjectivesScreen } from './components/course/ObjectivesScreen';
import { RoadmapScreen } from './components/course/RoadmapScreen';
import { LessonScreen } from './components/course/LessonScreen';
import { ActivityScreen } from './components/course/ActivityScreen';
import { QuizScreen } from './components/course/QuizScreen';
import { SummaryScreen } from './components/course/SummaryScreen';
import { CompletionScreen } from './components/course/CompletionScreen';
import { stopVoiceClip } from './lib/playVoiceClip';

/** The full chapter experience. Theme is owned by App; onExit returns to the platform. */
export default function CoursePlayer({
  theme,
  toggleTheme,
  onExit,
}: {
  theme: Theme;
  toggleTheme: () => void;
  onExit: () => void;
}) {
  const sections = course.sections;
  const progress = useProgress(sections.length);
  const narration = useNarrationContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = sections[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sections.length - 1;

  const totalActivities = useMemo(
    () => sections.filter((s) => s.type === 'activity').length,
    [sections],
  );

  const goTo = useCallback(
    (index: number) => {
      narration.stop();
      stopVoiceClip();
      const clamped = Math.max(0, Math.min(index, sections.length - 1));
      setCurrentIndex(clamped);
      progress.setLastSection(sections[clamped].id);
      progress.markComplete(sections[clamped].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [narration, progress, sections],
  );

  const goNext = useCallback(() => {
    progress.markComplete(current.id);
    if (!isLast) goTo(currentIndex + 1);
  }, [current.id, currentIndex, goTo, isLast, progress]);

  const goPrev = useCallback(() => {
    if (!isFirst) goTo(currentIndex - 1);
  }, [currentIndex, goTo, isFirst]);

  const restart = useCallback(() => {
    progress.reset();
    narration.stop();
    stopVoiceClip();
    setCurrentIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [narration, progress]);

  const showFooter = current.type !== 'welcome' && current.type !== 'completion';
  const nextLabel = current.type === 'lesson' ? 'تم الفهم — متابعة' : 'متابعة';

  const renderSection = () => {
    switch (current.type) {
      case 'welcome':
        return (
          <WelcomeScreen
            section={current}
            onStart={goNext}
            onResume={() => {
              const idx = sections.findIndex((s) => s.id === progress.state.lastSectionId);
              goTo(idx > 0 ? idx : 1);
            }}
            hasProgress={Boolean(progress.state.lastSectionId) && progress.percent > 0}
          />
        );
      case 'objectives':
        return <ObjectivesScreen section={current} />;
      case 'roadmap':
        return <RoadmapScreen section={current} />;
      case 'lesson':
        return <LessonScreen section={current} />;
      case 'activity':
        return (
          <ActivityScreen
            section={current}
            done={progress.isActivityDone(current.id)}
            onActivityDone={progress.markActivityDone}
          />
        );
      case 'quiz':
        return (
          <QuizScreen
            section={current}
            onComplete={(score) => {
              progress.setQuizScore(score);
              progress.markComplete(current.id);
            }}
          />
        );
      case 'summary':
        return <SummaryScreen section={current} />;
      case 'completion':
        return (
          <CompletionScreen
            section={current}
            percent={progress.percent}
            quizScore={progress.state.quizScore}
            activitiesDone={
              progress.state.activitiesDone.filter((id) =>
                sections.some((s) => s.id === id && s.type === 'activity'),
              ).length
            }
            totalActivities={totalActivities}
            onRestart={restart}
          />
        );
      default:
        return null;
    }
  };

  return (
    <CourseLayout
      header={
        <CourseHeader
          title={course.meta.title}
          chapter={course.meta.chapter}
          percent={progress.percent}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onExit={onExit}
        />
      }
      sidebar={
        <LessonSidebar
          sections={sections}
          currentIndex={currentIndex}
          percent={progress.percent}
          isComplete={progress.isComplete}
          onNavigate={goTo}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      }
    >
      {/* key forces remount per section: resets activity state & replays entrance */}
      <div key={current.id}>{renderSection()}</div>

      {showFooter && (
        <SectionNav
          onPrev={goPrev}
          onNext={goNext}
          isFirst={isFirst}
          isLast={isLast}
          nextLabel={nextLabel}
        />
      )}
    </CourseLayout>
  );
}
