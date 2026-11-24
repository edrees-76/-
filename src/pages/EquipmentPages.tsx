import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Bookmark, CheckCircle2, ImageOff, Scale } from 'lucide-react';
import {
  EQUIPMENT_LIST,
  EQUIPMENT_TASK_LABELS,
  TASK_SELECTION_MATRIX,
} from '../data/equipment';
import { Breadcrumbs, Ltr, ReviewStatusText, ScientificMetaPanel } from '../components/SharedUI';
import type { EquipmentTaskCategory, LocalUserProgress } from '../types';

interface EquipmentCatalogProps {
  onNavigate: (path: string) => void;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
}

export const EquipmentCatalogPage: React.FC<EquipmentCatalogProps> = ({
  onNavigate,
  compareIds,
  onToggleCompare,
}) => {
  const [selectedTask, setSelectedTask] = useState<EquipmentTaskCategory | 'all'>('all');

  const filtered = EQUIPMENT_LIST.filter(
    (item) => selectedTask === 'all' || item.tasks.includes(selectedTask)
  );

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'دليل أجهزة القياس' }]} onNavigate={onNavigate} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">
            دليل أجهزة القياس الإشعاعي (<Ltr>14</Ltr> جهازًا ومسبارًا)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            منظّم حسب المهمة مع التمييز الصارم بين الجهاز المتكامل، والمسبار الخارجي، ووحدة القراءة، ومقياس الجرعة الشخصي، وعدم افتراض تكافؤ نسخ العائلة الواحدة.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/compare')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00D1CE] px-4 py-2.5 text-sm font-bold text-[#001F4D] hover:opacity-90"
        >
          <Scale className="w-4 h-4" aria-hidden="true" />
          <span>مقارنة الأجهزة ({compareIds.length}/3)</span>
        </button>
      </header>

      {/* Strict Methodological Caution */}
      <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs sm:text-sm text-amber-950 dark:text-amber-100 space-y-1">
        <p className="font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>ضوابط الاختيار العلمي للأجهزة:</span>
        </p>
        <p>
          دقة العرض ليست حد كشف، ونطاق الطاقة لا يعني دقة ثابتة، ومقياس الجرعة الشخصي (<Ltr>Hp(10)</Ltr>) ليس بديلًا تلقائيًا لجهاز مسح المكان (<Ltr>H*(10)</Ltr>). جميع ترشيحات الأجهزة مشروطة بالمهمة وشهادة المعايرة ونسخة الجهاز الفعلية.
        </p>
      </div>

      {/* Task Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedTask('all')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
            selectedTask === 'all'
              ? 'bg-[#001F4D] dark:bg-[#00D1CE] text-white dark:text-[#001F4D] border-transparent'
              : 'bg-white dark:bg-[#0D1B2E] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          جميع المهام (14)
        </button>
        {(Object.keys(EQUIPMENT_TASK_LABELS) as EquipmentTaskCategory[]).map((tk) => (
          <button
            key={tk}
            type="button"
            onClick={() => setSelectedTask(tk)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
              selectedTask === tk
                ? 'bg-[#001F4D] dark:bg-[#00D1CE] text-white dark:text-[#001F4D] border-transparent'
                : 'bg-white dark:bg-[#0D1B2E] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {EQUIPMENT_TASK_LABELS[tk].label}
          </button>
        ))}
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((eq) => {
          const inCompare = compareIds.includes(eq.id);
          return (
            <article
              key={eq.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Honest No-Unlicensed-Image Placeholder */}
                <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-4 flex flex-col items-center justify-center text-center min-h-[110px]">
                  <ImageOff className="w-6 h-6 text-slate-400 mb-1.5" aria-hidden="true" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">صورة غير متاحة</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {eq.imageStatus.sourceAttribution}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Ltr className="font-bold text-[#007574] dark:text-[#00D1CE]">{eq.number}</Ltr>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{eq.classification}</span>
                  <span aria-hidden="true">·</span>
                  <span>{eq.meta.status}</span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/equipment/${eq.id}`)}
                      className="text-right hover:text-[#007574] dark:hover:text-[#00D1CE]"
                    >
                      <Ltr>{eq.model}</Ltr>
                    </button>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{eq.manufacturer}</p>
                </div>

                <dl className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div>
                    <dt className="inline font-bold text-[#001F4D] dark:text-slate-200">الكاشف: </dt>
                    <dd className="inline">{eq.detectorType}</dd>
                  </div>
                  <div>
                    <dt className="inline font-bold text-[#001F4D] dark:text-slate-200">الكميات: </dt>
                    <dd className="inline">{eq.quantities.join('، ')}</dd>
                  </div>
                  <div>
                    <dt className="inline font-bold text-[#001F4D] dark:text-slate-200">الحقول النبضية: </dt>
                    <dd className="inline font-semibold">{eq.pulsedSuitability.level}</dd>
                  </div>
                </dl>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onToggleCompare(eq.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors ${
                    inCompare
                      ? 'bg-[#E6FAFA] dark:bg-[#0D2533] border-[#007574] dark:border-[#00D1CE] text-[#001F4D] dark:text-[#00D1CE]'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {inCompare ? 'مضاف للمقارنة ✓' : 'أضف للمقارنة'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(`/equipment/${eq.id}`)}
                  className="text-xs font-bold text-[#001F4D] dark:text-[#00D1CE] hover:underline inline-flex items-center gap-1"
                >
                  <span>البطاقة الكاملة</span>
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Task Selection Matrix */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#001F4D] dark:text-white">مصفوفة الاختيار المشروط حسب المهمة</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            لا تعني قائمة المرشحين تطابق الأداء أو وجوب شرائها جميعًا؛ كل ترشيح مشروط بملاءمة الطيف والنبضات وشهادة المعايرة.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] text-right">
                <th className="p-3 font-bold text-[#001F4D] dark:text-white">المهمة</th>
                <th className="p-3 font-bold text-[#001F4D] dark:text-white">مرشح أو تجهيز مشروط</th>
                <th className="p-3 font-bold text-[#001F4D] dark:text-white">الشرط الأساسي قبل الاعتماد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
              {TASK_SELECTION_MATRIX.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-bold text-[#001F4D] dark:text-slate-100">{row.task}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{row.candidates.join(' · ')}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{row.essentialCondition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

interface EquipmentDetailProps {
  deviceId: string;
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
  onToggleBookmark: (item: { type: 'equipment'; id: string; title: string; route: string }) => void;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
}

export const EquipmentDetailPage: React.FC<EquipmentDetailProps> = ({
  deviceId,
  onNavigate,
  progress,
  onToggleBookmark,
  compareIds,
  onToggleCompare,
}) => {
  const eq = EQUIPMENT_LIST.find((e) => e.id === deviceId);
  if (!eq) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#001F4D] dark:text-white">الجهاز غير موجود</h1>
        <button type="button" onClick={() => onNavigate('/equipment')} className="rounded-lg bg-[#001F4D] text-white px-4 py-2 text-sm font-bold">
          العودة لدليل الأجهزة
        </button>
      </div>
    );
  }

  const isBookmarked = progress.bookmarks.some((b) => b.type === 'equipment' && b.id === eq.id);
  const inCompare = compareIds.includes(eq.id);

  return (
    <article className="space-y-8 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'دليل أجهزة القياس', path: '/equipment' },
          { label: eq.model },
        ]}
        onNavigate={onNavigate}
      />

      <header className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-5 text-center space-y-2">
            <ImageOff className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">صورة غير متاحة</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{eq.imageStatus.sourceAttribution}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">{eq.imageStatus.rightsNote}</p>
          </div>

          <div className="md:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-[#007574] dark:text-[#00D1CE]">بطاقة {eq.number}</span>
              <span aria-hidden="true">·</span>
              <span>{eq.classification}</span>
              <span aria-hidden="true">·</span>
              <ReviewStatusText status={eq.meta.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#001F4D] dark:text-white">
              <Ltr>{eq.model}</Ltr>
            </h1>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">الشركة المصنعة: {eq.manufacturer}</p>
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-950 dark:text-amber-100">
              <strong>تنبيه النسخ والتكوين:</strong> {eq.variantsNote}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => onToggleCompare(eq.id)}
                className="rounded-lg bg-[#00D1CE] px-4 py-2 text-xs font-bold text-[#001F4D]"
              >
                {inCompare ? 'مضاف للمقارنة (إزالة)' : 'إضافة إلى المقارنة'}
              </button>
              <button
                type="button"
                onClick={() =>
                  onToggleBookmark({
                    type: 'equipment',
                    id: eq.id,
                    title: `جهاز: ${eq.model}`,
                    route: `/equipment/${eq.id}`,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isBookmarked ? 'محفوظ في العلامات' : 'حفظ كعلامة مرجعية'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Technical Specifications Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">المواصفات الفنية الموثقة</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              <tr>
                <th className="p-3 text-right font-bold text-[#001F4D] dark:text-slate-200 w-48 bg-slate-50 dark:bg-[#050E1D]">نوع الكاشف</th>
                <td className="p-3">{eq.detectorType}</td>
              </tr>
              <tr>
                <th className="p-3 text-right font-bold text-[#001F4D] dark:text-slate-200 bg-slate-50 dark:bg-[#050E1D]">الكميات المقاسة</th>
                <td className="p-3">{eq.quantities.join(' · ')}</td>
              </tr>
              <tr>
                <th className="p-3 text-right font-bold text-[#001F4D] dark:text-slate-200 bg-slate-50 dark:bg-[#050E1D]">الوحدات</th>
                <td className="p-3"><Ltr>{eq.units.join(' , ')}</Ltr></td>
              </tr>
              <tr>
                <th className="p-3 text-right font-bold text-[#001F4D] dark:text-slate-200 bg-slate-50 dark:bg-[#050E1D]">نطاق القياس الموثق</th>
                <td className="p-3">{eq.measurementRange}</td>
              </tr>
              <tr>
                <th className="p-3 text-right font-bold text-[#001F4D] dark:text-slate-200 bg-slate-50 dark:bg-[#050E1D]">نطاق الطاقة الموثق</th>
                <td className="p-3">{eq.energyRange}</td>
              </tr>
              <tr>
                <th className="p-3 text-right font-bold text-[#001F4D] dark:text-slate-200 bg-slate-50 dark:bg-[#050E1D]">ملاءمة الحقول النبضية</th>
                <td className="p-3">
                  <div className="font-bold text-[#001F4D] dark:text-[#00D1CE]">{eq.pulsedSuitability.level}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{eq.pulsedSuitability.details}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Uses, Limitations, Calibration, Accessories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white">الاستخدامات المناسبة</h2>
          <ul className="list-disc pr-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {eq.suitableUses.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white">القيود والأخطاء المحتملة</h2>
          <ul className="list-disc pr-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {eq.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white">المعايرة والتحقق من الاستجابة</h2>
          <ul className="list-disc pr-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {eq.calibrationAndCheck.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-2">
          <h2 className="text-base font-bold text-[#001F4D] dark:text-white">الملحقات والمجسات المطلوبة والقبول</h2>
          <ul className="list-disc pr-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {eq.requiredAccessories.map((a, i) => <li key={i}>{a}</li>)}
            {eq.acceptanceChecklist.map((ac, i) => <li key={`ac-${i}`}>{ac}</li>)}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-[#007574]/30 dark:border-[#00D1CE]/30 bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 p-5 space-y-1.5">
        <h2 className="text-sm font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" aria-hidden="true" />
          <span>سياق الترشيح المشروط بالمهمة</span>
        </h2>
        <p className="text-sm text-slate-800 dark:text-slate-200">{eq.recommendationContext}</p>
      </section>

      <ScientificMetaPanel meta={eq.meta} onNavigate={onNavigate} />
    </article>
  );
};

interface CompareProps {
  onNavigate: (path: string) => void;
  compareIds: string[];
  onSetCompareIds: (ids: string[]) => void;
}

export const EquipmentComparePage: React.FC<CompareProps> = ({
  onNavigate,
  compareIds,
  onSetCompareIds,
}) => {
  const effectiveIds = compareIds.length >= 2 ? compareIds : ['raysafe-452', 'atomtex-at1123', 'ludlum-9dp-1-star'];
  const selectedDevices = effectiveIds
    .map((id) => EQUIPMENT_LIST.find((e) => e.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const updateSlot = (slotIdx: number, nextId: string) => {
    const copy = [...effectiveIds];
    if (nextId === '') {
      copy.splice(slotIdx, 1);
    } else {
      copy[slotIdx] = nextId;
    }
    onSetCompareIds(Array.from(new Set(copy)).slice(0, 3));
  };

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'دليل أجهزة القياس', path: '/equipment' },
          { label: 'مقارنة الأجهزة' },
        ]}
        onNavigate={onNavigate}
      />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">مقارنة أجهزة القياس (جهازين أو ثلاثة)</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          توحيد بنود المقارنة مع إظهار الاختلافات في الكميات والوحدات والنبضات والمعلومات غير المتاحة؛ تذكر أن الترجيح يرتبط بالمهمة والشروط لا بأكبر رقم في النشرة.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-4">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="space-y-1.5">
            <label htmlFor={`cmp-slot-${slot}`} className="block text-xs font-bold text-[#001F4D] dark:text-slate-200">
              الجهاز {slot + 1} {slot === 2 ? '(اختياري)' : ''}
            </label>
            <select
              id={`cmp-slot-${slot}`}
              value={effectiveIds[slot] ?? ''}
              onChange={(e) => updateSlot(slot, e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {slot === 2 && <option value="">— بدون جهاز ثالث —</option>}
              {EQUIPMENT_LIST.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.number} — {item.model} ({item.classification})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D]">
              <th className="p-3 text-right font-bold text-[#001F4D] dark:text-white w-44">بند المقارنة</th>
              {selectedDevices.map((d) => (
                <th key={d.id} className="p-3 text-right font-bold text-[#001F4D] dark:text-[#00D1CE]">
                  <button type="button" onClick={() => onNavigate(`/equipment/${d.id}`)} className="hover:underline">
                    <Ltr>{d.model}</Ltr>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
            {[
              { label: 'التصنيف (جهاز/مسبار/شخصي)', fn: (d: typeof EQUIPMENT_LIST[number]) => d.classification },
              { label: 'الشركة المصنعة', fn: (d: typeof EQUIPMENT_LIST[number]) => d.manufacturer },
              { label: 'نوع الكاشف', fn: (d: typeof EQUIPMENT_LIST[number]) => d.detectorType },
              { label: 'الكميات المقاسة', fn: (d: typeof EQUIPMENT_LIST[number]) => d.quantities.join(' · ') },
              { label: 'الوحدات الموحدة', fn: (d: typeof EQUIPMENT_LIST[number]) => d.units.join(' , ') },
              { label: 'نطاق القياس', fn: (d: typeof EQUIPMENT_LIST[number]) => d.measurementRange },
              { label: 'نطاق الطاقة', fn: (d: typeof EQUIPMENT_LIST[number]) => d.energyRange },
              { label: 'الحقول النبضية وحدودها', fn: (d: typeof EQUIPMENT_LIST[number]) => `${d.pulsedSuitability.level}: ${d.pulsedSuitability.details}` },
              { label: 'تمييز النسخ الفرعية', fn: (d: typeof EQUIPMENT_LIST[number]) => d.variantsNote },
              { label: 'القيود الأهم', fn: (d: typeof EQUIPMENT_LIST[number]) => d.limitations.join(' — ') },
              { label: 'الترشيح المشروط بالمهمة', fn: (d: typeof EQUIPMENT_LIST[number]) => d.recommendationContext },
              { label: 'حالة المراجعة والتاريخ', fn: (d: typeof EQUIPMENT_LIST[number]) => `${d.meta.status} (${d.meta.lastReviewed})` },
            ].map((row) => (
              <tr key={row.label}>
                <th className="p-3 text-right font-bold text-[#001F4D] dark:text-slate-200 bg-slate-50/70 dark:bg-[#050E1D]/60 align-top">
                  {row.label}
                </th>
                {selectedDevices.map((d) => (
                  <td key={d.id} className="p-3 align-top text-slate-700 dark:text-slate-300 leading-relaxed">
                    {row.fn(d)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
