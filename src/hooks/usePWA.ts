import { useCallback, useEffect, useState } from 'react';
import { CONTENT_PACKAGE_VERSION } from '../data/references';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface OfflinePackState {
  downloaded: boolean;
  downloading: boolean;
  progressPercent: number;
  cachedCount: number;
  totalCount: number;
  lastDownloadedAt: string | null;
  packageVersion: string;
  failedUrls: string[];
  swSupported: boolean;
  swRegistered: boolean;
  updateAvailable: boolean;
}

const OFFLINE_META_KEY = 'mrs_offline_pack_meta_v1';

export function usePWA() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const [offlineState, setOfflineState] = useState<OfflinePackState>(() => {
    let saved: Partial<OfflinePackState> = {};
    try {
      const raw = localStorage.getItem(OFFLINE_META_KEY);
      if (raw) saved = JSON.parse(raw) as Partial<OfflinePackState>;
    } catch {
      // ignore
    }
    return {
      downloaded: Boolean(saved.downloaded),
      downloading: false,
      progressPercent: saved.downloaded ? 100 : 0,
      cachedCount: saved.cachedCount ?? 0,
      totalCount: saved.totalCount ?? 0,
      lastDownloadedAt: saved.lastDownloadedAt ?? null,
      packageVersion: saved.packageVersion ?? CONTENT_PACKAGE_VERSION,
      failedUrls: [],
      swSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
      swRegistered: false,
      updateAvailable: false,
    };
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register Service Worker cleanly without silently replacing an active session
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setOfflineState((prev) => ({ ...prev, swRegistered: true }));

          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setOfflineState((prev) => ({ ...prev, updateAvailable: true }));
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setOfflineState((prev) => ({ ...prev, updateAvailable: true }));
              }
            });
          });
        })
        .catch(() => {
          setOfflineState((prev) => ({ ...prev, swRegistered: false }));
        });

      const handleSWMessage = (event: MessageEvent) => {
        const msg = event.data;
        if (!msg) return;
        if (msg.type === 'OFFLINE_DOWNLOAD_PROGRESS') {
          setOfflineState((prev) => ({
            ...prev,
            downloading: true,
            progressPercent: msg.percent,
            cachedCount: msg.completed,
            totalCount: msg.total,
            failedUrls: msg.failed ?? [],
          }));
        } else if (msg.type === 'OFFLINE_DOWNLOAD_COMPLETE') {
          const nextMeta = {
            downloaded: (msg.failed?.length ?? 0) === 0,
            cachedCount: msg.completed,
            totalCount: msg.total,
            lastDownloadedAt: msg.timestamp ?? new Date().toISOString(),
            packageVersion: CONTENT_PACKAGE_VERSION,
          };
          try {
            localStorage.setItem(OFFLINE_META_KEY, JSON.stringify(nextMeta));
          } catch {
            // ignore
          }
          setOfflineState((prev) => ({
            ...prev,
            ...nextMeta,
            downloading: false,
            progressPercent: 100,
            failedUrls: msg.failed ?? [],
          }));
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const downloadOfflinePack = useCallback(async () => {
    // Collect active bundled assets + app shell + local icons/logo so everything works offline
    const urls = new Set<string>([
      '/',
      '/index.html',
      '/manifest.webmanifest',
      '/icons/pwa-192x192.png',
      '/icons/pwa-512x512.png',
      '/icons/apple-touch-icon.png',
      '/assets/aistudio/_________________________________12eb8902.png',
    ]);

    document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach((el) => {
      const attr = el.getAttribute('src') || el.getAttribute('href');
      if (attr && attr.startsWith('/')) {
        urls.add(attr);
      }
    });

    const urlList = Array.from(urls);
    setOfflineState((prev) => ({
      ...prev,
      downloading: true,
      progressPercent: 5,
      cachedCount: 0,
      totalCount: urlList.length,
      failedUrls: [],
    }));

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const target = navigator.serviceWorker.controller || reg.active;
      if (target) {
        target.postMessage({ type: 'DOWNLOAD_OFFLINE_PACK', urls: urlList });
        return;
      }
    }

    // Direct Cache API fallback if SW is not active yet in preview iframe
    if ('caches' in window) {
      try {
        const cache = await caches.open('mrs-offline-v1.0.0-20261124');
        let done = 0;
        const failed: string[] = [];
        for (const u of urlList) {
          try {
            const resp = await fetch(u, { cache: 'reload' });
            if (resp.ok) await cache.put(u, resp.clone());
            else failed.push(u);
          } catch {
            failed.push(u);
          }
          done += 1;
          setOfflineState((prev) => ({
            ...prev,
            cachedCount: done,
            totalCount: urlList.length,
            progressPercent: Math.round((done / urlList.length) * 100),
            failedUrls: failed,
          }));
        }
        const timestamp = new Date().toISOString();
        const nextMeta = {
          downloaded: failed.length === 0,
          cachedCount: done,
          totalCount: urlList.length,
          lastDownloadedAt: timestamp,
          packageVersion: CONTENT_PACKAGE_VERSION,
        };
        localStorage.setItem(OFFLINE_META_KEY, JSON.stringify(nextMeta));
        setOfflineState((prev) => ({ ...prev, ...nextMeta, downloading: false, progressPercent: 100 }));
      } catch {
        setOfflineState((prev) => ({ ...prev, downloading: false }));
      }
    } else {
      setOfflineState((prev) => ({ ...prev, downloading: false }));
    }
  }, []);

  const applyUpdateSafely = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [waitingWorker]);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    isOnline,
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    installApp,
    offlineState,
    downloadOfflinePack,
    applyUpdateSafely,
  };
}
