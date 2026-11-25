import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { DesignerSplash } from './components/DesignerSplash';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { HomePage, StartHerePage, TracksPage } from './pages/HomeStartTracksPages';
import { usePWA } from './hooks/usePWA';
import {
  issueTrackCertificate,
  loadUserProgress,
  recordQuizAttempt,
  saveUserProgress,
} from './utils/storage';
import type { DesignId, LocalUserProgress, TrackId } from './types';

const LibraryPage = lazy(() => import('./pages/LibraryPages').then((m) => ({ default: m.LibraryPage })));
const LessonDetailPage = lazy(() => import('./pages/LibraryPages').then((m) => ({ default: m.LessonDetailPage })));
const EquipmentCatalogPage = lazy(() => import('./pages/EquipmentPages').then((m) => ({ default: m.EquipmentCatalogPage })));
const EquipmentDetailPage = lazy(() => import('./pages/EquipmentPages').then((m) => ({ default: m.EquipmentDetailPage })));
const EquipmentComparePage = lazy(() => import('./pages/EquipmentPages').then((m) => ({ default: m.EquipmentComparePage })));
const PlannerPage = lazy(() => import('./pages/PlannerPage').then((m) => ({ default: m.PlannerPage })));
const CalculatorsPage = lazy(() => import('./pages/CalculatorsPage').then((m) => ({ default: m.CalculatorsPage })));
const FormsReportsPage = lazy(() => import('./pages/FormsReportsPage').then((m) => ({ default: m.FormsReportsPage })));
const ScenariosListPage = lazy(() => import('./pages/ScenariosPage').then((m) => ({ default: m.ScenariosListPage })));
const ScenarioDetailPage = lazy(() => import('./pages/ScenariosPage').then((m) => ({ default: m.ScenarioDetailPage })));
const GlossaryPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.GlossaryPage })));
const ReferencesPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.ReferencesPage })));
const AboutOfflinePage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.AboutOfflinePage })));
const PrivacyPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.PrivacyPage })));
const NotFoundPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.NotFoundPage })));

