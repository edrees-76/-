import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { DEFAULT_FORMS_DRAFT, type SurveyFormsDraft } from '../data/forms';
import {
  calculateBackgroundSubtraction,
  calculateContaminationWipe,
  formatPrecision,
} from '../logic/calculators';
import {
  exportToCsv,
  loadDraftRecord,
  saveDraftRecord,
  triggerDownloadFile,
} from '../utils/storage';
import { AssessmentBanner, Breadcrumbs, Ltr } from '../components/SharedUI';
import { LOGO_PATH } from '../components/Layout';
import type { AssessmentOutcome } from '../types';

interface FormsReportsPageProps {
  onNavigate: (path: string) => void;
}

type FormTabId = 'F01' | 'F02' | 'F03' | 'F04' | 'F05' | 'F06' | 'F07';

const FORM_TABS: { id: FormTabId; title: string }[] = [
  { id: 'F01', title: 'F01 التحضير والمعيار' },
  { id: 'F02', title: 'F02 الجهاز والهندسة' },
  { id: 'F03', title: 'F03 القراءات الخام' },
  { id: 'F04', title: 'F04 التقدير والمقارنة' },
  { id: 'F05', title: 'F05 التلوث والمسحات' },
  { id: 'F06', title: 'F06 الملاحظات والتدقيق' },
  { id: 'F07', title: 'F07 التقرير الفني للطباعة' },
];

