import React, { useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  Compass,
  FileText,
  Gauge,
  Layers,
  Lock,
  Shield,
} from 'lucide-react';
import { CURRICULUM_UNITS, LESSONS } from '../data/lessons';
import { EQUIPMENT_LIST } from '../data/equipment';
import { TRAINING_SCENARIOS } from '../data/scenarios';
import { LOGO_PATH } from '../components/Layout';
import { Breadcrumbs, Ltr } from '../components/SharedUI';
import { CompletionCertificateModal } from '../components/CompletionCertificateModal';
import { checkBeginnerTrackEligibility, getLessonQuizStatus, getTrackCertificate } from '../utils/storage';
import type { LocalUserProgress, TrackId } from '../types';

interface NavProps {
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
  onSelectTrack: (track: TrackId) => void;
  onIssueCertificate?: (recipientName: string, trackId?: TrackId) => void;
}

const TRACK_DETAILS: Record<
  TrackId,
  {
    title: string;
    audience: string;
    description: string;
    primaryRoute: string;
    primaryCta: string;
    quickLinks: { label: string; path: string }[];
  }
> = {
  beginner: {
    title: 'مسار المبتدئ',
    audience: 'المتدربون وطلبة الفيزياء الطبية والوقاية من الإشعاع',
    description: 'تدرّج منظم يبدأ بالمفاهيم والكميات والوحدات، ثم اختيار الأجهزة وهندسة القياس، وصولًا إلى تطبيق الحالة المرجعية للأشعة العامة.',
    primaryRoute: '/library/L01-concepts-scope',
    primaryCta: 'ابدأ من الدرس الأول',
    quickLinks: [
      { label: '1. الأسس والكميات ومعايير المقارنة', path: '/library/L02-quantities-units-criteria' },
      { label: '2. هندسة القياس والمخطط', path: '/library/L05-geometry-room-mapping' },
      { label: '3. الحالة المرجعية للأشعة العامة', path: '/scenarios/scen-01-general-xray' },
    ],
  },
  practitioner: {
    title: 'مسار الممارس الميداني',
    audience: 'الفيزيائيون الطبيون ومسؤولو الوقاية وفرق التفتيش',
    description: 'وصول مباشر إلى بروتوكولات الأقسام، ودليل الأجهزة ومقارنتها، والمخطط التفاعلي بمقياس 1:50، والنماذج الميدانية F01–F07.',
    primaryRoute: '/forms',
    primaryCta: 'فتح النماذج والتقارير F01–F07',
    quickLinks: [
      { label: 'المخطط التفاعلي بمقياس 1:50', path: '/planner' },
      { label: 'دليل ومقارنة أجهزة القياس', path: '/equipment' },
      { label: 'الحالات التدريبية الثمانية', path: '/scenarios' },
    ],
  },
  'quick-review': {
    title: 'مسار المراجعة السريعة',
    audience: 'المراجعة السريعة لمعادلة أو مصطلح أو قائمة تحقق قبل الزيارة',
    description: 'وصول فوري للحاسبات الثمانية الموثقة، وقاموس المصطلحات العلمية، وقوائم التحقق، وأسئلة الميدان الحاسمة.',
    primaryRoute: '/calculators',
    primaryCta: 'فتح الحاسبات الموثقة',
    quickLinks: [
      { label: 'قاموس المصطلحات والفصل المفاهيمي', path: '/glossary' },
      { label: 'الأسئلة الميدانية السريعة (الدرس 25)', path: '/library/L25-field-qa-rapid-reference' },
      { label: 'سجل المراجع ومنهجية المراجعة', path: '/references' },
    ],
  },
};

