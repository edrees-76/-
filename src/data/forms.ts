import type { RoomPlanState } from '../types';
import { CALCULATOR_ENGINE_VERSION } from './references';

export const DEFAULT_ROOM_PLAN: RoomPlanState = {
  planTitle: 'مخطط غرفة الأشعة العامة الافتراضية (تعليمي — ليس تصميم تدريع)',
  roomCode: 'R01',
  lengthX: 6.0,
  widthY: 5.0,
  clearHeightZ: 3.3,
  slabAboveM: 0.3,
  slabBelowM: 0.3,
  upperFloorFFL: 3.6,
  lowerFloorFFL: -3.3,
  northAngleDeg: 0,
  northVerified: false,
  source: {
    id: 'SRC-01',
    x: 3.0,
    y: 2.5,
    z: 1.5,
    label: 'البؤرة المرجعية للأنبوب',
  },
  table: {
    id: 'TAB-01',
    x: 3.0,
    y: 2.5,
    widthM: 1.2,
    lengthM: 2.2,
    heightM: 0.85,
  },
  wallBucky: {
    id: 'WB-01',
    x: 5.75,
    y: 2.5,
    z: 1.4,
  },
  door: {
    id: 'DOR-01',
    wall: 'south',
    offsetFromWestM: 1.1,
    widthM: 1.2,
  },
  window: {
    id: 'WIN-01',
    wall: 'south',
    offsetFromWestM: 3.9,
    widthM: 1.2,
  },
  controlStationLabel: 'محطة التحكم (A04)',
  roofStatus: 'فوق الغرفة طابق جناح إقامة A05؛ السطح النهائي للمبنى في الطابق الأعلى غير متاح أثناء الزيارة — لم يُتحقق من الإشغال.',
  barriers: [
    {
      id: 'BAR-01',
      name: 'الجدار الغربي (جهة المكتب A01)',
      side: 'west',
      lengthM: 5.0,
      thicknessM: 0.2,
      material: 'خرسانة / طوب (سماكة هندسية فقط)',
      shieldingSpec: 'غير متحقق منها — تحتاج إلى مصدر',
      infoSource: 'قياس هندسي ميداني دون فتح الجدار',
      verificationStatus: 'غير معلوم — يحتاج إلى مصدر',
    },
    {
      id: 'BAR-02',
      name: 'الجدار الجنوبي (جهة التحكم A04 — يحوي DOR-01 وWIN-01)',
      side: 'south',
      lengthM: 6.0,
      thicknessM: 0.2,
      material: 'جدار + باب DOR-01 + نافذة مشاهدة WIN-01',
      shieldingSpec: 'مذكور من المنشأة (خواص الزجاج وإطار الباب لم يُتحقق منها)',
      infoSource: 'سجل المنشأة',
      verificationStatus: 'مذكور من المنشأة ولم يُتحقق',
    },
    {
      id: 'BAR-03',
      name: 'الجدار الشرقي (جهة الممر العام A02 — خلف حامل الصدر WB-01)',
      side: 'east',
      lengthM: 5.0,
      thicknessM: 0.2,
      material: 'حاجز أولي محتمل في وضع S02',
      shieldingSpec: 'يلزم التحقق من مخطط التدريع المعتمد',
      infoSource: 'غير موثق بعد',
      verificationStatus: 'غير معلوم — يحتاج إلى مصدر',
    },
    {
      id: 'BAR-04',
      name: 'الجدار الشمالي (جهة الانتظار A03)',
      side: 'north',
      lengthM: 6.0,
      thicknessM: 0.2,
      material: 'خرسانة / طوب (سماكة هندسية فقط)',
      shieldingSpec: 'مذكور بمخطط معماري قديم',
      infoSource: 'مخطط معماري غير محدث',
      verificationStatus: 'مذكور من المنشأة ولم يُتحقق',
    },
  ],
  adjacencies: [
    {
      id: 'adj-a01',
      code: 'A01',
      position: 'west',
      label: 'مكتب إداري (غرب)',
      use: 'مكتب عمل دائم',
      occupantCategory: 'جمهور',
      occupancyPattern: 'إشغال مستمر خلال ساعات الدوام (يُعتمد معامل T وفق الجهة المختصة)',
      occupancySource: 'معاينة ميدانية وتأكيد مسؤول القسم',
      elevationM: 0.0,
      accessibility: 'متاح للفحص',
    },
    {
      id: 'adj-a02',
      code: 'A02',
      position: 'east',
      label: 'ممر عام (شرق)',
      use: 'ممر يربط الاستقبال والعيادات',
      occupantCategory: 'جمهور',
      occupancyPattern: 'عبور عام متكرر (بيانات الإشغال تحتاج اعتمادًا منفصلًا)',
      occupancySource: 'معاينة ميدانية',
      elevationM: 0.0,
      accessibility: 'متاح للفحص',
    },
    {
      id: 'adj-a03',
      code: 'A03',
      position: 'north',
      label: 'منطقة انتظار (شمال محلي)',
      use: 'صف مقاعد انتظار مراجعين',
      occupantCategory: 'جمهور',
      occupancyPattern: 'إشغال مرتفع أثناء ساعات العمل',
      occupancySource: 'معاينة ميدانية',
      elevationM: 0.0,
      accessibility: 'متاح للفحص',
    },
    {
      id: 'adj-a04',
      code: 'A04',
      position: 'south',
      label: 'محطة التحكم (جنوب محلي)',
      use: 'موضع مشغل الأشعة خلف نافذة المشاهدة',
      occupantCategory: 'عاملون',
      occupancyPattern: 'إشغال كامل أثناء تشغيل الجهاز (T = 1)',
      occupancySource: 'خطة التشغيل المعتمدة',
      elevationM: 0.0,
      accessibility: 'متاح للفحص',
    },
    {
      id: 'adj-a05',
      code: 'A05',
      position: 'above',
      label: 'الطابق الأعلى — جناح إقامة',
      use: 'غرف إقامة مرضى (فوق بصمة الغرفة)',
      occupantCategory: 'مرضى',
      occupancyPattern: 'إشغال مستمر على مدار الساعة (تحقق من الإسقاط المعماري)',
      occupancySource: 'مخطط الطوابق وتأكيد مسؤول المبنى',
      elevationM: 3.6,
      accessibility: 'دخول مقيد',
    },
    {
      id: 'adj-a06',
      code: 'A06',
      position: 'below',
      label: 'الطابق الأسفل — مكتب',
      use: 'مكتب إداري أسفل غرفة المسح',
      occupantCategory: 'جمهور',
      occupancyPattern: 'إشغال دائم خلال الدوام الرسمي',
      occupancySource: 'مخطط الطوابق ومعاينة ميدانية',
      elevationM: -3.3,
      accessibility: 'متاح للفحص',
    },
    {
      id: 'adj-a07',
      code: 'A07',
      position: 'roof',
      label: 'السطح العلوي للمبنى / الخارج',
      use: 'معدات تكييف ومسار صيانة محتمل',
      occupantCategory: 'غير متاح / صيانة',
      occupancyPattern: 'لم يُتحقق من تكرار وصول فرق الصيانة',
      occupancySource: 'غير متحقق منها — تحتاج إلى مصدر',
      elevationM: 7.2,
      accessibility: 'غير متاح أثناء الزيارة — لم يُتحقق من الإشغال',
    },
  ],
  points: [
    { id: 'MP-01', label: 'المكتب الغربي', locationDescription: '0.30 m خارج الجدار BAR-01 عند موضع المكتب', x: -0.5, y: 2.5, z: 1.2, floorLevel: 'same', localHeightM: 1.2 },
    { id: 'MP-02', label: 'خارج الباب DOR-01', locationDescription: '0.30 m خارج منتصف الباب (تُضاف نقاط الحواف والعتبة)', x: 1.7, y: -0.5, z: 1.2, floorLevel: 'same', localHeightM: 1.2 },
    { id: 'MP-03', label: 'خلف نافذة التحكم WIN-01', locationDescription: 'موضع وقوف المشغل خلف نافذة المشاهدة', x: 4.5, y: -0.5, z: 1.2, floorLevel: 'same', localHeightM: 1.2 },
    { id: 'MP-04', label: 'الممر الشرقي', locationDescription: '0.30 m خارج الجدار BAR-03 في الممر العام A02', x: 6.5, y: 2.5, z: 1.2, floorLevel: 'same', localHeightM: 1.2 },
    { id: 'MP-05', label: 'منطقة الانتظار الشمالية', locationDescription: 'أقرب مقعد انتظار خلف الجدار BAR-04', x: 3.0, y: 5.5, z: 1.2, floorLevel: 'same', localHeightM: 1.2 },
    { id: 'MP-06', label: 'الطابق الأعلى (جناح الإقامة)', locationDescription: 'فوق مركز الغرفة على ارتفاع 1.00 m من أرضية الطابق الأعلى (+3.60)', x: 3.0, y: 2.5, z: 4.6, floorLevel: 'above', localHeightM: 1.0 },
    { id: 'MP-07', label: 'الطابق الأسفل (المكتب)', locationDescription: 'تحت مركز الغرفة على ارتفاع 2.20 m من أرضية الطابق الأسفل (−3.30)', x: 3.0, y: 2.5, z: -1.1, floorLevel: 'below', localHeightM: 2.2 },
  ],
};

