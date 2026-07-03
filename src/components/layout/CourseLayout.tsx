import { StickyNarrationBar } from '../audio/StickyNarrationBar';
import { BackgroundDecor } from '../course/BackgroundDecor';

/** Structural shell: header on top, nav sidebar on the start side, main content. */
export function CourseLayout({
  header,
  sidebar,
  children,
}: {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <BackgroundDecor />
      {header}
      <div className="mx-auto flex max-w-[1400px]">
        {sidebar}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-4xl pb-16">{children}</div>
        </main>
      </div>
      <StickyNarrationBar />
    </div>
  );
}