export const FormsReportsPage: React.FC<FormsReportsPageProps> = ({ onNavigate }) => {
  const [draft, setDraft] = useState<SurveyFormsDraft>(DEFAULT_FORMS_DRAFT);
  const [activeTab, setActiveTab] = useState<FormTabId>('F07');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    loadDraftRecord<SurveyFormsDraft>('forms_draft', DEFAULT_FORMS_DRAFT).then((loaded) => {
      if (mounted && loaded && loaded.meta && loaded.f03RawReadings) {
        setDraft(loaded);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateDraft = (updater: (prev: SurveyFormsDraft) => SurveyFormsDraft) => {
    setDraft((prev) => {
      const next = updater(prev);
      saveDraftRecord('forms_draft', next);
      return next;
    });
  };

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Live computed F03 net values
  const f03Computed = useMemo(() => {
    return draft.f03RawReadings.rows.map((row) => {
      const res = calculateBackgroundSubtraction({
        mode: 'dose',
        hOn: row.rawTotal,
        bgRate: row.bgRatePerHour,
        windowSec: row.windowSec,
      });
      const net = res.valid ? res.netValue ?? 0 : 0;
      const bgContrib = res.valid ? res.bgContribution ?? 0 : 0;
      const perExp = row.exposures > 0 ? net / row.exposures : 0;
      return { row, bgContrib, net, perExp, valid: res.valid };
    });
  }, [draft.f03RawReadings.rows]);

  // Live computed F04 weekly/annual + decision evaluation
  const f04Computed = useMemo(() => {
    const weeks = Math.max(1, draft.f04Estimation.operatingWeeksPerYear || 50);
    const uncFactor = Math.max(0, draft.f04Estimation.expandedUncertaintyPercent || 0) / 100;
    const critVal = draft.f04Estimation.comparisonCriterionValue;
    const critUnit = draft.f04Estimation.comparisonCriterionUnit;

    return draft.f04Estimation.rows.map((row) => {
      const weekly = row.dosePerExposure * row.weeklyExposures * row.occupancyT;
      const annualMilli = (weekly * weeks) / 1000;
      const comparedVal = critUnit === 'µSv/week' ? weekly : annualMilli;
      const uVal = Math.abs(comparedVal) * uncFactor;
      const low = comparedVal - uVal;
      const high = comparedVal + uVal;

      let outcome: AssessmentOutcome = 'insufficient_data';
      let outcomeLabel = 'البيانات غير كافية للتقييم';
      if (critVal > 0 && draft.f01Preparation.criterionReference.trim().length > 0) {
        if (high <= critVal) {
          outcome = 'below_criterion';
          outcomeLabel = 'أقل من معيار المقارنة المختار ضمن الافتراضات';
        } else if (low > critVal) {
          outcome = 'above_criterion';
          outcomeLabel = 'أعلى من معيار المقارنة المختار ضمن الافتراضات';
        } else {
          outcome = 'inconclusive';
          outcomeLabel = 'نتيجة غير حاسمة (تقاطع عدم اليقين مع المعيار)';
        }
      }
      return { row, weekly, annualMilli, comparedVal, uVal, low, high, outcome, outcomeLabel };
    });
  }, [draft.f04Estimation, draft.f01Preparation.criterionReference]);

  // Live computed F05 wipe results
  const f05Computed = useMemo(() => {
    return draft.f05Contamination.rows.map((row) => {
      const res = calculateContaminationWipe({
        ns: row.ns,
        ts: row.ts,
        nb: row.nb,
        tb: row.tb,
        efficiency: draft.f05Contamination.efficiency,
        areaCm2: row.areaCm2,
        removalFactor: draft.f05Contamination.removalFactor > 0 ? draft.f05Contamination.removalFactor : null,
      });
      return { row, res };
    });
  }, [draft.f05Contamination]);

  // Overall F07 summary outcome (never "آمنة")
  const overallOutcome: { outcome: AssessmentOutcome; statement: string } = useMemo(() => {
    if (!f04Computed.length || draft.f04Estimation.comparisonCriterionValue <= 0) {
      return {
        outcome: 'insufficient_data',
        statement: 'البيانات غير كافية للتقييم — تأكد من إدخال صفوف التقدير ومعيار المقارنة ومرجعه.',
      };
    }
    if (f04Computed.some((r) => r.outcome === 'above_criterion')) {
      return {
        outcome: 'above_criterion',
        statement: `التقدير أعلى من معيار المقارنة المختار (${draft.f04Estimation.comparisonCriterionValue} ${draft.f04Estimation.comparisonCriterionUnit}) في نقطة واحدة على الأقل، ضمن الافتراضات الموضحة.`,
      };
    }
    if (f04Computed.some((r) => r.outcome === 'inconclusive')) {
      return {
        outcome: 'inconclusive',
        statement: `توجد نتيجة غير حاسمة (تقاطع عدم اليقين مع معيار المقارنة ${draft.f04Estimation.comparisonCriterionValue} ${draft.f04Estimation.comparisonCriterionUnit}) في نقطة واحدة على الأقل — يلزم قياس أدق أو مراجعة تشغيلية.`,
      };
    }
    return {
      outcome: 'below_criterion',
      statement: `التقدير أقل من معيار المقارنة المختار (${draft.f04Estimation.comparisonCriterionValue} ${draft.f04Estimation.comparisonCriterionUnit}) للنقاط المختبرة فقط، ضمن الافتراضات الموضحة.`,
    };
  }, [f04Computed, draft.f04Estimation]);

  const handleExportJson = () => {
    triggerDownloadFile(
      `${draft.meta.reportNumber || 'survey_draft'}_F01-F07.json`,
      JSON.stringify(draft, null, 2),
      'application/json;charset=utf-8'
    );
    showStatus('تم تصدير مسودة النماذج F01–F07 بصيغة JSON.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as SurveyFormsDraft;
        if (!parsed.meta || !parsed.f03RawReadings || !parsed.f04Estimation) {
          showStatus('ملف JSON غير مطابق لبنية نماذج F01–F07.');
          return;
        }
        setDraft(parsed);
        saveDraftRecord('forms_draft', parsed);
        showStatus('تم استيراد المسودة وحفظها محليًا بنجاح.');
      } catch {
        showStatus('تعذر قراءة ملف JSON؛ تأكد من سلامة تنسيق الملف.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCsv = () => {
    exportToCsv(
      `${draft.meta.reportNumber || 'survey'}_F03_F04_tables.csv`,
      [
        'النموذج',
        'رمز النقطة',
        'الموقع / الوضع',
        'القراءة الخام / h',
        'الخلفية أو التعرضات/أسبوع',
        'الصافي / الأسبوعي (µSv)',
        'السنوي (mSv) أو لكل تعرض',
        'ملاحظة / مقارنة المعيار',
      ],
      [
        ...f03Computed.map((r) => [
          'F03',
          r.row.pointCode,
          r.row.location,
          r.row.rawTotal,
          r.row.bgRatePerHour,
          Number(r.net.toFixed(4)),
          Number(r.perExp.toFixed(5)),
          r.row.notes,
        ]),
        ...f04Computed.map((r) => [
          'F04',
          r.row.pointCode,
          r.row.modeLabel,
          r.row.dosePerExposure,
          r.row.weeklyExposures,
          Number(r.weekly.toFixed(3)),
          Number(r.annualMilli.toFixed(4)),
          r.outcomeLabel,
        ]),
      ]
    );
    showStatus('تم تصدير جداول F03 وF04 بصيغة CSV (متوافقة مع العربية في Excel).');
  };

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'النماذج والتقارير (F01–F07)' }]} onNavigate={onNavigate} />

      <header className="no-print flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">
            النماذج الميدانية والتقرير الفني (<Ltr>F01–F07</Ltr>)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            حزمة النماذج الكاملة مع الحفظ المحلي التلقائي، وتصدير/استيراد <Ltr>JSON</Ltr>، وتصدير الجداول <Ltr>CSV</Ltr>، ومعاينة طباعة عربية احترافية على ورق <Ltr>A4</Ltr> خالية من أي بيانات شخصية أو أختام اعتماد.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              saveDraftRecord('forms_draft', draft);
              showStatus('تم حفظ جميع نماذج F01–F07 محليًا.');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#001F4D] px-3 py-2 text-xs font-bold text-white"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ المسودة</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('F07');
              setTimeout(() => window.print(), 100);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00D1CE] px-3 py-2 text-xs font-bold text-[#001F4D]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير A4 / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد JSON</span>
          </button>
          <input ref={importInputRef} type="file" accept="application/json" onChange={handleImportJson} className="hidden" />
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_FORMS_DRAFT);
              saveDraftRecord('forms_draft', DEFAULT_FORMS_DRAFT);
              showStatus('تمت استعادة المثال التعليمي RS-2026-001.');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>مثال RS-2026-001</span>
          </button>
        </div>
      </header>

      {statusMsg && (
        <div role="status" className="no-print rounded-lg bg-[#E6FAFA] dark:bg-[#0D2533] border border-[#007574]/30 px-4 py-2 text-xs font-bold text-[#001F4D] dark:text-[#00D1CE]">
          {statusMsg}
        </div>
      )}

      {/* Simulated Data Banner */}
      {draft.meta.isSimulatedEducational && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-950 dark:text-amber-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>تقرير تعليمي — بيانات محاكاة (لا يمثل تقرير مسح لمنشأة حقيقية ولا اعتمادًا رسميًا)</span>
          </div>
          <label className="no-print inline-flex items-center gap-2 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={draft.meta.isSimulatedEducational}
              onChange={(e) => updateDraft((d) => ({ ...d, meta: { ...d.meta, isSimulatedEducational: e.target.checked } }))}
            />
            <span>إبقاء شارة «بيانات محاكاة تعليمية» مفعلة</span>
          </label>
        </div>
      )}

      {/* Privacy & No-Patient-Data Guard */}
      <div className="no-print rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-3 text-xs text-slate-600 dark:text-slate-400">
        <strong>سياسة الخصوصية:</strong> لا تدخل أسماء مرضى أو أرقام ملفات طبية أو بيانات شخصية في أي حقل؛ يُكتفى برموز الغرف والمسميات الوظيفية فقط. الحفظ محلي على هذا المتصفح فقط.
      </div>

      {/* Form Tabs */}
      <div className="no-print flex flex-wrap gap-2" role="tablist" aria-label="نماذج المسح الإشعاعي">
        {FORM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#001F4D] text-white'
                : 'bg-white dark:bg-[#0D1B2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* F01: Preparation & Criterion */}
      {activeTab === 'F01' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-6">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">نموذج F01: بطاقة التحضير وتحديد النطاق ومعيار المقارنة</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <label className="space-y-1">
              <span className="font-bold">رقم التقرير</span>
              <input type="text" value={draft.meta.reportNumber} onChange={(e) => updateDraft((d) => ({ ...d, meta: { ...d.meta, reportNumber: e.target.value } }))} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">تاريخ القياس</span>
              <input type="date" value={draft.meta.measurementDate} onChange={(e) => updateDraft((d) => ({ ...d, meta: { ...d.meta, measurementDate: e.target.value } }))} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">نوع المسح</span>
              <select value={draft.meta.surveyType} onChange={(e) => updateDraft((d) => ({ ...d, meta: { ...d.meta, surveyType: e.target.value as SurveyFormsDraft['meta']['surveyType'] } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2">
                <option value="مسح قبول أولي">مسح قبول أولي</option>
                <option value="مسح دوري">مسح دوري</option>
                <option value="مسح تحقيقي">مسح تحقيقي</option>
                <option value="متابعة تعديل">متابعة تعديل</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-bold">اسم المنشأة (أو رمز تعليمي دون أسماء أفراد)</span>
              <input type="text" value={draft.meta.facilityName} onChange={(e) => updateDraft((d) => ({ ...d, meta: { ...d.meta, facilityName: e.target.value } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="font-bold">القسم والغرفة</span>
              <input type="text" value={draft.meta.departmentAndRoom} onChange={(e) => updateDraft((d) => ({ ...d, meta: { ...d.meta, departmentAndRoom: e.target.value } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2" />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <label className="space-y-1">
              <span className="font-bold">مرجع معيار المقارنة (وثيقة / بند)</span>
              <input type="text" value={draft.f01Preparation.criterionReference} onChange={(e) => updateDraft((d) => ({ ...d, f01Preparation: { ...d.f01Preparation, criterionReference: e.target.value } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">قاعدة القرار المعتمدة قبل البدء</span>
              <input type="text" value={draft.f01Preparation.decisionRule} onChange={(e) => updateDraft((d) => ({ ...d, f01Preparation: { ...d.f01Preparation, decisionRule: e.target.value } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="font-bold">المشمول والمستبعد من النطاق</span>
              <textarea rows={2} value={draft.f01Preparation.excludedScope} onChange={(e) => updateDraft((d) => ({ ...d, f01Preparation: { ...d.f01Preparation, excludedScope: e.target.value } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2" />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#050E1D] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2.5 text-right">بند التحقق قبل بدء المسح</th>
                  <th className="p-2.5 text-right w-32">الحالة</th>
                  <th className="p-2.5 text-right">ملاحظة وتوثيق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {draft.f01Preparation.checklist.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-semibold">{item.item}</td>
                    <td className="p-2">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateDraft((d) => ({
                            ...d,
                            f01Preparation: {
                              ...d.f01Preparation,
                              checklist: d.f01Preparation.checklist.map((x, i) =>
                                i === idx ? { ...x, status: e.target.value as 'نعم' | 'لا' | 'لا ينطبق' } : x
                              ),
                            },
                          }))
                        }
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1"
                      >
                        <option value="نعم">نعم</option>
                        <option value="لا">لا</option>
                        <option value="لا ينطبق">لا ينطبق</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) =>
                          updateDraft((d) => ({
                            ...d,
                            f01Preparation: {
                              ...d.f01Preparation,
                              checklist: d.f01Preparation.checklist.map((x, i) =>
                                i === idx ? { ...x, note: e.target.value } : x
                              ),
                            },
                          }))
                        }
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* F02: Equipment & Geometry */}
      {activeTab === 'F02' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">نموذج F02: بطاقة الجهاز والإعداد الهندسي والميداني</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {(
              [
                ['setupCode', 'رمز الإعداد (مثل S01)'],
                ['clinicalDevice', 'الجهاز الإشعاعي الطبي'],
                ['surveyInstrument', 'جهاز المسح الإشعاعي ونسخته'],
                ['serialNumbers', 'الأرقام التسلسلية'],
                ['calibrationDetails', 'بيانات شهادة المعايرة وسريانها'],
                ['measuredQuantityAndRange', 'الكمية المقاسة والنطاق الموثق'],
                ['energyAndPulseSuitability', 'ملاءمة الطاقة والحقل النبضي'],
                ['integrationMode', 'وضع القياس والتكامل'],
                ['prePostFunctionalCheck', 'الفحص الوظيفي قبل وبعد المهمة'],
                ['backgroundMethod', 'طريقة قياس الخلفية وقيمتها'],
                ['kvpOrEnergy', 'الجهد / الطاقة (kVp / MV)'],
                ['masOrMu', 'الخرج (mAs / MU)'],
                ['fieldSizeAndSid', 'حجم الحقل ومسافة SID'],
                ['phantomDescription', 'الفانتوم وأبعاده وموضعه'],
                ['beamDirectionAndAngles', 'اتجاه الحزمة والزوايا'],
                ['detectorPositionAndHeight', 'ارتفاع الكاشف ومسافته عن الحاجز'],
              ] as [keyof SurveyFormsDraft['f02EquipmentGeometry'], string][]
            ).map(([field, label]) => (
              <label key={field} className="space-y-1">
                <span className="font-bold text-[#001F4D] dark:text-slate-200">{label}</span>
                <input
                  type="text"
                  value={draft.f02EquipmentGeometry[field]}
                  onChange={(e) =>
                    updateDraft((d) => ({
                      ...d,
                      f02EquipmentGeometry: { ...d.f02EquipmentGeometry, [field]: e.target.value },
                    }))
                  }
                  className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2"
                />
              </label>
            ))}
          </div>
        </section>
      )}

      {/* F03: Raw Readings */}
      {activeTab === 'F03' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">نموذج F03: سجل القراءات الخام وطرح الخلفية التلقائي</h2>
              <p className="text-xs text-slate-500">الكمية والوحدة: {draft.f03RawReadings.quantityUnit} — تُحفظ القيم الصافية السالبة كما هي إحصائيًا.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateDraft((d) => ({
                  ...d,
                  f03RawReadings: {
                    ...d.f03RawReadings,
                    rows: [
                      ...d.f03RawReadings.rows,
                      {
                        id: `r${Date.now()}`,
                        pointCode: `MP-0${d.f03RawReadings.rows.length + 4}`,
                        location: 'نقطة جديدة',
                        windowSec: 120,
                        exposures: 10,
                        rawTotal: 0.05,
                        bgRatePerHour: 0.06,
                        notes: '',
                      },
                    ],
                  },
                }))
              }
              className="rounded-lg bg-[#00D1CE] px-3.5 py-2 text-xs font-bold text-[#001F4D]"
            >
              إضافة صف قراءة
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#050E1D] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2 text-right">النقطة</th>
                  <th className="p-2 text-right">الموقع</th>
                  <th className="p-2 text-right">النافذة (s)</th>
                  <th className="p-2 text-right">التعرضات n</th>
                  <th className="p-2 text-right">الخام H_on</th>
                  <th className="p-2 text-right">الخلفية b (µSv/h)</th>
                  <th className="p-2 text-right">H_bg</th>
                  <th className="p-2 text-right">الصافي H_net</th>
                  <th className="p-2 text-right">h لكل تعرض</th>
                  <th className="p-2 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {f03Computed.map(({ row, bgContrib, net, perExp }, idx) => (
                  <tr key={row.id}>
                    <td className="p-2">
                      <input type="text" value={row.pointCode} onChange={(e) => updateDraft((d) => ({ ...d, f03RawReadings: { ...d.f03RawReadings, rows: d.f03RawReadings.rows.map((x, i) => i === idx ? { ...x, pointCode: e.target.value } : x) } }))} dir="ltr" className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 font-mono" />
                    </td>
                    <td className="p-2 min-w-[150px]">
                      <input type="text" value={row.location} onChange={(e) => updateDraft((d) => ({ ...d, f03RawReadings: { ...d.f03RawReadings, rows: d.f03RawReadings.rows.map((x, i) => i === idx ? { ...x, location: e.target.value } : x) } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={row.windowSec} onChange={(e) => updateDraft((d) => ({ ...d, f03RawReadings: { ...d.f03RawReadings, rows: d.f03RawReadings.rows.map((x, i) => i === idx ? { ...x, windowSec: Number(e.target.value) } : x) } }))} dir="ltr" className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 font-mono" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="1" value={row.exposures} onChange={(e) => updateDraft((d) => ({ ...d, f03RawReadings: { ...d.f03RawReadings, rows: d.f03RawReadings.rows.map((x, i) => i === idx ? { ...x, exposures: Number(e.target.value) } : x) } }))} dir="ltr" className="w-14 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 font-mono" />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.001" value={row.rawTotal} onChange={(e) => updateDraft((d) => ({ ...d, f03RawReadings: { ...d.f03RawReadings, rows: d.f03RawReadings.rows.map((x, i) => i === idx ? { ...x, rawTotal: Number(e.target.value) } : x) } }))} dir="ltr" className="w-20 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 font-mono" />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.005" value={row.bgRatePerHour} onChange={(e) => updateDraft((d) => ({ ...d, f03RawReadings: { ...d.f03RawReadings, rows: d.f03RawReadings.rows.map((x, i) => i === idx ? { ...x, bgRatePerHour: Number(e.target.value) } : x) } }))} dir="ltr" className="w-18 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 font-mono" />
                    </td>
                    <td className="p-2 font-mono"><Ltr>{formatPrecision(bgContrib, 4)}</Ltr></td>
                    <td className="p-2 font-mono font-bold text-[#001F4D] dark:text-[#00D1CE]"><Ltr>{formatPrecision(net, 4)}</Ltr></td>
                    <td className="p-2 font-mono font-bold"><Ltr>{formatPrecision(perExp, 5)}</Ltr></td>
                    <td className="p-2 text-center">
                      {draft.f03RawReadings.rows.length > 1 && (
                        <button type="button" onClick={() => updateDraft((d) => ({ ...d, f03RawReadings: { ...d.f03RawReadings, rows: d.f03RawReadings.rows.filter((_, i) => i !== idx) } }))} className="text-rose-700 dark:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* F04: Weekly/Annual Estimation */}
      {activeTab === 'F04' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">نموذج F04: التقدير الأسبوعي والسنوي ومقارنة المعيار</h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <label className="space-y-1">
              <span className="font-bold">أسابيع التشغيل/سنة</span>
              <input type="number" value={draft.f04Estimation.operatingWeeksPerYear} onChange={(e) => updateDraft((d) => ({ ...d, f04Estimation: { ...d.f04Estimation, operatingWeeksPerYear: Number(e.target.value) } }))} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">عدم اليقين الموسع النسبي (%)</span>
              <input type="number" value={draft.f04Estimation.expandedUncertaintyPercent} onChange={(e) => updateDraft((d) => ({ ...d, f04Estimation: { ...d.f04Estimation, expandedUncertaintyPercent: Number(e.target.value) } }))} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">معيار المقارنة المختار</span>
              <input type="number" step="any" value={draft.f04Estimation.comparisonCriterionValue} onChange={(e) => updateDraft((d) => ({ ...d, f04Estimation: { ...d.f04Estimation, comparisonCriterionValue: Number(e.target.value) } }))} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2 font-mono" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">وحدة المعيار</span>
              <select value={draft.f04Estimation.comparisonCriterionUnit} onChange={(e) => updateDraft((d) => ({ ...d, f04Estimation: { ...d.f04Estimation, comparisonCriterionUnit: e.target.value as 'µSv/week' | 'mSv/year' } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-2">
                <option value="µSv/week">µSv/week</option>
                <option value="mSv/year">mSv/year</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#050E1D] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2 text-right">النقطة</th>
                  <th className="p-2 text-right">الموقع / الوضع</th>
                  <th className="p-2 text-right">h (µSv/تعرض)</th>
                  <th className="p-2 text-right">تعرض/أسبوع</th>
                  <th className="p-2 text-right">T</th>
                  <th className="p-2 text-right">الأسبوعي (µSv)</th>
                  <th className="p-2 text-right">Y + U</th>
                  <th className="p-2 text-right">السنوي (mSv)</th>
                  <th className="p-2 text-right">نتيجة المقارنة المشروطة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {f04Computed.map(({ row, weekly, annualMilli, high, outcomeLabel }, idx) => (
                  <tr key={row.id}>
                    <td className="p-2 font-mono font-bold"><Ltr>{row.pointCode}</Ltr></td>
                    <td className="p-2">{row.modeLabel}</td>
                    <td className="p-2">
                      <input type="number" step="0.001" value={row.dosePerExposure} onChange={(e) => updateDraft((d) => ({ ...d, f04Estimation: { ...d.f04Estimation, rows: d.f04Estimation.rows.map((x, i) => i === idx ? { ...x, dosePerExposure: Number(e.target.value) } : x) } }))} dir="ltr" className="w-20 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 font-mono" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={row.weeklyExposures} onChange={(e) => updateDraft((d) => ({ ...d, f04Estimation: { ...d.f04Estimation, rows: d.f04Estimation.rows.map((x, i) => i === idx ? { ...x, weeklyExposures: Number(e.target.value) } : x) } }))} dir="ltr" className="w-20 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 font-mono" />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.05" min="0.05" max="1" value={row.occupancyT} onChange={(e) => updateDraft((d) => ({ ...d, f04Estimation: { ...d.f04Estimation, rows: d.f04Estimation.rows.map((x, i) => i === idx ? { ...x, occupancyT: Number(e.target.value) } : x) } }))} dir="ltr" className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 font-mono" />
                    </td>
                    <td className="p-2 font-mono font-bold"><Ltr>{formatPrecision(weekly, 2)}</Ltr></td>
                    <td className="p-2 font-mono font-bold text-[#007574] dark:text-[#00D1CE]"><Ltr>{formatPrecision(high, 2)}</Ltr></td>
                    <td className="p-2 font-mono"><Ltr>{formatPrecision(annualMilli, 3)}</Ltr></td>
                    <td className="p-2 font-semibold">{outcomeLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AssessmentBanner outcome={overallOutcome.outcome} statement={overallOutcome.statement} />
        </section>
      )}

      {/* F05: Contamination & Wipes */}
      {activeTab === 'F05' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">نموذج F05: سجل مسح التلوث السطحي والمسحات (الطب النووي)</h2>
            <label className="inline-flex items-center gap-2 text-xs font-bold">
              <input
                type="checkbox"
                checked={draft.f05Contamination.applicable}
                onChange={(e) => updateDraft((d) => ({ ...d, f05Contamination: { ...d.f05Contamination, applicable: e.target.checked } }))}
              />
              <span>ينطبق على هذا المسح (مصادر غير مختومة)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="space-y-1">
              <span className="font-bold">النظير الإشعاعي</span>
              <input type="text" value={draft.f05Contamination.isotope} onChange={(e) => updateDraft((d) => ({ ...d, f05Contamination: { ...d.f05Contamination, isotope: e.target.value } }))} className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">كفاءة العد الكلية ε</span>
              <input type="number" step="0.01" value={draft.f05Contamination.efficiency} onChange={(e) => updateDraft((d) => ({ ...d, f05Contamination: { ...d.f05Contamination, efficiency: Number(e.target.value) } }))} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" />
            </label>
            <label className="space-y-1">
              <span className="font-bold">كفاءة الاسترجاع f (اختياري)</span>
              <input type="number" step="0.05" value={draft.f05Contamination.removalFactor} onChange={(e) => updateDraft((d) => ({ ...d, f05Contamination: { ...d.f05Contamination, removalFactor: Number(e.target.value) } }))} dir="ltr" className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2.5 py-1.5 font-mono" />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#050E1D] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2 text-right">العينة</th>
                  <th className="p-2 text-right">الموقع</th>
                  <th className="p-2 text-right">S (cm²)</th>
                  <th className="p-2 text-right">N_s / t_s</th>
                  <th className="p-2 text-right">N_b / t_b</th>
                  <th className="p-2 text-right">R_net (cps)</th>
                  <th className="p-2 text-right">المجمع (Bq/cm²)</th>
                  <th className="p-2 text-right">المقدر مع f (Bq/cm²)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {f05Computed.map(({ row, res }) => (
                  <tr key={row.id}>
                    <td className="p-2 font-mono font-bold"><Ltr>{row.sampleCode}</Ltr></td>
                    <td className="p-2">{row.location}</td>
                    <td className="p-2 font-mono"><Ltr>{row.areaCm2}</Ltr></td>
                    <td className="p-2 font-mono"><Ltr>{row.ns} / {row.ts}s</Ltr></td>
                    <td className="p-2 font-mono"><Ltr>{row.nb} / {row.tb}s</Ltr></td>
                    <td className="p-2 font-mono">{res.valid ? <Ltr>{formatPrecision(res.rNetCps ?? 0, 3)}</Ltr> : '—'}</td>
                    <td className="p-2 font-mono font-bold text-[#007574] dark:text-[#00D1CE]">
                      {res.valid ? <Ltr>{formatPrecision(res.collectedPerAreaBqCm2 ?? 0, 4)}</Ltr> : '—'}
                    </td>
                    <td className="p-2 font-mono font-bold">
                      {res.valid && res.removableEstimateBqCm2 !== undefined ? <Ltr>{formatPrecision(res.removableEstimateBqCm2, 4)}</Ltr> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* F06: Findings & Pre-release QA */}
      {activeTab === 'F06' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 space-y-6">
          <h2 className="text-lg font-bold text-[#001F4D] dark:text-white">نموذج F06: سجل الملاحظات والإجراءات التصحيحية وقائمة تدقيق ما قبل الإصدار</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#050E1D] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2 text-right">الرقم</th>
                  <th className="p-2 text-right">التصنيف</th>
                  <th className="p-2 text-right">الدليل والنقطة</th>
                  <th className="p-2 text-right">الإجراء المطلوب</th>
                  <th className="p-2 text-right">الأولوية</th>
                  <th className="p-2 text-right">المسمى المسؤول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {draft.f06Findings.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2 font-mono font-bold"><Ltr>{r.code}</Ltr></td>
                    <td className="p-2 font-bold">{r.category}</td>
                    <td className="p-2">{r.evidenceAndPoint}</td>
                    <td className="p-2">{r.requiredAction}</td>
                    <td className="p-2 font-bold">{r.priority}</td>
                    <td className="p-2">{r.responsibleRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#001F4D] dark:text-white">قائمة تدقيق ما قبل إصدار التقرير (10 بنود)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {draft.f06Findings.preReleaseChecklist.map((item, idx) => (
                <label key={idx} className="flex items-start gap-2 rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) =>
                      updateDraft((d) => ({
                        ...d,
                        f06Findings: {
                          ...d.f06Findings,
                          preReleaseChecklist: d.f06Findings.preReleaseChecklist.map((x, i) =>
                            i === idx ? { ...x, checked: e.target.checked } : x
                          ),
                        },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* F07: Complete Printable Arabic A4 Technical Report */}
      {activeTab === 'F07' && (
        <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-6 sm:p-8 space-y-6 text-sm print:border-0 print:p-0 print:bg-white print:text-slate-900">
          {/* Report Institutional Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#001F4D] pb-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#007574] dark:text-[#00D1CE]">
                {draft.meta.isSimulatedEducational ? 'تقرير تعليمي — بيانات محاكاة' : 'مسودة تقرير فني للمسح الإشعاعي الطبي'}
              </div>
              <h2 className="text-2xl font-bold text-[#001F4D] dark:text-white">
                تقرير المسح الإشعاعي الطبي — <Ltr>{draft.meta.reportNumber}</Ltr>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                الإصدار: <Ltr>{draft.meta.reportVersion}</Ltr> · تاريخ القياس: <Ltr>{draft.meta.measurementDate}</Ltr> · تاريخ الإصدار: <Ltr>{draft.meta.issueDate}</Ltr> · محرك الحسابات: <Ltr>{draft.meta.calculatorVersion}</Ltr>
              </p>
            </div>
            <div className="w-28 bg-white rounded p-1.5 border border-slate-200">
              <img src={LOGO_PATH} alt="شعار المسح الإشعاعي الطبي" className="w-full h-auto object-contain" />
            </div>
          </div>

          {/* 12 Required Report Elements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-[#050E1D] rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <div><strong>1. المنشأة والقسم والغرفة:</strong> {draft.meta.facilityName} — {draft.meta.departmentAndRoom}</div>
            <div><strong>2. نوع المسح:</strong> {draft.meta.surveyType}</div>
            <div><strong>3. الجهاز السريري والإعداد:</strong> {draft.f02EquipmentGeometry.clinicalDevice} (<Ltr>{draft.f02EquipmentGeometry.setupCode}</Ltr>)</div>
            <div><strong>4. جهاز المسح ومعايرته:</strong> {draft.f02EquipmentGeometry.surveyInstrument} — {draft.f02EquipmentGeometry.calibrationDetails}</div>
            <div className="md:col-span-2"><strong>5. معيار المقارنة وقاعدة القرار:</strong> {draft.f01Preparation.criterionValueAndPeriod} — {draft.f01Preparation.criterionReference}</div>
          </div>

          <section className="space-y-2 print-break-avoid">
            <h3 className="font-bold text-base text-[#001F4D] dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" />
              <span>6. الهدف والنطاق والمستبعدات</span>
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{draft.f07ReportNarrative.objectiveAndScope}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400"><strong>المستبعد صراحة:</strong> {draft.f01Preparation.excludedScope}</p>
          </section>

          <section className="space-y-2 print-break-avoid">
            <h3 className="font-bold text-base text-[#001F4D] dark:text-white">7. وصف الغرفة والمجاورات والهندسة الميدانية</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{draft.f07ReportNarrative.facilityAndAdjacencySummary}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              ظروف التشغيل: <Ltr>{draft.f02EquipmentGeometry.kvpOrEnergy}</Ltr> · <Ltr>{draft.f02EquipmentGeometry.masOrMu}</Ltr> · {draft.f02EquipmentGeometry.fieldSizeAndSid} · {draft.f02EquipmentGeometry.phantomDescription} · {draft.f02EquipmentGeometry.detectorPositionAndHeight}
            </p>
          </section>

          <section className="space-y-3 print-break-avoid">
            <h3 className="font-bold text-base text-[#001F4D] dark:text-white">8. ملخص القراءات الخام والصافية والتقديرات الأسبوعية والسنوية</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#050E1D]">
                    <th className="p-2 border border-slate-300 dark:border-slate-700 text-right">النقطة</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700 text-right">الموقع</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700 text-right">H_on (µSv)</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700 text-right">H_net (µSv)</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700 text-right">الأسبوعي (µSv)</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700 text-right">Y + U</th>
                    <th className="p-2 border border-slate-300 dark:border-slate-700 text-right">السنوي (mSv)</th>
                  </tr>
                </thead>
                <tbody>
                  {f04Computed.map((est) => {
                    const rawMatch = f03Computed.find((r) => r.row.pointCode === est.row.pointCode);
                    return (
                      <tr key={est.row.id}>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold"><Ltr>{est.row.pointCode}</Ltr></td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{est.row.modeLabel}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono">{rawMatch ? <Ltr>{rawMatch.row.rawTotal}</Ltr> : '—'}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono">{rawMatch ? <Ltr>{formatPrecision(rawMatch.net, 4)}</Ltr> : '—'}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold"><Ltr>{formatPrecision(est.weekly, 2)}</Ltr></td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold"><Ltr>{formatPrecision(est.high, 2)}</Ltr></td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono"><Ltr>{formatPrecision(est.annualMilli, 3)}</Ltr></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2 print-break-avoid">
            <h3 className="font-bold text-base text-[#001F4D] dark:text-white">9. المناقشة والافتراضات وحدود الاستنتاج</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{draft.f07ReportNarrative.discussionText}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400"><strong>الافتراضات:</strong> {draft.f04Estimation.keyAssumptions}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400"><strong>الحدود:</strong> {draft.f04Estimation.conclusionLimitations}</p>
          </section>

          <section className="space-y-3 print-break-avoid">
            <h3 className="font-bold text-base text-[#001F4D] dark:text-white">10. الخلاصة المقيدة بالنطاق المختبر</h3>
            <AssessmentBanner outcome={overallOutcome.outcome} statement={overallOutcome.statement} />
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{draft.f07ReportNarrative.conclusionText}</p>
          </section>

          <section className="space-y-2 print-break-avoid">
            <h3 className="font-bold text-base text-[#001F4D] dark:text-white">11. الملاحظات والإجراءات التصحيحية والمرفقات</h3>
            <ul className="list-disc pr-5 text-xs space-y-1 text-slate-700 dark:text-slate-300">
              {draft.f06Findings.rows.map((f) => (
                <li key={f.id}>
                  <strong>[{f.category} — أولوية {f.priority}]</strong> {f.evidenceAndPoint} ← <em>{f.requiredAction}</em> (المسؤول: {f.responsibleRole})
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-1"><strong>المرفقات:</strong> {draft.f07ReportNarrative.attachmentsList}</p>
          </section>

          {/* 12. Manual Review/Signature Blocks — NEVER auto-generated signatures or seals */}
          <section className="border-t border-slate-300 dark:border-slate-700 pt-4 space-y-3 print-break-avoid">
            <h3 className="font-bold text-sm text-[#001F4D] dark:text-white">12. خانات المراجعة والتوقيع اليدوي بعد الطباعة (لا يُنشئ النظام توقيعًا أو ختمًا آليًا)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded border border-slate-300 dark:border-slate-700 p-3 space-y-4">
                <div className="font-bold">المُعدّ (الفيزيائي الطبي / منفذ المسح)</div>
                <div className="text-slate-500">المسمى الوظيفي: ________________</div>
                <div className="text-slate-500">التوقيع اليدوي والتاريخ: __________</div>
              </div>
              <div className="rounded border border-slate-300 dark:border-slate-700 p-3 space-y-4">
                <div className="font-bold">المراجع الفني المستقل</div>
                <div className="text-slate-500">المسمى الوظيفي: ________________</div>
                <div className="text-slate-500">التوقيع اليدوي والتاريخ: __________</div>
              </div>
              <div className="rounded border border-slate-300 dark:border-slate-700 p-3 space-y-4">
                <div className="font-bold">الاعتماد الإداري بالمنشأة (إن لزم)</div>
                <div className="text-slate-500">المسمى الوظيفي: ________________</div>
                <div className="text-slate-500">التوقيع اليدوي والتاريخ: __________</div>
              </div>
            </div>
          </section>
        </article>
      )}
    </div>
  );
};
