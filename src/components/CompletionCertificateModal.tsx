import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Printer, X } from 'lucide-react';
import { LOGO_PATH } from './Layout';
import { Ltr } from './SharedUI';
import type { BeginnerCertificateRecord } from '../types';

interface CompletionCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate?: BeginnerCertificateRecord;
  averageBestPercent: number | null;
  lessonsCount: number;
  trackTitle?: string;
  trackDescription?: string;
  onIssueCertificate: (recipientName: string) => void;
}

function formatArabicDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export const CompletionCertificateModal: React.FC<CompletionCertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
  averageBestPercent,
  lessonsCount,
  trackTitle = 'مسار المبتدئ — الأسس والكميات وهندسة المسح',
  trackDescription = 'إصدار وطباعة شهادة إتمام مسار المبتدئ',
  onIssueCertificate,
}) => {
  const [nameInput, setNameInput] = useState(certificate?.recipientName ?? '');

  useEffect(() => {
    if (isOpen) {
      setNameInput(certificate?.recipientName ?? '');
      document.body.classList.add('has-certificate-modal');
    } else {
      document.body.classList.remove('has-certificate-modal');
    }
    return () => {
      document.body.classList.remove('has-certificate-modal');
    };
  }, [isOpen, certificate?.recipientName]);

  if (!isOpen) return null;

  const trimmedName = nameInput.trim();
  const canIssueOrPrint = trimmedName.length >= 2;
  const displayDate = certificate?.earnedAt
    ? formatArabicDate(certificate.earnedAt)
    : formatArabicDate(new Date().toISOString());
  const certNumber = certificate?.certificateNumber ?? 'سيُنشأ عند الاعتماد';

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canIssueOrPrint) return;
    onIssueCertificate(trimmedName);
  };

  const handlePrint = () => {
    if (!canIssueOrPrint) return;
    if (!certificate || certificate.recipientName !== trimmedName) {
      onIssueCertificate(trimmedName);
    }
    setTimeout(() => {
      window.print();
    }, 80);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-modal-title"
    >
      {/* Dynamic A4 Landscape rule only while certificate modal is open */}
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>

      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#0D1B2E] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Modal Controls (hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#007574] dark:text-[#00D1CE]" aria-hidden="true" />
            <h2 id="cert-modal-title" className="text-base font-bold text-[#001F4D] dark:text-white">
              {trackDescription}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الشهادة"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name Form (hidden on print) */}
        <form
          onSubmit={handleSaveName}
          className="px-6 py-4 bg-slate-50 dark:bg-[#050E1D] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-end gap-3 no-print"
        >
          <div className="flex-1 min-w-[220px] space-y-1">
            <label htmlFor="cert-recipient-name" className="block text-xs font-bold text-[#001F4D] dark:text-slate-200">
              الاسم الكامل للمتدرب/ـة (كما سيظهر على الشهادة)
            </label>
            <input
              id="cert-recipient-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="مثال: د. أحمد محمد علي"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-3.5 py-2 text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!canIssueOrPrint}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold border transition-colors ${
              canIssueOrPrint
                ? 'border-[#007574] bg-[#E6FAFA] text-[#001F4D] hover:bg-[#d1f5f5]'
                : 'border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>{certificate ? 'تحديث الاسم وحفظه' : 'اعتماد وتثبيت الشهادة'}</span>
          </button>

          <button
            type="button"
            disabled={!canIssueOrPrint}
            onClick={handlePrint}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-opacity ${
              canIssueOrPrint
                ? 'bg-[#001F4D] dark:bg-[#00D1CE] text-white dark:text-[#001F4D] hover:opacity-95'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>طباعة / حفظ PDF (A4 أفقي)</span>
          </button>
        </form>

        {/* Printable Certificate Sheet */}
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/60">
          <div
            id="certificate-print-sheet"
            className="certificate-print-sheet relative mx-auto bg-[#FDFBF7] text-[#001F4D] p-6 sm:p-10 rounded-xl border-4 border-[#001F4D] shadow-sm"
          >
            {/* Inner Double Frame */}
            <div className="border-2 border-[#007574] p-6 sm:p-8 rounded-lg space-y-6">
              {/* Top Header with Platform Logo */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#007574]/30 pb-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold tracking-wide text-[#007574]">
                    منصة المسح الإشعاعي الطبي · Medical Radiation Survey
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#001F4D]">
                    شهادة إتمام صادرة عن المنصة
                  </h3>
                  <div className="text-xs font-semibold text-slate-600" dir="ltr">
                    Platform Certificate of Completion
                  </div>
                </div>
                <img
                  src={LOGO_PATH}
                  alt="شعار منصة المسح الإشعاعي الطبي"
                  className="h-16 sm:h-20 w-auto object-contain"
                />
              </div>

              {/* Recipient & Achievement Body */}
              <div className="text-center space-y-4 py-3">
                <p className="text-sm sm:text-base text-slate-700 font-semibold">
                  تشهد منصة المسح الإشعاعي الطبي بأن المتدرب/ـة:
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#001F4D] border-b-2 border-[#007574]/40 inline-block px-8 pb-2 min-w-[240px]">
                  {trimmedName || '........................................'}
                </div>
                <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed">
                  قد أتم/ـت بنجاح متطلبات{' '}
                  <strong className="text-[#001F4D]">
                    {trackTitle} ({lessonsCount} درسًا)
                  </strong>{' '}
                  واجتاز/ت جميع الاختبارات التقييمية الموثقة بنسبة لا تقل عن{' '}
                  <Ltr className="font-bold">80%</Ltr> في كل درس
                  {averageBestPercent !== null ? (
                    <span>
                      {' '}
                      بمتوسط درجات <Ltr className="font-bold">{averageBestPercent}%</Ltr>
                    </span>
                  ) : null}
                  .
                </p>
              </div>

              {/* Metadata & Signature Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-[#007574]/30 items-end text-xs">
                <div className="space-y-1">
                  <div className="text-slate-500 font-semibold">تاريخ الاستحقاق</div>
                  <div className="font-bold text-[#001F4D] text-sm">{displayDate}</div>
                </div>

                <div className="space-y-1 sm:text-center">
                  <div className="text-slate-500 font-semibold">الرقم المرجعي للشهادة</div>
                  <div className="font-bold text-[#001F4D]">
                    <Ltr>{certNumber}</Ltr>
                  </div>
                </div>

                <div className="space-y-1 sm:text-left">
                  <div className="font-bold text-[#001F4D] text-sm" dir="ltr">
                    EFH - Edrees F. Hery
                  </div>
                  <div className="text-slate-600">مهندس قياسات إشعاعية · مصمم المنصة</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 text-center pt-2">
                وثيقة إتمام تعليمية صادرة محليًا عن المنصة، ولا تمثل ترخيصًا مهنيًا أو اعتمادًا تنظيميًا من جهة رقابية.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
