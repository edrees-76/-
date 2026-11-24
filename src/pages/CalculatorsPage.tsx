import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bookmark, Calculator, CheckCircle2, Play, Trash2 } from 'lucide-react';
import {
  CALCULATOR_DOCS,
  COMPARISON_STANDARDS,
  UNIT_DEFINITIONS,
  calculateBackgroundSubtraction,
  calculateContaminationWipe,
  calculateCoordinatesDistance,
  calculateDosePerExposure,
  calculateRadioactiveDecay,
  calculateTransmissionReduction,
  calculateUncertaintyDecision,
  calculateUnitConversion,
  calculateWeeklyAnnual,
  formatPrecision,
  type WorkloadRowInput,
} from '../logic/calculators';
import { AssessmentBanner, Breadcrumbs, Ltr, ReviewStatusText, ScientificMetaPanel } from '../components/SharedUI';
import type { LocalUserProgress } from '../types';

interface CalculatorsPageProps {
  initialCalcId?: string;
  onNavigate: (path: string) => void;
  progress: LocalUserProgress;
  onToggleBookmark: (item: { type: 'calculator'; id: string; title: string; route: string }) => void;
}

const CALC_IDS = [
  'unit-conversion',
  'background-subtraction',
  'dose-per-exposure',
  'weekly-annual',
  'transmission-reduction',
  'contamination-wipe',
  'coordinates-distance',
  'uncertainty-decision',
] as const;

type CalcId = (typeof CALC_IDS)[number];

