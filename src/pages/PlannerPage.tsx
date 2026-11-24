import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Compass,
  Download,
  Layers,
  Printer,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { DEFAULT_ROOM_PLAN } from '../data/forms';
import { LAST_GLOBAL_REVIEW_DATE } from '../data/references';
import { calculateCoordinatesDistance, formatPrecision } from '../logic/calculators';
import { loadDraftRecord, saveDraftRecord, triggerDownloadFile } from '../utils/storage';
import { Breadcrumbs, Ltr, ScientificMetaPanel } from '../components/SharedUI';
import type { RoomBarrier, RoomPlanState, RoomPoint } from '../types';

interface PlannerPageProps {
  onNavigate: (path: string) => void;
}

type PrintScale = '1:25' | '1:50' | '1:100';

const PLANNER_META = {
  referenceIds: ['iaea-ssg-46', 'iaea-tecdoc-1732'],
  lastReviewed: LAST_GLOBAL_REVIEW_DATE,
  status: 'مُراجع' as const,
  assumptions: [
    'المحور السيني X يمتد من الجدار الغربي نحو الشرقي، والمحور الصادي Y من الجدار الجنوبي نحو الشمالي، والأصل (0,0) هو الركن الداخلي الجنوبي الغربي على منسوب أرضية غرفة المسح FFL = 0.00 m.',
    'الإحداثي الرأسي z مطلق بالنسبة لأرضية غرفة المسح (مثل z = +4.60 m للطابق الأعلى عند ارتفاع 1.00 m من أرضيته، وz = −1.10 m للطابق الأسفل عند ارتفاع 2.20 m من أرضيته).',
    'الرموز SRC-01 وTAB-01 وBAR-01..04 وMP-01..07 مفصولة صراحة عن رموز النماذج F01–F07 لمنع أي التباس في التقرير.',
  ],
  limitations: [
    'هذا المخطط أداة توثيق هندسي وتعليمي للمسح الإشعاعي فقط، ولا يُعد تصميم تدريع تنفيذيًا أو اعتمادًا إنشائيًا أو بديلًا عن مخططات As-built المعتمدة.',
    'سماكات الجدران المرسومة هندسية ولا تُثبت تكافؤ الرصاص ما لم تُرفق وثيقة تدريع محققة.',
    'الدقة المطبوعة بمقياس 1:50 تتطلب الطباعة بنسبة 100% (Actual Size) والتحقق بالمسطرة من شريط المعايرة المطبوع على الورقة.',
  ],
};

