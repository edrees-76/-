import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  Download,
  ExternalLink,
  Menu,
  Moon,
  Palette,
  RefreshCw,
  Search,
  Sun,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { LESSONS } from '../data/lessons';
import { EQUIPMENT_LIST } from '../data/equipment';
import { GLOSSARY_ENTRIES } from '../data/glossary';
import { TRAINING_SCENARIOS } from '../data/scenarios';
import { CALCULATOR_DOCS } from '../logic/calculators';
import type { DesignId, LocalUserProgress } from '../types';
import type { OfflinePackState } from '../hooks/usePWA';

export const LOGO_PATH = '/assets/aistudio/_________________________________12eb8902.png';
export const DESIGNER_LOGO_PATH = '/assets/aistudio/Gemini_Generated_Image_c0344966.jpeg';
export const DESIGNER_CV_URL = 'https://edrees-elhery-cv.netlify.app/';

interface LayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
  onToggleTheme: () => void;
  onSelectDesign: (design: DesignId) => void;
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstallApp: () => void;
  offlineState: OfflinePackState;
  onApplyUpdate: () => void;
  children: React.ReactNode;
}

const PRIMARY_NAV = [
  { label: 'ابدأ من هنا', path: '/start' },
  { label: 'المكتبة', path: '/library' },
  { label: 'الأجهزة', path: '/equipment' },
  { label: 'المخطط', path: '/planner' },
  { label: 'الحاسبات', path: '/calculators' },
  { label: 'النماذج', path: '/forms' },
  { label: 'الحالات', path: '/scenarios' },
];

const ALL_PAGES_LINKS = [
  { label: 'الرئيسية', path: '/' },
  { label: 'ابدأ من هنا', path: '/start' },
  { label: 'المسارات التعليمية', path: '/tracks' },
  { label: 'المكتبة التعليمية (25 درسًا)', path: '/library' },
  { label: 'دليل أجهزة القياس (14 جهازًا)', path: '/equipment' },
  { label: 'مقارنة الأجهزة', path: '/compare' },
  { label: 'المخطط التفاعلي للغرفة', path: '/planner' },
  { label: 'الحاسبات الموثقة (8 حاسبات)', path: '/calculators' },
  { label: 'النماذج والتقارير (F01–F07)', path: '/forms' },
  { label: 'الحالات التدريبية (8 حالات)', path: '/scenarios' },
  { label: 'المصطلحات العلمية', path: '/glossary' },
  { label: 'المراجع ومنهجية المراجعة', path: '/references' },
  { label: 'حول المنصة والنشر والعمل دون اتصال', path: '/about' },
  { label: 'الخصوصية وحدود الاستخدام', path: '/privacy' },
];

const DESIGN_THEMES: {
  id: DesignId;
  name: string;
  subtitle: string;
  swatches: [string, string, string];
}[] = [
  {
    id: 'clinical',
    name: 'نبض سريري',
    subtitle: 'أسلوب طبي سويسري نظيف',
    swatches: ['#F8FAFC', '#0F172A', '#0D9488'],
  },
  {
    id: 'dosimetry',
    name: 'غرفة التحكم',
    subtitle: 'مختبر أجهزة القياس الداكن',
    swatches: ['#090D16', '#111827', '#06B6D4'],
  },
  {
    id: 'editorial',
    name: 'المرجع الأكاديمي',
    subtitle: 'ورق دافئ مريح للقراءة',
    swatches: ['#FAF8F5', '#134E4A', '#EA580C'],
  },
  {
    id: 'cobalt',
    name: 'درع الإشعاع',
    subtitle: 'SaaS طبي ببطاقات زجاجية',
    swatches: ['#F1F5F9', '#1E1B4B', '#2563EB'],
  },
];

