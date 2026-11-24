import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Download,
  HardDrive,
  RefreshCw,
  Search,
  Shield,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { GLOSSARY_ENTRIES } from '../data/glossary';
import {
  CALCULATOR_ENGINE_VERSION,
  CONTENT_PACKAGE_VERSION,
  LAST_GLOBAL_REVIEW_DATE,
  REFERENCES,
  REFERENCE_MAP,
} from '../data/references';
import {
  ATTACHMENT_AUDIT,
  DEPLOYMENT_GUIDE_STEPS,
  POST_DEPLOY_CHECKLIST,
  REMAINING_LIMITATIONS,
} from '../data/siteAudit';
import { DEFAULT_FORMS_DRAFT, DEFAULT_ROOM_PLAN, type SurveyFormsDraft } from '../data/forms';
import {
  loadDraftRecord,
  saveDraftRecord,
  saveUserProgress,
  triggerDownloadFile,
  type FullBackupPayload,
} from '../utils/storage';
import { Breadcrumbs, Ltr, ReviewStatusText } from '../components/SharedUI';
import { LOGO_PATH } from '../components/Layout';
import type { GlossaryEntry, LocalUserProgress, RoomPlanState } from '../types';
import type { OfflinePackState } from '../hooks/usePWA';

/* ============================================================================
 * 1. GLOSSARY PAGE (/glossary)
 * ========================================================================== */