// Complete F01–F07 Form Suite Data Model (Zero personal names, clearly marked educational/simulated)
export interface SurveyFormsDraft {
  meta: {
    reportNumber: string;
    reportVersion: string;
    measurementDate: string;
    issueDate: string;
    isSimulatedEducational: boolean;
    facilityName: string;
    departmentAndRoom: string;
    surveyType: 'مسح قبول أولي' | 'مسح دوري' | 'مسح تحقيقي' | 'متابعة تعديل';
    calculatorVersion: string;
  };
  f01Preparation: {
    checklist: { item: string; status: 'نعم' | 'لا' | 'لا ينطبق'; note: string }[];
    criterionReference: string;
    criterionAuthority: string;
    areaClassificationAndQuantity: string;
    criterionValueAndPeriod: string;
    decisionRule: string;
    planChangesNote: string;
    excludedScope: string;
    missingDataImpact: string;
  };
  f02EquipmentGeometry: {
    setupCode: string;
    clinicalDevice: string;
    testType: string;
    surveyInstrument: string;
    serialNumbers: string;
    calibrationDetails: string;
    measuredQuantityAndRange: string;
    energyAndPulseSuitability: string;
    integrationMode: string;
    prePostFunctionalCheck: string;
    backgroundMethod: string;
    kvpOrEnergy: string;
    masOrMu: string;
    fieldSizeAndSid: string;
    phantomDescription: string;
    beamDirectionAndAngles: string;
    detectorPositionAndHeight: string;
  };
  f03RawReadings: {
    quantityUnit: string;
    rows: {
      id: string;
      pointCode: string;
      location: string;
      windowSec: number;
      exposures: number;
      rawTotal: number;
      bgRatePerHour: number;
      notes: string;
    }[];
    overloadNote: string;
    excludedReadingJustification: string;
    rawFileNames: string;
  };
  f04Estimation: {
    operatingWeeksPerYear: number;
    workloadSourceAndDate: string;
    useFactorNote: string;
    otherSourcesNote: string;
    expandedUncertaintyPercent: number;
    comparisonCriterionValue: number;
    comparisonCriterionUnit: 'µSv/week' | 'mSv/year';
    rows: {
      id: string;
      pointCode: string;
      modeLabel: string;
      dosePerExposure: number;
      weeklyExposures: number;
      occupancyT: number;
      tSource: string;
    }[];
    keyAssumptions: string;
    conclusionLimitations: string;
  };
  f05Contamination: {
    applicable: boolean;
    isotope: string;
    probeOrCounter: string;
    measurementKind: 'مسح مباشر' | 'مسحات غير مباشرة (Wipe test)' | 'كلاهما';
    efficiency: number;
    efficiencySource: string;
    removalFactor: number;
    rows: {
      id: string;
      sampleCode: string;
      location: string;
      areaCm2: number;
      ns: number;
      ts: number;
      nb: number;
      tb: number;
      note: string;
    }[];
    decontaminationAction: string;
  };
  f06Findings: {
    rows: {
      id: string;
      code: string;
      category: 'تجاوز مثبت' | 'نتيجة غير حاسمة' | 'قصور توثيق' | 'صيانة' | 'إجراء عمل';
      evidenceAndPoint: string;
      requiredAction: string;
      priority: 'عاجل' | 'مرتفع' | 'متوسط';
      responsibleRole: string;
      dueDate: string;
      closureEvidence: string;
    }[];
    preReleaseChecklist: { label: string; checked: boolean }[];
  };
  f07ReportNarrative: {
    objectiveAndScope: string;
    facilityAndAdjacencySummary: string;
    discussionText: string;
    conclusionText: string;
    attachmentsList: string;
  };
}

