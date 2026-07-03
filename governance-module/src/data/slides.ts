import type { Beat, Slide } from '../types/slides';
import type { ActivitySection, QuizSection } from '../types/course';
import { course } from './courseContent';

const activityData = (id: string) => (course.sections.find((s) => s.id === id) as ActivitySection).data;
const quizData = (id: string) => (course.sections.find((s) => s.id === id) as QuizSection).quiz;

export const courseMeta = {
  title: 'نماذج وهياكل الحوكمة الصحية',
  chapter: 'الفصل الأول',
};

// Build a content slide whose narration = the beats joined (so the spoken text
// covers everything on screen and stays perfectly aligned with the reveal).
function content(o: {
  id: string;
  index: number;
  title: string;
  visual: string;
  beats: Beat[];
  visualKind?: 'emoji' | 'target';
}): Slide {
  const narration = o.beats.map((b) => b.text).join(' ');
  return {
    id: o.id,
    index: o.index,
    title: o.title,
    audioKey: o.id,
    kind: 'content',
    visual: o.visual,
    visualKind: o.visualKind ?? 'emoji',
    duration: Math.max(8, Math.round(narration.length / 11)),
    narration,
    timeline: [],
    beats: o.beats,
  };
}

const titleBeat = (text: string): Beat => ({ text, anim: 'fade-up', unit: { t: 'title' } });