function normalizePath(raw: string): string {
  const cleaned = raw.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/'
  );
  const [progress, setProgress] = useState<LocalUserProgress>(() => loadUserProgress());
  const [compareIds, setCompareIds] = useState<string[]>([
    'raysafe-452',
    'atomtex-at1123',
    'ludlum-9dp-1-star',
  ]);

  const pwa = usePWA();

  // Sync dark mode class and active design identity on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (progress.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.dataset.design = progress.design ?? 'clinical';
  }, [progress.theme, progress.design]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const next = normalizePath(to);
    if (window.location.pathname !== next) {
      window.history.pushState({}, '', next);
    }
    setCurrentPath(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const updateProgress = useCallback((updater: (prev: LocalUserProgress) => LocalUserProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveUserProgress(next);
      return next;
    });
  }, []);

  const handleToggleTheme = useCallback(() => {
    updateProgress((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }));
  }, [updateProgress]);

  const handleSelectDesign = useCallback(
    (design: DesignId) => {
      updateProgress((p) => ({
        ...p,
        design,
        theme: design === 'dosimetry' ? 'dark' : 'light',
      }));
    },
    [updateProgress]
  );

  const handleSelectTrack = useCallback(
    (track: TrackId) => {
      updateProgress((p) => ({ ...p, selectedTrack: track }));
    },
    [updateProgress]
  );

  const handleMarkLessonVisited = useCallback(
    (lessonId: string) => {
      updateProgress((p) => (p.lastLessonId === lessonId ? p : { ...p, lastLessonId: lessonId }));
    },
    [updateProgress]
  );

  const handleToggleLessonComplete = useCallback(
    (lessonId: string) => {
      updateProgress((p) => {
        const exists = p.completedLessons.includes(lessonId);
        return {
          ...p,
          completedLessons: exists
            ? p.completedLessons.filter((id) => id !== lessonId)
            : [...p.completedLessons, lessonId],
        };
      });
    },
    [updateProgress]
  );

  const handleToggleBookmark = useCallback(
    (item: { type: 'lesson' | 'equipment' | 'calculator' | 'scenario'; id: string; title: string; route: string }) => {
      updateProgress((p) => {
        const exists = p.bookmarks.some((b) => b.type === item.type && b.id === item.id);
        return {
          ...p,
          bookmarks: exists
            ? p.bookmarks.filter((b) => !(b.type === item.type && b.id === item.id))
            : [...p.bookmarks, item],
        };
      });
    },
    [updateProgress]
  );

  const handleToggleChecklist = useCallback(
    (key: string, idx: number, total: number) => {
      updateProgress((p) => {
        const current = p.completedChecklists[key] ?? Array.from({ length: total }, () => false);
        const nextArr = Array.from({ length: total }, (_, i) => (i === idx ? !current[i] : Boolean(current[i])));
        return {
          ...p,
          completedChecklists: { ...p.completedChecklists, [key]: nextArr },
        };
      });
    },
    [updateProgress]
  );

  const handleSaveScenarioScore = useCallback(
    (scenarioId: string, score: number, total: number) => {
      updateProgress((p) => ({
        ...p,
        scenarioScores: { ...p.scenarioScores, [scenarioId]: { score, total } },
      }));
    },
    [updateProgress]
  );

  const handleSaveQuizAttempt = useCallback(
    (lessonId: string, score: number, total: number) => {
      updateProgress((p) => recordQuizAttempt(p, lessonId, score, total));
    },
    [updateProgress]
  );

  const handleIssueTrackCertificate = useCallback(
    (recipientName: string, trackId: TrackId = 'beginner') => {
      updateProgress((p) => issueTrackCertificate(p, trackId, recipientName));
    },
    [updateProgress]
  );

  const handleToggleCompare = useCallback((deviceId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(deviceId)) return prev.filter((id) => id !== deviceId);
      if (prev.length >= 3) return [...prev.slice(1), deviceId];
      return [...prev, deviceId];
    });
  }, []);

  const renderPage = () => {
    if (currentPath === '/') {
      return <HomePage onNavigate={navigate} progress={progress} onSelectTrack={handleSelectTrack} />;
    }
    if (currentPath === '/start') {
      return <StartHerePage onNavigate={navigate} progress={progress} onSelectTrack={handleSelectTrack} />;
    }
    if (currentPath === '/tracks') {
      return (
        <TracksPage
          onNavigate={navigate}
          progress={progress}
          onSelectTrack={handleSelectTrack}
          onIssueCertificate={handleIssueTrackCertificate}
        />
      );
    }
    if (currentPath === '/library') {
      return <LibraryPage onNavigate={navigate} progress={progress} />;
    }
    if (currentPath.startsWith('/library/')) {
      const lessonId = decodeURIComponent(currentPath.slice('/library/'.length));
      return (
        <LessonDetailPage
          lessonId={lessonId}
          onNavigate={navigate}
          progress={progress}
          onMarkLessonVisited={handleMarkLessonVisited}
          onToggleComplete={handleToggleLessonComplete}
          onToggleBookmark={handleToggleBookmark}
          onToggleChecklist={handleToggleChecklist}
          onSaveQuizAttempt={handleSaveQuizAttempt}
        />
      );
    }
    if (currentPath === '/equipment') {
      return (
        <EquipmentCatalogPage
          onNavigate={navigate}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
        />
      );
    }
    if (currentPath.startsWith('/equipment/')) {
      const deviceId = decodeURIComponent(currentPath.slice('/equipment/'.length));
      return (
        <EquipmentDetailPage
          deviceId={deviceId}
          onNavigate={navigate}
          progress={progress}
          onToggleBookmark={handleToggleBookmark}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
        />
      );
    }
    if (currentPath === '/compare') {
      return (
        <EquipmentComparePage
          onNavigate={navigate}
          compareIds={compareIds}
          onSetCompareIds={setCompareIds}
        />
      );
    }
    if (currentPath === '/planner') {
      return <PlannerPage onNavigate={navigate} />;
    }
    if (currentPath === '/calculators') {
      return (
        <CalculatorsPage
          onNavigate={navigate}
          progress={progress}
          onToggleBookmark={handleToggleBookmark}
        />
      );
    }
    if (currentPath.startsWith('/calculators/')) {
      const calcId = decodeURIComponent(currentPath.slice('/calculators/'.length));
      return (
        <CalculatorsPage
          initialCalcId={calcId}
          onNavigate={navigate}
          progress={progress}
          onToggleBookmark={handleToggleBookmark}
        />
      );
    }
    if (currentPath === '/forms') {
      return <FormsReportsPage onNavigate={navigate} />;
    }
    if (currentPath === '/scenarios') {
      return <ScenariosListPage onNavigate={navigate} progress={progress} />;
    }
    if (currentPath.startsWith('/scenarios/')) {
      const scenarioId = decodeURIComponent(currentPath.slice('/scenarios/'.length));
      return (
        <ScenarioDetailPage
          scenarioId={scenarioId}
          onNavigate={navigate}
          progress={progress}
          onSaveScore={handleSaveScenarioScore}
          onToggleBookmark={handleToggleBookmark}
        />
      );
    }
    if (currentPath === '/glossary') {
      return <GlossaryPage onNavigate={navigate} />;
    }
    if (currentPath === '/references') {
      return <ReferencesPage onNavigate={navigate} />;
    }
    if (currentPath === '/about') {
      return (
        <AboutOfflinePage
          onNavigate={navigate}
          progress={progress}
          onRestoreProgress={setProgress}
          isOnline={pwa.isOnline}
          offlineState={pwa.offlineState}
          onDownloadOffline={pwa.downloadOfflinePack}
          onApplyUpdate={pwa.applyUpdateSafely}
        />
      );
    }
    if (currentPath === '/privacy') {
      return <PrivacyPage onNavigate={navigate} />;
    }
    return <NotFoundPage currentPath={currentPath} onNavigate={navigate} />;
  };

  return (
    <>
      <DesignerSplash />
      <Layout
        currentPath={currentPath}
        onNavigate={navigate}
        progress={progress}
        onToggleTheme={handleToggleTheme}
        onSelectDesign={handleSelectDesign}
        isOnline={pwa.isOnline}
        isInstallable={pwa.isInstallable}
        isInstalled={pwa.isInstalled}
        isIOS={pwa.isIOS}
        onInstallApp={pwa.installApp}
        offlineState={pwa.offlineState}
        onApplyUpdate={pwa.applyUpdateSafely}
      >
        <RouteErrorBoundary>
          <Suspense
            fallback={
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-8 text-center text-sm text-slate-600 dark:text-slate-300">
                جاري تحميل الصفحة...
              </div>
            }
          >
            {renderPage()}
          </Suspense>
        </RouteErrorBoundary>
      </Layout>
    </>
  );
}
