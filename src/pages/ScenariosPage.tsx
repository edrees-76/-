import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Eye,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { TRAINING_SCENARIOS } from '../data/scenarios';
import { AssessmentBanner, Breadcrumbs, Ltr, ReviewStatusText, ScientificMetaPanel } from '../components/SharedUI';
import type { LocalUserProgress } from '../types';

interface ScenariosListProps {
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
}

export const ScenariosListPage: React.FC<ScenariosListProps> = ({ onNavigate, progress }) => {
  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'الحالات التدريبية' }]} onNavigate={onNavigate} />

      <header className="space-y-2 max-w-3xl">
        <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">
          الحالات التدريبية التفاعلية (<Ltr>8</Ltr> حالات تطبيقية متدرجة)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ثماني حالات ميدانية ببيانات تعليمية محاكاة تغطي أقسام الأشعة والطب النووي والعلاج الإشعاعي، وتتضمن عيوبًا منهجية مقصودة لتدريب الفاحص على اكتشاف الأخطاء قبل إصدار التقرير.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TRAINING_SCENARIOS.map((sc) => {
          const scoreRec = progress.scenarioScores[sc.id];
          return (
            <article
              key={sc.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 flex flex-col justify-between gap-4 hover:border-[#00D1CE] transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-[#007574] dark:text-[#00D1CE]">
                    حالة {sc.order} · {sc.difficulty}
                    {sc.isReferenceCase ? ' · الحالة المرجعية الكاملة' : ''}
                  </span>
                  <ReviewStatusText status={sc.meta.status} />
                </div>

                <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">{sc.title}</h2>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{sc.modality}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {sc.objectives[0]}
                </p>

                <div className="text-xs text-amber-800 dark:text-amber-300">
                  تحتوي {sc.embeddedDefects.length} عيبًا/ملاحظة منهجية للتدقيق · {sc.questions.length} أسئلة تقييم
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {scoreRec
                    ? `نتيجتك المحفوظة: ${scoreRec.score} من ${scoreRec.total}`
                    : 'لم تُحل الأسئلة بعد'}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate(`/scenarios/${sc.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#001F4D] px-3.5 py-2 text-xs font-bold text-white hover:opacity-90"
                >
                  <span>بدء الحالة</span>
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

interface ScenarioDetailProps {
  scenarioId: string;
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
  onSaveScore: (scenarioId: string, score: number, total: number) => void;
  onToggleBookmark: (item: { type: 'scenario'; id: string; title: string; route: string }) => void;
}

export const ScenarioDetailPage: React.FC<ScenarioDetailProps> = ({
  scenarioId,
  onNavigate,
  progress,
  onSaveScore,
  onToggleBookmark,
}) => {
  const sc = TRAINING_SCENARIOS.find((s) => s.id === scenarioId);
  const [revealedDefects, setRevealedDefects] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!sc) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#001F4D] dark:text-white">الحالة التدريبية غير موجودة</h1>
        <button type="button" onClick={() => onNavigate('/scenarios')} className="rounded-lg bg-[#001F4D] text-white px-4 py-2 text-sm font-bold">
          العودة إلى قائمة الحالات
        </button>
      </div>
    );
  }

  const isBookmarked = progress.bookmarks.some((b) => b.type === 'scenario' && b.id === sc.id);

  const handleSubmitQuiz = () => {
    const score = sc.questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);
    setSubmitted(true);
    onSaveScore(sc.id, score, sc.questions.length);
  };

  const currentScore = sc.questions.reduce((acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0), 0);

  return (
    <article className="space-y-8 max-w-5xl">
      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'الحالات التدريبية', path: '/scenarios' },
          { label: `حالة ${sc.order}` },
        ]}
        onNavigate={onNavigate}
      />

      <header className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-[#007574] dark:text-[#00D1CE]">حالة {sc.order} · {sc.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span>{sc.modality}</span>
              <span aria-hidden="true">·</span>
              <ReviewStatusText status={sc.meta.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#001F4D] dark:text-white">{sc.title}</h1>
          </div>

          <button
            type="button"
            onClick={() =>
              onToggleBookmark({
                type: 'scenario',
                id: sc.id,
                title: `حالة ${sc.order}: ${sc.title}`,
                route: `/scenarios/${sc.id}`,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isBookmarked ? 'محفوظة' : 'حفظ كعلامة'}</span>
          </button>
        </div>

        <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{sc.isSimulatedNotice}</span>
        </div>

        <div className="space-y-1.5 text-sm">
          <h2 className="font-bold text-[#001F4D] dark:text-white">أهداف التدريب في هذه الحالة</h2>
          <ul className="list-disc pr-5 space-y-1 text-slate-700 dark:text-slate-300">
            {sc.objectives.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      </header>

      {/* Room Summary & Operating Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-3 text-sm">
          <h2 className="font-bold text-[#001F4D] dark:text-white">ملخص الغرفة والمجاورات</h2>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">الأبعاد: {sc.roomSummary.dimensions}</p>
          <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
            {sc.roomSummary.adjacencies.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
          <p className="text-xs text-slate-600 dark:text-slate-400">{sc.roomSummary.geometryNotes}</p>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-3 text-sm">
          <h2 className="font-bold text-[#001F4D] dark:text-white">بيانات التشغيل والعبء</h2>
          <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {sc.operatingData.map((d, i) => (
              <div key={i} className="py-2 flex justify-between gap-3">
                <dt className="font-bold text-[#001F4D] dark:text-slate-200">{d.label}</dt>
                <dd className="text-slate-700 dark:text-slate-300 text-left">{d.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Equipment Suitability Check */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" />
            <span>فحص ملاءمة جهاز القياس المقترح</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate(`/equipment/${sc.equipmentSelection.proposedDeviceId}`)}
            className="text-xs font-bold text-[#007574] dark:text-[#00D1CE] hover:underline"
          >
            فتح بطاقة الجهاز <Ltr>{sc.equipmentSelection.proposedDeviceName}</Ltr>
          </button>
        </div>

        <div
          className={`rounded-lg border p-4 text-xs space-y-1.5 ${
            sc.equipmentSelection.isSuitable
              ? 'bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 border-[#007574]/30'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="font-bold flex items-center gap-2">
            {sc.equipmentSelection.isSuitable ? (
              <CheckCircle2 className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-700 dark:text-rose-400" />
            )}
            <span>
              الجهاز المقترح: <Ltr>{sc.equipmentSelection.proposedDeviceName}</Ltr> —{' '}
              {sc.equipmentSelection.isSuitable ? 'مناسب بشروط المهمة' : 'غير مناسب لهذه المهمة (خلل مقصود في السيناريو)'}
            </span>
          </div>
          <p className="leading-relaxed">{sc.equipmentSelection.rationale}</p>
          {sc.equipmentSelection.recommendedAlternative && (
            <p className="font-bold">البديل المنهجي المناسب: {sc.equipmentSelection.recommendedAlternative}</p>
          )}
        </div>
      </section>

      {/* Measurement Points Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-3">
        <h2 className="text-base font-bold text-[#001F4D] dark:text-white">نقاط القياس والقراءات الميدانية (محاكاة)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#050E1D] border-b border-slate-200 dark:border-slate-800">
                <th className="p-2.5 text-right">النقطة</th>
                <th className="p-2.5 text-right">الموقع</th>
                <th className="p-2.5 text-right">الإحداثيات</th>
                <th className="p-2.5 text-right">القراءة الخام</th>
                <th className="p-2.5 text-right">الخلفية</th>
                <th className="p-2.5 text-right">النافذة / الزمن</th>
                <th className="p-2.5 text-right">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sc.measurementPoints.map((pt) => (
                <tr key={pt.code}>
                  <td className="p-2.5 font-mono font-bold text-[#001F4D] dark:text-[#00D1CE]"><Ltr>{pt.code}</Ltr></td>
                  <td className="p-2.5 font-semibold">{pt.location}</td>
                  <td className="p-2.5 font-mono"><Ltr>{pt.coordinates}</Ltr></td>
                  <td className="p-2.5 font-mono">{pt.rawReading}</td>
                  <td className="p-2.5 font-mono">{pt.background}</td>
                  <td className="p-2.5">{pt.windowOrTime}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{pt.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Defect Discovery Panel */}
      <section className="rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>تمرين اكتشاف العيوب المنهجية المضمنة في الحالة ({sc.embeddedDefects.length})</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            حاول اكتشاف الخلل أولًا من جدول القياسات وبطاقة الجهاز أعلاه، ثم اضغط لكشف التحليل العلمي والإجراء التصحيحي لكل عيب.
          </p>
        </div>

        <div className="space-y-3">
          {sc.embeddedDefects.map((def, idx) => {
            const open = Boolean(revealedDefects[def.id]);
            return (
              <div key={def.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#001F4D] dark:text-white">
                    العيب #{idx + 1} — التصنيف: {def.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRevealedDefects((prev) => ({ ...prev, [def.id]: !prev[def.id] }))}
                    className="inline-flex items-center gap-1.5 rounded bg-[#00D1CE] px-3 py-1.5 text-xs font-bold text-[#001F4D]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{open ? 'إخفاء التحليل' : 'كشف التحليل والتصحيح'}</span>
                  </button>
                </div>
                {open && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <p><strong>الوصف العلمي للخلل:</strong> {def.description}</p>
                    <p className="text-[#007574] dark:text-[#00D1CE]"><strong>الإجراء التصحيحي الصحيح:</strong> {def.correctAction}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Calculations Summary & Report Excerpt */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <h2 className="text-base font-bold text-[#001F4D] dark:text-white">الحسابات والتقييم ومقتطف التقرير الفني</h2>
        <div dir="ltr" className="ltr-block rounded bg-slate-50 dark:bg-[#050E1D] p-3 font-mono text-xs font-bold text-[#001F4D] dark:text-[#00D1CE]">
          {sc.calculationsSummary.formulaUsed}
        </div>
        <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
          {sc.calculationsSummary.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <p className="text-xs font-bold text-[#001F4D] dark:text-white">النتيجة: {sc.calculationsSummary.result}</p>

        <AssessmentBanner
          outcome={sc.calculationsSummary.assessmentOutcome}
          statement={sc.calculationsSummary.assessmentStatement}
          detail={`معيار المقارنة المستخدم: ${sc.calculationsSummary.criterionUsed}`}
        />

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-4 space-y-1.5 text-xs">
          <div className="font-bold text-[#001F4D] dark:text-white">مقتطف صياغة مهنية مقترحة للتقرير</div>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">{sc.reportExcerpt}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" onClick={() => onNavigate('/calculators')} className="rounded-lg bg-[#001F4D] px-3.5 py-2 text-xs font-bold text-white">
            تطبيق الأرقام في الحاسبات
          </button>
          <button type="button" onClick={() => onNavigate('/planner')} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200">
            فتح المخطط التفاعلي
          </button>
          <button type="button" onClick={() => onNavigate('/forms')} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200">
            إعداد النماذج F01–F07
          </button>
        </div>
      </section>

      {/* Interactive Scenario Quiz */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <h2 className="text-base font-bold text-[#001F4D] dark:text-white">أسئلة التقييم الذاتي للحالة</h2>
        <div className="space-y-5">
          {sc.questions.map((q, qIdx) => (
            <div key={q.id} className="space-y-2.5">
              <p className="text-sm font-bold text-[#001F4D] dark:text-white">
                {qIdx + 1}. {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, optIdx) => {
                  const chosen = answers[q.id] === optIdx;
                  const isCorrect = submitted && optIdx === q.correctIndex;
                  const isWrongChoice = submitted && chosen && optIdx !== q.correctIndex;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                      className={`w-full text-right rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                          : isWrongChoice
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100'
                            : chosen
                              ? 'border-[#001F4D] bg-[#E6FAFA] dark:bg-[#001F4D] text-[#001F4D] dark:text-white'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#050E1D]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#050E1D] rounded p-3">
                  <strong>التوضيح:</strong> {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmitQuiz}
            className="rounded-lg bg-[#00D1CE] px-5 py-2.5 text-xs font-bold text-[#001F4D] hover:opacity-90"
          >
            تصحيح الإجابات وحفظ النتيجة محليًا
          </button>
          {submitted && (
            <span className="text-sm font-bold text-[#001F4D] dark:text-[#00D1CE]">
              نتيجتك: {currentScore} من {sc.questions.length}
            </span>
          )}
        </div>
      </section>

      <ScientificMetaPanel meta={sc.meta} onNavigate={onNavigate} />
    </article>
  );
};