export const HomePage: React.FC<NavProps> = ({ onNavigate, progress, onSelectTrack }) => {
  const lastLesson = LESSONS.find((l) => l.id === progress.lastLessonId);
  const completedCount = progress.completedLessons.length;
  const totalLessons = LESSONS.length;
  const activeTrackLessons = LESSONS.filter((l) => l.trackTags.includes(progress.selectedTrack));
  const activeEligibility = checkBeginnerTrackEligibility(progress, activeTrackLessons);
  const activeTrackTitle = TRACK_DETAILS[progress.selectedTrack].title;

  return (
    <div className="space-y-12">
      {/* Calm Scientific Hero */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-4 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            <div className="text-xs font-semibold text-[#007574] dark:text-[#00D1CE]">
              منصة عربية تعليمية ومرجعية · الفيزياء الطبية والوقاية من الإشعاع
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#001F4D] dark:text-white leading-snug">
              المسح الإشعاعي الطبي
              <span className="block text-lg sm:text-xl font-semibold text-slate-600 dark:text-slate-300 mt-1" dir="ltr">
                Medical Radiation Survey
              </span>
            </h1>
            <p className="text-base text-[#334155] dark:text-slate-300 max-w-2xl leading-relaxed">
              مرجع مهني وتعليمي متكامل لتعلّم تخطيط وتنفيذ المسح الإشعاعي في العيادات والمستشفيات، واختيار أجهزة القياس ومقارنتها، وتوثيق هندسة الغرف بمقياس رسم، وإجراء الحسابات الموثقة، وإعداد التقارير الفنية وفق معايير واضحة.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('/start')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#001F4D] dark:bg-[#00D1CE] px-5 py-2.5 text-sm font-bold text-white dark:text-[#001F4D] hover:opacity-95 transition-opacity"
              >
                <span>ابدأ من هنا</span>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/scenarios/scen-01-general-xray')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#E6FAFA] dark:bg-[#050E1D] px-5 py-2.5 text-sm font-bold text-[#001F4D] dark:text-[#00D1CE] hover:bg-[#d5f5f5] dark:hover:bg-slate-900 transition-colors"
              >
                <span>استعراض الحالة المرجعية (الأشعة العامة)</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              منصة تعليمية ومرجعية مستقلة · لا تصدر اعتمادًا رسميًا أو شهادة أمان مطلقة · تعمل محليًا دون حسابات أو خادم خلفي.
            </p>
          </div>

          {/* Unmodified Attached Logo Showcase */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-6">
            <img
              src={LOGO_PATH}
              alt="الشعار الرسمي لمنصة المسح الإشعاعي الطبي Medical Radiation Survey"
              className="w-full max-w-[260px] h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Continue Last Lesson & Local Progress Strip */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#E6FAFA]/60 dark:bg-[#0D1B2E] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[#001F4D] dark:text-white">
            تقدمك المحفوظ محليًا على هذا المتصفح
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            أكملت <Ltr>{completedCount}</Ltr> من أصل <Ltr>{totalLessons}</Ltr> درسًا · اختبارات <Ltr>{activeTrackTitle}</Ltr> المجتازة (<Ltr>≥ 80%</Ltr>):{' '}
            <Ltr>{activeEligibility.passedQuizzesCount} / {activeEligibility.totalQuizzes}</Ltr> · العلامات المرجعية:{' '}
            <Ltr>{progress.bookmarks.length}</Ltr>
            {lastLesson ? ` · آخر درس مفتوح: ${lastLesson.number}. ${lastLesson.title}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/tracks')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
              activeEligibility.eligible
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] text-[#001F4D] dark:text-slate-200'
            }`}
          >
            {activeEligibility.eligible ? 'استعراض شهادة المسار ✓' : `خريطة ${activeTrackTitle}`}
          </button>
          {lastLesson ? (
            <button
              type="button"
              onClick={() => onNavigate(`/library/${lastLesson.id}`)}
              className="rounded-lg bg-[#00D1CE] px-4 py-2 text-xs font-bold text-[#001F4D] hover:opacity-90"
            >
              متابعة آخر درس
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/library/L01-concepts-scope')}
              className="rounded-lg bg-[#00D1CE] px-4 py-2 text-xs font-bold text-[#001F4D] hover:opacity-90"
            >
              بدء الدرس الأول
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('/about')}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3.5 py-2 text-xs font-semibold text-[#001F4D] dark:text-slate-200"
          >
            العمل دون اتصال والنسخ الاحتياطي
          </button>
        </div>
      </section>

      {/* Dual-Mode Workspace Hub: Learning Mode vs Field Work Mode */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#001F4D] dark:text-white">وضع التعلّم والتأهيل</h2>
            <span className="text-[11px] font-bold text-[#007574] dark:text-[#00D1CE]">للمتدربين والدارسين</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {[
              { title: 'ابدأ من هنا', desc: 'خريطة المنصة و20 دقيقة', path: '/start' },
              { title: 'المسارات التعليمية', desc: '3 مسارات + شهادة إتمام', path: '/tracks' },
              { title: 'المكتبة (25 درسًا)', desc: 'دروس واختبارات وقوائم', path: '/library' },
              { title: 'الحالات (8 حالات)', desc: 'تطبيقات ميدانية تفاعلية', path: '/scenarios' },
            ].map((card) => (
              <button
                key={card.path}
                type="button"
                onClick={() => onNavigate(card.path)}
                className="text-right rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#050E1D] p-3 hover:border-[#007574] dark:hover:border-[#00D1CE] transition-colors"
              >
                <div className="font-bold text-[#001F4D] dark:text-white">{card.title}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{card.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#001F4D] dark:text-white">وضع العمل الميداني السريع</h2>
            <span className="text-[11px] font-bold text-[#007574] dark:text-[#00D1CE]">للعيادات والمستشفيات</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {[
              { title: 'دليل الأجهزة (14)', desc: 'مواصفات وصور ومقارنة', path: '/equipment' },
              { title: 'الحاسبات الموثقة (8)', desc: 'جرعة، تربيع عكسي، HVL', path: '/calculators' },
              { title: 'المخطط التفاعلي', desc: 'هندسة الغرفة بمقياس 1:50', path: '/planner' },
              { title: 'النماذج (F01–F07)', desc: 'تقارير جاهزة للطباعة A4', path: '/forms' },
            ].map((card) => (
              <button
                key={card.path}
                type="button"
                onClick={() => onNavigate(card.path)}
                className="text-right rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#050E1D] p-3 hover:border-[#007574] dark:hover:border-[#00D1CE] transition-colors"
              >
                <div className="font-bold text-[#001F4D] dark:text-white">{card.title}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{card.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Three Learning Tracks */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-[#001F4D] dark:text-white">ثلاثة مسارات منظمة حسب احتياجك</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">اختر المسار المناسب لخبرتك ومهمتك الحالية، ويمكنك التبديل في أي وقت.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/tracks')}
            className="text-sm font-bold text-[#007574] dark:text-[#00D1CE] hover:underline"
          >
            عرض تفاصيل المسارات
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['beginner', 'practitioner', 'quick-review'] as TrackId[]).map((tid) => {
            const tr = TRACK_DETAILS[tid];
            const isSelected = progress.selectedTrack === tid;
            return (
              <div
                key={tid}
                className={`rounded-xl border p-5 flex flex-col justify-between bg-white dark:bg-[#0D1B2E] ${
                  isSelected
                    ? 'border-[#007574] dark:border-[#00D1CE]'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-[#007574] dark:text-[#00D1CE]">
                    {isSelected ? 'المسار المختار حاليًا' : tr.audience}
                  </div>
                  <h3 className="text-lg font-bold text-[#001F4D] dark:text-white">{tr.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{tr.description}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTrack(tid);
                      onNavigate(tr.primaryRoute);
                    }}
                    className="text-sm font-bold text-[#001F4D] dark:text-[#00D1CE] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{tr.primaryCta}</span>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reference End-to-End Workflow (General X-Ray Reference Case) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[#001F4D] dark:text-white">
            سير العمل المرجعي المكتمل: حالة غرفة الأشعة العامة (R01)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            ترابط تفاعلي كامل من الدرس النظري حتى التقرير القابل للطباعة على A4 باستخدام بيانات محاكاة تعليمية موثقة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { step: '01', title: 'درس الأشعة العامة', desc: 'الأوضاع S01/S02 والفانتوم', path: '/library/L09-general-xray-mobile' },
            { step: '02', title: 'اختيار الجهاز', desc: 'RaySafe 452 وشروط النبض', path: '/equipment/raysafe-452' },
            { step: '03', title: 'مخطط الغرفة', desc: '6×5 m بمقياس 1:50 و3D', path: '/planner' },
            { step: '04', title: 'قراءات محاكاة', desc: 'الحالة 01 ونقطة ناقصة', path: '/scenarios/scen-01-general-xray' },
            { step: '05', title: 'الحاسبات الموثقة', desc: 'خلفية، أسبوعي، عدم يقين', path: '/calculators/weekly-annual' },
            { step: '06', title: 'التقرير الفني F07', desc: 'حفظ JSON وطباعة A4', path: '/forms' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => onNavigate(item.path)}
              className="text-right rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#050E1D] p-3.5 hover:border-[#007574] dark:hover:border-[#00D1CE] transition-colors"
            >
              <div className="text-xs font-mono font-bold text-[#007574] dark:text-[#00D1CE]">{item.step}</div>
              <div className="font-bold text-sm text-[#001F4D] dark:text-white mt-1">{item.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Core Platform Hubs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            icon: BookOpen,
            title: 'المكتبة التعليمية',
            meta: `${CURRICULUM_UNITS.length} وحدات · ${LESSONS.length} درسًا`,
            desc: 'من الأسس والكميات وحتى CT والقسطرة والطب النووي وLINAC وعدم اليقين والتقارير.',
            path: '/library',
          },
          {
            icon: Gauge,
            title: 'دليل ومقارنة أجهزة القياس',
            meta: `${EQUIPMENT_LIST.length} جهازًا ومسبارًا`,
            desc: 'بطاقات فنية تفصل الجهاز عن المسبار والنسخ الفرعية مع أداة مقارنة حتى 3 أجهزة.',
            path: '/equipment',
          },
          {
            icon: Compass,
            title: 'المخطط التفاعلي للغرفة',
            meta: 'SVG تفاعلي · قطاع رأسي · 1:50',
            desc: 'غرفة قابلة لتغيير الأبعاد مع تحريك نقاط القياس MP وحساب 2D/3D وتصدير الطباعة بمقياس.',
            path: '/planner',
          },
          {
            icon: Calculator,
            title: 'الحاسبات الموثقة',
            meta: '8 حاسبات مستقلة · خطوات تعويض',
            desc: 'تحويل الوحدات المتجانسة، الخلفية، الجرعة/تعرض، الأسبوعي/السنوي، الانتقال، التلوث، الإحداثيات، وعدم اليقين.',
            path: '/calculators',
          },
          {
            icon: FileText,
            title: 'النماذج والتقارير الفنية',
            meta: 'F01 إلى F07 · JSON / CSV / A4',
            desc: 'تعبئة تفاعلية مع حفظ محلي وطباعة عربية منسقة على A4 دون توليد توقيع أو ختم آلي.',
            path: '/forms',
          },
          {
            icon: Layers,
            title: 'الحالات التدريبية الثمانية',
            meta: `${TRAINING_SCENARIOS.length} حالات محاكاة مع عيوب مدمجة`,
            desc: 'تدريب عملي على اكتشاف الجهاز غير المناسب، نقص الخلفية، أخطاء الزمن، والنقاط الناقصة.',
            path: '/scenarios',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.path}
              type="button"
              onClick={() => onNavigate(card.path)}
              className="text-right rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 hover:border-[#007574] dark:hover:border-[#00D1CE] transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-[#007574] dark:text-[#00D1CE]" aria-hidden="true" />
                <span className="text-xs text-slate-500 dark:text-slate-400">{card.meta}</span>
              </div>
              <h3 className="text-base font-bold text-[#001F4D] dark:text-white">{card.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{card.desc}</p>
            </button>
          );
        })}
      </section>

      {/* Explicit Conceptual Separation Box */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#007574] dark:text-[#00D1CE]" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">
            مبدأ منهجي أساسي: الفصل الواضح بين مجالات الوقاية والفيزياء الطبية
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {[
            { title: 'المسح الإشعاعي للمستويات والحواجز', note: 'يتحقق من مستويات الإشعاع حول الغرف والحواجز تحت تشغيل وهندسة موثقة.' },
            { title: 'مسح التلوث السطحي', note: 'يكشف النشاط غير المرغوب على الأسطح (مباشر أو مسحات) بوحدة Bq/cm².' },
            { title: 'الرصد الشخصي', note: 'يتابع جرعات الأفراد (Hp(10)/Hp(3)/Hp(0.07)) ولا يستبدل مسح مكان العمل.' },
            { title: 'ضبط جودة الأجهزة (QC)', note: 'يختبر kVp وHVL والمؤقت وجودة الصورة؛ مستقل عن مسح الحواجز.' },
            { title: 'تقييم جرعات المرضى', note: 'يقوم على التبرير والتحسين وDRLs ولا تطبق عليه حدود العاملين أو الجمهور.' },
            { title: 'تصميم التدريع', note: 'حساب إنشائي وفيزيائي مسبق؛ المخطط التفاعلي والمسح لا ينتجان اعتماد تدريع.' },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/60 dark:bg-[#050E1D]">
              <h3 className="font-bold text-[#001F4D] dark:text-white text-sm">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const StartHerePage: React.FC<NavProps> = ({ onNavigate, progress, onSelectTrack }) => (
  <div className="space-y-8 max-w-4xl">
    <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'ابدأ من هنا' }]} onNavigate={onNavigate} />

    <header className="space-y-2">
      <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">ابدأ من هنا — خريطة استخدام المنصة</h1>
      <p className="text-base text-slate-600 dark:text-slate-300">
        صُممت منصة «المسح الإشعاعي الطبي» لتجمع بين التعلم التدرجي، والمرجعية العلمية الموثقة بالمصادر، والأدوات العملية للتوثيق والحساب دون أي ادعاء اعتماد رسمي.
      </p>
    </header>

    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
      <h2 className="text-xl font-bold text-[#001F4D] dark:text-white">أولًا: كيف تقرأ الصياغات العلمية وحالات المراجعة في المنصة؟</h2>
      <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300 list-disc pr-5">
        <li>
          <strong>لا توجد عبارة «الغرفة آمنة»:</strong> جميع الحاسبات والحالات تعرض علاقة التقدير بمعيار المقارنة المختار ضمن الافتراضات الموضحة، أو «نتيجة غير حاسمة»، أو «البيانات غير كافية للتقييم».
        </li>
        <li>
          <strong>الشفافية في النقص والمصادر:</strong> حيثما تنقص معلومة مرجعية أو رقم صفحة أو مواصفة، تُكتب عبارة «غير متحقق منها — تحتاج إلى مصدر»، وتُوسم الموضوعات غير المكتملة بحالة «قيد الإعداد».
        </li>
        <li>
          <strong>حالة المراجعة:</strong> تحمل كل بطاقة جهاز ودرس وحاسبة وسم «مُراجع» أو «يحتاج مراجعة» أو «مسودة» مع تاريخ آخر مراجعة (<Ltr>2026-11-24</Ltr>).
        </li>
        <li>
          <strong>البيانات المحاكاة مقابل الحقيقية:</strong> جميع الأرقام التدريبية في الدروس والحالات والنماذج الافتراضية موسومة بوضوح بأنها «بيانات تعليمية محاكاة».
        </li>
        <li>
          <strong>حدود الإشعاع غير المؤين:</strong> أجهزة MRI والموجات فوق الصوتية غير مؤينة ولا تدخل ضمن مسح الفوتونات (راجع الدرس 19).
        </li>
      </ul>
    </section>

    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
      <h2 className="text-xl font-bold text-[#001F4D] dark:text-white">ثانيًا: مسار مقترح لأول 20 دقيقة على المنصة</h2>
      <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300 list-decimal pr-5">
        <li>
          اقرأ <button type="button" onClick={() => onNavigate('/library/L01-concepts-scope')} className="font-bold text-[#007574] dark:text-[#00D1CE] hover:underline">الدرس 1 (المفاهيم والنطاق)</button> و<button type="button" onClick={() => onNavigate('/library/L02-quantities-units-criteria')} className="font-bold text-[#007574] dark:text-[#00D1CE] hover:underline">الدرس 2 (الكميات ومعايير المقارنة)</button>.
        </li>
        <li>
          تعرّف على الفرق بين أجهزة المسح والمجسات ومقاييس الجرعة الشخصية في <button type="button" onClick={() => onNavigate('/equipment')} className="font-bold text-[#007574] dark:text-[#00D1CE] hover:underline">دليل أجهزة القياس</button> ثم جرّب <button type="button" onClick={() => onNavigate('/compare')} className="font-bold text-[#007574] dark:text-[#00D1CE] hover:underline">مقارنة جهازين أو ثلاثة</button>.
        </li>
        <li>
          افتح <button type="button" onClick={() => onNavigate('/planner')} className="font-bold text-[#007574] dark:text-[#00D1CE] hover:underline">المخطط التفاعلي للغرفة</button> وحرّك نقطة قياس MP-04 وراقب تغير المسافة الأفقية والثلاثية وتجربة الطباعة بمقياس 1:50.
        </li>
        <li>
          طبّق <button type="button" onClick={() => onNavigate('/scenarios/scen-01-general-xray')} className="font-bold text-[#007574] dark:text-[#00D1CE] hover:underline">الحالة المرجعية للأشعة العامة</button>، ثم راجع التقرير المقابل لها في <button type="button" onClick={() => onNavigate('/forms')} className="font-bold text-[#007574] dark:text-[#00D1CE] hover:underline">النماذج والتقارير F01–F07</button>.
        </li>
      </ol>
    </section>

    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#001F4D] dark:text-white">ثالثًا: اختر مسارك التعليمي الموصى به</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            اختر المسار المناسب لخبرتك للانتقال مباشرة إلى صفحة المسارات ومتابعة تقدمك.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/tracks')}
          className="text-xs font-bold text-[#007574] dark:text-[#00D1CE] hover:underline"
        >
          عرض كافة تفاصيل المسارات ←
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['beginner', 'practitioner', 'quick-review'] as TrackId[]).map((tid) => {
          const track = TRACK_DETAILS[tid];
          const isSelected = progress.selectedTrack === tid;
          return (
            <div
              key={tid}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                isSelected
                  ? 'border-[#007574] dark:border-[#00D1CE] bg-[#E6FAFA]/50 dark:bg-[#050E1D]'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#050E1D]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[#001F4D] dark:text-white">{track.title}</span>
                  {isSelected && (
                    <span className="text-[11px] font-bold text-[#007574] dark:text-[#00D1CE]">مختار</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{track.description}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectTrack(tid);
                  onNavigate('/tracks');
                }}
                className="w-full rounded-lg bg-[#001F4D] dark:bg-[#00D1CE] px-3 py-2 text-xs font-bold text-white dark:text-[#001F4D] hover:opacity-90 transition-opacity"
              >
                {isSelected ? 'متابعة هذا المسار' : 'اختيار هذا المسار والمتابعة'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  </div>
);

export const TracksPage: React.FC<NavProps> = ({
  onNavigate,
  progress,
  onSelectTrack,
  onIssueCertificate,
}) => {
  const [certModalOpen, setCertModalOpen] = useState(false);
  const activeTrack = TRACK_DETAILS[progress.selectedTrack];
  const filteredLessons = LESSONS.filter((l) => l.trackTags.includes(progress.selectedTrack));
  const eligibility = checkBeginnerTrackEligibility(progress, filteredLessons);
  const currentCertificate = getTrackCertificate(progress, progress.selectedTrack);
  const readPct =
    eligibility.totalLessons > 0
      ? Math.round((eligibility.completedCount / eligibility.totalLessons) * 100)
      : 0;
  const quizPct =
    eligibility.totalQuizzes > 0
      ? Math.round((eligibility.passedQuizzesCount / eligibility.totalQuizzes) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'المسارات التعليمية' }]} onNavigate={onNavigate} />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">المسارات التعليمية</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          اختر مسارك المفضل ليُحفظ محليًا ويُرتّب لك الدروس والأدوات الأنسب لطبيعة عملك.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-[#0D1B2E] border border-slate-200 dark:border-slate-800">
        {(['beginner', 'practitioner', 'quick-review'] as TrackId[]).map((tid) => (
          <button
            key={tid}
            type="button"
            onClick={() => onSelectTrack(tid)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
              progress.selectedTrack === tid
                ? 'bg-[#001F4D] dark:bg-[#00D1CE] text-white dark:text-[#001F4D]'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#050E1D]'
            }`}
          >
            {TRACK_DETAILS[tid].title}
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-semibold text-[#007574] dark:text-[#00D1CE]">{activeTrack.audience}</div>
            <h2 className="text-2xl font-bold text-[#001F4D] dark:text-white">{activeTrack.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{activeTrack.description}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(activeTrack.primaryRoute)}
            className="rounded-lg bg-[#00D1CE] px-4 py-2.5 text-sm font-bold text-[#001F4D] hover:opacity-90"
          >
            {activeTrack.primaryCta}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {activeTrack.quickLinks.map((ql) => (
            <button
              key={ql.path}
              type="button"
              onClick={() => onNavigate(ql.path)}
              className="text-right rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050E1D] p-3.5 text-sm font-semibold text-[#001F4D] dark:text-slate-100 hover:border-[#007574] dark:hover:border-[#00D1CE]"
            >
              {ql.label}
            </button>
          ))}
        </div>
      </section>

      {/* Active Track Independent Progress Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2.5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              1. مؤشر إكمال الدروس (القراءة)
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#001F4D] dark:text-white">
                <Ltr>{eligibility.completedCount} / {eligibility.totalLessons}</Ltr>
              </span>
              <span className="text-sm font-bold text-[#007574] dark:text-[#00D1CE]">
                <Ltr>{readPct}%</Ltr>
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-[#007574] dark:bg-[#00D1CE] transition-all"
                style={{ width: `${readPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2.5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              2. مؤشر اجتياز الاختبارات (≥ 80%)
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#001F4D] dark:text-white">
                <Ltr>{eligibility.passedQuizzesCount} / {eligibility.totalQuizzes}</Ltr>
              </span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                <Ltr>{quizPct}%</Ltr>
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all"
                style={{ width: `${quizPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2.5">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              3. متوسط أعلى الدرجات المختبرة
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#001F4D] dark:text-white">
                {eligibility.averageBestPercent !== null ? (
                  <Ltr>{eligibility.averageBestPercent}%</Ltr>
                ) : (
                  'لم يُختبر بعد'
                )}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">الحد الأدنى 80%</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              يُحفظ أعلى تقييم لكل درس مع السماح بإعادة المحاولة في أي وقت.
            </p>
          </div>
        </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-[#001F4D] dark:text-white">
          خريطة {activeTrack.title} (<Ltr>{filteredLessons.length}</Ltr> درسًا)
        </h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E]">
          {filteredLessons.map((lesson) => {
            const done = progress.completedLessons.includes(lesson.id);
            const quizStatus = getLessonQuizStatus(progress, lesson.id);
            const rec = progress.quizRecords?.[lesson.id];
            const bestPct =
              rec && rec.totalQuestions > 0 ? Math.round((rec.highestScore / rec.totalQuestions) * 100) : null;
            const unit = CURRICULUM_UNITS.find((u) => u.id === lesson.unitId);

            return (
              <div key={lesson.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#007574] dark:text-[#00D1CE]">الدرس {lesson.number}</span>
                    {unit && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>الوحدة {unit.letter}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>مكتمل</span>
                      </span>
                    ) : (
                      <span>قيد المتابعة</span>
                    )}

                    {lesson.quiz.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        {quizStatus === 'not_attempted' && (
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            لم يُختبر بعد
                          </span>
                        )}
                        {quizStatus === 'passed' && bestPct !== null && (
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                            مجتاز (<Ltr>{bestPct}%</Ltr>)
                          </span>
                        )}
                        {quizStatus === 'failed' && bestPct !== null && (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:text-amber-300">
                            لم يجتز (<Ltr>{bestPct}%</Ltr> — المطلوب <Ltr>80%</Ltr>)
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/library/${lesson.id}`)}
                    className="text-right font-bold text-base text-[#001F4D] dark:text-white hover:text-[#007574] dark:hover:text-[#00D1CE]"
                  >
                    {lesson.title}
                  </button>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{lesson.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(`/library/${lesson.id}`)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-bold text-[#001F4D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  فتح الدرس
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Track Certificate Unlock Card */}
      <section
          className={`rounded-xl border p-6 space-y-4 ${
            eligibility.eligible
              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E]'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                {eligibility.eligible ? (
                  <Award className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                )}
                <h3 className="text-lg font-bold text-[#001F4D] dark:text-white">
                  شهادة إتمام {activeTrack.title} الصادرة عن المنصة
                </h3>
              </div>

              {eligibility.eligible ? (
                <p className="text-sm text-emerald-900 dark:text-emerald-200">
                  تهانينا! استوفيت جميع شروط {activeTrack.title}: إكمال جميع الدروس (<Ltr>{eligibility.totalLessons}</Ltr>) واجتياز جميع الاختبارات (<Ltr>{eligibility.totalQuizzes}</Ltr>) بنسبة <Ltr>80%</Ltr> فأعلى.
                </p>
              ) : (
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <p>لفتح زر إصدار الشهادة، يجب استيفاء الشرطين معًا:</p>
                  <ul className="list-disc pr-5 text-xs space-y-1">
                    <li>
                      إكمال جميع الدروس ({eligibility.missingLessonIds.length === 0 ? 'مكتمل بالكامل ✓' : `متبقي ${eligibility.missingLessonIds.length} درس بحاجة للإكمال`})
                    </li>
                    <li>
                      اجتياز جميع اختبارات المسار بنسبة ≥ 80% ({eligibility.failedOrMissingQuizLessonIds.length === 0 ? 'مجتاز بالكامل ✓' : `متبقي ${eligibility.failedOrMissingQuizLessonIds.length} اختبار بحاجة لتحقيق 80%`})
                    </li>
                  </ul>
                </div>
              )}

              {currentCertificate && (
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 pt-1">
                  رقم الشهادة المثبت: <Ltr>{currentCertificate.certificateNumber}</Ltr>
                </p>
              )}
            </div>

            {eligibility.eligible && (
              <button
                type="button"
                onClick={() => setCertModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#001F4D] dark:bg-[#00D1CE] px-5 py-2.5 text-sm font-bold text-white dark:text-[#001F4D] hover:opacity-95"
              >
                <Award className="w-4 h-4" aria-hidden="true" />
                <span>عرض وإصدار شهادة الإتمام</span>
              </button>
            )}
          </div>
        </section>

      {onIssueCertificate && (
        <CompletionCertificateModal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          certificate={currentCertificate}
          averageBestPercent={eligibility.averageBestPercent}
          lessonsCount={eligibility.totalLessons}
          trackTitle={activeTrack.title}
          trackDescription={`إصدار وطباعة شهادة إتمام ${activeTrack.title}`}
          onIssueCertificate={(recipientName) => onIssueCertificate(recipientName, progress.selectedTrack)}
        />
      )}
    </div>
  );
};