const rawSlides: Slide[] = [
  // 01 — Welcome
  {
    id: 'slide-01',
    index: 1,
    title: 'نماذج وهياكل الحوكمة الصحية',
    audioKey: 'slide-01',
    duration: 14,
    kind: 'welcome',
    visual: '🎓',
    narration:
      'مرحباً بك في دورة نماذج وهياكل الحوكمة الصحية، الفصل الأول. رحلة تعلّم في الحوكمة والامتثال وأخلاقيات العمل في القطاع الصحي، عبر دروس مصوّرة وأنشطة تدريبية واختبار معرفة وشرح صوتي. اضغط «التالي» لننطلق.',
    timeline: [],
    content: {
      highlights: {
        kind: 'points',
        variant: 'grid',
        items: [
          { emoji: '📖', title: 'دروس مصوّرة', text: '' },
          { emoji: '🎯', title: 'أنشطة تدريبية', text: '' },
          { emoji: '📝', title: 'اختبار معرفة', text: '' },
          { emoji: '🔊', title: 'شرح صوتي', text: '' },
        ],
      },
    },
  },

  // Roadmap — how the unit flows (target/bullseye like the client's objectives)
  content({
    id: 'slide-roadmap',
    index: 0,
    title: 'محاور الوحدة الأولى',
    visual: '🎯',
    visualKind: 'target',
    beats: [
      titleBeat('في هذه الوحدة ستسير في خمسة محاور رئيسية بالترتيب.'),
      { text: 'المحور الأول: الحوكمة الصحية، تعريفها وهياكلها.', anim: 'slide-in', unit: { t: 'point', emoji: '🏛️', title: 'الحوكمة الصحية', text: 'التعريف والهياكل وخطوط الدفاع.' } },
      { text: 'المحور الثاني: مجلس الإدارة واللجان ومصفوفة الصلاحيات.', anim: 'slide-in', unit: { t: 'point', emoji: '🧭', title: 'المجلس واللجان والصلاحيات', text: 'مَن يوجّه ومَن يوصي ومَن يضبط القرار.' } },
      { text: 'المحور الثالث: تطوير أطر الحوكمة وخطوات بنائها.', anim: 'slide-in', unit: { t: 'point', emoji: '🏗️', title: 'تطوير أطر الحوكمة', text: 'المكوّنات وخطوات البناء.' } },
      { text: 'المحور الرابع: العلاقة بين الحوكمة والامتثال.', anim: 'slide-in', unit: { t: 'point', emoji: '⚖️', title: 'الحوكمة والامتثال', text: 'كيف يتكاملان لحماية المنشأة.' } },
      { text: 'المحور الخامس: أخلاقيات العمل وتضارب المصالح.', anim: 'slide-in', unit: { t: 'point', emoji: '🤝', title: 'الأخلاقيات وتضارب المصالح', text: 'النزاهة وإدارة تضارب المصالح.' } },
    ],
  }),

  // 02 — Definition
  content({
    id: 'slide-02',
    index: 2,
    title: 'تعريف الحوكمة',
    visual: '🏛️',
    beats: [
      titleBeat('تعريف الحوكمة.'),
      {
        text: 'الحوكمة هي الإطار الذي يحدد توزيع الأدوار والمسؤوليات بين مجلس الإدارة والإدارة التنفيذية واللجان المتخصصة، مع آليات المساءلة والشفافية.',
        anim: 'rise',
        unit: {
          t: 'def',
          emoji: '🏛️',
          term: 'تعريف الحوكمة',
          text: 'الإطار الذي يحدد توزيع الأدوار والمسؤوليات بين مجلس الإدارة، الإدارة التنفيذية، واللجان المتخصصة، مع آليات المساءلة والشفافية.',
        },
      },
      { text: 'يوزّع هذا الإطار الأدوار على ثلاثة أطراف: مجلس الإدارة الذي يوجّه ويشرف،', anim: 'zoom', row: 1, marker: 'shape', unit: { t: 'point', emoji: '🧭', title: 'مجلس الإدارة', text: 'يوجّه ويشرف.' } },
      { text: 'والإدارة التنفيذية التي تُنفّذ العمل اليومي،', anim: 'zoom', row: 1, marker: 'shape', unit: { t: 'point', emoji: '⚙️', title: 'الإدارة التنفيذية', text: 'تُنفّذ العمل اليومي.' } },
      { text: 'واللجان المتخصصة التي تحلّل وتوصي.', anim: 'zoom', row: 1, marker: 'shape', unit: { t: 'point', emoji: '👥', title: 'اللجان المتخصصة', text: 'تحلّل وتوصي.' } },
      {
        text: 'وتبقى المساءلة والشفافية ركيزتين لا تنفصلان؛ فهما ما يحوّل توزيع الأدوار من هيكل على الورق إلى حوكمة فعلية.',
        anim: 'scale-in',
        unit: { t: 'callout', tone: 'gold', title: 'ركيزتان لا تنفصلان', text: 'المساءلة والشفافية هما ما يحوّل توزيع الأدوار من هيكل على الورق إلى حوكمة فعلية.' },
      },
    ],
  }),

  // 03 — Three lines of defense
  content({
    id: 'slide-03',
    index: 3,
    title: 'خطوط الدفاع الثلاثة',
    visual: '🛡️',
    beats: [
      titleBeat('نموذج خطوط الدفاع الثلاثة يوزّع المسؤولية عن المخاطر والرقابة على ثلاثة خطوط.'),
      { text: 'الخط الأول: الإدارة التنفيذية، وهي مسؤولة عن التنفيذ اليومي وتملّك المخاطر في موقع العمل.', anim: 'slide-in', row: 1, unit: { t: 'point', emoji: '⚙️', title: 'الخط الأول', text: 'الإدارة التنفيذية — التنفيذ اليومي.' } },
      { text: 'الخط الثاني: إدارة المخاطر والامتثال، وتتولّى وضع الضوابط ومتابعة الالتزام بها.', anim: 'slide-in', row: 1, unit: { t: 'point', emoji: '🛡️', title: 'الخط الثاني', text: 'إدارة المخاطر والامتثال — وضع الضوابط ومتابعتها.' } },
      { text: 'الخط الثالث: التدقيق الداخلي المستقل، ويقدّم تأكيداً محايداً على فاعلية الخطين السابقين.', anim: 'slide-in', row: 1, unit: { t: 'point', emoji: '🔍', title: 'الخط الثالث', text: 'التدقيق الداخلي المستقل — تأكيد محايد.' } },
    ],
  }),

  // 04 — Board of Directors
  content({
    id: 'slide-04',
    index: 4,
    title: 'مجلس الإدارة',
    visual: '🧭',
    beats: [
      titleBeat('مجلس الإدارة يوجّه ويشرف لا يُشغّل؛ إذ يترك التنفيذ اليومي للإدارة التنفيذية.'),
      { text: 'مهمته الأولى: اعتماد الاستراتيجية بإقرار التوجهات الكبرى.', anim: 'zoom', row: 1, unit: { t: 'point', emoji: '🧭', title: 'اعتماد الاستراتيجية', text: 'إقرار التوجهات الكبرى.' } },
      { text: 'والثانية: الإشراف على الأداء بمتابعة النتائج لا التنفيذ.', anim: 'zoom', row: 1, unit: { t: 'point', emoji: '👁️', title: 'الإشراف على الأداء', text: 'متابعة النتائج لا التنفيذ.' } },
      { text: 'والثالثة: ضمان الامتثال بالتأكد من الالتزام بالأنظمة.', anim: 'zoom', row: 1, unit: { t: 'point', emoji: '🛡️', title: 'ضمان الامتثال', text: 'التأكد من الالتزام بالأنظمة.' } },
      { text: 'والرابعة: حماية حقوق أصحاب المصلحة بصون الحقوق والثقة.', anim: 'zoom', row: 1, unit: { t: 'point', emoji: '🤝', title: 'حماية أصحاب المصلحة', text: 'صون الحقوق والثقة.' } },
    ],
  }),

  // 05 — Committees
  content({
    id: 'slide-05',
    index: 5,
    title: 'اللجان التابعة',
    visual: '👥',
    beats: [
      titleBeat('تعمل تحت المجلس لجانٌ متخصصة.'),
      { text: 'أولاً: لجنة الجودة وسلامة المرضى، وتتولّى مراجعة نسب الأخطاء الجسيمة وخطط التحسين.', anim: 'rise', row: 1, unit: { t: 'point', emoji: '🏥', title: 'لجنة الجودة وسلامة المرضى', text: 'مراجعة نسب الأخطاء الجسيمة وخطط التحسين.' } },
      { text: 'وثانياً: لجنة الامتثال والأخلاقيات، وتتولّى برامج الامتثال وحالات تضارب المصالح.', anim: 'rise', row: 1, unit: { t: 'point', emoji: '⚖️', title: 'لجنة الامتثال والأخلاقيات', text: 'برامج الامتثال وتضارب المصالح.' } },
    ],
  }),

  // 06 — DoA matrix
  content({
    id: 'slide-06',
    index: 6,
    title: 'مصفوفة الصلاحيات (DoA)',
    visual: '🗂️',
    beats: [
      titleBeat('مصفوفة الصلاحيات، واختصارها DoA، وثيقة تحدد من يملك القرار، وبأي مستوى، وضمن أي حدود مالية أو تنظيمية.'),
      {
        text: 'فهي تضبط القرار، وتوضّح المساءلة، وتمنع التداخل بين الصلاحيات.',
        anim: 'rise',
        unit: { t: 'def', emoji: '🗂️', term: 'مصفوفة الصلاحيات (DoA)', text: 'وثيقة تضبط القرار وتوضّح المساءلة وتمنع التداخل بين الصلاحيات.' },
      },
      { text: 'أولاً: مَن يملك القرار، بتحديد صاحب الصلاحية.', anim: 'swing-in', row: 1, unit: { t: 'point', emoji: '🙋‍♂️', title: 'مَن يملك القرار', text: 'تحديد صاحب الصلاحية.' } },
      { text: 'ثانياً: بأي مستوى، بتحديد درجة الاعتماد المطلوبة.', anim: 'swing-in', row: 1, unit: { t: 'point', emoji: '🎚️', title: 'بأي مستوى', text: 'درجة الاعتماد المطلوبة.' } },
      { text: 'ثالثاً: ضمن أي حدود مالية أو تنظيمية.', anim: 'swing-in', row: 1, unit: { t: 'point', emoji: '💰', title: 'ضمن أي حدود', text: 'سقوف مالية وتنظيمية.' } },
    ],
  }),

  // 07 — Integrated relationship
  content({
    id: 'slide-07',
    index: 7,
    title: 'ملخص العلاقة التكاملية',
    visual: '🔗',
    beats: [
      titleBeat('تتكامل عناصر الحوكمة في سلسلة واحدة من التوجيه إلى الممارسة.'),
      { text: 'مجلس الإدارة يوجّه،', anim: 'slide-in', row: 1, unit: { t: 'point', emoji: '🧭', title: 'مجلس الإدارة', text: 'يوجّه' } },
      { text: 'ثم اللجان تحلّل وتوصي،', anim: 'slide-in', row: 1, unit: { t: 'point', emoji: '👥', title: 'اللجان', text: 'تحلّل وتوصي' } },
      { text: 'ثم مصفوفة الصلاحيات تضبط،', anim: 'slide-in', row: 1, unit: { t: 'point', emoji: '🗂️', title: 'مصفوفة الصلاحيات', text: 'تضبط القرار' } },
      { text: 'ثم السياسات تحدد الالتزام،', anim: 'slide-in', row: 1, unit: { t: 'point', emoji: '📜', title: 'السياسات', text: 'تحدد الالتزام' } },
      { text: 'وأخيراً الإجراءات تترجمه ممارسةً يومية.', anim: 'slide-in', row: 1, unit: { t: 'point', emoji: '⚙️', title: 'الإجراءات', text: 'تترجمه ممارسةً' } },
      { text: 'وكل حلقة تُكمّل ما قبلها؛ فاختلال أي حلقة يُضعف المنظومة كلّها.', anim: 'fade-in', unit: { t: 'callout', tone: 'info', text: 'كل حلقة تُكمّل ما قبلها؛ فاختلال أي حلقة يُضعف المنظومة كلّها.' } },
    ],
  }),

  // 08 — Framework build steps (PPT slide 2, second part) — no longer a duplicate of slide 7
  content({
    id: 'slide-08',
    index: 8,
    title: 'خطوات بناء إطار الحوكمة',
    visual: '🏗️',
    beats: [
      titleBeat('يُبنى إطار الحوكمة عبر ست خطوات متتابعة.'),
      { text: 'أولاً: تحديد القيم والأهداف المؤسسية.', anim: 'zoom', row: 1, unit: { t: 'point', emoji: '🎯', title: 'القيم والأهداف', text: 'تحديد القيم والأهداف المؤسسية.' } },
      { text: 'ثانياً: وضع السياسات وآليات الامتثال.', anim: 'zoom', row: 1, unit: { t: 'point', emoji: '📜', title: 'السياسات والامتثال', text: 'وضع السياسات وآليات الامتثال.' } },
      { text: 'ثالثاً: تصميم هياكل المساءلة والشفافية.', anim: 'zoom', row: 1, unit: { t: 'point', emoji: '🏛️', title: 'المساءلة والشفافية', text: 'تصميم هياكل المساءلة والشفافية.' } },
      { text: 'رابعاً: إدارة البيانات الصحية بمسؤولية.', anim: 'zoom', row: 2, unit: { t: 'point', emoji: '🗄️', title: 'البيانات الصحية', text: 'إدارة البيانات الصحية بمسؤولية.' } },
      { text: 'خامساً: إدارة الموارد البشرية بكفاءة.', anim: 'zoom', row: 2, unit: { t: 'point', emoji: '👥', title: 'الموارد البشرية', text: 'إدارة الموارد البشرية بكفاءة.' } },
      { text: 'وسادساً: التطبيق عبر تدريب مستمر وتقييم دوري.', anim: 'zoom', row: 2, unit: { t: 'point', emoji: '🔄', title: 'التطبيق والتقييم', text: 'تدريب مستمر وتقييم دوري.' } },
    ],
  }),

  // 09 — Governance & Compliance
  content({
    id: 'slide-09',
    index: 9,
    title: 'العلاقة بين الحوكمة والامتثال',
    visual: '⚖️',
    beats: [
      titleBeat('الحوكمة والامتثال معاً يحميان المنشأة.'),
      { text: 'فالحوكمة بلا امتثال: سلطةٌ بلا أثر.', anim: 'flip', row: 1, marker: 'shape', unit: { t: 'callout', tone: 'info', title: '🏛️ الحوكمة بلا امتثال', text: 'سلطةٌ بلا أثر.' } },
      { text: 'والامتثال بلا حوكمة: تنفيذٌ بلا توجيه.', anim: 'flip', row: 1, marker: 'shape', unit: { t: 'callout', tone: 'gold', title: '✅ الامتثال بلا حوكمة', text: 'تنفيذٌ بلا توجيه.' } },
      {
        text: 'أمّا التكامل بينهما فهو استدامة الأداء؛ إذ يصنع منشأة مستدامة، ويترجم الاستراتيجية إلى ممارسة يومية محمية تبني ثقة المرضى والجهات التنظيمية والمجتمع.',
        anim: 'scale-in',
        marker: 'shape',
        unit: { t: 'callout', tone: 'contrast', title: '🔗 التكامل = استدامة الأداء', text: 'يصنع منشأة مستدامة، ويترجم الاستراتيجية إلى ممارسة يومية محمية تبني الثقة.' },
      },
    ],
  }),

  // 10 — Compliance monitoring
  content({
    id: 'slide-10',
    index: 10,
    title: 'الامتثال: ماذا يُلزَم وكيف يُراقَب',
    visual: '🔍',
    beats: [
      titleBeat('يضمن الامتثال التطبيق الفعلي، ويجيب عن ثلاثة أسئلة: ماذا يُلزَم، وكيف يُراقَب، وأين الفجوات.'),
      { text: 'فهو يحوّل المتطلبات التنظيمية إلى ضوابط قابلة للقياس،', anim: 'rise', row: 1, marker: 'shape', unit: { t: 'point', emoji: '📐', text: 'يحوّل المتطلبات التنظيمية إلى ضوابط قابلة للقياس.' } },
      { text: 'ويراقب التطبيق الفعلي ويختبر فعالية الضوابط،', anim: 'rise', row: 1, marker: 'shape', unit: { t: 'point', emoji: '🔍', text: 'يراقب التطبيق الفعلي ويختبر فعالية الضوابط.' } },
      { text: 'ويعالج أسباب عدم الامتثال الجذرية لا الظاهرية،', anim: 'rise', row: 2, marker: 'shape', unit: { t: 'point', emoji: '🌱', text: 'يعالج أسباب عدم الامتثال الجذرية لا الظاهرية.' } },
      { text: 'ويرفع تقارير دورية للقيادة لدعم القرار،', anim: 'rise', row: 2, marker: 'shape', unit: { t: 'point', emoji: '📊', text: 'يرفع تقارير دورية للقيادة لدعم القرار.' } },
      { text: 'ويبني ثقافة مؤسسية تلتزم بروح النظام لا حرفه.', anim: 'rise', row: 2, marker: 'shape', unit: { t: 'point', emoji: '🧭', text: 'يبني ثقافة مؤسسية تلتزم بروح النظام لا حرفه.' } },
    ],
  }),

  // 11 — Activity: classification (drag & drop)
  {
    id: 'slide-11',
    index: 11,
    title: 'نشاط: الحوكمة أم الامتثال؟',
    audioKey: 'slide-11',
    duration: 14,
    kind: 'activity',
    visual: '🎯',
    activityLabel: 'نشاط تدريبي · اسحب وأفلت',
    narration:
      'نشاط تدريبي. لاحظت لجنة الجودة في مستشفى أن ثلاثين بالمئة من الأطباء لا يوثّقون تقارير الخروج وفق السياسة المعتمدة. اسحب كل إجراء وأفلته في تصنيفه الصحيح: هل هو قرار حوكمة يوجّه ويضع القواعد، أم إجراء امتثال يراقب التطبيق ويضمن الالتزام؟',
    timeline: [],
    activity: activityData('governance-compliance-activity'),
  },

  // 12 — Ethics flip cards
  {
    id: 'slide-12',
    index: 12,
    title: 'أخلاقيات العمل وتضارب المصالح',
    audioKey: 'slide-12',
    duration: 16,
    kind: 'activity',
    visual: '🃏',
    activityLabel: 'بطاقات تدريبية · تُقرأ صوتياً',
    narration:
      'ستة مفاهيم أساسية على شكل بطاقات: أخلاقيات العمل العام، والأساس النظامي في المملكة، وتضارب المصالح، وإطار الإدارة الأربعي، والنزاهة المؤسسية، وأمثلة من القطاع الصحي. اضغط أي بطاقة لقلبها، وسيقرأ الصوت تعريفها تلقائياً.',
    timeline: [],
    activity: activityData('ethics-flip-cards'),
  },

  // 13 — Decision simulation · identify
  {
    id: 'slide-13',
    index: 13,
    title: 'محاكاة قرار: تحديد المخالفة',
    audioKey: 'slide-13',
    duration: 15,
    kind: 'activity',
    visual: '🧑‍⚖️',
    activityLabel: 'محاكاة قرار · الخطوة الأولى',
    activityMode: 'identify',
    narration:
      'محاكاة قرار. موظف في لجنة شراء أجهزة طبية لديه أسهم أو مصلحة تجارية مع إحدى الشركات المتنافسة. مهمتك الأولى: حدّد نوع المخالفة. هل هو تضارب فعلي حالي، أم محتمل مستقبلي؟',
    timeline: [],
    activity: activityData('conflict-interest-simulation'),
  },

  // 14 — Decision simulation · path
  {
    id: 'slide-14',
    index: 14,
    title: 'محاكاة قرار: مسار الإجراء الصحيح',
    audioKey: 'slide-14',
    duration: 16,
    kind: 'activity',
    visual: '🧭',
    activityLabel: 'محاكاة قرار · الخطوة الثانية',
    activityMode: 'path',
    narration:
      'الآن رتّب مسار الإجراء الصحيح للاستجابة للحالة: أولاً الإفصاح، ثم التنحّي عن القرار، ثم توثيق الحالة، وأخيراً إشراف لجنة الامتثال والأخلاقيات.',
    timeline: [],
    activity: activityData('conflict-interest-simulation'),
  },

  // 15 — Reflection
  {
    id: 'slide-15',
    index: 15,
    title: 'نقاط للنقاش والتأمّل',
    audioKey: 'slide-15',
    duration: 14,
    kind: 'reflection',
    visual: '💬',
    narration:
      'وقفة تأمّل، بأسئلة مفتوحة للنقاش لا إجابة واحدة صحيحة لها. أولاً: هل يكفي الإفصاح وحده؟ ثانياً: ما آليات الحماية المؤسسية الواجب تفعيلها؟ ثالثاً: كيف نضمن أن الامتثال ليس شكلياً؟',
    timeline: [],
    reflection: [
      'هل يكفي الإفصاح وحده؟',
      'ما آليات الحماية المؤسسية الواجب تفعيلها؟',
      'كيف نضمن أن الامتثال ليس شكلياً؟',
    ],
  },

  // 16 — Knowledge check
  {
    id: 'slide-16',
    index: 16,
    title: 'اختبار المعرفة',
    audioKey: 'slide-16',
    duration: 12,
    kind: 'quiz',
    visual: '📝',
    activityLabel: 'اختبار المعرفة',
    narration:
      'اختبار المعرفة. ستة أسئلة قصيرة مستمدة بالكامل من محتوى الوحدة، وتحتاج إلى سبعين بالمئة للاجتياز. بعد كل إجابة سيظهر التوضيح ومصدره. بالتوفيق.',
    timeline: [],
    quiz: quizData('knowledge-check'),
  },

  // 17 — Completion
  {
    id: 'slide-17',
    index: 17,
    title: 'الخلاصة وإتمام الوحدة',
    audioKey: 'slide-17',
    duration: 20,
    kind: 'completion',
    visual: '🏆',
    narration:
      'أحسنت! لنراجع أبرز ما تعلّمته: الحوكمة إطار يوزّع الأدوار مع المساءلة والشفافية، ونموذج خطوط الدفاع الثلاثة يفصل بين التنفيذ والمخاطر والتدقيق المستقل، والمجلس يوجّه واللجان تحلّل ومصفوفة الصلاحيات تضبط، والحوكمة والامتثال يتكاملان لصناعة الاستدامة، وأخلاقيات العمل تُدار يومياً، وتضارب المصالح يُعالَج بإطار رباعي يبدأ بالإفصاح. لقد أتممت الفصل الأول بنجاح.',
    timeline: [],
    content: {
      takeaways: {
        kind: 'points',
        variant: 'grid',
        items: [
          { emoji: '🏛️', title: 'الحوكمة إطار', text: 'توزيع أدوار مع مساءلة وشفافية.' },
          { emoji: '🛡️', title: 'خطوط الدفاع الثلاثة', text: 'تنفيذ، فمخاطر وامتثال، فتدقيق مستقل.' },
          { emoji: '🧭', title: 'المجلس واللجان والصلاحيات', text: 'المجلس يوجّه واللجان توصي والمصفوفة تضبط.' },
          { emoji: '⚖️', title: 'الحوكمة + الامتثال', text: 'تكاملهما يصنع الاستدامة.' },
          { emoji: '🤝', title: 'الأخلاقيات وتضارب المصالح', text: 'إفصاح ← تقييم ← معالجة ← توثيق.' },
          { emoji: '✨', title: 'النزاهة المؤسسية', text: 'سلوك يبدأ من القمة.' },
        ],
      },
    },
  },
];

// Assign sequential index / id / audioKey by position (so inserting slides is easy
// and the page number + audio filenames stay consistent).
export const slides: Slide[] = rawSlides.map((s, i) => {
  const n = String(i + 1).padStart(2, '0');
  return { ...s, index: i + 1, id: `slide-${n}`, audioKey: `slide-${n}` };
});
