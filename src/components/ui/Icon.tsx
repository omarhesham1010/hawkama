import type { IconKey } from '../../types/course';

interface IconProps {
  name: IconKey;
  className?: string;
  strokeWidth?: number;
}

// A compact, consistent line-icon set (stroke = currentColor).
const paths: Record<IconKey, React.ReactNode> = {
  shield: <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />,
  layers: (
    <>
      <path d="M12 4l8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </>
  ),
  building: (
    <>
      <path d="M4 20V7l8-3 8 3v13" />
      <path d="M4 20h16" />
      <path d="M9 20v-4h6v4" />
      <path d="M9 9h1.5M13.5 9H15M9 12.5h1.5M13.5 12.5H15" />
    </>
  ),
  committee: (
    <>
      <circle cx="8" cy="9" r="2.4" />
      <circle cx="16" cy="9" r="2.4" />
      <path d="M4 19c0-2.4 1.9-4 4-4s4 1.6 4 4" />
      <path d="M12 19c0-2.4 1.9-4 4-4s4 1.6 4 4" />
    </>
  ),
  matrix: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M4 15h16M10 4v16M15 4v16" />
    </>
  ),
  flow: (
    <>
      <rect x="3" y="4" width="6" height="4" rx="1" />
      <rect x="15" y="9" width="6" height="4" rx="1" />
      <rect x="3" y="15" width="6" height="4" rx="1" />
      <path d="M9 6h4a2 2 0 012 2v1M9 17h4a2 2 0 002-2v-1" />
    </>
  ),
  link: (
    <>
      <path d="M9 12h6" />
      <path d="M10 8H8a4 4 0 000 8h2" />
      <path d="M14 8h2a4 4 0 010 8h-2" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M12 6l-6 2 3 4a3 3 0 01-6 0l3-4" />
      <path d="M12 6l6 2-3 4a3 3 0 006 0l-3-4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A2 2 0 017 4h11v14H7a2 2 0 00-2 2z" />
      <path d="M5 5.5V20" />
      <path d="M9 8h6M9 11h5" />
    </>
  ),
  integrity: (
    <>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="5" width="12" height="16" rx="2" />
      <path d="M9 5V4a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M9 11l1.5 1.5L13 10M9 16h5" />
    </>
  ),
  cards: (
    <>
      <rect x="4" y="7" width="11" height="13" rx="2" />
      <path d="M8 4h9a2 2 0 012 2v10" />
      <path d="M7 11h5M7 14h4" />
    </>
  ),
  gavel: (
    <>
      <path d="M14 4l6 6-2.5 2.5L11.5 6.5z" />
      <path d="M9.5 8.5l6 6" />
      <path d="M4 20h9" />
      <path d="M6.5 17.5l4-4" />
    </>
  ),
  quiz: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .8-1.5 1.3-1.5 2.5" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2 3 2 3H6" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l8.5 15H3.5z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 12h5M9.5 15h5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16 9a4 4 0 010 6M18.5 7a7 7 0 010 10" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" />
      <path d="M18 15l.7 1.8L20.5 17.5l-1.8.7L18 20l-.7-1.8L15.5 17.5l1.8-.7z" />
    </>
  ),
  license: (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <circle cx="11" cy="14.5" r="2.6" />
      <path d="M9.3 16.6L8.6 21l2.4-1.4 2.4 1.4-.7-4.4" />
    </>
  ),
  inspection: (
    <>
      <path d="M5 3h9l4 4v6" />
      <path d="M14 3v4h4" />
      <path d="M7.5 9h6M7.5 12h4" />
      <circle cx="9.5" cy="17" r="3.2" />
      <path d="M11.8 19.3L14.5 22" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7" />
      <path d="M3 20h18" />
    </>
  ),
  cycle: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0112.5-5.6" />
      <path d="M14 4.5l3 2-2 3" />
      <path d="M19.5 12a7.5 7.5 0 01-12.5 5.6" />
      <path d="M10 19.5l-3-2 2-3" />
    </>
  ),
  handshake: (
    <>
      <path d="M2.5 9.5h5l3.3 3.3" />
      <path d="M21.5 9.5h-5l-2.6 2.6" />
      <path d="M9 11l3.3 3.3a1.3 1.3 0 001.9-1.8L11 9.3" />
      <path d="M12.6 14.6l1.6 1.6a1.3 1.3 0 001.9-1.8" />
      <path d="M2.5 9.5v6.5M21.5 9.5v6.5" />
    </>
  ),
};

export function Icon({ name, className = 'w-6 h-6', strokeWidth = 1.7 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