export const DEFAULT_FORMS_DRAFT: SurveyFormsDraft = {
  meta: {
    reportNumber: 'RS-2026-001',
    reportVersion: '1.0',
    measurementDate: '2026-11-24',
    issueDate: '2026-11-24',
    isSimulatedEducational: true,
    facilityName: 'منشأة تعليمية افتراضية (بيانات محاكاة)',
    departmentAndRoom: 'قسم الأشعة التشخيصية — غرفة الأشعة العامة R01',
    surveyType: 'مسح قبول أولي',
    calculatorVersion: CALCULATOR_ENGINE_VERSION,
  },
  f01Preparation: {
    checklist: [
      { item: 'الترخيص والنطاق ومعيار المقارنة', status: 'نعم', note: 'معيار تدريبي افتراضي 10 µSv/week للتوضيح' },
      { item: 'مخطط الغرفة والمجاورات الأفقية والرأسية', status: 'نعم', note: 'مخطط 6×5 m (النقاط الرأسية مؤجلة للجولة الثانية)' },
      { item: 'قائمة الأجهزة والأرقام التسلسلية', status: 'نعم', note: 'تم التحقق الميداني من الملصق' },
      { item: 'عبء العمل وتوزيع الأوضاع', status: 'نعم', note: '400 تعرض/أسبوع لوضع الطاولة S01 (افتراضي)' },
      { item: 'الإشغال ومصدر البيانات', status: 'نعم', note: 'T=1 تحفظي للنقاط الثلاث المختبرة' },
      { item: 'ملاءمة أداة القياس للمهمة والنبضات', status: 'نعم', note: 'RaySafe 452 (نسخة H*(10))' },
      { item: 'المعايرة والفحص الوظيفي قبل البدء', status: 'نعم', note: 'شهادة سارية وفحص استجابة ناجح' },
      { item: 'الفانتوم والحامل والخريطة', status: 'نعم', note: 'فانتوم PMMA وحامل ثلاثي' },
      { item: 'المشغل وضوابط الدخول والطوارئ', status: 'نعم', note: 'تأكيد إشارات البدء والإيقاف' },
      { item: 'الوقاية والرصد الشخصي للفريق', status: 'نعم', note: 'ارتداء مقاييس شخصية إلكترونية' },
    ],
    criterionReference: 'مثال تدريبي توضيحي (الدليل المرجعي — الفصل 22.6) — يستبدل بالمعيار المحلي المعتمد في المسوح الفعلية',
    criterionAuthority: 'معيار تعليمي افتراضي (لا يمثل جهة اعتماد رسمية)',
    areaClassificationAndQuantity: 'محيط غرفة الأشعة العامة — الكمية التشغيلية H*(10)',
    criterionValueAndPeriod: '10 µSv/week (أسبوعيًا)',
    decisionRule: 'قاعدة تحفظية مقترحة: Y+U ≤ L أقل من المعيار ضمن الافتراضات؛ التقاطع غير حاسم (k=2، U نسبي = 20%)',
    planChangesNote: 'لا توجد تعديلات إنشائية منذ آخر معاينة؛ سماكة الرصاص المخفي غير متحققة من مخطط As-built.',
    excludedScope: 'لا يشمل التقرير اختبارات ضبط جودة الجهاز (QC) أو جرعات المرضى أو أجهزة MRI/السونار، كما لم يُختبر وضع حامل الصدر S02 والنقاط الرأسية في هذه الجولة.',
    missingDataImpact: 'غياب قياسات وضع حامل الصدر S02 والطابقين العلوي والسفلي يقصر الاستنتاج على وضع الطاولة والنقاط المختبرة فقط.',
  },
  f02EquipmentGeometry: {
    setupCode: 'S01',
    clinicalDevice: 'جهاز أشعة عامة رقمي DR (افتراضي للتدريب)',
    testType: 'تشتت وتقييم حواجز ثانوية في وضع الطاولة',
    surveyInstrument: 'RaySafe 452 (نسخة H*(10) مع الغطاء المطابق)',
    serialNumbers: 'SN-EDU-001 (افتراضي للتدريب)',
    calibrationDetails: 'شهادة معايرة سارية لـ H*(10) — تُوثق الشهادة الأصلية في المسح الفعلي',
    measuredQuantityAndRange: 'H*(10)، 0–1 Sv/h (مجال IEC المعلن 1 µSv/h–1 Sv/h)',
    energyAndPulseSuitability: '16 keV–7 MeV؛ نبضات X-ray ≥ 5 ms عند حرارة < 30°C',
    integrationMode: 'وضع تكامل الجرعة المتراكمة خلال نافذة 120 s لـ 10 تعرضات متماثلة',
    prePostFunctionalCheck: 'تم الفحص الوظيفي قبل وبعد المهمة دون انحراف أو رسالة Overload',
    backgroundMethod: 'قياس مستقر قبل التشغيل والمصدر متوقف: 0.060 µSv/h',
    kvpOrEnergy: '90 kVp',
    masOrMu: '20 mAs (يدوي مستقر)',
    fieldSizeAndSid: 'الحقل 30×30 cm عند مستوى الفانتوم، SID = 100 cm',
    phantomDescription: 'فانتوم PMMA بأبعاد 20×20×20 cm موضوع بمركز الطاولة TAB-01',
    beamDirectionAndAngles: 'حزمة رأسية نحو الأرضية (وضع S01 — لا يعمل متزامنًا مع S02)',
    detectorPositionAndHeight: 'مثبت على حامل ثلاثي بارتفاع 1.20 m من الأرضية وعلى مسافة 0.30 m خارج الحاجز',
  },
  f03RawReadings: {
    quantityUnit: 'H*(10) بوحدة µSv',
    rows: [
      { id: 'r1', pointCode: 'MP-03', location: 'خلف حاجز التحكم (المشغل A04)', windowSec: 120, exposures: 10, rawTotal: 0.042, bgRatePerHour: 0.06, notes: 'خلف نافذة المشاهدة WIN-01' },
      { id: 'r2', pointCode: 'MP-02', location: 'خارج منتصف الباب (DOR-01)', windowSec: 120, exposures: 10, rawTotal: 0.082, bgRatePerHour: 0.06, notes: 'تُضاف نقاط حواف وإطار الباب في الجولة التفصيلية' },
      { id: 'r3', pointCode: 'MP-01', location: 'المكتب المجاور غربًا (A01)', windowSec: 120, exposures: 10, rawTotal: 0.122, bgRatePerHour: 0.06, notes: 'خارج الجدار BAR-01' },
    ],
    overloadNote: 'لم تُسجل أي رسالة Overload أو تغير غير مبرر في الخرج.',
    excludedReadingJustification: 'لا توجد قراءات مستبعدة.',
    rawFileNames: 'RS-2026-001_S01_raw.json (ملف محاكاة تعليمي)',
  },
  f04Estimation: {
    operatingWeeksPerYear: 50,
    workloadSourceAndDate: 'تقدير تدريبي افتراضي بتاريخ 2026-11-24: 400 تعرض/أسبوع لوضع الطاولة S01',
    useFactorNote: 'وضع الطاولة S01 مفصول في التوزيع الأسبوعي (U=1 ضمن هذا الوضع ولا يُضرب مرتين).',
    otherSourcesNote: 'لا توجد مصادر أشعة مجاورة تساهم متزامنة في النقاط الثلاث ضمن هذا المثال.',
    expandedUncertaintyPercent: 20,
    comparisonCriterionValue: 10,
    comparisonCriterionUnit: 'µSv/week',
    rows: [
      { id: 'e1', pointCode: 'MP-03', modeLabel: 'المشغل (S01)', dosePerExposure: 0.004, weeklyExposures: 400, occupancyT: 1, tSource: 'إشغال كامل أثناء التشغيل' },
      { id: 'e2', pointCode: 'MP-02', modeLabel: 'خارج الباب (S01)', dosePerExposure: 0.008, weeklyExposures: 400, occupancyT: 1, tSource: 'افتراض تحفظي تدريبي T=1' },
      { id: 'e3', pointCode: 'MP-01', modeLabel: 'المكتب المجاور (S01)', dosePerExposure: 0.012, weeklyExposures: 400, occupancyT: 1, tSource: 'مكتب عمل دائم T=1' },
    ],
    keyAssumptions: 'ثبات إعدادات 90 kVp و20 mAs وعبء عمل 400 تعرض/أسبوع وT=1 وعدم يقين موسع نسبي 20% (k=2).',
    conclusionLimitations: 'لا يمتد الاستنتاج إلى وضع حامل الصدر S02 أو الحواجز غير المختبرة أو الطابقين العلوي والسفلي أو تغير البروتوكولات.',
  },
  f05Contamination: {
    applicable: false,
    isotope: 'لا ينطبق على غرفة الأشعة العامة (مخصص للطب النووي والمصادر غير المختومة)',
    probeOrCounter: 'RadEye B20 / Hidex AMG (عند التفعيل في حالات الطب النووي)',
    measurementKind: 'مسحات غير مباشرة (Wipe test)',
    efficiency: 0.3,
    efficiencySource: 'شهادة معايرة النظير (مثال الفصل 20.8)',
    removalFactor: 0.5,
    rows: [
      { id: 'c1', sampleCode: 'W-01', location: 'سطح التحضير (مثال تعليمي)', areaCm2: 100, ns: 420, ts: 60, nb: 120, tb: 120, note: 'بيانات محاكاة للمثال 5' },
      { id: 'c2', sampleCode: 'BLANK', location: 'مسحة مرجعية نظيفة', areaCm2: 100, ns: 118, ts: 120, nb: 120, tb: 120, note: 'تحقق من غياب التلوث المتبادل' },
    ],
    decontaminationAction: 'لا ينطبق على غرفة الأشعة العامة.',
  },
  f06Findings: {
    rows: [
      {
        id: 'fin1',
        code: '01',
        category: 'قصور توثيق',
        evidenceAndPoint: 'وضع حامل الصدر S02 والنقاط الرأسية MP-06 وMP-07 لم تُختبر بعد.',
        requiredAction: 'تنفيذ جولة قياس لوضع حامل الصدر WB-01 (الجدار الشرقي BAR-03) والطابقين الأعلى والأسفل وتوثيق مخطط التدريع.',
        priority: 'مرتفع',
        responsibleRole: 'الفيزيائي الطبي ومسؤول الوقاية من الإشعاع',
        dueDate: 'قبل اعتماد التقييم الكامل للغرفة',
        closureEvidence: 'تقرير ملحق بالقياسات الخام والحسابات المحدثة.',
      },
      {
        id: 'fin2',
        code: '02',
        category: 'قصور توثيق',
        evidenceAndPoint: 'سماكات الرصاص في BAR-01..BAR-04 غير مدعومة بمخطط As-built.',
        requiredAction: 'إرفاق وثائق وتفاصيل تنفيذ التدريع وإطار الباب DOR-01 ونافذة WIN-01 في ملف الغرفة.',
        priority: 'متوسط',
        responsibleRole: 'إدارة المنشأة / الهندسة الطبية',
        dueDate: 'خلال 30 يومًا',
        closureEvidence: 'نسخة مخطط التدريع وشهادات الزجاج الرصاصي.',
      },
    ],
    preReleaseChecklist: [
      { label: 'تطابق أسماء الأجهزة والأرقام التسلسلية والتواريخ', checked: true },
      { label: 'وجود مخطط النقاط والمجاورات العلوية والسفلية', checked: true },
      { label: 'ربط كل نتيجة بإعداد تشغيل وهندسة وأداة معايرة', checked: true },
      { label: 'توثيق القراءات الخام والخلفية والصافي والوحدات', checked: true },
      { label: 'بيان عبء العمل والإشغال ومعيار القرار وعدم اليقين', checked: true },
      { label: 'عدم وصف عدم الكشف بأنه غياب مطلق للإشعاع', checked: true },
      { label: 'تقييد الاستنتاج بنطاق الاختبار الفعلي وعدم كتابة حكم مطلق بـ «آمنة»', checked: true },
      { label: 'تحديد المسؤول والمواعيد ومعيار إغلاق الملاحظات', checked: true },
      { label: 'التحقق من خلو التقرير والصور من أي بيانات شخصية أو بيانات مرضى', checked: true },
      { label: 'حفظ الملفات الأصلية وذكر إصدار الحاسبات المستخدمة', checked: true },
    ],
  },
  f07ReportNarrative: {
    objectiveAndScope: 'تقييم مستويات الإشعاع خارج غرفة الأشعة العامة R01 تحت تشغيل وضع الطاولة S01 فقط لأغراض التدريب المرجعي. لا يشمل التقرير اختبارات ضبط جودة الجهاز أو جرعات المرضى أو اتجاه حامل الصدر S02 أو النقاط الرأسية.',
    facilityAndAdjacencySummary: 'غرفة بأبعاد داخلية 6.00×5.00 m وارتفاع صافي 3.30 m، يجاورها غربًا مكتب A01، وشرقًا ممر عام A02، وشمالًا انتظار A03، وجنوبًا محطة التحكم A04، وأعلى جناح إقامة A05، وأسفل مكتب A06. سماكات الجدران المرسومة هندسية فقط ولا تثبت تكافؤ الرصاص دون مخطط As-built.',
    discussionText: 'أظهرت القياسات المتكاملة لـ 10 تعرضات متماثلة عند 90 kVp و20 mAs (بعد طرح خلفية 0.002 µSv عن نافذة 120 s) تقديرًا أسبوعيًا بين 1.60 و4.80 µSv/week. وبإضافة عدم يقين موسع نسبي 20% يبلغ أعلى حد Y+U قيمة 5.76 µSv/week عند النقطة MP-01 (المكتب الغربي).',
    conclusionText: 'التقدير أقل من معيار المقارنة المختار (10 µSv/week — افتراضي للتدريب) للنقاط الثلاث في وضع الطاولة S01 ضمن الافتراضات الموضحة (400 تعرض/أسبوع وT=1). لا يمتد الاستنتاج إلى وضع حامل الصدر S02 أو الحواجز غير المختبرة أو الطابقين العلوي والسفلي، ولا يُستخدم هذا النص كشهادة اعتماد رسمية.',
    attachmentsList: '1) مخطط الغرفة R01 بمقياس 1:50 والقطاع الرأسي؛ 2) نماذج F01–F06؛ 3) نسخة البيانات الخام JSON وجداول CSV؛ 4) شهادات المعايرة (تُرفق في المسوح الفعلية).',
  },
};