export const Layout: React.FC<LayoutProps> = ({
  currentPath,
  onNavigate,
  progress,
  onToggleTheme,
  onSelectDesign,
  isOnline,
  isInstallable,
  isInstalled,
  isIOS,
  onInstallApp,
  offlineState,
  onApplyUpdate,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [designMenuOpen, setDesignMenuOpen] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const matches: { type: string; title: string; subtitle: string; path: string }[] = [];

    for (const l of LESSONS) {
      if (
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.sections.some((s) => s.body.toLowerCase().includes(q))
      ) {
        matches.push({
          type: 'درس',
          title: `${l.number}. ${l.title}`,
          subtitle: l.summary,
          path: `/library/${l.id}`,
        });
      }
    }

    for (const eq of EQUIPMENT_LIST) {
      if (
        eq.model.toLowerCase().includes(q) ||
        eq.manufacturer.toLowerCase().includes(q) ||
        eq.detectorType.toLowerCase().includes(q) ||
        eq.suitableUses.some((u) => u.toLowerCase().includes(q))
      ) {
        matches.push({
          type: 'جهاز قياس',
          title: eq.model,
          subtitle: `${eq.classification} · ${eq.detectorType}`,
          path: `/equipment/${eq.id}`,
        });
      }
    }

    for (const c of Object.values(CALCULATOR_DOCS)) {
      if (
        c.title.toLowerCase().includes(q) ||
        c.formulaLatexLike.toLowerCase().includes(q)
      ) {
        matches.push({
          type: 'حاسبة',
          title: c.title,
          subtitle: c.formulaLatexLike,
          path: `/calculators/${c.id}`,
        });
      }
    }

    for (const sc of TRAINING_SCENARIOS) {
      if (sc.title.toLowerCase().includes(q) || sc.modality.toLowerCase().includes(q)) {
        matches.push({
          type: 'حالة تدريبية',
          title: sc.title,
          subtitle: sc.modality,
          path: `/scenarios/${sc.id}`,
        });
      }
    }

    for (const g of GLOSSARY_ENTRIES) {
      if (
        g.termAr.toLowerCase().includes(q) ||
        g.termEn.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q)
      ) {
        matches.push({
          type: 'مصطلح',
          title: `${g.termAr} (${g.termEn})`,
          subtitle: g.definition,
          path: '/glossary',
        });
      }
    }

    return matches.slice(0, 20);
  }, [searchQuery]);

  const handleGo = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setBookmarksOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#334155] dark:bg-[#050E1D] dark:text-slate-200">
      {/* Skip to content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:rounded focus:bg-[#001F4D] focus:px-4 focus:py-2 focus:text-white"
      >
        الانتقال إلى المحتوى الرئيسي
      </a>

      {/* Update Available Banner (never replaces an active lesson automatically) */}
      {offlineState.updateAvailable && (
        <div
          role="status"
          className="no-print bg-[#001F4D] text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-[#00D1CE]/40"
        >
          <span>
            يتوفر تحديث جديد للمنصة. لن يُستبدل المحتوى المفتوح تلقائيًا ولن تُحذف مسوداتك المحلية.
          </span>
          <button
            type="button"
            onClick={onApplyUpdate}
            className="inline-flex items-center gap-1.5 rounded bg-[#00D1CE] px-3 py-1 font-bold text-[#001F4D] hover:opacity-90"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>تحديث الآن</span>
          </button>
        </div>
      )}

      {/* Offline Banner when disconnected */}
      {!isOnline && (
        <div
          role="status"
          className="no-print bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-100 px-4 py-1.5 text-xs flex items-center justify-center gap-2 border-b border-amber-300 dark:border-amber-800"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            أنت تعمل حاليًا دون اتصال بالإنترنت.{' '}
            {offlineState.downloaded
              ? `الحزمة المحلية محمّلة (${offlineState.packageVersion}) والمسودات تُحفظ محليًا.`
              : 'لم تكتمل حزمة التنزيل دون اتصال قبل الانقطاع؛ قد لا تتوفر بعض الموارد غير المخزنة.'}
          </span>
        </div>
      )}

      {/* Compact Sticky Top Header (Single Row, Clean Three-Zone Contract) */}
      <header className="no-print sticky top-0 z-40 h-16 bg-white/95 dark:bg-[#050E1D]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto h-full px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Right-side Menu Button + Brand with original unmodified logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="قائمة جميع الصفحات"
              aria-expanded={mobileMenuOpen}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#001F4D] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D1B2E] shrink-0"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={() => handleGo('/')}
              className="flex items-center gap-2 sm:gap-3 min-w-0 text-right focus-visible:outline-2"
              aria-label="المسح الإشعاعي الطبي — الصفحة الرئيسية"
            >
              <span className="h-9 w-12 sm:h-10 sm:w-16 rounded bg-white p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <img
                  src={LOGO_PATH}
                  alt="شعار منصة المسح الإشعاعي الطبي Medical Radiation Survey"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="font-bold text-sm sm:text-lg text-[#001F4D] dark:text-white truncate">
                المسح الإشعاعي الطبي
              </span>
            </button>
          </div>

          {/* Zone 2: Clean single-line typography nav links */}
          <nav aria-label="التنقل الرئيسي" className="hidden lg:flex items-center gap-5 text-sm font-semibold">
            {PRIMARY_NAV.map((item) => {
              const active =
                currentPath === item.path ||
                (item.path !== '/' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleGo(item.path)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? 'border-[#00D1CE] text-[#001F4D] dark:text-[#00D1CE]'
                      : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-[#001F4D] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Essential Functional Controls (Search, Bookmarks, Design, Theme, Mobile Menu) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="بحث في المنصة"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-[#001F4D] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D1B2E] whitespace-nowrap"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">بحث</span>
            </button>

            <button
              type="button"
              onClick={() => setBookmarksOpen(true)}
              aria-label={`العلامات المرجعية (${progress.bookmarks.length})`}
              className="relative p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#001F4D] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D1B2E]"
            >
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              {progress.bookmarks.length > 0 && (
                <span className="sr-only">{progress.bookmarks.length} عناصر محفوظة</span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setDesignMenuOpen((v) => !v)}
                aria-label="اختيار تصميم وهوية الموقع"
                aria-expanded={designMenuOpen}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 sm:px-2.5 sm:py-2 text-xs font-semibold text-[#001F4D] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D1B2E] whitespace-nowrap"
              >
                <Palette className="w-4 h-4" aria-hidden="true" />
                <span className="hidden md:inline">التصميم</span>
              </button>

              {designMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDesignMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    aria-label="اختيار هوية وتصميم المنصة"
                    className="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-x-auto sm:left-0 sm:top-auto sm:mt-2 sm:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] p-2 shadow-xl z-50 space-y-1"
                  >
                    <p className="px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      اختر هوية وتصميم المنصة
                    </p>
                    {DESIGN_THEMES.map((item) => {
                      const active = (progress.design ?? 'clinical') === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => {
                            onSelectDesign(item.id);
                            setDesignMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-right transition-colors ${
                            active
                              ? 'bg-slate-100 dark:bg-slate-800/80 text-[#001F4D] dark:text-white'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <span>{item.name}</span>
                              {active && <Check className="w-3.5 h-3.5 text-[#007574] dark:text-sky-400 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
                            {item.swatches.map((hex) => (
                              <span
                                key={hex}
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={progress.theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[#001F4D] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D1B2E]"
            >
              {progress.theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={onInstallApp}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#00D1CE] px-3 py-2 text-xs font-bold text-[#001F4D] hover:opacity-90 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>تثبيت التطبيق</span>
              </button>
            )}

            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setIosGuideOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-[#001F4D] dark:text-slate-200 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>تثبيت iOS</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Full Navigation Drawer (Mobile + Desktop Quick All-Pages Index) */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/50 flex justify-start" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="w-full max-w-sm bg-white dark:bg-[#0D1B2E] h-full overflow-y-auto p-6 border-l border-slate-200 dark:border-slate-800 space-y-5"
            onClick={(e) => e.stopPropagation()}
            aria-label="فهرس صفحات المنصة"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="font-bold text-[#001F4D] dark:text-white">جميع صفحات المنصة</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {ALL_PAGES_LINKS.map((link) => {
                const active = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleGo(link.path)}
                    className={`w-full text-right px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#E6FAFA] dark:bg-[#001F4D] text-[#001F4D] dark:text-[#00D1CE]'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" /> : <WifiOff className="w-4 h-4 text-amber-600" />}
                <span>الحالة: {isOnline ? 'متصل بالإنترنت' : 'دون اتصال'}</span>
              </div>
              <p>
                التقدم المحفوظ محليًا: {progress.completedLessons.length} من {LESSONS.length} درسًا
              </p>
              {!isInstalled && isInstallable && (
                <button
                  type="button"
                  onClick={onInstallApp}
                  className="w-full rounded-lg bg-[#00D1CE] py-2 font-bold text-[#001F4D]"
                >
                  تثبيت التطبيق على الجهاز
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/60 flex items-start justify-center p-4 pt-16"
          onClick={() => setSearchOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="البحث في محتوى المنصة"
            className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#0D1B2E] border border-slate-200 dark:border-slate-700 p-5 space-y-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="global-search-input" className="font-bold text-[#001F4D] dark:text-white text-sm">
                البحث في الدروس والأجهزة والحاسبات والحالات والمصطلحات
              </label>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="إغلاق البحث"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              id="global-search-input"
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث مثلًا عن: RaySafe 452، طرح الخلفية، CBCT، Nيوترونات، H*(10)، حد الكشف..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] px-4 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <div className="overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 flex-1">
              {searchQuery.trim().length < 2 ? (
                <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  أدخل حرفين على الأقل للبحث الفوري داخل المحتوى العربي وأسماء الأجهزة والوحدات.
                </p>
              ) : searchResults.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  لا توجد نتائج مطابقة لعبارة «{searchQuery}».
                </p>
              ) : (
                searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleGo(res.path)}
                    className="w-full text-right py-3 px-2 hover:bg-slate-50 dark:hover:bg-[#050E1D]/60 transition-colors"
                  >
                    <div className="text-xs text-[#007574] dark:text-[#00D1CE] font-semibold">{res.type}</div>
                    <div className="font-bold text-sm text-[#001F4D] dark:text-white">{res.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">{res.subtitle}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks Modal */}
      {bookmarksOpen && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/60 flex items-start justify-center p-4 pt-16"
          onClick={() => setBookmarksOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="العلامات المرجعية المحفوظة"
            className="w-full max-w-lg rounded-xl bg-white dark:bg-[#0D1B2E] border border-slate-200 dark:border-slate-700 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#001F4D] dark:text-white text-base">العلامات المرجعية المحفوظة محليًا</h2>
              <button type="button" onClick={() => setBookmarksOpen(false)} aria-label="إغلاق">
                <X className="w-4 h-4" />
              </button>
            </div>
            {progress.bookmarks.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 py-4">
                لا توجد علامات مرجعية بعد. يمكنك حفظ أي درس أو جهاز أو حالة تدريبية للعودة السريعة إليها.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {progress.bookmarks.map((bm) => (
                  <li key={`${bm.type}-${bm.id}`} className="py-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleGo(bm.route)}
                      className="text-right font-semibold text-sm text-[#001F4D] dark:text-slate-100 hover:text-[#007574] dark:hover:text-[#00D1CE]"
                    >
                      {bm.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* iOS Safari Install Guide */}
      {iosGuideOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4" onClick={() => setIosGuideOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="إرشادات التثبيت على iOS"
            className="w-full max-w-sm rounded-xl bg-white dark:bg-[#0D1B2E] border border-slate-200 dark:border-slate-700 p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-[#001F4D] dark:text-white">تثبيت المنصة على iPhone / iPad</h3>
            <ol className="list-decimal pr-5 text-sm space-y-1.5 text-slate-700 dark:text-slate-300">
              <li>اضغط على زر المشاركة (Share) في شريط Safari.</li>
              <li>مرّر للأسفل واختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</li>
              <li>من صفحة «حول المنصة والعمل دون اتصال» اضغط تنزيل الحزمة للعمل دون اتصال.</li>
            </ol>
            <button
              type="button"
              onClick={() => setIosGuideOpen(false)}
              className="w-full rounded-lg bg-[#001F4D] py-2 text-sm font-bold text-white"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Clean Institutional Footer */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3 md:col-span-1">
            <div className="w-40 bg-white rounded-lg p-2 border border-slate-200">
              <img
                src={LOGO_PATH}
                alt="شعار المسح الإشعاعي الطبي Medical Radiation Survey"
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              منصة عربية تعليمية ومرجعية للمسح الإشعاعي الطبي. المحتوى تعليمي ومهني ولا يمثل اعتمادًا رسميًا أو بديلًا عن متطلبات الجهة الرقابية المحلية.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#001F4D] dark:text-white mb-3">التعلم والمراجع</h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><button type="button" onClick={() => handleGo('/start')} className="hover:underline">ابدأ من هنا</button></li>
              <li><button type="button" onClick={() => handleGo('/tracks')} className="hover:underline">المسارات التعليمية</button></li>
              <li><button type="button" onClick={() => handleGo('/library')} className="hover:underline">المكتبة التعليمية</button></li>
              <li><button type="button" onClick={() => handleGo('/glossary')} className="hover:underline">المصطلحات العلمية</button></li>
              <li><button type="button" onClick={() => handleGo('/references')} className="hover:underline">المراجع ومنهجية المراجعة</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#001F4D] dark:text-white mb-3">الأدوات الميدانية</h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><button type="button" onClick={() => handleGo('/equipment')} className="hover:underline">دليل أجهزة القياس</button></li>
              <li><button type="button" onClick={() => handleGo('/compare')} className="hover:underline">مقارنة الأجهزة</button></li>
              <li><button type="button" onClick={() => handleGo('/planner')} className="hover:underline">المخطط التفاعلي للغرفة (1:50)</button></li>
              <li><button type="button" onClick={() => handleGo('/calculators')} className="hover:underline">الحاسبات الموثقة</button></li>
              <li><button type="button" onClick={() => handleGo('/forms')} className="hover:underline">النماذج والتقارير (F01–F07)</button></li>
              <li><button type="button" onClick={() => handleGo('/scenarios')} className="hover:underline">الحالات التدريبية (8 حالات)</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#001F4D] dark:text-white mb-3">الحوكمة والعمل دون اتصال</h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><button type="button" onClick={() => handleGo('/about')} className="hover:underline">حول المنصة، النسخ الاحتياطي، والنشر</button></li>
              <li><button type="button" onClick={() => handleGo('/privacy')} className="hover:underline">الخصوصية وحدود الاستخدام</button></li>
            </ul>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              البيانات والمسودات تُحفظ محليًا على هذا المتصفح فقط ولا تتزامن تلقائيًا ولا تحتوي حقولًا لبيانات المرضى.
            </p>
          </div>
        </div>

        {/* Designer Attribution Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#050E1D]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white p-1 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                <img
                  src={DESIGNER_LOGO_PATH}
                  alt="شعار المصمم EFH — م. إدريس فتح الله الهرى"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-[#001F4D] dark:text-white">
                  إعداد وتصميم المنصة: م. إدريس فتح الله الهرى{' '}
                  <span dir="ltr" className="ltr-inline font-semibold text-slate-500 dark:text-slate-400">
                    (EFH)
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  مهندس قياسات إشعاعية · رئيس مختبر التحاليل والقياسات الإشعاعية — بنغازي
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => handleGo('/about')}
                className="font-semibold text-[#001F4D] dark:text-slate-200 hover:text-[#007574] dark:hover:text-[#00D1CE] hover:underline"
              >
                نبذة عن المصمم
              </button>
              <a
                href={DESIGNER_CV_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-3 py-1.5 font-bold text-[#001F4D] dark:text-[#00D1CE] hover:border-[#00D1CE] transition-colors"
              >
                <span>الصفحة الشخصية والسيرة الذاتية</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
