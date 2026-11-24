import React, { useEffect, useState } from 'react';
import { Award, BookOpenCheck, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { QUIZ_PASS_THRESHOLD } from '../utils/storage';
import { Ltr } from './SharedUI';
import type { LessonQuizQuestion, LessonQuizRecord } from '../types';

interface LessonQuizCardProps {
  lessonId: string;
  questions: LessonQuizQuestion[];
  quizRecord?: LessonQuizRecord;
  onSaveAttempt: (lessonId: string, score: number, total: number) => void;
  onNavigate?: (path: string) => void;
}

export const LessonQuizCard: React.FC<LessonQuizCardProps> = ({
  lessonId,
  questions,
  quizRecord,
  onSaveAttempt,
  onNavigate,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [lastScore, setLastScore] = useState<number>(0);

  useEffect(() => {
    setSelectedAnswers({});
    setSubmitted(false);
    setLastScore(0);
  }, [lessonId]);

  if (questions.length === 0) return null;

  const answeredCount = questions.filter((q) => selectedAnswers[q.id] !== undefined).length;
  const allAnswered = answeredCount === questions.length;

  const bestPct =
    quizRecord && quizRecord.totalQuestions > 0
      ? Math.round((quizRecord.highestScore / quizRecord.totalQuestions) * 100)
      : null;

  const handleSubmit = () => {
    if (!allAnswered || submitted) return;
    const score = questions.reduce(
      (acc, q) => acc + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0),
      0
    );
    setLastScore(score);
    setSubmitted(true);
    onSaveAttempt(lessonId, score, questions.length);
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setLastScore(0);
  };

  const currentPct = Math.round((lastScore / questions.length) * 100);
  const currentPassed = lastScore / questions.length >= QUIZ_PASS_THRESHOLD;

  return (
    <section
      id="lesson-quiz-section"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-5 no-print"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-[#007574] dark:text-[#00D1CE]" aria-hidden="true" />
            <span>اختبار التحقق والفهم</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            أجب عن جميع الأسئلة (<Ltr>{questions.length}</Ltr>) ثم اضغط «تسليم الإجابات». درجة الاجتياز المطلوبة: <Ltr>80%</Ltr> مع حفظ أعلى درجة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!quizRecord || quizRecord.attemptsCount === 0 ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              لم يُختبر بعد
            </span>
          ) : quizRecord.passed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Award className="w-3.5 h-3.5" aria-hidden="true" />
              <span>مجتاز — أعلى درجة: <Ltr>{bestPct}%</Ltr></span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-300">
              لم يجتز — أعلى درجة: <Ltr>{bestPct}%</Ltr> (المطلوب <Ltr>80%</Ltr>)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const chosen = selectedAnswers[q.id];
          return (
            <div key={q.id} className="space-y-3">
              <p className="font-semibold text-sm text-[#001F4D] dark:text-slate-100 leading-relaxed">
                <span className="text-[#007574] dark:text-[#00D1CE] ml-1.5">
                  <Ltr>{qIdx + 1}.</Ltr>
                </span>
                {q.question}
              </p>

              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const isPicked = chosen === idx;
                  const isCorrect = idx === q.correctIndex;
                  let cls =
                    'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#050E1D] text-slate-800 dark:text-slate-200 hover:border-[#007574] dark:hover:border-[#00D1CE]';

                  if (!submitted && isPicked) {
                    cls =
                      'border-[#001F4D] dark:border-[#00D1CE] bg-[#E6FAFA]/70 dark:bg-[#0D2533] text-[#001F4D] dark:text-white font-semibold';
                  } else if (submitted) {
                    if (isCorrect) {
                      cls =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100';
                    } else if (isPicked) {
                      cls =
                        'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100';
                    } else {
                      cls =
                        'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-[#050E1D]/60 text-slate-500 dark:text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={submitted}
                      onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                      className={`w-full text-right rounded-lg border p-3 text-sm transition-colors flex items-start justify-between gap-3 ${cls}`}
                    >
                      <span>{opt}</span>
                      {submitted && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      {submitted && isPicked && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div>
                    <strong className={chosen === q.correctIndex ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                      {chosen === q.correctIndex ? 'إجابة صحيحة — التفسير العلمي: ' : 'مراجعة مطلوبة — التفسير العلمي: '}
                    </strong>
                    {q.explanation}
                  </div>
                  {q.citation && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-[#007574] dark:text-[#00D1CE]">الإحالة المرجعية:</span>
                      <Ltr className="font-semibold">{q.citation.standardDoc}</Ltr>
                      <span>—</span>
                      <span>{q.citation.sectionOrPage}</span>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('/references')}
                          className="underline text-[#001F4D] dark:text-[#00D1CE] mr-1"
                        >
                          (سجل المراجع)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission / Result Footer */}
      {!submitted ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            تمت الإجابة عن <Ltr>{answeredCount}</Ltr> من <Ltr>{questions.length}</Ltr> أسئلة
          </span>
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleSubmit}
            className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-opacity ${
              allAnswered
                ? 'bg-[#001F4D] dark:bg-[#00D1CE] text-white dark:text-[#001F4D] hover:opacity-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            تسليم الإجابات
          </button>
        </div>
      ) : (
        <div
          className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
            currentPassed
              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
              : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100'
          }`}
        >
          <div className="space-y-1 text-sm">
            <div className="font-bold">
              {currentPassed
                ? `تهانينا! تم اجتياز الاختبار بنجاح (${currentPct}%)`
                : `لم تبلغ نسبة الاجتياز المطلوبة (80%). نتيجتك الحالية: ${currentPct}%`}
            </div>
            <div className="text-xs opacity-90">
              الدرجة: <Ltr>{lastScore} / {questions.length}</Ltr>
              {bestPct !== null && (
                <span>
                  {' · '}أعلى درجة محفوظة: <Ltr>{bestPct}%</Ltr>
                </span>
              )}
              {!currentPassed && ' · يمكنك مراجعة الدرس وإعادة المحاولة مع الحفاظ على أعلى درجة محققة.'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-current/30 bg-white/80 dark:bg-[#050E1D] px-4 py-2 text-xs font-bold text-[#001F4D] dark:text-[#00D1CE] hover:bg-white dark:hover:bg-slate-900"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>إعادة الاختبار</span>
          </button>
        </div>
      )}
    </section>
  );
};
