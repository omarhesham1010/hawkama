import type { DiagramKey } from '../../types/course';
import { Icon } from '../ui/Icon';
import type { IconKey } from '../../types/course';

/** Chevron that points along the reading flow (leftwards in RTL). */
function FlowArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 shrink-0 text-brand/60 rotate-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

/** Vertical connector for mobile stacked flows. */
function FlowArrowDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 text-brand/60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// --- نموذج خطوط الدفاع الثلاثة (أفقي، متّسق مع باقي المخططات) ---
function ThreeLinesDiagram() {
  const lines = [
    { n: '١', label: 'الخط الأول', role: 'الإدارة التنفيذية', hint: 'التنفيذ اليومي', emoji: '⚙️' },
    { n: '٢', label: 'الخط الثاني', role: 'إدارة المخاطر والامتثال', hint: 'وضع الضوابط ومتابعتها', emoji: '🛡️' },
    { n: '٣', label: 'الخط الثالث', role: 'التدقيق الداخلي المستقل', hint: 'تأكيد مستقل ومحايد', emoji: '🔍' },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {lines.map((l) => (
        <div
          key={l.n}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface-2 p-4 text-center"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-surface text-2xl shadow-card">
            {l.emoji}
          </span>
          <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white tabular">
            {l.n}
          </span>
          <p className="text-xs font-semibold text-brand">{l.label}</p>
          <p className="font-bold leading-tight text-ink">{l.role}</p>
          <p className="text-xs text-ink-muted">{l.hint}</p>
        </div>
      ))}
    </div>
  );
}

// --- سلسلة إطار الحوكمة ---------------------------------------
function FrameworkFlowDiagram() {
  const nodes = [
    { t: 'مجلس الإدارة', s: 'يوجّه', icon: 'building' as IconKey },
    { t: 'اللجان', s: 'تحلّل وتوصي', icon: 'committee' as IconKey },
    { t: 'مصفوفة الصلاحيات', s: 'تضبط', icon: 'matrix' as IconKey },
    { t: 'السياسات', s: 'تحدد الالتزام', icon: 'doc' as IconKey },
    { t: 'الإجراءات', s: 'ممارسة يومية', icon: 'flow' as IconKey },
  ];
  return (
    <div className="flex flex-col md:flex-row md:flex-wrap md:items-stretch gap-2 md:gap-1">
      {nodes.map((node, i) => (
        <div key={node.t} className="flex flex-col md:flex-row items-center gap-2 md:gap-1">
          <div className="w-full md:w-auto flex md:flex-col items-center gap-3 md:gap-1.5 rounded-2xl border border-line bg-surface-2 px-4 py-3 md:w-32 md:text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
              <Icon name={node.icon} className="w-5 h-5" />
            </span>
            <span>
              <span className="block font-bold text-ink text-sm leading-tight">{node.t}</span>
              <span className="block text-xs text-ink-muted">{node.s}</span>
            </span>
          </div>
          {i < nodes.length - 1 && (
            <>
              <span className="hidden md:block">
                <FlowArrow />
              </span>
              <span className="md:hidden">
                <FlowArrowDown />
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// --- إطار إدارة تضارب المصالح الأربعي -------------------------
function CoiFrameworkDiagram() {
  const steps = [
    { n: '١', t: 'الإفصاح', s: 'إلزام الجميع', icon: 'eye' as IconKey },
    { n: '٢', t: 'التقييم', s: 'تحديد نوع التضارب', icon: 'scale' as IconKey },
    { n: '٣', t: 'المعالجة', s: 'تنحٍّ / نقل صلاحية / منع', icon: 'shield' as IconKey },
    { n: '٤', t: 'التوثيق والمراقبة', s: 'استمرارية الضبط', icon: 'clipboard' as IconKey },
  ];
  return (
    <div className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-1">
      {steps.map((step, i) => (
        <div key={step.n} className="flex flex-col md:flex-row items-center gap-2 md:gap-1 md:flex-1">
          <div className="relative w-full flex md:flex-col items-center gap-3 md:gap-2 rounded-2xl border border-line bg-surface-2 px-4 py-4 md:text-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-600 dark:text-gold-400 font-bold tabular">
              {step.n}
            </span>
            <span className="hidden md:inline-flex text-brand">
              <Icon name={step.icon} className="w-6 h-6" />
            </span>
            <span>
              <span className="block font-bold text-ink text-sm">{step.t}</span>
              <span className="block text-xs text-ink-muted">{step.s}</span>
            </span>
          </div>
          {i < steps.length - 1 && (
            <>
              <span className="hidden md:block">
                <FlowArrow />
              </span>
              <span className="md:hidden">
                <FlowArrowDown />
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function Diagram({ diagram }: { diagram: DiagramKey }) {
  switch (diagram) {
    case 'threeLines':
      return <ThreeLinesDiagram />;
    case 'frameworkFlow':
      return <FrameworkFlowDiagram />;
    case 'coiFramework':
      return <CoiFrameworkDiagram />;
    default:
      return null;
  }
}
