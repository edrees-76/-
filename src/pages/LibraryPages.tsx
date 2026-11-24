import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, CheckCircle2, Circle, Info } from 'lucide-react';
import { CURRICULUM_UNITS, LESSONS } from '../data/lessons';
import { Breadcrumbs, Ltr, ReviewStatusText, ScientificMetaPanel } from '../components/SharedUI';
import type { LocalUserProgress, TrackId } from '../types';

interface LibraryProps {
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
}

export const LibraryPage: React.FC<LibraryProps> = ({ onNavigate, progress }) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<TrackId | 'all'>('all');

  const visibleUnits = CURRICULUM_UNITS.filter((u) => selectedUnit === 'all' || u.id === selectedUnit);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'المكتبة التعليمية' }]} onNavigate={onNavigate} />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">المكتبة التعليمية (7 وحدات · 25 درسًا)</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
          منهج علمي منظم يغطي المسح الإشعاعي الطبي من الأسس والوحدات إلى جميع الأقسام الإشعاعية والحسابات والتقارير، مع تمييز صريح للبيانات التعليمية المحاكاة والموضوعات التي ما زالت بحالة «قيد الإعداد».
        </p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="unit-filter" className="text-xs font-bold text-[#001F4D] dark:text-slate-200">
            تصفية بالوحدة:
          </label>
          <select
            id="unit-filter"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
          >
            <option value="all">جميع الوحدات (أ – ز)</option>
            {CURRICULUM_UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                الوحدة {u.letter}: {u.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'الكل' },
              { id: 'beginner', label: 'المبتدئ' },
              { id: 'practitioner', label: 'الممارس الميداني' },
              { id: 'quick-review', label: 'المراجعة السريعة' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTrack(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedTrack === tab.id
                  ? 'bg-[#001F4D] dark:bg-[#00D1CE] text-white dark:text-[#001F4D]'
                  : 'bg-slate-100 dark:bg-[#050E1D] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Units & Lessons */}
      <div className="space-y-8">
        {visibleUnits.map((unit) => {
          const unitLessons = LESSONS.filter(
            (l) => l.unitId === unit.id && (selectedTrack === 'all' || l.trackTags.includes(selectedTrack))
          );
          if (unitLessons.length === 0) return null;

          return (
            <section key={unit.id} className="space-y-3">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h2 className="text-xl font-bold text-[#001F4D] dark:text-white">
                  الوحدة {unit.letter}: {unit.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{unit.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unitLessons.map((lesson) => {
                  const isDone = progress.completedLessons.includes(lesson.id);
                  return (
                    <article
                      key={lesson.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-[#007574] dark:text-[#00D1CE]">الدرس {lesson.number}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {lesson.contentStatus === 'قيد الإعداد' ? 'قيد الإعداد (محتوى تمهيدي)' : lesson.meta.status}
                          </span>
                          {isDone && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">مكتمل</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-[#001F4D] dark:text-white">
                          <button
                            type="button"
                            onClick={() => onNavigate(`/library/${lesson.id}`)}
                            className="text-right hover:text-[#007574] dark:hover:text-[#00D1CE]"
                          >
                            {lesson.title}
                          </button>
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{lesson.summary}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          مراجعة <Ltr>{lesson.meta.lastReviewed}</Ltr>
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate(`/library/${lesson.id}`)}
                          className="font-bold text-[#001F4D] dark:text-[#00D1CE] hover:underline inline-flex items-center gap-1"
                        >
                          <span>قراءة الدرس</span>
                          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

interface LessonDetailProps {
  lessonId: string;
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
  onMarkLessonVisited: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleBookmark: (item: { type: 'lesson'; id: string; title: string; route: string }) => void;
  onToggleChecklist: (key: string, idx: number, total: number) => void;
}

export const LessonDetailPage: React.FC<LessonDetailProps> = ({
  lessonId,
  onNavigate,
  progress,
  onMarkLessonVisited,
  onToggleComplete,
  onToggleBookmark,
  onToggleChecklist,
}) => {
  const lessonIndex = LESSONS.findIndex((l) => l.id === lessonId);
  const lesson = LESSONS[lessonIndex];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (lesson) {
      onMarkLessonVisited(lesson.id);
      setSelectedAnswers({});
    }
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#001F4D] dark:text-white">الدرس غير موجود</h1>
        <button
          type="button"
          onClick={() => onNavigate('/library')}
          className="rounded-lg bg-[#001F4D] text-white px-4 py-2 text-sm font-bold"
        >
          العودة إلى المكتبة التعليمية
        </button>
      </div>
    );
  }

  const unit = CURRICULUM_UNITS.find((u) => u.id === lesson.unitId);
  const prevLesson = lessonIndex > 0 ? LESSONS[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < LESSONS.length - 1 ? LESSONS[lessonIndex + 1] : null;
  const isCompleted = progress.completedLessons.includes(lesson.id);
  const isBookmarked = progress.bookmarks.some((b) => b.type === 'lesson' && b.id === lesson.id);
  const checklistState = progress.completedChecklists[`lesson_${lesson.id}`] ?? [];

  return (
    <article className="space-y-8 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'المكتبة التعليمية', path: '/library' },
          { label: `الدرس ${lesson.number}` },
        ]}
        onNavigate={onNavigate}
      />

      {/* Lesson Header */}
      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-bold text-[#007574] dark:text-[#00D1CE]">
            الوحدة {unit?.letter}: {unit?.title}
          </span>
          <span aria-hidden="true">·</span>
          <span>الدرس {lesson.number}</span>
          <span aria-hidden="true">·</span>
          <ReviewStatusText status={lesson.meta.status} />
          <span aria-hidden="true">·</span>
          <span>
            حالة المحتوى: <strong>{lesson.contentStatus}</strong>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#001F4D] dark:text-white leading-snug">{lesson.title}</h1>
        <p className="text-base text-slate-600 dark:text-slate-300">{lesson.summary}</p>

        <div className="flex flex-wrap items-center gap-2 pt-1 no-print">
          <button
            type="button"
            onClick={() => onToggleComplete(lesson.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold border transition-colors ${
              isCompleted
                ? 'bg-[#E6FAFA] dark:bg-[#0D2533] border-[#007574] dark:border-[#00D1CE] text-[#001F4D] dark:text-[#00D1CE]'
                : 'bg-white dark:bg-[#0D1B2E] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            <span>{isCompleted ? 'مكتمل (إلغاء الإكمال)' : 'تحديد الدرس كمكتمل'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onToggleBookmark({
                type: 'lesson',
                id: lesson.id,
                title: `الدرس ${lesson.number}: ${lesson.title}`,
                route: `/library/${lesson.id}`,
              })
            }
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold border transition-colors ${
              isBookmarked
                ? 'bg-[#001F4D] text-white border-[#001F4D] dark:bg-[#00D1CE] dark:text-[#001F4D]'
                : 'bg-white dark:bg-[#0D1B2E] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{isBookmarked ? 'محفوظ في العلامات' : 'حفظ كعلامة مرجعية'}</span>
          </button>
        </div>

        {lesson.contentStatus === 'قيد الإعداد' && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-950 dark:text-amber-100 flex items-start gap-2.5">
            <Info className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>تنبيه حالة المحتوى — قيد الإعداد:</strong> يعرض هذا الدرس الإطار الموثق المتاح حاليًا فقط ولم يُملأ بمعلومات مختلقة؛ يُستكمل عند إضافة مراجعه التخصصية المعتمدة.
            </div>
          </div>
        )}
      </header>

      {/* Objectives & Prerequisites */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white mb-2">أهداف التعلم</h2>
          <ul className="list-disc pr-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {lesson.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white mb-2">المتطلبات السابقة</h2>
          <ul className="list-disc pr-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {lesson.prerequisites.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="space-y-6">
        {lesson.sections.map((sec, idx) => (
          <section key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-3">
            <h2 className="text-xl font-bold text-[#001F4D] dark:text-white">{sec.heading}</h2>
            <p className="text-sm sm:text-base leading-relaxed text-[#334155] dark:text-slate-300">{sec.body}</p>
            {sec.bullets && (
              <ul className="list-disc pr-5 space-y-2 text-sm text-slate-700 dark:text-slate-300 pt-1">
                {sec.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Quantities & Units */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-3">
        <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">الكميات والوحدات المستخدمة</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-right bg-slate-50 dark:bg-[#050E1D]">
                <th className="p-2.5 font-bold text-[#001F4D] dark:text-white">الرمز</th>
                <th className="p-2.5 font-bold text-[#001F4D] dark:text-white">الكمية</th>
                <th className="p-2.5 font-bold text-[#001F4D] dark:text-white">الوحدة</th>
                <th className="p-2.5 font-bold text-[#001F4D] dark:text-white">ملاحظة علمية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {lesson.quantitiesAndUnits.map((q, i) => (
                <tr key={i}>
                  <td className="p-2.5"><Ltr className="font-semibold text-[#001F4D] dark:text-[#00D1CE]">{q.symbol}</Ltr></td>
                  <td className="p-2.5 font-semibold">{q.name}</td>
                  <td className="p-2.5"><Ltr>{q.unit}</Ltr></td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-300">{q.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-3">
        <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">خطوات العمل التعليمية</h2>
        <ol className="list-decimal pr-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {lesson.workflowSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      {/* Worked Example (if verified/available) */}
      {lesson.workedExample && (
        <section className="rounded-xl border border-[#007574]/30 dark:border-[#00D1CE]/30 bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">{lesson.workedExample.title}</h2>
            <span className="text-xs font-bold text-[#007574] dark:text-[#00D1CE]">
              تصنيف البيانات: {lesson.workedExample.dataType}
            </span>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200">{lesson.workedExample.scenario}</p>
          <ol className="list-decimal pr-5 space-y-1.5 text-sm text-slate-800 dark:text-slate-200">
            {lesson.workedExample.steps.map((st, i) => (
              <li key={i}>{st}</li>
            ))}
          </ol>
          <p className="text-sm font-bold text-[#001F4D] dark:text-[#00D1CE] pt-1">
            الخلاصة: {lesson.workedExample.result}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">تنبيه: {lesson.workedExample.caution}</p>
        </section>
      )}

      {/* Common Mistakes & Interactive Checklist */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white">أخطاء شائعة يجب تجنبها</h2>
          <ul className="list-disc pr-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {lesson.commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white">قائمة تحقق تطبيقية (تُحفظ محليًا)</h2>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {lesson.checklist.map((item, i) => (
              <li key={i}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(checklistState[i])}
                    onChange={() => onToggleChecklist(`lesson_${lesson.id}`, i, lesson.checklist.length)}
                    className="mt-1 h-4 w-4 accent-[#001F4D] dark:accent-[#00D1CE]"
                  />
                  <span className={checklistState[i] ? 'line-through opacity-75' : ''}>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quiz with Explanations */}
      {lesson.quiz.length > 0 && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">سؤال تحقق وفهم</h2>
          {lesson.quiz.map((q) => {
            const chosen = selectedAnswers[q.id];
            return (
              <div key={q.id} className="space-y-3">
                <p className="font-semibold text-sm text-[#001F4D] dark:text-slate-100">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, idx) => {
                    const isPicked = chosen === idx;
                    const isCorrect = idx === q.correctIndex;
                    let cls =
                      'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#050E1D] text-slate-800 dark:text-slate-200';
                    if (chosen !== undefined) {
                      if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100';
                      else if (isPicked) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100';
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                        className={`w-full text-right rounded-lg border p-3 text-sm transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-3.5 text-xs text-slate-700 dark:text-slate-300">
                    <strong>{chosen === q.correctIndex ? 'إجابة صحيحة — التفسير العلمي: ' : 'مراجعة مطلوبة — التفسير العلمي: '}</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Scientific References & Meta */}
      <ScientificMetaPanel meta={lesson.meta} onNavigate={onNavigate} />

      {/* Prev / Next Navigation */}
      <nav aria-label="التنقل بين الدروس" className="no-print flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        {prevLesson ? (
          <button
            type="button"
            onClick={() => onNavigate(`/library/${prevLesson.id}`)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200"
          >
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
            <span>السابق: {prevLesson.number}. {prevLesson.title}</span>
          </button>
        ) : (
          <div />
        )}
        {nextLesson && (
          <button
            type="button"
            onClick={() => onNavigate(`/library/${nextLesson.id}`)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#001F4D] dark:bg-[#00D1CE] px-4 py-2 text-xs font-bold text-white dark:text-[#001F4D]"
          >
            <span>التالي: {nextLesson.number}. {nextLesson.title}</span>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </nav>
    </article>
  );
};