export const CalculatorsPage: React.FC<CalculatorsPageProps> = ({
  initialCalcId,
  onNavigate,
  progress,
  onToggleBookmark,
}) => {
  const activeId: CalcId = CALC_IDS.includes(initialCalcId as CalcId) ? (initialCalcId as CalcId) : 'unit-conversion';
  const doc = CALCULATOR_DOCS[activeId];
  const isBookmarked = progress.bookmarks.some((b) => b.type === 'calculator' && b.id === activeId);

  // 1. Unit Conversion state
  const [ucVal, setUcVal] = useState('1');
  const [ucFrom, setUcFrom] = useState('mSv');
  const [ucTo, setUcTo] = useState('uSv');

  // 2. Background Subtraction state
  const [bgMode, setBgMode] = useState<'dose' | 'counts'>('dose');
  const [bgHon, setBgHon] = useState('0.120');
  const [bgRate, setBgRate] = useState('0.060');
  const [bgWin, setBgWin] = useState('120');
  const [bgDL, setBgDL] = useState('');
  const [bgNs, setBgNs] = useState('420');
  const [bgTs, setBgTs] = useState('60');
  const [bgNb, setBgNb] = useState('120');
  const [bgTb, setBgTb] = useState('120');
  const [bgCurrie, setBgCurrie] = useState(true);

  // 3. Dose per exposure state
  const [dpeNet, setDpeNet] = useState('0.118');
  const [dpeCount, setDpeCount] = useState('10');
  const [dpeOutput, setDpeOutput] = useState('200');
  const [dpeUnit, setDpeUnit] = useState<'mAs' | 'MU'>('mAs');

  // 4. Weekly/Annual state
  const [waRows, setWaRows] = useState<WorkloadRowInput[]>([
    {
      id: 'w1',
      label: 'وضع الطاولة S01 (أشعة عامة)',
      inputType: 'per_procedure',
      value: 0.0118,
      countOrMinutesPerWeek: 400,
      occupancyT: 1,
      useFactorU: 1,
      tJustification: 'افتراض تحفظي T=1؛ وضع S01 مفصول أسبوعيًا',
    },
  ]);
  const [waWeeks, setWaWeeks] = useState('50');
  const [waUncPct, setWaUncPct] = useState('20');
  const [waStdId, setWaStdId] = useState('edu-weekly-10');
  const [waCustomVal, setWaCustomVal] = useState('');
  const [waCustomUnit, setWaCustomUnit] = useState<'µSv/week' | 'mSv/year'>('µSv/week');
  const [waCustomRef, setWaCustomRef] = useState('');

  // 5. Transmission & Reduction state
  const [trWithout, setTrWithout] = useState('0.80');
  const [trWith, setTrWith] = useState('0.08');
  const [trBelowDL, setTrBelowDL] = useState(false);
  const [trGeomOk, setTrGeomOk] = useState(true);
  const [trBgOk, setTrBgOk] = useState(true);

  // 6. Contamination Wipe + Decay state
  const [cwNs, setCwNs] = useState('420');
  const [cwTs, setCwTs] = useState('60');
  const [cwNb, setCwNb] = useState('120');
  const [cwTb, setCwTb] = useState('120');
  const [cwEff, setCwEff] = useState('0.30');
  const [cwArea, setCwArea] = useState('100');
  const [cwRemF, setCwRemF] = useState('0.50');
  const [cwDecayH, setCwDecayH] = useState('');
  const [cwHalfH, setCwHalfH] = useState('6');
  // Standalone decay checker (PDF Ex 8)
  const [decA0, setDecA0] = useState('800');
  const [decT, setDecT] = useState('12');
  const [decHalf, setDecHalf] = useState('6');

  // 7. Coordinates & Distance state
  const [cdXf, setCdXf] = useState('3.00');
  const [cdYf, setCdYf] = useState('2.50');
  const [cdZf, setCdZf] = useState('1.50');
  const [cdXp, setCdXp] = useState('6.50');
  const [cdYp, setCdYp] = useState('2.50');
  const [cdZp, setCdZp] = useState('1.20');
  const [cdInvEnabled, setCdInvEnabled] = useState(false);
  const [cdR1, setCdR1] = useState('10');
  const [cdD1, setCdD1] = useState('1');
  const [cdPointConfirmed, setCdPointConfirmed] = useState(false);

  // 8. Uncertainty & Decision state
  const [unMode, setUnMode] = useState<'budget' | 'background_propagation'>('budget');
  const [unY, setUnY] = useState('9');
  const [unUnit, setUnUnit] = useState('µSv/week');
  const [unK, setUnK] = useState('2');
  const [unL, setUnL] = useState('10');
  const [unRef, setUnRef] = useState('معيار تعليمي افتراضي — الدليل المرجعي الفصل 21.3');
  const [unComps, setUnComps] = useState<{ label: string; u: number; group: 'قياس' | 'تشغيل' }[]>([
    { label: 'معايرة الجهاز واستجابة الطاقة', u: 0.6, group: 'قياس' },
    { label: 'التكرار والتموضع والخلفية', u: 0.4, group: 'قياس' },
    { label: 'تقدير عبء العمل الأسبوعي والإشغال', u: 0.6928, group: 'تشغيل' },
  ]);
  const [unHon, setUnHon] = useState('0.120');
  const [unUHon, setUnUHon] = useState('0.006');
  const [unBg, setUnBg] = useState('0.060');
  const [unUBg, setUnUBg] = useState('0.005');
  const [unTh, setUnTh] = useState('0.0333');
  const [unUTh, setUnUTh] = useState('0.0005');

  const [exampleLoadedMsg, setExampleLoadedMsg] = useState<string | null>(null);

  useEffect(() => {
    setExampleLoadedMsg(null);
  }, [activeId]);

  const loadVerificationExample = () => {
    if (activeId === 'unit-conversion') {
      setUcVal('1');
      setUcFrom('mSv');
      setUcTo('uSv');
    } else if (activeId === 'background-subtraction') {
      setBgMode('dose');
      setBgHon('0.120');
      setBgRate('0.060');
      setBgWin('120');
      setBgDL('');
    } else if (activeId === 'dose-per-exposure') {
      setDpeNet('0.118');
      setDpeCount('10');
      setDpeOutput('200');
      setDpeUnit('mAs');
    } else if (activeId === 'weekly-annual') {
      setWaRows([
        { id: 'ct1', label: 'CT الرأس', inputType: 'per_procedure', value: 0.02, countOrMinutesPerWeek: 100, occupancyT: 0.5, useFactorU: 1, tJustification: 'مثال CT (الفصل 20.7): T=0.5 موثق' },
        { id: 'ct2', label: 'CT الصدر', inputType: 'per_procedure', value: 0.08, countOrMinutesPerWeek: 80, occupancyT: 0.5, useFactorU: 1, tJustification: 'مثال CT (الفصل 20.7): T=0.5 موثق' },
        { id: 'ct3', label: 'CT البطن والحوض', inputType: 'per_procedure', value: 0.15, countOrMinutesPerWeek: 20, occupancyT: 0.5, useFactorU: 1, tJustification: 'مثال CT (الفصل 20.7): T=0.5 موثق' },
      ]);
      setWaWeeks('50');
      setWaUncPct('20');
      setWaStdId('edu-weekly-10');
    } else if (activeId === 'transmission-reduction') {
      setTrWithout('0.80');
      setTrWith('0.08');
      setTrBelowDL(false);
      setTrGeomOk(true);
      setTrBgOk(true);
    } else if (activeId === 'contamination-wipe') {
      setCwNs('420');
      setCwTs('60');
      setCwNb('120');
      setCwTb('120');
      setCwEff('0.30');
      setCwArea('100');
      setCwRemF('0.50');
      setCwDecayH('');
      setDecA0('800');
      setDecT('12');
      setDecHalf('6');
    } else if (activeId === 'coordinates-distance') {
      setCdXf('3.00');
      setCdYf('2.50');
      setCdZf('1.50');
      setCdXp('6.50');
      setCdYp('2.50');
      setCdZp('1.20');
      setCdInvEnabled(false);
    } else if (activeId === 'uncertainty-decision') {
      setUnMode('budget');
      setUnY('9');
      setUnUnit('µSv/week');
      setUnK('2');
      setUnL('10');
      setUnRef('مثال الفصل 21.3 — معيار تعليمي افتراضي 10 µSv/week');
      setUnComps([
        { label: 'عدم اليقين القياسي المركب المكافئ (u_c = 1.0)', u: 1.0, group: 'قياس' },
      ]);
    }
    setExampleLoadedMsg('تم تحميل أرقام مثال التحقق الموثق بنجاح.');
    setTimeout(() => setExampleLoadedMsg(null), 2600);
  };

  // Compute live results
  const ucResult = useMemo(() => calculateUnitConversion(Number(ucVal), ucFrom, ucTo), [ucVal, ucFrom, ucTo]);

  const bgResult = useMemo(() => {
    if (bgMode === 'dose') {
      return calculateBackgroundSubtraction({
        mode: 'dose',
        hOn: Number(bgHon),
        bgRate: Number(bgRate),
        windowSec: Number(bgWin),
        declaredDetectionLimit: bgDL.trim() ? Number(bgDL) : null,
      });
    }
    return calculateBackgroundSubtraction({
      mode: 'counts',
      ns: Number(bgNs),
      ts: Number(bgTs),
      nb: Number(bgNb),
      tb: Number(bgTb),
      computeCurrieDL: bgCurrie,
    });
  }, [bgMode, bgHon, bgRate, bgWin, bgDL, bgNs, bgTs, bgNb, bgTb, bgCurrie]);

  const dpeResult = useMemo(
    () =>
      calculateDosePerExposure(
        Number(dpeNet),
        Number(dpeCount),
        dpeOutput.trim() ? Number(dpeOutput) : null,
        dpeUnit
      ),
    [dpeNet, dpeCount, dpeOutput, dpeUnit]
  );

  const selectedStd = COMPARISON_STANDARDS.find((s) => s.id === waStdId) ?? COMPARISON_STANDARDS[0];
  const waResult = useMemo(() => {
    const critVal =
      waStdId === 'custom'
        ? waCustomVal.trim()
          ? Number(waCustomVal)
          : null
        : selectedStd.value;
    const critUnit: 'µSv/week' | 'mSv/year' =
      waStdId === 'custom'
        ? waCustomUnit
        : selectedStd.unit === 'mSv/year'
          ? 'mSv/year'
          : 'µSv/week';
    const critRef = waStdId === 'custom' ? waCustomRef : selectedStd.reference;
    return calculateWeeklyAnnual(
      waRows,
      Number(waWeeks),
      waUncPct.trim() ? Number(waUncPct) : null,
      critVal,
      critUnit,
      critRef
    );
  }, [waRows, waWeeks, waUncPct, waStdId, waCustomVal, waCustomUnit, waCustomRef, selectedStd]);

  const trResult = useMemo(
    () => calculateTransmissionReduction(Number(trWithout), Number(trWith), trBelowDL, trGeomOk, trBgOk),
    [trWithout, trWith, trBelowDL, trGeomOk, trBgOk]
  );

  const cwResult = useMemo(
    () =>
      calculateContaminationWipe({
        ns: Number(cwNs),
        ts: Number(cwTs),
        nb: Number(cwNb),
        tb: Number(cwTb),
        efficiency: Number(cwEff),
        areaCm2: Number(cwArea),
        removalFactor: cwRemF.trim() ? Number(cwRemF) : null,
        decayHours: cwDecayH.trim() ? Number(cwDecayH) : null,
        halfLifeHours: cwDecayH.trim() ? Number(cwHalfH) : null,
      }),
    [cwNs, cwTs, cwNb, cwTb, cwEff, cwArea, cwRemF, cwDecayH, cwHalfH]
  );

  const decayCheckResult = useMemo(
    () => calculateRadioactiveDecay(Number(decA0), Number(decT), Number(decHalf)),
    [decA0, decT, decHalf]
  );

  const cdResult = useMemo(
    () =>
      calculateCoordinatesDistance({
        xf: Number(cdXf),
        yf: Number(cdYf),
        zf: Number(cdZf),
        xp: Number(cdXp),
        yp: Number(cdYp),
        zp: Number(cdZp),
        inverseSquare: {
          enabled: cdInvEnabled,
          r1: Number(cdR1),
          d1: Number(cdD1),
          pointSourceConfirmed: cdPointConfirmed,
        },
      }),
    [cdXf, cdYf, cdZf, cdXp, cdYp, cdZp, cdInvEnabled, cdR1, cdD1, cdPointConfirmed]
  );

  const unResult = useMemo(
    () =>
      calculateUncertaintyDecision({
        mode: unMode,
        resultY: Number(unY),
        unit: unUnit,
        coverageK: Number(unK),
        limitL: unL.trim() ? Number(unL) : null,
        limitReference: unRef,
        components: unComps,
        hOn: Number(unHon),
        uHOn: Number(unUHon),
        bgRate: Number(unBg),
        uBgRate: Number(unUBg),
        tHours: Number(unTh),
        uTHours: Number(unUTh),
      }),
    [unMode, unY, unUnit, unK, unL, unRef, unComps, unHon, unUHon, unBg, unUBg, unTh, unUTh]
  );

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'الرئيسية', path: '/' },
          { label: 'الحاسبات الموثقة', path: '/calculators' },
          { label: doc.shortTitle },
        ]}
        onNavigate={onNavigate}
      />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">
          الحاسبات العلمية الموثقة (<Ltr>8</Ltr> حاسبات مستقلة)
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
          كل حاسبة موثقة بمعادلتها ومصدرها وشروط تطبيقها وحالات بطلانها ومثال تحقق مطابق للأمثلة المرجعية، ولا تصدر حكمًا مطلقًا بأن الغرفة «آمنة».
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Selector */}
        <aside className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400">اختر الحاسبة</div>
          {CALC_IDS.map((id, index) => {
            const c = CALCULATOR_DOCS[id];
            const active = id === activeId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(`/calculators/${id}`)}
                className={`w-full text-right rounded-lg px-3 py-2.5 text-xs font-bold transition-colors flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-[#001F4D] text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>
                  {index + 1}. {c.shortTitle}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Active Calculator Workspace */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header & Formula Card */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ReviewStatusText status={doc.status} />
                  <span aria-hidden="true">·</span>
                  <span>
                    إصدار المحرك: <Ltr>{doc.version}</Ltr>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    آخر مراجعة: <Ltr>{doc.lastReviewed}</Ltr>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#007574] dark:text-[#00D1CE] shrink-0" aria-hidden="true" />
                  <span>{doc.title}</span>
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadVerificationExample}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#00D1CE] px-3.5 py-2 text-xs font-bold text-[#001F4D] hover:opacity-90"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>تحميل مثال التحقق</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onToggleBookmark({
                      type: 'calculator',
                      id: activeId,
                      title: `حاسبة: ${doc.shortTitle}`,
                      route: `/calculators/${activeId}`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isBookmarked ? 'محفوظة' : 'حفظ'}</span>
                </button>
              </div>
            </div>

            {exampleLoadedMsg && (
              <div role="status" className="rounded-lg bg-[#E6FAFA] dark:bg-[#0D2533] border border-[#007574]/30 px-3 py-2 text-xs font-bold text-[#001F4D] dark:text-[#00D1CE]">
                {exampleLoadedMsg}
              </div>
            )}

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-4">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المعادلة المستخدمة</div>
              <div dir="ltr" className="ltr-block font-mono text-sm font-bold text-[#001F4D] dark:text-[#00D1CE] overflow-x-auto">
                {doc.formulaLatexLike}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">المصدر: {doc.formulaSource}</div>
            </div>

            {/* Interactive Inputs & Outputs per Calculator */}
            <div className="pt-2 space-y-5">
              {/* 1. UNIT CONVERSION */}
              {activeId === 'unit-conversion' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <label className="space-y-1">
                      <span className="font-bold">القيمة</span>
                      <input
                        type="number"
                        step="any"
                        value={ucVal}
                        onChange={(e) => setUcVal(e.target.value)}
                        dir="ltr"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono text-sm"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">من وحدة</span>
                      <select
                        value={ucFrom}
                        onChange={(e) => setUcFrom(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 text-sm"
                      >
                        {UNIT_DEFINITIONS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label} — {u.categoryLabelAr}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">إلى وحدة</span>
                      <select
                        value={ucTo}
                        onChange={(e) => setUcTo(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 text-sm"
                      >
                        {UNIT_DEFINITIONS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label} — {u.categoryLabelAr}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {!ucResult.valid ? (
                    <div role="alert" className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-950 dark:text-rose-100 flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700 dark:text-rose-400" />
                      <div>
                        <p className="font-bold">تحويل محظور علميًا أو مدخل غير صالح</p>
                        <p className="mt-1">{ucResult.error}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#007574]/30 bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 p-5 space-y-3">
                      <div className="text-xs font-bold text-[#007574] dark:text-[#00D1CE]">النتيجة المكافئة</div>
                      <div className="text-2xl font-bold text-[#001F4D] dark:text-white font-mono">
                        <Ltr>
                          {formatPrecision(ucResult.value ?? 0, 6)} {ucResult.unit}
                        </Ltr>
                      </div>
                      <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {ucResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                      {ucResult.scientificWarning && (
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{ucResult.scientificWarning}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. BACKGROUND SUBTRACTION */}
              {activeId === 'background-subtraction' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setBgMode('dose')}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold ${
                        bgMode === 'dose' ? 'bg-[#001F4D] text-white' : 'bg-slate-100 dark:bg-[#050E1D] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      وضع الجرعة المتكاملة (µSv)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBgMode('counts')}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold ${
                        bgMode === 'counts' ? 'bg-[#001F4D] text-white' : 'bg-slate-100 dark:bg-[#050E1D] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      وضع معدل العدّ الإشعاعي (counts / s)
                    </button>
                  </div>

                  {bgMode === 'dose' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <label className="space-y-1">
                        <span className="font-bold">الجرعة الإجمالية <Ltr>H_on (µSv)</Ltr></span>
                        <input type="number" step="any" value={bgHon} onChange={(e) => setBgHon(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                      </label>
                      <label className="space-y-1">
                        <span className="font-bold">معدل الخلفية <Ltr>b (µSv/h)</Ltr></span>
                        <input type="number" step="any" value={bgRate} onChange={(e) => setBgRate(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                      </label>
                      <label className="space-y-1">
                        <span className="font-bold">نافذة التكامل <Ltr>t (s)</Ltr></span>
                        <input type="number" step="any" value={bgWin} onChange={(e) => setBgWin(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                      </label>
                      <label className="space-y-1">
                        <span className="font-bold">حد كشف موثق اختياري <Ltr>DL (µSv)</Ltr></span>
                        <input type="number" step="any" value={bgDL} onChange={(e) => setBgDL(e.target.value)} placeholder="اختياري" dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <label className="space-y-1">
                          <span className="font-bold">عدّ العينة <Ltr>N_s</Ltr></span>
                          <input type="number" step="1" value={bgNs} onChange={(e) => setBgNs(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">زمن العينة <Ltr>t_s (s)</Ltr></span>
                          <input type="number" step="any" value={bgTs} onChange={(e) => setBgTs(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">عدّ الخلفية <Ltr>N_b</Ltr></span>
                          <input type="number" step="1" value={bgNb} onChange={(e) => setBgNb(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">زمن الخلفية <Ltr>t_b (s)</Ltr></span>
                          <input type="number" step="any" value={bgTb} onChange={(e) => setBgTb(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                        </label>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold">
                        <input type="checkbox" checked={bgCurrie} onChange={(e) => setBgCurrie(e.target.checked)} />
                        <span>حساب عتبة القرار <Ltr>L_c</Ltr> وحد الكشف <Ltr>L_D</Ltr> وفق تقريب بواسون (<Ltr>α = β = 0.05</Ltr>)</span>
                      </label>
                    </div>
                  )}

                  {!bgResult.valid ? (
                    <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-100">
                      {bgResult.error}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#007574]/30 bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 p-5 space-y-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-[#007574] dark:text-[#00D1CE]">القيمة الصافية (محفوظة بإشارتها الإحصائية)</div>
                          <div className="text-2xl font-bold text-[#001F4D] dark:text-white font-mono mt-1">
                            <Ltr>
                              {formatPrecision(bgResult.netValue ?? 0, 4)} {bgResult.unit}
                              {bgResult.statisticalUncertainty1Sigma !== undefined
                                ? ` ± ${formatPrecision(bgResult.statisticalUncertainty1Sigma, 3)} ${bgResult.unit} (1σ)`
                                : ''}
                            </Ltr>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#001F4D] dark:text-slate-200">{bgResult.classification}</div>
                      </div>
                      <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {bgResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                      <div className="border-t border-[#007574]/20 pt-2 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {bgResult.notes.map((n, i) => <p key={i}>• {n}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. DOSE PER EXPOSURE */}
              {activeId === 'dose-per-exposure' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <label className="space-y-1">
                      <span className="font-bold">الجرعة الصافية <Ltr>H_net (µSv)</Ltr></span>
                      <input type="number" step="any" value={dpeNet} onChange={(e) => setDpeNet(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">عدد التعرضات <Ltr>n</Ltr></span>
                      <input type="number" step="1" min="1" value={dpeCount} onChange={(e) => setDpeCount(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">الخرج الكلي (اختياري)</span>
                      <input type="number" step="any" value={dpeOutput} onChange={(e) => setDpeOutput(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">وحدة الخرج</span>
                      <select value={dpeUnit} onChange={(e) => setDpeUnit(e.target.value as 'mAs' | 'MU')} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2">
                        <option value="mAs">mAs (أشعة تشخيصية / CT)</option>
                        <option value="MU">MU (مسرع خطي LINAC)</option>
                      </select>
                    </label>
                  </div>

                  {!dpeResult.valid ? (
                    <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-100">
                      {dpeResult.error}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#007574]/30 bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 p-5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-bold text-[#007574] dark:text-[#00D1CE]">الجرعة الصافية لكل تعرض (h)</div>
                          <div className="text-2xl font-bold text-[#001F4D] dark:text-white font-mono">
                            <Ltr>{formatPrecision(dpeResult.dosePerExposure ?? 0, 5)} µSv/exp</Ltr>
                          </div>
                        </div>
                        {dpeResult.normalizedPerOutput !== undefined && (
                          <div>
                            <div className="text-xs font-bold text-[#007574] dark:text-[#00D1CE]">الجرعة المطبّعة إلى الخرج (q)</div>
                            <div className="text-2xl font-bold text-[#001F4D] dark:text-white font-mono">
                              <Ltr>{formatPrecision(dpeResult.normalizedPerOutput, 6)} µSv/{dpeResult.outputUnit}</Ltr>
                            </div>
                          </div>
                        )}
                      </div>
                      <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {dpeResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {dpeResult.notes.map((n, i) => <p key={i}>• {n}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. WEEKLY & ANNUAL ESTIMATE */}
              {activeId === 'weekly-annual' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#001F4D] dark:text-white">صفوف الأوضاع / البروتوكولات الأسبوعية</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setWaRows((prev) => [
                          ...prev,
                          {
                            id: `w${Date.now()}`,
                            label: `بروتوكول ${prev.length + 1}`,
                            inputType: 'per_procedure',
                            value: 0.01,
                            countOrMinutesPerWeek: 100,
                            occupancyT: 1,
                            useFactorU: 1,
                            tJustification: 'T=1 افتراضي تحفظي',
                          },
                        ])
                      }
                      className="rounded-lg bg-[#001F4D] text-white px-3 py-1.5 text-xs font-bold"
                    >
                      إضافة صف بروتوكول
                    </button>
                  </div>

                  <div className="space-y-3">
                    {waRows.map((row, idx) => (
                      <div key={row.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#050E1D] p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs items-end">
                        <label className="lg:col-span-2 space-y-1">
                          <span className="font-bold">وصف الوضع / البروتوكول</span>
                          <input
                            type="text"
                            value={row.label}
                            onChange={(e) =>
                              setWaRows((r) => r.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                            }
                            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-2 py-1.5"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">نوع الإدخال</span>
                          <select
                            value={row.inputType}
                            onChange={(e) =>
                              setWaRows((r) =>
                                r.map((x, i) =>
                                  i === idx ? { ...x, inputType: e.target.value as WorkloadRowInput['inputType'] } : x
                                )
                              )
                            }
                            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-2 py-1.5"
                          >
                            <option value="per_procedure">جرعة/إجراء (µSv)</option>
                            <option value="dose_rate">معدل (µSv/h)</option>
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">{row.inputType === 'per_procedure' ? 'h (µSv/إجراء)' : 'r (µSv/h)'}</span>
                          <input
                            type="number"
                            step="any"
                            value={row.value}
                            onChange={(e) =>
                              setWaRows((r) => r.map((x, i) => (i === idx ? { ...x, value: Number(e.target.value) } : x)))
                            }
                            dir="ltr"
                            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-2 py-1.5 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">{row.inputType === 'per_procedure' ? 'العدد/أسبوع' : 'دقائق الإشعاع/أسبوع'}</span>
                          <input
                            type="number"
                            step="any"
                            value={row.countOrMinutesPerWeek}
                            onChange={(e) =>
                              setWaRows((r) =>
                                r.map((x, i) => (i === idx ? { ...x, countOrMinutesPerWeek: Number(e.target.value) } : x))
                              )
                            }
                            dir="ltr"
                            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-2 py-1.5 font-mono"
                          />
                        </label>
                        <div className="flex items-end gap-1.5">
                          <label className="flex-1 space-y-1">
                            <span className="font-bold"><Ltr>T</Ltr></span>
                            <input
                              type="number"
                              step="0.05"
                              min="0.01"
                              max="1"
                              value={row.occupancyT}
                              onChange={(e) =>
                                setWaRows((r) =>
                                  r.map((x, i) => (i === idx ? { ...x, occupancyT: Number(e.target.value) } : x))
                                )
                              }
                              dir="ltr"
                              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-2 py-1.5 font-mono"
                            />
                          </label>
                          <label className="flex-1 space-y-1">
                            <span className="font-bold"><Ltr>U</Ltr></span>
                            <input
                              type="number"
                              step="0.05"
                              min="0.01"
                              max="1"
                              value={row.useFactorU}
                              onChange={(e) =>
                                setWaRows((r) =>
                                  r.map((x, i) => (i === idx ? { ...x, useFactorU: Number(e.target.value) } : x))
                                )
                              }
                              dir="ltr"
                              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1B2E] px-2 py-1.5 font-mono"
                            />
                          </label>
                          {waRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setWaRows((r) => r.filter((_, i) => i !== idx))}
                              aria-label="حذف الصف"
                              className="p-2 text-rose-700 dark:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <label className="space-y-1">
                      <span className="font-bold">أسابيع التشغيل في السنة</span>
                      <input type="number" min="1" max="53" value={waWeeks} onChange={(e) => setWaWeeks(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">عدم اليقين الموسع النسبي (%)</span>
                      <input type="number" step="1" min="0" value={waUncPct} onChange={(e) => setWaUncPct(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">معيار المقارنة المختار</span>
                      <select value={waStdId} onChange={(e) => setWaStdId(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2">
                        {COMPARISON_STANDARDS.map((st) => (
                          <option key={st.id} value={st.id}>{st.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {waStdId === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-xs">
                      <label className="space-y-1">
                        <span className="font-bold">قيمة المعيار المخصص</span>
                        <input type="number" step="any" value={waCustomVal} onChange={(e) => setWaCustomVal(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" />
                      </label>
                      <label className="space-y-1">
                        <span className="font-bold">وحدة وفترة المعيار</span>
                        <select value={waCustomUnit} onChange={(e) => setWaCustomUnit(e.target.value as 'µSv/week' | 'mSv/year')} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5">
                          <option value="µSv/week">µSv/week</option>
                          <option value="mSv/year">mSv/year</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="font-bold">المرجع والجهة المعتمدة (إلزامي)</span>
                        <input type="text" value={waCustomRef} onChange={(e) => setWaCustomRef(e.target.value)} placeholder="مثال: وثيقة الترخيص رقم..." className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5" />
                      </label>
                    </div>
                  )}

                  {!waResult.valid ? (
                    <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-100">
                      {waResult.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-4">
                        <div>
                          <div className="text-xs text-slate-500">الأسبوعي قبل T وU</div>
                          <div className="text-lg font-bold font-mono text-[#001F4D] dark:text-white">
                            <Ltr>{formatPrecision(waResult.totalWeeklyBeforeTU ?? 0, 3)} µSv/wk</Ltr>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">الأسبوعي بعد T وU</div>
                          <div className="text-xl font-bold font-mono text-[#007574] dark:text-[#00D1CE]">
                            <Ltr>{formatPrecision(waResult.totalWeeklyMicroSv ?? 0, 3)} µSv/wk</Ltr>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">السنوي المقدر ({waWeeks} أسبوعًا)</div>
                          <div className="text-lg font-bold font-mono text-[#001F4D] dark:text-white">
                            <Ltr>{formatPrecision(waResult.totalAnnualMilliSv ?? 0, 4)} mSv/yr</Ltr>
                          </div>
                        </div>
                      </div>

                      {waResult.assessmentOutcome && waResult.assessmentStatement && (
                        <AssessmentBanner
                          outcome={waResult.assessmentOutcome}
                          statement={waResult.assessmentStatement}
                          detail={`المرجع المختار: ${waStdId === 'custom' ? waCustomRef || 'غير محدد' : selectedStd.reference}`}
                        />
                      )}

                      <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {waResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 5. TRANSMISSION & REDUCTION */}
              {activeId === 'transmission-reduction' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <label className="space-y-1">
                      <span className="font-bold">القراءة الصافية دون الحاجز/الواقي <Ltr>H_without</Ltr></span>
                      <input type="number" step="any" value={trWithout} onChange={(e) => setTrWithout(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">{trBelowDL ? 'حد الكشف الموثق DL (بدل H_with)' : 'القراءة الصافية مع الحاجز H_with'}</span>
                      <input type="number" step="any" value={trWith} onChange={(e) => setTrWith(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono" />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <label className="inline-flex items-center gap-2 font-semibold">
                      <input type="checkbox" checked={trBelowDL} onChange={(e) => setTrBelowDL(e.target.checked)} />
                      <span>القراءة المحمية تحت حد الكشف (حساب حد أعلى لـ B وحد أدنى لـ RF)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 font-semibold">
                      <input type="checkbox" checked={trGeomOk} onChange={(e) => setTrGeomOk(e.target.checked)} />
                      <span>الهندسة والفانتوم والخرج متطابقان بين القياسين</span>
                    </label>
                    <label className="inline-flex items-center gap-2 font-semibold">
                      <input type="checkbox" checked={trBgOk} onChange={(e) => setTrBgOk(e.target.checked)} />
                      <span>تم طرح الخلفية في كلا القياسين</span>
                    </label>
                  </div>

                  {!trResult.valid ? (
                    <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-100">
                      {trResult.error}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#007574]/30 bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 p-5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                        <div>
                          <div className="text-xs font-sans text-slate-600 dark:text-slate-300">نسبة الانتقال B</div>
                          <div className="text-xl font-bold text-[#001F4D] dark:text-white">
                            <Ltr>{trResult.isLimitBound ? '< ' : ''}{formatPrecision(trResult.transmissionB ?? 0, 4)}</Ltr>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-sans text-slate-600 dark:text-slate-300">عامل الخفض RF</div>
                          <div className="text-xl font-bold text-[#007574] dark:text-[#00D1CE]">
                            <Ltr>{trResult.isLimitBound ? '> ' : ''}{formatPrecision(trResult.reductionFactorRF ?? 0, 2)}</Ltr>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-sans text-slate-600 dark:text-slate-300">نسبة الخفض</div>
                          <div className="text-xl font-bold text-[#001F4D] dark:text-white">
                            <Ltr>{trResult.isLimitBound ? '> ' : ''}{formatPrecision(trResult.reductionPercent ?? 0, 2)}%</Ltr>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {trResult.notes.map((n, i) => <p key={i}>• {n}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. CONTAMINATION WIPE + DECAY */}
              {activeId === 'contamination-wipe' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                    <label className="space-y-1">
                      <span className="font-bold">عدّ العينة <Ltr>N_s</Ltr></span>
                      <input type="number" value={cwNs} onChange={(e) => setCwNs(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">زمن العينة <Ltr>t_s (s)</Ltr></span>
                      <input type="number" value={cwTs} onChange={(e) => setCwTs(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">عدّ الخلفية <Ltr>N_b</Ltr></span>
                      <input type="number" value={cwNb} onChange={(e) => setCwNb(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">زمن الخلفية <Ltr>t_b (s)</Ltr></span>
                      <input type="number" value={cwTb} onChange={(e) => setCwTb(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">كفاءة العد <Ltr>ε (0–1)</Ltr></span>
                      <input type="number" step="0.01" value={cwEff} onChange={(e) => setCwEff(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">مساحة المسحة <Ltr>S (cm²)</Ltr></span>
                      <input type="number" step="any" value={cwArea} onChange={(e) => setCwArea(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">كفاءة الاسترجاع <Ltr>f</Ltr> (اختياري)</span>
                      <input type="number" step="0.05" value={cwRemF} onChange={(e) => setCwRemF(e.target.value)} placeholder="اختياري" dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                    </label>
                    <label className="space-y-1">
                      <span className="font-bold">زمن حتى العدّ <Ltr>t (h)</Ltr> / <Ltr>T½ (h)</Ltr></span>
                      <div className="flex gap-1">
                        <input type="number" step="any" value={cwDecayH} onChange={(e) => setCwDecayH(e.target.value)} placeholder="t" dir="ltr" className="w-1/2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-2 font-mono" />
                        <input type="number" step="any" value={cwHalfH} onChange={(e) => setCwHalfH(e.target.value)} placeholder="T½" dir="ltr" className="w-1/2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-2 font-mono" />
                      </div>
                    </label>
                  </div>

                  {!cwResult.valid ? (
                    <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-100">
                      {cwResult.error}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#007574]/30 bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 p-5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">نشاط المسحة A_wipe</div>
                          <div className="text-xl font-bold font-mono text-[#001F4D] dark:text-white">
                            <Ltr>{formatPrecision(cwResult.aWipeDecayCorrectedBq ?? cwResult.aWipeBq ?? 0, 3)} Bq</Ltr>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">النشاط المجمع لكل مساحة (A_wipe/S)</div>
                          <div className="text-xl font-bold font-mono text-[#007574] dark:text-[#00D1CE]">
                            <Ltr>{formatPrecision(cwResult.collectedPerAreaBqCm2 ?? 0, 4)} Bq/cm²</Ltr>
                          </div>
                        </div>
                        {cwResult.removableEstimateBqCm2 !== undefined && (
                          <div>
                            <div className="text-xs text-slate-600 dark:text-slate-300">المقدر قبل المسح (مع f)</div>
                            <div className="text-xl font-bold font-mono text-[#001F4D] dark:text-white">
                              <Ltr>{formatPrecision(cwResult.removableEstimateBqCm2, 4)} Bq/cm²</Ltr>
                            </div>
                          </div>
                        )}
                      </div>
                      <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {cwResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Standalone Decay Calculator (Example 8) */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                    <h3 className="text-xs font-bold text-[#001F4D] dark:text-white">
                      حاسبة الاضمحلال الإشعاعي السريعة (<Ltr>A(t) = A₀ × 2^(−t / T½)</Ltr> — المثال 8)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
                      <label className="space-y-1">
                        <span>النشاط الابتدائي A₀ (MBq)</span>
                        <input type="number" value={decA0} onChange={(e) => setDecA0(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" />
                      </label>
                      <label className="space-y-1">
                        <span>الزمن المنقضي t (h)</span>
                        <input type="number" value={decT} onChange={(e) => setDecT(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" />
                      </label>
                      <label className="space-y-1">
                        <span>نصف العمر T½ (h)</span>
                        <input type="number" value={decHalf} onChange={(e) => setDecHalf(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" />
                      </label>
                      <div className="rounded bg-slate-100 dark:bg-[#050E1D] px-3 py-2 font-mono font-bold text-[#001F4D] dark:text-[#00D1CE]">
                        {decayCheckResult.valid ? <Ltr>{formatPrecision(decayCheckResult.value ?? 0, 3)} MBq</Ltr> : decayCheckResult.error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. COORDINATES & 2D/3D DISTANCE */}
              {activeId === 'coordinates-distance' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-300 py-1">أمثلة دليل المخططات (الفصل 12):</span>
                    <button
                      type="button"
                      onClick={() => { setCdXp('6.50'); setCdYp('2.50'); setCdZp('1.20'); }}
                      className="rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Ltr>MP-04 (6.5, 2.5, 1.2)</Ltr>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCdXp('3.00'); setCdYp('2.50'); setCdZp('4.60'); }}
                      className="rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Ltr>MP-06 الأعلى (3.0, 2.5, +4.6)</Ltr>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCdXp('3.00'); setCdYp('2.50'); setCdZp('-1.10'); }}
                      className="rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Ltr>MP-07 الأسفل (3.0, 2.5, −1.1)</Ltr>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                      <div className="font-bold text-[#001F4D] dark:text-white">إحداثيات المصدر <Ltr>SRC-01 (m)</Ltr></div>
                      <div className="grid grid-cols-3 gap-2">
                        <label><span>x_F</span><input type="number" step="0.1" value={cdXf} onChange={(e) => setCdXf(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono" /></label>
                        <label><span>y_F</span><input type="number" step="0.1" value={cdYf} onChange={(e) => setCdYf(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono" /></label>
                        <label><span>z_F</span><input type="number" step="0.1" value={cdZf} onChange={(e) => setCdZf(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono" /></label>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                      <div className="font-bold text-[#001F4D] dark:text-white">إحداثيات نقطة القياس <Ltr>MP (m)</Ltr></div>
                      <div className="grid grid-cols-3 gap-2">
                        <label><span>x_P</span><input type="number" step="0.1" value={cdXp} onChange={(e) => setCdXp(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono" /></label>
                        <label><span>y_P</span><input type="number" step="0.1" value={cdYp} onChange={(e) => setCdYp(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono" /></label>
                        <label><span>z_P المطلق</span><input type="number" step="0.1" value={cdZp} onChange={(e) => setCdZp(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono" /></label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2 text-xs">
                    <label className="inline-flex items-center gap-2 font-bold">
                      <input type="checkbox" checked={cdInvEnabled} onChange={(e) => setCdInvEnabled(e.target.checked)} />
                      <span>تفعيل فحص التربيع العكسي الاختياري (للمصدر النقطي غير المحجوب فقط)</span>
                    </label>
                    {cdInvEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 items-center">
                        <label><span>المعدل المرجعي r1</span><input type="number" step="any" value={cdR1} onChange={(e) => setCdR1(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono" /></label>
                        <label><span>المسافة المرجعية d1 (m)</span><input type="number" step="any" value={cdD1} onChange={(e) => setCdD1(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono" /></label>
                        <label className="inline-flex items-center gap-2 pt-4">
                          <input type="checkbox" checked={cdPointConfirmed} onChange={(e) => setCdPointConfirmed(e.target.checked)} />
                          <span>أؤكد تحقق شرط المصدر النقطي غير المحجوب</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {!cdResult.valid ? (
                    <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-100">
                      {cdResult.error}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#007574]/30 bg-[#E6FAFA]/60 dark:bg-[#0D2533]/60 p-5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">المسافة الأفقية r_xy</div>
                          <div className="text-xl font-bold font-mono text-[#001F4D] dark:text-white">
                            <Ltr>{formatPrecision(cdResult.horizontalDistanceM ?? 0, 3)} m</Ltr>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">المسافة ثلاثية الأبعاد d</div>
                          <div className="text-xl font-bold font-mono text-[#007574] dark:text-[#00D1CE]">
                            <Ltr>{formatPrecision(cdResult.distance3DM ?? 0, 3)} m</Ltr>
                          </div>
                        </div>
                        {cdResult.inverseSquareRate !== undefined && (
                          <div>
                            <div className="text-xs text-slate-600 dark:text-slate-300">تقدير التربيع العكسي r2</div>
                            <div className="text-xl font-bold font-mono text-[#001F4D] dark:text-white">
                              <Ltr>{formatPrecision(cdResult.inverseSquareRate, 4)}</Ltr>
                            </div>
                          </div>
                        )}
                      </div>
                      <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {cdResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {cdResult.notes.map((n, i) => <p key={i}>• {n}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 8. UNCERTAINTY & DECISION RULE */}
              {activeId === 'uncertainty-decision' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setUnMode('budget')}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold ${
                        unMode === 'budget' ? 'bg-[#001F4D] text-white' : 'bg-slate-100 dark:bg-[#050E1D] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ميزانية عدم اليقين وقاعدة القرار
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnMode('background_propagation')}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold ${
                        unMode === 'background_propagation' ? 'bg-[#001F4D] text-white' : 'bg-slate-100 dark:bg-[#050E1D] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      انتشار عدم يقين طرح الخلفية u_c(H_net)
                    </button>
                  </div>

                  {unMode === 'budget' ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <label className="space-y-1">
                          <span className="font-bold">النتيجة المقدرة Y</span>
                          <input type="number" step="any" value={unY} onChange={(e) => setUnY(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">الوحدة</span>
                          <input type="text" value={unUnit} onChange={(e) => setUnUnit(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">معامل التغطية k</span>
                          <input type="number" step="0.1" value={unK} onChange={(e) => setUnK(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                        </label>
                        <label className="space-y-1">
                          <span className="font-bold">معيار المقارنة L</span>
                          <input type="number" step="any" value={unL} onChange={(e) => setUnL(e.target.value)} dir="ltr" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
                        </label>
                      </div>

                      <label className="block space-y-1">
                        <span className="font-bold">مرجع المعيار L (إلزامي لإصدار المقارنة)</span>
                        <input type="text" value={unRef} onChange={(e) => setUnRef(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2" />
                      </label>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#001F4D] dark:text-white">مكونات عدم اليقين القياسية u_i (بنفس وحدة Y)</span>
                          <button
                            type="button"
                            onClick={() => setUnComps((c) => [...c, { label: 'مكون إضافي', u: 0.2, group: 'قياس' }])}
                            className="rounded bg-[#001F4D] text-white px-2.5 py-1 font-bold"
                          >
                            إضافة مكون
                          </button>
                        </div>
                        {unComps.map((comp, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={comp.label}
                              onChange={(e) => setUnComps((c) => c.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                              className="sm:col-span-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5"
                            />
                            <select
                              value={comp.group}
                              onChange={(e) => setUnComps((c) => c.map((x, i) => (i === idx ? { ...x, group: e.target.value as 'قياس' | 'تشغيل' } : x)))}
                              className="sm:col-span-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5"
                            >
                              <option value="قياس">مكون قياس</option>
                              <option value="تشغيل">مكون تشغيل/عبء عمل</option>
                            </select>
                            <input
                              type="number"
                              step="any"
                              value={comp.u}
                              onChange={(e) => setUnComps((c) => c.map((x, i) => (i === idx ? { ...x, u: Number(e.target.value) } : x)))}
                              dir="ltr"
                              className="sm:col-span-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1.5 font-mono"
                            />
                            {unComps.length > 1 && (
                              <button type="button" onClick={() => setUnComps((c) => c.filter((_, i) => i !== idx))} className="sm:col-span-1 text-rose-700 dark:text-rose-400">
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <label className="space-y-1"><span>H_on (µSv)</span><input type="number" step="any" value={unHon} onChange={(e) => setUnHon(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" /></label>
                      <label className="space-y-1"><span>u(H_on) (µSv)</span><input type="number" step="any" value={unUHon} onChange={(e) => setUnUHon(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" /></label>
                      <label className="space-y-1"><span>b (µSv/h)</span><input type="number" step="any" value={unBg} onChange={(e) => setUnBg(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" /></label>
                      <label className="space-y-1"><span>u(b) (µSv/h)</span><input type="number" step="any" value={unUBg} onChange={(e) => setUnUBg(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" /></label>
                      <label className="space-y-1"><span>t (h)</span><input type="number" step="any" value={unTh} onChange={(e) => setUnTh(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" /></label>
                      <label className="space-y-1"><span>u(t) (h)</span><input type="number" step="any" value={unUTh} onChange={(e) => setUnUTh(e.target.value)} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" /></label>
                    </div>
                  )}

                  {!unResult.valid ? (
                    <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-100">
                      {unResult.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-4">
                        <div>
                          <div className="text-xs text-slate-500">النتيجة Y ± U</div>
                          <div className="text-lg font-bold font-mono text-[#001F4D] dark:text-white">
                            <Ltr>{formatPrecision(unResult.resultY ?? 0, 4)} ± {formatPrecision(unResult.expandedU ?? 0, 4)} {unUnit}</Ltr>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">المجال [Y − U , Y + U]</div>
                          <div className="text-lg font-bold font-mono text-[#007574] dark:text-[#00D1CE]">
                            <Ltr>[{formatPrecision(unResult.lowerBound ?? 0, 3)} , {formatPrecision(unResult.upperBound ?? 0, 3)}]</Ltr>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">عدم اليقين المركب u_c</div>
                          <div className="text-lg font-bold font-mono text-[#001F4D] dark:text-white">
                            <Ltr>{formatPrecision(unResult.uCombined ?? 0, 4)}</Ltr>
                          </div>
                        </div>
                      </div>

                      {unResult.outcome && unResult.outcomeStatement && (
                        <AssessmentBanner outcome={unResult.outcome} statement={unResult.outcomeStatement} />
                      )}

                      <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                        {unResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Scientific Documentation for Active Calculator */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-5">
            <h3 className="text-base font-bold text-[#001F4D] dark:text-white">
              توثيق المتغيرات، وشروط التطبيق، وحالات البطلان، ومثال التحقق
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#050E1D] text-[#001F4D] dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2.5 text-right">الرمز</th>
                    <th className="p-2.5 text-right">المعنى</th>
                    <th className="p-2.5 text-right">الوحدة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {doc.variables.map((v, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-mono font-bold text-[#001F4D] dark:text-[#00D1CE]"><Ltr>{v.symbol}</Ltr></td>
                      <td className="p-2.5">{v.meaning}</td>
                      <td className="p-2.5 font-mono"><Ltr>{v.unit}</Ltr></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#001F4D] dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" />
                  <span>شروط التطبيق السليم</span>
                </h4>
                <ul className="list-disc pr-5 space-y-1 text-slate-700 dark:text-slate-300">
                  {doc.applicabilityConditions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>حالات بطلان الحساب</span>
                </h4>
                <ul className="list-disc pr-5 space-y-1 text-slate-700 dark:text-slate-300">
                  {doc.invalidationCases.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-4 text-xs space-y-1">
              <div className="font-bold text-[#001F4D] dark:text-white">مثال التحقق المرجعي: {doc.verificationExample.title}</div>
              <p><strong>المدخلات:</strong> {doc.verificationExample.inputsSummary}</p>
              <p><strong>النتيجة المتوقعة:</strong> {doc.verificationExample.expectedResult}</p>
              <p className="text-slate-500">المصدر: {doc.verificationExample.sourceNote}</p>
            </div>
          </section>

          <ScientificMetaPanel
            meta={{
              referenceIds: doc.referenceIds,
              lastReviewed: doc.lastReviewed,
              status: doc.status,
              assumptions: doc.applicabilityConditions,
              limitations: doc.invalidationCases,
            }}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
};