export const PlannerPage: React.FC<PlannerPageProps> = ({ onNavigate }) => {
  const [plan, setPlan] = useState<RoomPlanState>(DEFAULT_ROOM_PLAN);
  const [screenZoom, setScreenZoom] = useState<number>(100);
  const [printScale, setPrintScale] = useState<PrintScale>('1:50');
  const [activeTab, setActiveTab] = useState<'points' | 'barriers' | 'adjacencies' | 'geometry'>('points');
  const [selectedPointId, setSelectedPointId] = useState<string>('MP-04');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let mounted = true;
    loadDraftRecord<RoomPlanState>('room_plan', DEFAULT_ROOM_PLAN).then((loaded) => {
      if (mounted && loaded && loaded.lengthX > 0 && Array.isArray(loaded.points)) {
        setPlan(loaded);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const persistPlan = async (next: RoomPlanState, showToast = false) => {
    setPlan(next);
    await saveDraftRecord('room_plan', next);
    if (showToast) {
      setSaveNotice('تم حفظ المخطط محليًا على هذا المتصفح.');
      setTimeout(() => setSaveNotice(null), 2600);
    }
  };

  // SVG Coordinate projection: 1 meter = 60 SVG units; generous exterior margin for adjacent rooms & external points
  const PX_PER_M = 60;
  const MARGIN_M = 1.9;
  const vbWidth = (plan.lengthX + MARGIN_M * 2) * PX_PER_M;
  const vbHeight = (plan.widthY + MARGIN_M * 2) * PX_PER_M;

  // Room interior origin (0,0) = South-West corner
  const toSvgX = (xM: number) => (xM + MARGIN_M) * PX_PER_M;
  const toSvgY = (yM: number) => (plan.widthY - yM + MARGIN_M) * PX_PER_M;

  const clientToMeters = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const svgX = ((clientX - rect.left) / rect.width) * vbWidth;
    const svgY = ((clientY - rect.top) / rect.height) * vbHeight;
    const xM = Number((svgX / PX_PER_M - MARGIN_M).toFixed(2));
    const yM = Number((plan.widthY - (svgY / PX_PER_M - MARGIN_M)).toFixed(2));
    return {
      x: Math.max(-1.6, Math.min(plan.lengthX + 1.6, xM)),
      y: Math.max(-1.6, Math.min(plan.widthY + 1.6, yM)),
    };
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId) return;
    const coords = clientToMeters(e.clientX, e.clientY);
    if (!coords) return;
    setPlan((prev) => ({
      ...prev,
      points: prev.points.map((pt) =>
        pt.id === draggingId ? { ...pt, x: coords.x, y: coords.y } : pt
      ),
    }));
  };

  const handleSvgPointerUp = () => {
    if (draggingId) {
      setDraggingId(null);
      saveDraftRecord('room_plan', plan);
    }
  };

  const pointMetrics = useMemo(() => {
    return plan.points.map((pt) => {
      const res = calculateCoordinatesDistance({
        xf: plan.source.x,
        yf: plan.source.y,
        zf: plan.source.z,
        xp: pt.x,
        yp: pt.y,
        zp: pt.z,
      });
      return {
        point: pt,
        rxy: res.horizontalDistanceM ?? 0,
        d3d: res.distance3DM ?? 0,
      };
    });
  }, [plan.points, plan.source]);

  const updatePoint = (id: string, patch: Partial<RoomPoint>) => {
    const next: RoomPlanState = {
      ...plan,
      points: plan.points.map((pt) => {
        if (pt.id !== id) return pt;
        const updated = { ...pt, ...patch };
        if (patch.floorLevel !== undefined || patch.localHeightM !== undefined) {
          const baseFFL =
            updated.floorLevel === 'above'
              ? plan.upperFloorFFL
              : updated.floorLevel === 'below'
                ? plan.lowerFloorFFL
                : 0;
          updated.z = Number((baseFFL + updated.localHeightM).toFixed(2));
        }
        return updated;
      }),
    };
    persistPlan(next);
  };

  const addPoint = () => {
    const nextNum = plan.points.length + 1;
    const code = `MP-${String(nextNum).padStart(2, '0')}`;
    const newPt: RoomPoint = {
      id: code,
      label: `نقطة إضافية ${code}`,
      locationDescription: 'حدّد الوصف والارتفاع والواجهة الملاصقة',
      x: Number((plan.lengthX / 2).toFixed(2)),
      y: -0.5,
      z: 1.2,
      floorLevel: 'same',
      localHeightM: 1.2,
    };
    const next = { ...plan, points: [...plan.points, newPt] };
    setSelectedPointId(code);
    persistPlan(next, true);
  };

  const removePoint = (id: string) => {
    if (plan.points.length <= 1) return;
    const next = { ...plan, points: plan.points.filter((p) => p.id !== id) };
    persistPlan(next);
  };

  const updateBarrier = (id: string, patch: Partial<RoomBarrier>) => {
    const next = {
      ...plan,
      barriers: plan.barriers.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    };
    persistPlan(next);
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(svgRef.current);
    triggerDownloadFile(`${plan.roomCode}_plan_${printScale.replace(':', '-')}.svg`, raw, 'image/svg+xml;charset=utf-8');
  };

  const scaleFactor = printScale === '1:25' ? 25 : printScale === '1:100' ? 100 : 50;
  // Physical print dimensions in mm for A4 verification bar (2 meters represented at selected printScale)
  const twoMetersOnPaperCm = (200 / scaleFactor).toFixed(2);
  const printSvgWidthMm = Math.min(182, ((plan.lengthX + MARGIN_M * 2) * 1000) / scaleFactor);

  // Wall thicknesses in meters for drawing
  const westWall = plan.barriers.find((b) => b.side === 'west')?.thicknessM ?? 0.2;
  const southWall = plan.barriers.find((b) => b.side === 'south')?.thicknessM ?? 0.2;
  const eastWall = plan.barriers.find((b) => b.side === 'east')?.thicknessM ?? 0.2;
  const northWall = plan.barriers.find((b) => b.side === 'north')?.thicknessM ?? 0.2;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'الرئيسية', path: '/' }, { label: 'المخطط التفاعلي للغرفة' }]} onNavigate={onNavigate} />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-3xl font-bold text-[#001F4D] dark:text-white">
            المخطط التفاعلي للغرفة والمجاورات (<Ltr>1:50</Ltr> وقطاع رأسي)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            توثيق الأبعاد الداخلية، والحواجز <Ltr>BAR-01..04</Ltr>، والمصدر <Ltr>SRC-01</Ltr>، ونقاط القياس <Ltr>MP-01..07</Ltr>، والمجاورات الأفقية والرأسية مع حساب المسافات <Ltr>2D/3D</Ltr> والطباعة المقياسية على ورق <Ltr>A4</Ltr>.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => persistPlan(plan, true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#001F4D] px-3.5 py-2 text-xs font-bold text-white hover:opacity-90"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>حفظ محلي</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00D1CE] px-3.5 py-2 text-xs font-bold text-[#001F4D] hover:opacity-90"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>طباعة A4 بمقياس {printScale}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-[#001F4D] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>تصدير SVG</span>
          </button>
          <button
            type="button"
            onClick={() => persistPlan(DEFAULT_ROOM_PLAN, true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>استعادة 6×5 m</span>
          </button>
        </div>
      </header>

      {saveNotice && (
        <div role="status" className="no-print rounded-lg bg-[#E6FAFA] dark:bg-[#0D2533] border border-[#007574]/30 px-4 py-2 text-xs font-bold text-[#001F4D] dark:text-[#00D1CE]">
          {saveNotice}
        </div>
      )}

      {/* Mandatory Disclaimer Banner */}
      <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs text-amber-950 dark:text-amber-100 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong>تنبيه منهجي وطباعي:</strong> هذا المخطط تعليمي وتوثيقي للمسح الإشعاعي وليس مخطط تصميم تدريع أو اعتمادًا رسميًا. عند الطباعة على ورق <Ltr>A4</Ltr> اختر حجم طباعة <Ltr>100% (Actual Size)</Ltr>؛ لأن تفعيل «ملاءمة للصفحة / Fit to page» يغيّر مقياس الرسم الفعلي. تحقق بالمسطرة من شريط المعايرة (<Ltr>2.00 m = {twoMetersOnPaperCm} cm</Ltr> عند مقياس <Ltr>{printScale}</Ltr>).
        </p>
      </div>

      {/* Controls Separation Bar: Screen Zoom vs Print Scale */}
      <div className="no-print rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-[#001F4D] dark:text-white">تكبير الشاشة (للعرض فقط):</span>
          {[75, 100, 125, 150].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setScreenZoom(z)}
              className={`rounded px-2.5 py-1 font-bold border ${
                screenZoom === z
                  ? 'bg-[#001F4D] text-white border-[#001F4D]'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Ltr>{z}%</Ltr>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-[#001F4D] dark:text-white">مقياس الطباعة على ورق A4:</span>
          {(['1:25', '1:50', '1:100'] as PrintScale[]).map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => setPrintScale(sc)}
              className={`rounded px-2.5 py-1 font-bold border ${
                printScale === sc
                  ? 'bg-[#00D1CE] text-[#001F4D] border-[#007574]'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Ltr>{sc}</Ltr>
            </button>
          ))}
          <span className="text-slate-500 dark:text-slate-400">
            شريط التحقق: <Ltr>2 m = {twoMetersOnPaperCm} cm</Ltr>
          </span>
        </div>
      </div>

      {/* Main Canvas Grid: 2D Floor Plan + Vertical Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* 2D Scaled Plan */}
        <section className="xl:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-4 sm:p-5 space-y-4 print-break-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#001F4D] dark:text-white">{plan.planTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                رمز الغرفة: <Ltr>{plan.roomCode}</Ltr> · الأبعاد الداخلية: <Ltr>{plan.lengthX.toFixed(2)} × {plan.widthY.toFixed(2)} m</Ltr> · الارتفاع الصافي: <Ltr>{plan.clearHeightZ.toFixed(2)} m</Ltr> · مقياس الطباعة: <Ltr>{printScale}</Ltr> (A4)
              </p>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" aria-hidden="true" />
              <span>{plan.northVerified ? 'شمال جغرافي محقق' : 'اتجاه شمال محلي افتراضي'}</span>
            </div>
          </div>

          <p className="no-print text-xs text-slate-600 dark:text-slate-400">
            اسحب نقاط القياس الموجودة على نفس الطابق (<Ltr>MP-01..MP-05</Ltr>) مباشرة على المخطط أو عدّل إحداثياتها <Ltr>(x, y, z)</Ltr> بدقة في الجدول أدناه. الأصل <Ltr>(0,0)</Ltr> هو الركن الداخلي الجنوبي الغربي.
          </p>

          <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-2">
            <div
              style={{
                width: `${screenZoom}%`,
                minWidth: '520px',
                maxWidth: '100%',
              }}
              className="mx-auto print:w-auto"
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${vbWidth} ${vbHeight}`}
                className="w-full h-auto select-none touch-none"
                style={{ maxWidth: '100%' }}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerLeave={handleSvgPointerUp}
                role="img"
                aria-label="مخطط أفقي تفاعلي لغرفة الأشعة ونقاط القياس والمجاورات"
              >
                <defs>
                  <pattern id="grid-1m" width={PX_PER_M} height={PX_PER_M} patternUnits="userSpaceOnUse">
                    <path
                      d={`M ${PX_PER_M} 0 L 0 0 0 ${PX_PER_M}`}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="0.9"
                    />
                  </pattern>
                </defs>

                {/* Light Engineering Background */}
                <rect x="0" y="0" width={vbWidth} height={vbHeight} fill="#FFFFFF" />
                <rect
                  x={toSvgX(0)}
                  y={toSvgY(plan.widthY)}
                  width={plan.lengthX * PX_PER_M}
                  height={plan.widthY * PX_PER_M}
                  fill="url(#grid-1m)"
                />

                {/* Adjacency Zone Labels (A01-A04) */}
                <text x={toSvgX(-1.05)} y={toSvgY(plan.widthY / 2)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#001F4D">
                  A01 مكتب (غرب)
                </text>
                <text x={toSvgX(plan.lengthX + 1.05)} y={toSvgY(plan.widthY / 2)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#001F4D">
                  A02 ممر عام (شرق)
                </text>
                <text x={toSvgX(plan.lengthX / 2)} y={toSvgY(plan.widthY + 0.95)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#001F4D">
                  A03 منطقة انتظار (شمال)
                </text>
                <text x={toSvgX(plan.lengthX * 0.72)} y={toSvgY(-1.05)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#001F4D">
                  A04 محطة التحكم (جنوب)
                </text>

                {/* Structural Walls BAR-01..04 */}
                {/* BAR-01 West */}
                <rect
                  x={toSvgX(-westWall)}
                  y={toSvgY(plan.widthY + northWall)}
                  width={westWall * PX_PER_M}
                  height={(plan.widthY + northWall + southWall) * PX_PER_M}
                  fill="#001F4D"
                />
                {/* BAR-03 East */}
                <rect
                  x={toSvgX(plan.lengthX)}
                  y={toSvgY(plan.widthY + northWall)}
                  width={eastWall * PX_PER_M}
                  height={(plan.widthY + northWall + southWall) * PX_PER_M}
                  fill="#001F4D"
                />
                {/* BAR-04 North */}
                <rect
                  x={toSvgX(0)}
                  y={toSvgY(plan.widthY + northWall)}
                  width={plan.lengthX * PX_PER_M}
                  height={northWall * PX_PER_M}
                  fill="#001F4D"
                />
                {/* BAR-02 South */}
                <rect
                  x={toSvgX(0)}
                  y={toSvgY(0)}
                  width={plan.lengthX * PX_PER_M}
                  height={southWall * PX_PER_M}
                  fill="#001F4D"
                />

                {/* Barrier Labels */}
                <text x={toSvgX(-0.35)} y={toSvgY(plan.widthY - 0.5)} textAnchor="end" fontSize="9.5" fontWeight="700" fill="#475569">
                  BAR-01
                </text>
                <text x={toSvgX(plan.lengthX + 0.35)} y={toSvgY(plan.widthY - 0.5)} textAnchor="start" fontSize="9.5" fontWeight="700" fill="#475569">
                  BAR-03
                </text>
                <text x={toSvgX(0.6)} y={toSvgY(plan.widthY + 0.35)} textAnchor="start" fontSize="9.5" fontWeight="700" fill="#475569">
                  BAR-04
                </text>
                <text x={toSvgX(0.45)} y={toSvgY(-0.42)} textAnchor="start" fontSize="9.5" fontWeight="700" fill="#475569">
                  BAR-02
                </text>

                {/* Door DOR-01 on South Wall */}
                <rect
                  x={toSvgX(plan.door.offsetFromWestM)}
                  y={toSvgY(0) - 1}
                  width={plan.door.widthM * PX_PER_M}
                  height={southWall * PX_PER_M + 2}
                  fill="#F59E0B"
                />
                <text
                  x={toSvgX(plan.door.offsetFromWestM + plan.door.widthM / 2)}
                  y={toSvgY(0.18)}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#92400E"
                >
                  DOR-01
                </text>

                {/* Control Viewing Window WIN-01 on South Wall */}
                <rect
                  x={toSvgX(plan.window.offsetFromWestM)}
                  y={toSvgY(0) - 1}
                  width={plan.window.widthM * PX_PER_M}
                  height={southWall * PX_PER_M + 2}
                  fill="#00D1CE"
                />
                <text
                  x={toSvgX(plan.window.offsetFromWestM + plan.window.widthM / 2)}
                  y={toSvgY(0.18)}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#007574"
                >
                  WIN-01
                </text>

                {/* Examination Table TAB-01 */}
                <rect
                  x={toSvgX(plan.table.x - plan.table.lengthM / 2)}
                  y={toSvgY(plan.table.y + plan.table.widthM / 2)}
                  width={plan.table.lengthM * PX_PER_M}
                  height={plan.table.widthM * PX_PER_M}
                  rx="4"
                  fill="#E6FAFA"
                  stroke="#007574"
                  strokeWidth="1.5"
                />
                <text
                  x={toSvgX(plan.table.x)}
                  y={toSvgY(plan.table.y - 0.35)}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#001F4D"
                >
                  TAB-01 ({plan.table.lengthM}×{plan.table.widthM} m)
                </text>

                {/* Wall Bucky WB-01 */}
                <rect
                  x={toSvgX(plan.wallBucky.x) - 5}
                  y={toSvgY(plan.wallBucky.y) - 22}
                  width="10"
                  height="44"
                  fill="#334155"
                  rx="2"
                />
                <text x={toSvgX(plan.wallBucky.x) - 10} y={toSvgY(plan.wallBucky.y) + 4} textAnchor="end" fontSize="9" fontWeight="700" fill="#334155">
                  WB-01
                </text>

                {/* Reference Rays from SRC-01 to selected point */}
                {pointMetrics.map(({ point }) => {
                  const isSel = point.id === selectedPointId;
                  if (!isSel) return null;
                  return (
                    <line
                      key={`ray-${point.id}`}
                      x1={toSvgX(plan.source.x)}
                      y1={toSvgY(plan.source.y)}
                      x2={toSvgX(point.x)}
                      y2={toSvgY(point.y)}
                      stroke="#007574"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />
                  );
                })}

                {/* Source SRC-01 */}
                <g>
                  <circle
                    cx={toSvgX(plan.source.x)}
                    cy={toSvgY(plan.source.y)}
                    r="9"
                    fill="#001F4D"
                    stroke="#00D1CE"
                    strokeWidth="2.5"
                  />
                  <circle cx={toSvgX(plan.source.x)} cy={toSvgY(plan.source.y)} r="2.5" fill="#00D1CE" />
                  <text
                    x={toSvgX(plan.source.x)}
                    y={toSvgY(plan.source.y) - 13}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#001F4D"
                  >
                    SRC-01 ({plan.source.x.toFixed(1)}, {plan.source.y.toFixed(1)}, z={plan.source.z.toFixed(1)})
                  </text>
                </g>

                {/* Origin (0,0) Marker */}
                <g>
                  <circle cx={toSvgX(0)} cy={toSvgY(0)} r="4" fill="#DC2626" />
                  <text x={toSvgX(0) + 6} y={toSvgY(0) - 6} fontSize="9" fontWeight="700" fill="#DC2626">
                    (0,0) SW
                  </text>
                </g>

                {/* Dimension Lines */}
                <g stroke="#64748B" strokeWidth="1">
                  <line x1={toSvgX(0)} y1={toSvgY(plan.widthY + 0.55)} x2={toSvgX(plan.lengthX)} y2={toSvgY(plan.widthY + 0.55)} />
                  <line x1={toSvgX(0)} y1={toSvgY(plan.widthY + 0.45)} x2={toSvgX(0)} y2={toSvgY(plan.widthY + 0.65)} />
                  <line x1={toSvgX(plan.lengthX)} y1={toSvgY(plan.widthY + 0.45)} x2={toSvgX(plan.lengthX)} y2={toSvgY(plan.widthY + 0.65)} />
                </g>
                <text
                  x={toSvgX(plan.lengthX / 2)}
                  y={toSvgY(plan.widthY + 0.62)}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#334155"
                >
                  X = {plan.lengthX.toFixed(2)} m
                </text>

                {/* Measurement Points MP-01..MP-07 */}
                {plan.points.map((pt) => {
                  const isSel = pt.id === selectedPointId;
                  const isSameFloor = pt.floorLevel === 'same';
                  const cx = toSvgX(pt.x);
                  const cy = toSvgY(pt.y);
                  const fillColor =
                    pt.floorLevel === 'above'
                      ? '#7C3AED'
                      : pt.floorLevel === 'below'
                        ? '#D97706'
                        : isSel
                          ? '#00D1CE'
                          : '#007574';

                  return (
                    <g
                      key={pt.id}
                      onPointerDown={(e) => {
                        setSelectedPointId(pt.id);
                        if (isSameFloor) {
                          e.currentTarget.setPointerCapture?.(e.pointerId);
                          setDraggingId(pt.id);
                        }
                      }}
                      className={isSameFloor ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSel ? 10 : 8}
                        fill={fillColor}
                        stroke="#001F4D"
                        strokeWidth={isSel ? 2.5 : 1.5}
                      />
                      <text
                        x={cx}
                        y={pt.floorLevel === 'above' ? cy - 13 : pt.floorLevel === 'below' ? cy + 20 : cy - 12}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#001F4D"
                      >
                        {pt.id}
                        {pt.floorLevel === 'above' ? ' ↑' : pt.floorLevel === 'below' ? ' ↓' : ''}
                      </text>
                    </g>
                  );
                })}

                {/* North Arrow (Top-Right of canvas) */}
                <g transform={`translate(${vbWidth - 45}, 42) rotate(${plan.northAngleDeg})`}>
                  <circle cx="0" cy="0" r="18" fill="#F8FAFC" stroke="#001F4D" strokeWidth="1.2" />
                  <polygon points="0,-13 5,4 0,0 -5,4" fill="#001F4D" />
                  <text x="0" y="13" textAnchor="middle" fontSize="9" fontWeight="700" fill="#001F4D">
                    N
                  </text>
                </g>

                {/* Graphic Scale Bar (2.00 m calibration bar inside SVG) */}
                <g transform={`translate(24, ${vbHeight - 30})`}>
                  <rect x="0" y="0" width={PX_PER_M} height="7" fill="#001F4D" />
                  <rect x={PX_PER_M} y="0" width={PX_PER_M} height="7" fill="#FFFFFF" stroke="#001F4D" strokeWidth="1" />
                  <text x="0" y="-4" fontSize="9" fontWeight="700" fill="#001F4D">
                    0 m
                  </text>
                  <text x={PX_PER_M} y="-4" textAnchor="middle" fontSize="9" fontWeight="700" fill="#001F4D">
                    1 m
                  </text>
                  <text x={PX_PER_M * 2} y="-4" textAnchor="middle" fontSize="9" fontWeight="700" fill="#001F4D">
                    2 m (= {twoMetersOnPaperCm} cm @ {printScale})
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* True physical print verification strip */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#050E1D] p-3 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-[#001F4D] dark:text-white">
                شريط معايرة الطباعة الفعلي (<Ltr>A4 · 100% Actual Size · {printScale}</Ltr>)
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                قِس الشريط بالمسطرة بعد الطباعة: يجب أن يساوي <Ltr>{twoMetersOnPaperCm} cm</Ltr> بدقة (تمثل <Ltr>2.00 m</Ltr>). العرض المطبوع للمخطط: <Ltr>~{printSvgWidthMm.toFixed(0)} mm</Ltr>.
              </p>
            </div>
            <div className="flex flex-col items-start">
              <div
                style={{ width: `${twoMetersOnPaperCm}cm` }}
                className="h-3 border border-[#001F4D] dark:border-[#00D1CE] flex overflow-hidden"
                aria-label={`شريط معايرة طباعة بطول ${twoMetersOnPaperCm} سنتيمتر`}
              >
                <div className="w-1/2 bg-[#001F4D] dark:bg-[#00D1CE]" />
                <div className="w-1/2 bg-white dark:bg-[#050E1D]" />
              </div>
              <div className="text-[11px] font-semibold mt-0.5 text-slate-600 dark:text-slate-300">
                <Ltr>0 — 1 m — 2 m ({twoMetersOnPaperCm} cm)</Ltr>
              </div>
            </div>
          </div>
        </section>

        {/* Vertical Section SVG (Upper Floor A05, Survey Room R01, Lower Floor A06, Roof A07) */}
        <section className="xl:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-4 sm:p-5 space-y-4 print-break-avoid">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-[#001F4D] dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#007574] dark:text-[#00D1CE]" aria-hidden="true" />
              <span>القطاع الرأسي والمجاورات العلوية والسفلية</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              الإحداثي <Ltr>z</Ltr> مطلق من أرضية الغرفة (<Ltr>FFL = 0.00 m</Ltr>)
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-2">
            <svg viewBox="0 0 320 340" className="w-full h-auto" role="img" aria-label="القطاع الرأسي لغرفة المسح والطابق الأعلى والأسفل">
              {/* Roof notice */}
              <rect x="20" y="10" width="280" height="28" rx="4" fill="#FEF3C7" stroke="#D97706" strokeDasharray="4 3" />
              <text x="160" y="28" textAnchor="middle" fontSize="10" fontWeight="700" fill="#92400E">
                A07 السطح العلوي (غير متاح أثناء الزيارة)
              </text>

              {/* Upper Floor A05 */}
              <rect x="20" y="48" width="280" height="72" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.2" />
              <text x="290" y="64" textAnchor="end" fontSize="10" fontWeight="700" fill="#5B21B6">
                A05 الطابق الأعلى (جناح إقامة)
              </text>
              <text x="30" y="114" fontSize="9.5" fontWeight="700" fill="#5B21B6">
                FFL = +{plan.upperFloorFFL.toFixed(2)} m
              </text>
              {/* MP-06 */}
              <circle cx="160" cy="92" r="7" fill="#7C3AED" stroke="#001F4D" strokeWidth="1.5" />
              <text x="160" y="80" textAnchor="middle" fontSize="10" fontWeight="700" fill="#001F4D">
                MP-06 (z = +{(plan.points.find((p) => p.floorLevel === 'above')?.z ?? 4.6).toFixed(2)} m)
              </text>

              {/* Upper Slab */}
              <rect x="20" y="120" width="280" height="16" fill="#334155" />
              <text x="160" y="131" textAnchor="middle" fontSize="9" fontWeight="700" fill="#FFFFFF">
                بلاطة السقف ({plan.slabAboveM.toFixed(2)} m — سماكة هندسية)
              </text>

              {/* Survey Room R01 */}
              <rect x="20" y="136" width="280" height="94" fill="#E6FAFA" stroke="#001F4D" strokeWidth="2" />
              <text x="290" y="152" textAnchor="end" fontSize="10.5" fontWeight="700" fill="#001F4D">
                غرفة المسح {plan.roomCode} (H = {plan.clearHeightZ.toFixed(2)} m)
              </text>
              <text x="30" y="224" fontSize="9.5" fontWeight="700" fill="#001F4D">
                FFL = 0.00 m
              </text>
              {/* SRC-01 */}
              <circle cx="160" cy="186" r="8" fill="#001F4D" stroke="#00D1CE" strokeWidth="2" />
              <text x="160" y="173" textAnchor="middle" fontSize="10" fontWeight="700" fill="#001F4D">
                SRC-01 (z = {plan.source.z.toFixed(2)} m)
              </text>
              {/* Table */}
              <rect x="120" y="206" width="80" height="10" fill="#007574" />

              {/* Lower Slab */}
              <rect x="20" y="230" width="280" height="16" fill="#334155" />
              <text x="160" y="241" textAnchor="middle" fontSize="9" fontWeight="700" fill="#FFFFFF">
                بلاطة الأرضية ({plan.slabBelowM.toFixed(2)} m — سماكة هندسية)
              </text>

              {/* Lower Floor A06 */}
              <rect x="20" y="246" width="280" height="80" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.2" />
              <text x="290" y="262" textAnchor="end" fontSize="10" fontWeight="700" fill="#92400E">
                A06 الطابق الأسفل (مكتب إداري)
              </text>
              <text x="30" y="320" fontSize="9.5" fontWeight="700" fill="#92400E">
                FFL = {plan.lowerFloorFFL.toFixed(2)} m
              </text>
              {/* MP-07 */}
              <circle cx="160" cy="282" r="7" fill="#D97706" stroke="#001F4D" strokeWidth="1.5" />
              <text x="160" y="302" textAnchor="middle" fontSize="10" fontWeight="700" fill="#001F4D">
                MP-07 (z = {(plan.points.find((p) => p.floorLevel === 'below')?.z ?? -1.1).toFixed(2)} m)
              </text>

              {/* Vertical distance guide line */}
              <line x1="160" y1="99" x2="160" y2="178" stroke="#7C3AED" strokeDasharray="3 3" strokeWidth="1.2" />
              <line x1="160" y1="194" x2="160" y2="275" stroke="#D97706" strokeDasharray="3 3" strokeWidth="1.2" />
            </svg>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <p>
              <strong>حالة السطح العلوي (<Ltr>A07</Ltr>):</strong> {plan.roofStatus}
            </p>
            <p>
              <strong>المسافة الرأسية المرجعية:</strong> تُحسب المسافة المستقيمة ثلاثية الأبعاد <Ltr>d</Ltr> من <Ltr>SRC-01</Ltr> إلى كل نقطة <Ltr>MP-01..MP-07</Ltr> تلقائيًا في الجدول أدناه.
            </p>
          </div>
        </section>
      </div>

      {/* Interactive Editor Tabs */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1B2E] p-5 space-y-5">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="جداول بيانات المخطط">
            {[
              { id: 'points', label: `نقاط القياس والمسافات (${plan.points.length})` },
              { id: 'barriers', label: `الحواجز والجدران (${plan.barriers.length})` },
              { id: 'adjacencies', label: `المجاورات والإشغال (${plan.adjacencies.length})` },
              { id: 'geometry', label: 'أبعاد الغرفة والمصدر' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#001F4D] text-white'
                    : 'bg-slate-100 dark:bg-[#050E1D] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'points' && (
            <button
              type="button"
              onClick={addPoint}
              className="rounded-lg bg-[#00D1CE] px-3.5 py-2 text-xs font-bold text-[#001F4D] hover:opacity-90"
            >
              إضافة نقطة قياس جديدة
            </button>
          )}
        </div>

        {/* Points Table */}
        {activeTab === 'points' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#050E1D] text-[#001F4D] dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2.5 text-right">الرمز</th>
                  <th className="p-2.5 text-right">الوصف</th>
                  <th className="p-2.5 text-right">الطابق</th>
                  <th className="p-2.5 text-right"><Ltr>x (m)</Ltr></th>
                  <th className="p-2.5 text-right"><Ltr>y (m)</Ltr></th>
                  <th className="p-2.5 text-right">ارتفاع محلي (m)</th>
                  <th className="p-2.5 text-right"><Ltr>z المطلق (m)</Ltr></th>
                  <th className="p-2.5 text-right"><Ltr>r_xy (m)</Ltr></th>
                  <th className="p-2.5 text-right"><Ltr>d_3D (m)</Ltr></th>
                  <th className="p-2.5 text-center no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pointMetrics.map(({ point, rxy, d3d }) => (
                  <tr
                    key={point.id}
                    onClick={() => setSelectedPointId(point.id)}
                    className={
                      selectedPointId === point.id
                        ? 'bg-[#E6FAFA]/70 dark:bg-[#0D2533]/60'
                        : 'hover:bg-slate-50 dark:hover:bg-[#050E1D]/50'
                    }
                  >
                    <td className="p-2 font-bold text-[#001F4D] dark:text-[#00D1CE]">
                      <Ltr>{point.id}</Ltr>
                    </td>
                    <td className="p-2 min-w-[160px]">
                      <input
                        type="text"
                        value={point.label}
                        onChange={(e) => updatePoint(point.id, { label: e.target.value })}
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={point.floorLevel}
                        onChange={(e) => updatePoint(point.id, { floorLevel: e.target.value as RoomPoint['floorLevel'] })}
                        className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1 text-xs"
                      >
                        <option value="same">نفس الطابق</option>
                        <option value="above">الطابق الأعلى</option>
                        <option value="below">الطابق الأسفل</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={point.x}
                        onChange={(e) => updatePoint(point.id, { x: Number(e.target.value) })}
                        dir="ltr"
                        className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={point.y}
                        onChange={(e) => updatePoint(point.id, { y: Number(e.target.value) })}
                        dir="ltr"
                        className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={point.localHeightM}
                        onChange={(e) => updatePoint(point.id, { localHeightM: Number(e.target.value) })}
                        dir="ltr"
                        className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-1.5 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2 font-mono font-semibold text-[#001F4D] dark:text-slate-100">
                      <Ltr>{point.z.toFixed(2)}</Ltr>
                    </td>
                    <td className="p-2 font-mono">
                      <Ltr>{formatPrecision(rxy, 3)}</Ltr>
                    </td>
                    <td className="p-2 font-mono font-bold text-[#007574] dark:text-[#00D1CE]">
                      <Ltr>{formatPrecision(d3d, 3)}</Ltr>
                    </td>
                    <td className="p-2 text-center no-print">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePoint(point.id);
                        }}
                        aria-label={`حذف النقطة ${point.id}`}
                        className="p-1 rounded text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Barriers Table */}
        {activeTab === 'barriers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#050E1D] text-[#001F4D] dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2.5 text-right">الرمز</th>
                  <th className="p-2.5 text-right">الجدار / الحاجز</th>
                  <th className="p-2.5 text-right">السماكة الهندسية (m)</th>
                  <th className="p-2.5 text-right">المادة ومواصفة التدريع</th>
                  <th className="p-2.5 text-right">حالة التحقق ومصدر المعلومة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {plan.barriers.map((bar) => (
                  <tr key={bar.id}>
                    <td className="p-2.5 font-bold text-[#001F4D] dark:text-[#00D1CE]"><Ltr>{bar.id}</Ltr></td>
                    <td className="p-2.5 font-semibold">{bar.name}</td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="2"
                        value={bar.thicknessM}
                        onChange={(e) => updateBarrier(bar.id, { thicknessM: Number(e.target.value) })}
                        dir="ltr"
                        className="w-20 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1 font-mono"
                      />
                    </td>
                    <td className="p-2.5 space-y-1">
                      <input
                        type="text"
                        value={bar.shieldingSpec}
                        onChange={(e) => updateBarrier(bar.id, { shieldingSpec: e.target.value })}
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1"
                      />
                      <div className="text-[11px] text-slate-500">{bar.material}</div>
                    </td>
                    <td className="p-2.5 space-y-1">
                      <select
                        value={bar.verificationStatus}
                        onChange={(e) =>
                          updateBarrier(bar.id, { verificationStatus: e.target.value as RoomBarrier['verificationStatus'] })
                        }
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-2 py-1"
                      >
                        <option value="موثق بمخطط التدريع">موثق بمخطط التدريع</option>
                        <option value="مقاس عند فتحة متاحة">مقاس عند فتحة متاحة</option>
                        <option value="مذكور من المنشأة ولم يُتحقق">مذكور من المنشأة ولم يُتحقق</option>
                        <option value="غير معلوم — يحتاج إلى مصدر">غير معلوم — يحتاج إلى مصدر</option>
                      </select>
                      <div className="text-[11px] text-slate-500">المصدر: {bar.infoSource}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Adjacencies Table */}
        {activeTab === 'adjacencies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#050E1D] text-[#001F4D] dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-2.5 text-right">الرمز</th>
                  <th className="p-2.5 text-right">المنطقة المجاورة</th>
                  <th className="p-2.5 text-right">الاستخدام وفئة الشاغلين</th>
                  <th className="p-2.5 text-right">نمط الإشغال ومصدره</th>
                  <th className="p-2.5 text-right">المنسوب (<Ltr>m</Ltr>)</th>
                  <th className="p-2.5 text-right">إتاحة الفحص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {plan.adjacencies.map((adj) => (
                  <tr key={adj.id}>
                    <td className="p-2.5 font-bold text-[#001F4D] dark:text-[#00D1CE]"><Ltr>{adj.code}</Ltr></td>
                    <td className="p-2.5 font-semibold">{adj.label}</td>
                    <td className="p-2.5">
                      <div>{adj.use}</div>
                      <div className="text-[11px] text-slate-500">الفئة: {adj.occupantCategory}</div>
                    </td>
                    <td className="p-2.5">
                      <div>{adj.occupancyPattern}</div>
                      <div className="text-[11px] text-slate-500">المصدر: {adj.occupancySource}</div>
                    </td>
                    <td className="p-2.5 font-mono"><Ltr>{adj.elevationM.toFixed(2)}</Ltr></td>
                    <td className="p-2.5">{adj.accessibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Room Geometry & Source Tab */}
        {activeTab === 'geometry' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <label className="space-y-1">
              <span className="font-bold text-[#001F4D] dark:text-slate-200">الطول الداخلي X (متر)</span>
              <input
                type="number"
                step="0.1"
                min="2.5"
                max="14"
                value={plan.lengthX}
                onChange={(e) => persistPlan({ ...plan, lengthX: Math.max(2.5, Number(e.target.value)) })}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-[#001F4D] dark:text-slate-200">العرض الداخلي Y (متر)</span>
              <input
                type="number"
                step="0.1"
                min="2.5"
                max="12"
                value={plan.widthY}
                onChange={(e) => persistPlan({ ...plan, widthY: Math.max(2.5, Number(e.target.value)) })}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-[#001F4D] dark:text-slate-200">الارتفاع الصافي Z (متر)</span>
              <input
                type="number"
                step="0.1"
                min="2.2"
                max="6"
                value={plan.clearHeightZ}
                onChange={(e) => persistPlan({ ...plan, clearHeightZ: Math.max(2.2, Number(e.target.value)) })}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-[#001F4D] dark:text-slate-200">إحداثي المصدر SRC-01 (x)</span>
              <input
                type="number"
                step="0.1"
                value={plan.source.x}
                onChange={(e) => persistPlan({ ...plan, source: { ...plan.source, x: Number(e.target.value) } })}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-[#001F4D] dark:text-slate-200">إحداثي المصدر SRC-01 (y)</span>
              <input
                type="number"
                step="0.1"
                value={plan.source.y}
                onChange={(e) => persistPlan({ ...plan, source: { ...plan.source, y: Number(e.target.value) } })}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-[#001F4D] dark:text-slate-200">ارتفاع المصدر SRC-01 (z)</span>
              <input
                type="number"
                step="0.1"
                value={plan.source.z}
                onChange={(e) => persistPlan({ ...plan, source: { ...plan.source, z: Number(e.target.value) } })}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-[#001F4D] dark:text-slate-200">منسوب الطابق الأعلى FFL (m)</span>
              <input
                type="number"
                step="0.1"
                value={plan.upperFloorFFL}
                onChange={(e) => persistPlan({ ...plan, upperFloorFFL: Number(e.target.value) })}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-[#001F4D] dark:text-slate-200">منسوب الطابق الأسفل FFL (m)</span>
              <input
                type="number"
                step="0.1"
                value={plan.lowerFloorFFL}
                onChange={(e) => persistPlan({ ...plan, lowerFloorFFL: Number(e.target.value) })}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#050E1D] px-3 py-2 font-mono"
              />
            </label>
            <label className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={plan.northVerified}
                onChange={(e) => persistPlan({ ...plan, northVerified: e.target.checked })}
              />
              <span className="font-semibold">تم التحقق من الشمال الجغرافي ميدانيًا</span>
            </label>
          </div>
        )}
      </section>

      <ScientificMetaPanel meta={PLANNER_META} onNavigate={onNavigate} />
    </div>
  );
};
