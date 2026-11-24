import React from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import type { AssessmentOutcome, ReviewStatus, ScientificMeta } from '../types';
import { REFERENCE_MAP } from '../data/references';

export const Ltr: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span dir="ltr" className={`ltr-inline ${className}`}>
    {children}
  </span>
);

export const ReviewStatusText: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  if (status === 'مُراجع') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>حالة المراجعة: مُراجع</span>
      </span>
    );
  }
  if (status === 'يحتاج مراجعة') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 font-semibold">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>حالة المراجعة: يحتاج مراجعة</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
      <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>حالة المراجعة: مسودة</span>
    </span>
  );
};

export const AssessmentBanner: React.FC<{ outcome: AssessmentOutcome; statement: string; detail?: string }> = ({
  outcome,
  statement,
  detail,
}) => {
  const styles: Record<AssessmentOutcome, { box: string; title: string; icon: React.ReactNode }> = {
    below_criterion: {
      box: 'bg-[#E6FAFA] dark:bg-[#0D2533] border-[#007574]/30 dark:border-[#00D1CE]/30 text-[#001F4D] dark:text-slate-100',
      title: 'أقل من معيار المقارنة المختار (ضمن الافتراضات)',
      icon: <CheckCircle2 className="w-5 h-5 text-[#007574] dark:text-[#00D1CE] shrink-0" aria-hidden="true" />,
    },
    above_criterion: {
      box: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100',
      title: 'أعلى من معيار المقارنة المختار (ضمن الافتراضات)',
      icon: <ShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0" aria-hidden="true" />,
    },
    inconclusive: {
      box: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100',
      title: 'نتيجة غير حاسمة (تقاطع عدم اليقين مع المعيار)',
      icon: <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />,
    },
    insufficient_data: {
      box: 'bg-slate-100 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100',
      title: 'البيانات غير كافية للتقييم',
      icon: <Info className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" aria-hidden="true" />,
    },
  };

  const cfg = styles[outcome];

  return (
    <div role="status" className={`rounded-lg border p-4 ${cfg.box}`}>
      <div className="flex items-start gap-3">
        {cfg.icon}
        <div className="space-y-1">
          <p className="font-bold text-sm">{cfg.title}</p>
          <p className="text-sm leading-relaxed">{statement}</p>
          {detail && <p className="text-xs opacity-85">{detail}</p>}
        </div>
      </div>
    </div>
  );
};

export const ScientificMetaPanel: React.FC<{
  meta: ScientificMeta;
  onNavigate?: (path: string) => void;
}> = ({ meta, onNavigate }) => {
  const refs = meta.referenceIds.map((id) => REFERENCE_MAP[id]).filter(Boolean);

  return (
    <section
      aria-label="المصادر والافتراضات وحالة المراجعة"
      className="mt-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-4 print-break-avoid"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" aria-hidden="true" />
          <span>التوثيق العلمي والمصادر والافتراضات</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <ReviewStatusText status={meta.status} />
          <span aria-hidden="true">·</span>
          <span>
            تاريخ آخر مراجعة: <Ltr>{meta.lastReviewed}</Ltr>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="font-bold text-[#001F4D] dark:text-slate-100 mb-1.5">الافتراضات</h4>
          <ul className="list-disc pr-5 space-y-1 text-slate-700 dark:text-slate-300">
            {meta.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-[#001F4D] dark:text-slate-100 mb-1.5">حدود التطبيق والقيود</h4>
          <ul className="list-disc pr-5 space-y-1 text-slate-700 dark:text-slate-300">
            {meta.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm text-[#001F4D] dark:text-slate-100">المصادر المحددة</h4>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/references')}
              className="text-xs font-semibold text-[#007574] dark:text-[#00D1CE] hover:underline"
            >
              عرض سجل المراجع الكامل
            </button>
          )}
        </div>
        {refs.length === 0 ? (
          <p className="text-sm text-amber-800 dark:text-amber-300">غير متحقق منها — تحتاج إلى مصدر.</p>
        ) : (
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {refs.map((ref) => (
              <li
                key={ref.id}
                className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#050E1D]/60 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 font-semibold text-[#001F4D] dark:text-white">
                  <Ltr>{ref.code}</Ltr>
                  <span aria-hidden="true">·</span>
                  <span dir="ltr" className="font-normal text-left">
                    {ref.title}
                  </span>
                </div>
                <div className="mt-1 text-slate-600 dark:text-slate-400">
                  {ref.organization} · الإصدار: <Ltr>{ref.edition}</Ltr> · السنة: <Ltr>{ref.year}</Ltr>
                </div>
                <div className="mt-1 text-slate-600 dark:text-slate-400">القسم/الصفحة: {ref.sectionOrPage}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export const Breadcrumbs: React.FC<{
  items: { label: string; path?: string }[];
  onNavigate: (path: string) => void;
}> = ({ items, onNavigate }) => (
  <nav aria-label="مسار التنقل" className="mb-5 text-xs text-slate-600 dark:text-slate-400 no-print">
    <ol className="flex flex-wrap items-center gap-1.5">
      {items.map((item, idx) => (
        <li key={idx} className="inline-flex items-center gap-1.5">
          {idx > 0 && <span aria-hidden="true">/</span>}
          {item.path ? (
            <button
              type="button"
              onClick={() => onNavigate(item.path!)}
              className="hover:text-[#001F4D] dark:hover:text-[#00D1CE] hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-semibold text-[#001F4D] dark:text-slate-200">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
