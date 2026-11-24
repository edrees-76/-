import React, { useEffect, useState } from 'react';
import { DESIGNER_LOGO_PATH } from './Layout';

export const DesignerSplash: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const holdMs = prefersReduced ? 1200 : 2300;
    const fadeDurationMs = prefersReduced ? 200 : 500;

    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, holdMs);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, holdMs + fadeDurationMs);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        setFadingOut(true);
        window.setTimeout(() => setVisible(false), 250);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (!visible) return null;

  const handleSkip = () => {
    setFadingOut(true);
    window.setTimeout(() => setVisible(false), 250);
  };

  return (
    <div
      role="status"
      aria-label="شاشة افتتاحية — شعار المصمم م. إدريس فتح الله الهرى"
      onClick={handleSkip}
      className={`no-print fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white px-6 transition-opacity duration-500 ease-out cursor-pointer ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="splash-logo-animate flex flex-col items-center text-center max-w-md w-full">
        <img
          src={DESIGNER_LOGO_PATH}
          alt="شعار المصمم EFH — Edrees F. Hery"
          className="w-64 sm:w-80 md:w-96 max-w-[78vw] h-auto object-contain select-none"
        />

        <div className="mt-4 space-y-1">
          <p className="text-sm sm:text-base font-bold text-[#001F4D]">
            المسح الإشعاعي الطبي
          </p>
          <p className="text-xs text-slate-500">
            إعداد وتصميم: م. إدريس فتح الله الهرى · مهندس قياسات إشعاعية
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        className="mt-8 rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-500 hover:text-[#001F4D] hover:border-slate-400 transition-colors"
      >
        دخول مباشر
      </button>
    </div>
  );
};