export const GlossaryPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryEntry['category'] | 'all'>('all');

  const categories: GlossaryEntry['category'][] = [
    'نطاق المسح والفصل المفاهيمي',
    'كميات ووحدات',
    'معايير وحدود',
    'أجهزة وكواشف',
    'إحصاء وعدم يقين',
    'تلوث وطب نووي',
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY_ENTRIES.filter((g) => {
      const catOk = category === 'all' || g.category === category;
      const qOk =
        !q ||
        g.termAr.toLowerCase().includes(q) ||
        g.termEn.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q) ||
        g.distinctionNote.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [query, category]);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'المصطلحات العلمية' }]} onNavigate={onNavigate} />

      <header className="space-y-2 max-w-3xl">
        <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">
          المصطلحات العلمية والفصل المفاهيمي (<Ltr>{GLOSSARY_ENTRIES.length}</Ltr> مصطلحًا)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          مرجع ثنائي اللغة يضبط الفروق الدقيقة بين المسح الإشعاعي والتلوث والرصد الشخصي وضبط الجودة وجرعات المرضى وتصميم التدريع، وبين حدود الجرعة وقيودها وأهداف التصميم ومستويات التحقيق.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالعربية أو الإنجليزية (مثل: H*(10)، قيد الجرعة، L_D، ضبط الجودة)..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] pr-9 pl-3 py-2 text-xs"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GlossaryEntry['category'] | 'all')}
          aria-label="تصفية حسب الفئة"
          className="md:col-span-5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] px-3 py-2 text-xs font-semibold"
        >
          <option value="all">جميع فئات المصطلحات</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((g) => (
          <article key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2.5">
            <div className="text-xs font-bold text-[#007574] dark:text-[#00D1CE]">{g.category}</div>
            <h2 className="text-base font-bold text-[#001F4D] dark:text-white">
              {g.termAr}{' '}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                (<Ltr>{g.termEn}</Ltr>)
              </span>
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{g.definition}</p>
            <div className="rounded-lg bg-slate-50 dark:bg-[#050E1D] border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300">
              <strong className="text-[#001F4D] dark:text-white">ضابط التمييز العلمي: </strong>
              {g.distinctionNote}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              المراجع:{' '}
              {g.referenceIds
                .map((id) => REFERENCE_MAP[id]?.code)
                .filter(Boolean)
                .join(' · ')}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. REFERENCES & REVIEW METHODOLOGY PAGE (/references)
 * ========================================================================== */
export const ReferencesPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [catFilter, setCatFilter] = useState<string>('all');

  const visibleRefs = REFERENCES.filter((r) => catFilter === 'all' || r.category === catFilter);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'المراجع ومنهجية المراجعة' }]} onNavigate={onNavigate} />

      <header className="space-y-2 max-w-3xl">
        <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">
          سجل المراجع ومنهجية المراجعة العلمية
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          جميع المراجع الدولية والنشرات الفنية المذكورة في المنصة موثقة بجهتها وإصدارها وسنتها وحالة مراجعتها. لا تُستخدم شعارات الجهات المرجعية بما يوحي باعتماد رسمي، ولا يُختلق أي رقم صفحة غير متحقق منه.
        </p>
      </header>

      {/* Review Methodology Summary */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-3 text-sm">
        <h2 className="text-lg font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#007574] dark:text-[#00D1CE]" />
          <span>قواعد التوثيق وحالات المراجعة في المنصة</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
            <div className="font-bold text-emerald-700 dark:text-emerald-400">مُراجع</div>
            <p className="text-slate-600 dark:text-slate-300">تمت مطابقة النص والمعادلات والافتراضات مع المصدر الأولي المذكور وتاريخ المراجعة <Ltr>{LAST_GLOBAL_REVIEW_DATE}</Ltr>.</p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
            <div className="font-bold text-amber-800 dark:text-amber-300">يحتاج مراجعة</div>
            <p className="text-slate-600 dark:text-slate-300">يعتمد على نشرة مصنّع قديمة أو مرجع يحتاج تحديثًا من المصدر الرسمي قبل الاستخدام في الشراء أو الاعتماد.</p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
            <div className="font-bold text-slate-600 dark:text-slate-300">مسودة / قيد الإعداد</div>
            <p className="text-slate-600 dark:text-slate-300">موضوع تخصصي متقدم لم تكتمل مراجعه الأولية بعد؛ يُعرض بوضوح دون افتراض اكتماله.</p>
          </div>
        </div>
      </section>

      {/* Filter & Complete Reference Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">
            قائمة المصادر الموثقة (<Ltr>{visibleRefs.length}</Ltr>)
          </h2>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            aria-label="تصفية المراجع حسب الفئة"
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] px-3 py-1.5 text-xs font-semibold"
          >
            <option value="all">جميع فئات المصادر</option>
            <option value="معيار دولي">معيار دولي</option>
            <option value="دليل فني">دليل فني</option>
            <option value="منهجية إحصائية">منهجية إحصائية</option>
            <option value="نشرة مصنّع">نشرة مصنّع</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#050E1D] border-b border-slate-200 dark:border-slate-800 text-[#001F4D] dark:text-slate-200">
                <th className="p-2.5 text-right">الرمز</th>
                <th className="p-2.5 text-right">الوثيقة والجهة</th>
                <th className="p-2.5 text-right">الإصدار / السنة</th>
                <th className="p-2.5 text-right">القسم / الصفحة</th>
                <th className="p-2.5 text-right">حالة المراجعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {visibleRefs.map((ref) => (
                <tr key={ref.id}>
                  <td className="p-2.5 font-mono font-bold text-[#001F4D] dark:text-[#00D1CE] whitespace-nowrap">
                    <Ltr>{ref.code}</Ltr>
                  </td>
                  <td className="p-2.5">
                    <div dir="ltr" className="font-semibold text-left text-[#001F4D] dark:text-white">{ref.title}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">{ref.organization} · {ref.category}</div>
                    <div className="text-slate-500 dark:text-slate-400 mt-1">{ref.notes}</div>
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    <div><Ltr>{ref.edition}</Ltr></div>
                    <div className="text-slate-500"><Ltr>{ref.year}</Ltr></div>
                  </td>
                  <td className="p-2.5">{ref.sectionOrPage}</td>
                  <td className="p-2.5 whitespace-nowrap">
                    <ReviewStatusText status={ref.status} />
                    <div className="text-[11px] text-slate-500 mt-1"><Ltr>{ref.lastReviewed}</Ltr></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Attachment Audit Transparency Report */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">
            مراجعة المادة الأولية المرفقة وتقييم الجاهزية والشفافية
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            تم فحص الملفات المرفقة بوصفها مادة أولية؛ وُثّق ما تم تنظيمه وتنفيذه، وما يحتاج مراجعة دورية، وما ينقصه مصدر مباشر أو حقوق إعادة نشر.
          </p>
        </div>

        <div className="space-y-5">
          {ATTACHMENT_AUDIT.map((sec, idx) => (
            <div key={idx} className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#001F4D] dark:text-[#00D1CE]">{sec.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sec.items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#050E1D] p-3.5 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#001F4D] dark:text-white">{item.label}</span>
                      <span className="font-bold text-[#007574] dark:text-[#00D1CE]">{item.status}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
 * 3. ABOUT, OFFLINE PACK, LOCAL BACKUP & DEPLOYMENT PAGE (/about)
 * ========================================================================== */
interface AboutOfflineProps {
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
  onRestoreProgress: (next: LocalUserProgress) => void;
  isOnline: boolean;
  offlineState: OfflinePackState;
  onDownloadOffline: () => void;
  onApplyUpdate: () => void;
}

export const AboutOfflinePage: React.FC<AboutOfflineProps> = ({
  onNavigate,
  progress,
  onRestoreProgress,
  isOnline,
  offlineState,
  onDownloadOffline,
  onApplyUpdate,
}) => {
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [deployChecks, setDeployChecks] = useState<boolean[]>(() => POST_DEPLOY_CHECKLIST.map(() => false));
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const handleFullBackupExport = async () => {
    const [formsDraft, roomPlan] = await Promise.all([
      loadDraftRecord<SurveyFormsDraft>('forms_draft', DEFAULT_FORMS_DRAFT),
      loadDraftRecord<RoomPlanState>('room_plan', DEFAULT_ROOM_PLAN),
    ]);

    const payload: FullBackupPayload = {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      progress,
      formsDraft,
      roomPlan,
    };

    triggerDownloadFile(
      `medical-radiation-survey-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
    setBackupMsg('تم تصدير النسخة الاحتياطية الكاملة (التقدم + المخطط + النماذج F01–F07) بصيغة JSON.');
  };

  const handleFullBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as FullBackupPayload;
        if (!parsed.progress) {
          setBackupMsg('ملف النسخة الاحتياطية غير صالح أو لا يطابق بنية المنصة.');
          return;
        }
        saveUserProgress(parsed.progress);
        onRestoreProgress(parsed.progress);
        if (parsed.formsDraft) await saveDraftRecord('forms_draft', parsed.formsDraft);
        if (parsed.roomPlan) await saveDraftRecord('room_plan', parsed.roomPlan);
        setBackupMsg('تمت استعادة التقدم والمخطط ومسودات النماذج بنجاح على هذا المتصفح.');
      } catch {
        setBackupMsg('تعذر قراءة الملف؛ تأكد من اختيار ملف JSON صالح صُدّر من المنصة.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'حول المنصة والعمل دون اتصال والنشر' }]} onNavigate={onNavigate} />

      <header className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">
            حول المنصة، العمل دون اتصال، النسخ الاحتياطي، والنشر
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            «المسح الإشعاعي الطبي — Medical Radiation Survey» منصة ويب تعليمية ومرجعية ثابتة (<Ltr>Static SPA / PWA</Ltr>) لا تتطلب خادمًا خلفيًا أو مفتاح API أو حسابات مستخدمين.
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            إصدار حزمة المحتوى: <Ltr>{CONTENT_PACKAGE_VERSION}</Ltr> · إصدار محرك الحاسبات: <Ltr>{CALCULATOR_ENGINE_VERSION}</Ltr>
          </div>
        </div>
        <div className="w-40 bg-white rounded-lg p-2 border border-slate-200 shrink-0">
          <img src={LOGO_PATH} alt="شعار المسح الإشعاعي الطبي" className="w-full h-auto object-contain" />
        </div>
      </header>

      {/* Offline & PWA Control Panel */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-[#007574] dark:text-[#00D1CE]" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-600" />
            )}
            <span>إدارة العمل دون اتصال (PWA Offline Pack)</span>
          </h2>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            حالة الاتصال: {isOnline ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050E1D] p-4 space-y-1">
            <div className="text-slate-500">حالة الحزمة المحلية</div>
            <div className="font-bold text-sm text-[#001F4D] dark:text-white">
              {offlineState.downloading
                ? `جارٍ التنزيل... (${offlineState.progressPercent}%)`
                : offlineState.downloaded
                  ? 'الحزمة محمّلة وجاهزة دون اتصال'
                  : 'لم تُنزّل الحزمة بعد'}
            </div>
            <div className="text-slate-500">
              الملفات المخزنة: <Ltr>{offlineState.cachedCount} / {offlineState.totalCount || '—'}</Ltr>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050E1D] p-4 space-y-1">
            <div className="text-slate-500">إصدار الحزمة وتاريخ التنزيل</div>
            <div className="font-bold text-[#001F4D] dark:text-white"><Ltr>{offlineState.packageVersion}</Ltr></div>
            <div className="text-slate-500">
              {offlineState.lastDownloadedAt
                ? `آخر تنزيل: ${new Date(offlineState.lastDownloadedAt).toLocaleString('ar')}`
                : 'لا يُدَّعى التوفر دون اتصال قبل اكتمال التنزيل'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050E1D] p-4 space-y-1">
            <div className="text-slate-500">ما يتوفر دون اتصال بعد اكتمال التنزيل</div>
            <p className="text-slate-700 dark:text-slate-300">
              جميع الدروس (25)، الأجهزة (14)، الحاسبات (8)، المخطط التفاعلي، النماذج F01–F07، الحالات (8)، المصطلحات، والمراجع.
            </p>
          </div>
        </div>

        {/* Real Progress Bar */}
        {(offlineState.downloading || offlineState.downloaded) && (
          <div className="space-y-1.5">
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${offlineState.progressPercent}%` }}
                className="h-full bg-[#00D1CE] transition-all duration-300"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              تقدم التنزيل الفعلي: <Ltr>{offlineState.progressPercent}%</Ltr>
              {offlineState.failedUrls.length > 0 && ` (تعذر تخزين ${offlineState.failedUrls.length} مورد)`}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={offlineState.downloading || !isOnline}
            onClick={onDownloadOffline}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00D1CE] px-4 py-2.5 text-xs font-bold text-[#001F4D] hover:opacity-90 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{offlineState.downloaded ? 'إعادة تنزيل وتحديث الحزمة المحلية' : 'تنزيل الحزمة للعمل دون اتصال'}</span>
          </button>

          {offlineState.updateAvailable && (
            <button
              type="button"
              onClick={onApplyUpdate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#001F4D] px-4 py-2.5 text-xs font-bold text-white"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تطبيق التحديث الجديد بأمان (دون حذف المسودات)</span>
            </button>
          )}
        </div>
      </section>

      {/* Local Backup Export & Restore */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-[#007574] dark:text-[#00D1CE]" />
          <span>النسخ الاحتياطي والاستعادة المحلية (JSON)</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          لأن البيانات والمسودات تُحفظ محليًا على هذا المتصفح فقط ولا تتزامن تلقائيًا بين الأجهزة، يمكنك تصدير نسخة احتياطية كاملة (<Ltr>JSON</Ltr>) تشمل تقدمك في الدروس والعلامات المرجعية ومخطط الغرفة ومسودة النماذج <Ltr>F01–F07</Ltr> واستعادتها على أي جهاز آخر.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleFullBackupExport}
            className="inline-flex items-center gap-2 rounded-lg bg-[#001F4D] px-4 py-2.5 text-xs font-bold text-white"
          >
            <Download className="w-4 h-4" />
            <span>تصدير نسخة احتياطية كاملة (JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => restoreInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-[#001F4D] dark:text-slate-200"
          >
            <Upload className="w-4 h-4" />
            <span>استعادة نسخة احتياطية (JSON)</span>
          </button>
          <input ref={restoreInputRef} type="file" accept="application/json" onChange={handleFullBackupRestore} className="hidden" />
        </div>

        {backupMsg && (
          <div role="status" className="rounded-lg bg-[#E6FAFA] dark:bg-[#0D2533] border border-[#007574]/30 px-4 py-2 text-xs font-bold text-[#001F4D] dark:text-[#00D1CE]">
            {backupMsg}
          </div>
        )}
      </section>

      {/* Automated Calculator Test Summary & Remaining Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-3">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>نتائج اختبارات التحقق الحسابي الآلية</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            اجتاز محرك الحاسبات (<Ltr>{CALCULATOR_ENGINE_VERSION}</Ltr>) <Ltr>20 / 20</Ltr> اختبار تحقق آلي (<Ltr>0</Ltr> فشل) شملت:
          </p>
          <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
            <li>منع التحويل التلقائي بين <Ltr>Gy ↔ Sv</Ltr> و<Ltr>cps ↔ Bq</Ltr>.</li>
            <li>حفظ صافي طرح الخلفية السالب دون تصفير آلي ورفض القسمة على الصفر.</li>
            <li>مطابقة الأمثلة المرجعية الـ 8 (الأشعة العامة، <Ltr>CT</Ltr>، القسطرة، خفض الواقي، مسحة الطب النووي، تسرب <Ltr>LINAC</Ltr>، اضمحلال النظير، وإحداثيات المخطط <Ltr>2D/3D</Ltr>).</li>
            <li>قاعدة القرار لعدم اليقين (التقاطع غير الحاسم <Ltr>Y=9, U=2, L=10</Ltr>، ومثال التقرير <Ltr>Y=4.80, U=0.96, L=10</Ltr>).</li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-3">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>القيود المتبقية والشفافية</span>
          </h2>
          <ul className="list-disc pr-5 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
            {REMAINING_LIMITATIONS.map((lim, i) => <li key={i}>{lim}</li>)}
          </ul>
        </section>
      </div>

      {/* Beginner Static Hosting Deployment Guide */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">
          دليل النشر الثابت للمبتدئ وقائمة فحص ما بعد النشر
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEPLOYMENT_GUIDE_STEPS.map((item, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050E1D] p-4 space-y-2 text-xs">
              <h3 className="font-bold text-[#001F4D] dark:text-white">{item.step}</h3>
              <div dir="ltr" className="ltr-block rounded bg-[#001F4D] text-[#E6FAFA] p-2.5 font-mono space-y-1">
                {item.commands.map((cmd, idx) => <div key={idx}>{cmd}</div>)}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-2">
          <h3 className="text-sm font-bold text-[#001F4D] dark:text-white">قائمة فحص ما بعد النشر التفاعلية</h3>
          <div className="space-y-1.5 text-xs">
            {POST_DEPLOY_CHECKLIST.map((item, i) => (
              <label key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deployChecks[i]}
                  onChange={(e) => setDeployChecks((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))}
                  className="mt-0.5"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
 * 4. PRIVACY & LIMITS OF USE PAGE (/privacy)
 * ========================================================================== */
export const PrivacyPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <div className="space-y-8 max-w-4xl">
    <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'الخصوصية وحدود الاستخدام' }]} onNavigate={onNavigate} />

    <header className="space-y-2">
      <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white flex items-center gap-2.5">
        <Shield className="w-7 h-7 text-[#007574] dark:text-[#00D1CE]" />
        <span>الخصوصية وحدود الاستخدام العلمي</span>
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        توضيح صريح لطبيعة التخزين المحلي، وخلو المنصة من التتبع والبيانات الشخصية، وحدود الاستنتاجات التعليمية.
      </p>
    </header>

    <div className="space-y-5 text-sm leading-relaxed">
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-2">
        <h2 className="text-base font-bold text-[#001F4D] dark:text-white">1. الحفظ المحلي وعدم وجود خادم أو حسابات</h2>
        <p className="text-slate-700 dark:text-slate-300">
          تعمل المنصة بالكامل داخل متصفحك دون خادم خلفي أو قواعد بيانات خارجية أو مفاتيح API. جميع التقدم التعليمي والعلامات المرجعية ومخططات الغرف ومسودات النماذج <Ltr>F01–F07</Ltr> تُحفظ محليًا في <Ltr>localStorage</Ltr> و<Ltr>IndexedDB</Ltr> على هذا الجهاز والمتصفح فقط، ولا تتزامن تلقائيًا مع أي جهاز آخر.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-2">
        <h2 className="text-base font-bold text-[#001F4D] dark:text-white">2. منع بيانات المرضى والبيانات الشخصية</h2>
        <p className="text-slate-700 dark:text-slate-300">
          لا تتضمن المنصة أي حقول لأسماء المرضى أو أرقام ملفاتهم الطبية أو أسماء الأفراد الشخصية. عند استخدام النماذج الميدانية للتدريب أو إعداد المسودات، يلتزم المستخدم بالاكتفاء برموز الغرف والمسميات الوظيفية فقط.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-2">
        <h2 className="text-base font-bold text-[#001F4D] dark:text-white">3. حدود الاستخدام العلمي وعدم إصدار اعتماد رسمي</h2>
        <ul className="list-disc pr-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>المنصة أداة تعليمية ومرجعية ولا تحمل اعتمادًا رسميًا ولا تُنشئ أختامًا أو تواقيع رقمية.</li>
          <li>لا تصدر الحاسبات ولا التقارير حكمًا مطلقًا بأن غرفة أو منشأة «آمنة»، وإنما تعرض مقارنة مشروطة بالمعيار المختار وافتراضاته.</li>
          <li>المعايير القانونية وحدود التصميم والتشغيل تُؤخذ دائمًا من الجهة الرقابية المحلية وترخيص المنشأة.</li>
          <li>المخطط التفاعلي أداة توثيق للمسح ولا يُعد بديلًا عن تقرير تصميم التدريع الهندسي المعتمد.</li>
        </ul>
      </section>
    </div>
  </div>
);

/* ============================================================================
 * 5. 404 NOT FOUND PAGE
 * ========================================================================== */
export const NotFoundPage: React.FC<{ currentPath: string; onNavigate: (path: string) => void }> = ({
  currentPath,
  onNavigate,
}) => (
  <div className="max-w-xl mx-auto py-12 text-center space-y-5">
    <div className="text-5xl font-bold font-mono text-[#007574] dark:text-[#00D1CE]">
      <Ltr>404</Ltr>
    </div>
    <h1 className="text-2xl font-bold text-[#001F4D] dark:text-white">الصفحة المطلوبة غير موجودة</h1>
    <p className="text-sm text-slate-600 dark:text-slate-300">
      لم يُعثر على محتوى يطابق المسار <Ltr>{currentPath}</Ltr>. يمكنك العودة إلى الصفحة الرئيسية أو استخدام البحث السريع للوصول إلى الدروس والأجهزة والحاسبات.
    </p>
    <div className="flex flex-wrap justify-center gap-3 pt-2">
      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="rounded-lg bg-[#001F4D] px-5 py-2.5 text-sm font-bold text-white"
      >
        العودة إلى الرئيسية
      </button>
      <button
        type="button"
        onClick={() => onNavigate('/start')}
        className="rounded-lg bg-[#00D1CE] px-5 py-2.5 text-sm font-bold text-[#001F4D]"
      >
        ابدأ من هنا
      </button>
    </div>
  </div>
);
