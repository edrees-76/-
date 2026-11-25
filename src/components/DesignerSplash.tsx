import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DESIGNER_LOGO_PATH } from './Layout';

export const DesignerSplash: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  const handleEnter = useCallback(() => {
    if (fadingOut) return;
    setFadingOut(true);
    window.setTimeout(() => setVisible(false), 300);
  }, [fadingOut]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleEnter]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="شاشة الترحيب — المسح الإشعاعي الطبي"
      className={`no-print fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#050E1D] px-6 transition-opacity duration-300 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="splash-logo-animate flex flex-col items-center text-center max-w-md w-full">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <img
            src={DESIGNER_LOGO_PATH}
            alt="شعار المصمم EFH — Edrees F. Hery"
            className="w-56 sm:w-72 md:w-80 max-w-[75vw] h-auto object-contain select-none"
          />
        </div>

        <div className="mt-5 space-y-1.5">
          <h1 className="text-lg sm:text-xl font-bold text-[#001F4D] dark:text-white">
            المسح الإشعاعي الطبي
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            إعداد وتصميم: م. إدريس فتح الله الهرى · مهندس قياسات إشعاعية
          </p>
        </div>

        <button
          type="button"
          onClick={handleEnter}
          autoFocus
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-[#001F4D] px-7 py-3 text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>دخول المنصة</span>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
