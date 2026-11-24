import type { AssessmentOutcome, ComparisonStandard, ReviewStatus } from '../types';
import { CALCULATOR_ENGINE_VERSION, LAST_GLOBAL_REVIEW_DATE } from '../data/references';

export interface CalculatorDoc {
  id: string;
  title: string;
  shortTitle: string;
  formulaLatexLike: string;
  formulaSource: string;
  referenceIds: string[];
  variables: { symbol: string; meaning: string; unit: string }[];
  applicabilityConditions: string[];
  invalidationCases: string[];
  verificationExample: {
    title: string;
    inputsSummary: string;
    expectedResult: string;
    sourceNote: string;
  };
  lastReviewed: string;
  status: ReviewStatus;
  version: string;
}

export const COMPARISON_STANDARDS: ComparisonStandard[] = [
  {
    id: 'edu-weekly-10',
    label: 'معيار تعليمي افتراضي للمقارنة الأسبوعية (10 µSv/week)',
    value: 10,
    unit: 'µSv/week',
    period: 'أسبوعيًا',
    reference: 'مثال تدريبي توضيحي من الدليل المرجعي (الفصل 21 و22.6) — لأغراض التدريب فقط وليس حدًا قانونيًا',
    classification: 'هدف تصميم تعليمي افتراضي',
    note: 'يُستخدم للتمرين على قاعدة القرار وحساب المساهمة الأسبوعية؛ تُستبدل القيمة بالهدف المعتمد في ترخيص المنشأة.',
  },
  {
    id: 'edu-weekly-20',
    label: 'قيمة مرجعية تعليمية لمنطقة غير خاضعة (20 µSv/week)',
    value: 20,
    unit: 'µSv/week',
    period: 'أسبوعيًا (تعادل ~1 mSv على 50 أسبوعًا)',
    reference: 'مشتقة تعليميًا من IAEA GSR Part 3 للجمهور (1 mSv/سنة)؛ لا تُمثل هدف تصميم معتمدًا تلقائيًا دون موافقة الجهة المختصة',
    classification: 'قيمة مرجعية دولية',
    note: 'تُذكر للتمييز المنهجي فقط؛ يلزم الرجوع إلى هدف التصميم المعتمد للمنشأة والجهة الرقابية.',
  },
  {
    id: 'iaea-public-annual',
    label: 'حد الجرعة الفعالة المرجعي للجمهور — IAEA GSR Part 3 (1 mSv/year)',
    value: 1,
    unit: 'mSv/year',
    period: 'سنويًا (مجموع المصادر المنظمة)',
    reference: 'IAEA GSR Part 3 (2014), Schedule III',
    classification: 'قيمة مرجعية دولية',
    note: 'تنبيه مهم: هذا حد جرعة سنوي لمجموع المصادر وليس هدف تصميم لحاجز مفرد؛ قارن به مع التحفظ المنهجي الكامل.',
  },
  {
    id: 'iaea-worker-annual',
    label: 'متوسط حد الجرعة الفعالة للعامل — IAEA GSR Part 3 (20 mSv/year)',
    value: 20,
    unit: 'mSv/year',
    period: 'سنويًا متوسطًا على 5 سنوات متتالية (50 mSv أقصى سنة واحدة)',
    reference: 'IAEA GSR Part 3 (2014), Schedule III',
    classification: 'قيمة مرجعية دولية',
    note: 'لا يُستخدم حد العامل السنوي مباشرة بوصفه هدفًا لتصميم حاجز؛ يجب استخدام هدف التصميم وقيد الجرعة المعتمدين.',
  },
  {
    id: 'custom',
    label: 'معيار مخصص يحدده المستخدم مع مرجعه وفترته',
    value: 0,
    unit: 'µSv/week',
    period: 'يحدده المستخدم',
    reference: 'يُدخل المرجع والجهة المعتمدة يدويًا',
    classification: 'مخصص من المستخدم',
    note: 'لا تقم بالتقييم دون إدخال قيمة موجبة ومرجع وفترة زمنية متوافقة مع كمية القياس.',
  },
];

export const CALCULATOR_DOCS: Record<string, CalculatorDoc> = {
  'unit-conversion': {
    id: 'unit-conversion',
    title: 'تحويل الوحدات المتجانسة فقط',
    shortTitle: 'تحويل الوحدات',
    formulaLatexLike: 'V_target = V_source × (Factor_source / Factor_target)',
    formulaSource: 'النظام الدولي للوحدات SI وIAEA GSR Part 3 (2014) — الفصل 2 من الدليل المرجعي',
    referenceIds: ['iaea-gsr-part3', 'iaea-gsg-7'],
    variables: [
      { symbol: 'V_source', meaning: 'القيمة المقاسة بالوحدة الأصلية', unit: 'Sv / Gy / Bq / cps (ضمن الفئة نفسها فقط)' },
      { symbol: 'V_target', meaning: 'القيمة المكافئة بالوحدة المستهدفة داخل الفئة المتجانسة', unit: 'وحدة من الفئة نفسها' },
    ],
    applicabilityConditions: [
      'يُسمح بالتحويل فقط بين وحدات تنتمي إلى الكمية الفيزيائية نفسها (مثل mSv ↔ µSv ↔ nSv، أو µGy ↔ mGy، أو Bq ↔ kBq ↔ MBq، أو cps ↔ cpm).',
      'يُمنع التحويل التلقائي بين Gy (كرما الهواء/الجرعة الممتصة) وSv (مكافئ الجرعة)؛ لأن ذلك يتطلب معامل تحويل موثقًا للطاقة والهندسة.',
      'يُمنع التحويل التلقائي بين cps/cpm وBq دون كفاءة عد وهندسة معايرة.',
    ],
    invalidationCases: [
      'إدخال قيمة فارغة أو غير رقمية.',
      'طلب تحويل بين فئتين غير متجانستين (مثل µGy إلى µSv أو cps إلى Bq).',
    ],
    verificationExample: {
      title: 'تحويلات SI أساسية (الفصل 2.1)',
      inputsSummary: '1 mSv → µSv؛ 1 µSv → nSv؛ 60 cpm → cps',
      expectedResult: '1000 µSv؛ 1000 nSv؛ 1 cps',
      sourceNote: 'الدليل المرجعي، الفصل 2.1',
    },
    lastReviewed: LAST_GLOBAL_REVIEW_DATE,
    status: 'مُراجع',
    version: CALCULATOR_ENGINE_VERSION,
  },
  'background-subtraction': {
    id: 'background-subtraction',
    title: 'طرح الخلفية (الجرعة المتكاملة والعدّ الإشعاعي)',
    shortTitle: 'طرح الخلفية',
    formulaLatexLike: 'H_net = H_on − b × (t / 3600)   |   R_net = (N_s / t_s) − (N_b / t_b)',
    formulaSource: 'الدليل المرجعي، الفصول 6.1 و15.4 و21.2؛ ISO 11929 عند تفعيل حد الكشف الإحصائي',
    referenceIds: ['iaea-gsg-7', 'iso-11929'],
    variables: [
      { symbol: 'H_on', meaning: 'الجرعة الإجمالية المسجلة خلال نافذة التكامل', unit: 'µSv' },
      { symbol: 'b', meaning: 'معدل الخلفية المقاس بظروف قريبة والمصدر غير مساهم', unit: 'µSv/h' },
      { symbol: 't', meaning: 'كامل نافذة التكامل الزمنية (وليس زمن الأشعة فقط)', unit: 's' },
      { symbol: 'N_s, t_s', meaning: 'عدّ العينة وزمن عدّ العينة', unit: 'counts, s' },
      { symbol: 'N_b, t_b', meaning: 'عدّ الخلفية وزمن عدّ الخلفية', unit: 'counts, s' },
    ],
    applicabilityConditions: [
      'تُقاس الخلفية في ظروف قريبة من القياس والمصدر المعني غير مساهم.',
      'عند تكامل عدة تعرضات داخل نافذة واحدة، تُطرح الخلفية عن كامل نافذة التكامل t.',
      'تُحفظ النتائج الصافية السالبة كما هي إحصائيًا ولا تُحوَّل آليًا إلى صفر.',
      'لا يُحسب حد الكشف L_D إلا عند استخدام طريقة إحصائية موثقة للعدّ (مثل تقريب Currie / ISO 11929 بمعاملات α وβ صريحة).',
    ],
    invalidationCases: [
      'زمن قياس ≤ 0 (قسمة على صفر أو زمن غير صالح).',
      'خلفية سالبة أو قراءات عدّ خام سالبة.',
      'عدم تطابق وحدة الزمن مع وحدة معدل الخلفية (يتم التحويل الصريح t/3600 عندما يكون b بوحدة µSv/h وt بالثانية).',
    ],
    verificationExample: {
      title: 'المثال 1 (جرعة متكاملة) والمثال 5 (معدل عد)',
      inputsSummary: 'H_on = 0.120 µSv، b = 0.060 µSv/h، t = 120 s  |  N_s = 420 (t_s=60 s)، N_b = 120 (t_b=120 s)',
      expectedResult: 'H_bg = 0.002 µSv → H_net = 0.118 µSv  |  R_net = 6.000 cps ± 0.354 cps (1σ)',
      sourceNote: 'الدليل المرجعي، الفصول 20.7 (المثال 1) و20.8 (المثال 5)',
    },
    lastReviewed: LAST_GLOBAL_REVIEW_DATE,
    status: 'مُراجع',
    version: CALCULATOR_ENGINE_VERSION,
  },
  'dose-per-exposure': {
    id: 'dose-per-exposure',
    title: 'الجرعة لكل تعرض والتطبيع إلى الخرج (mAs / MU)',
    shortTitle: 'الجرعة لكل تعرض',
    formulaLatexLike: 'h = H_net / n   |   q = H_net / Output (mAs أو MU)',
    formulaSource: 'الدليل المرجعي، الفصول 20.1 و20.3 و20.7 و20.8',
    referenceIds: ['iaea-ssg-46'],
    variables: [
      { symbol: 'H_net', meaning: 'الجرعة الصافية المتكاملة بعد طرح الخلفية', unit: 'µSv' },
      { symbol: 'n', meaning: 'عدد التعرضات المتماثلة ضمن نافذة التكامل', unit: 'تعرض (عدد صحيح ≥ 1)' },
      { symbol: 'Output', meaning: 'الخرج الفعلي الكلي (mAs أو MU) لإعداد وهندسة ثابتة', unit: 'mAs أو MU' },
    ],
    applicabilityConditions: [
      'ثبات ظروف التشغيل (kVp والطاقة والحقل والفانتوم والهندسة) عبر جميع التعرضات n.',
      'التحقق من أن الجهاز لا يعاني من تشبع؛ جمع التعرضات يحسّن الإشارة فقط ولا يصلح كاشفًا متشبعًا.',
      'تغيير kVp أو الطاقة أو الفانتوم أو AEC قد يبطل التطبيع الخطي البسيط q.',
    ],
    invalidationCases: [
      'عدد التعرضات n ≤ 0 أو غير صحيح.',
      'الخرج mAs أو MU ≤ 0 عند طلب التطبيع.',
    ],
    verificationExample: {
      title: 'المثال 1 (الأشعة العامة) والمثال 6 (تسرب مسرع)',
      inputsSummary: 'H_net = 0.118 µSv، n = 10  |  H_net = 0.40 µSv، Output = 1000 MU',
      expectedResult: 'h = 0.0118 µSv/exposure  |  q = 0.00040 µSv/MU',
      sourceNote: 'الدليل المرجعي، الفصول 20.7 و20.8',
    },
    lastReviewed: LAST_GLOBAL_REVIEW_DATE,
    status: 'مُراجع',
    version: CALCULATOR_ENGINE_VERSION,
  },
  'weekly-annual': {
    id: 'weekly-annual',
    title: 'التقدير الأسبوعي والسنوي ومقارنته بالمعيار المختار',
    shortTitle: 'التقدير الأسبوعي والسنوي',
    formulaLatexLike: 'H_week = Σ(h_i × N_i × T_i × U_i)   أو   Σ(r_i × (t_min,i / 60) × T_i × U_i)   |   H_year = H_week × Weeks',
    formulaSource: 'الدليل المرجعي، الفصول 4.2 و20.1 و20.2 و20.6 و20.7 و21.3',
    referenceIds: ['iaea-ssg-46', 'iaea-gsr-part3'],
    variables: [
      { symbol: 'h_i أو r_i', meaning: 'الجرعة الصافية لكل إجراء (µSv/إجراء) أو معدل الجرعة الصافي (µSv/h)', unit: 'µSv/proc أو µSv/h' },
      { symbol: 'N_i أو t_min,i', meaning: 'عدد الإجراءات الأسبوعي أو زمن إصدار الإشعاع الفعلي أسبوعيًا بالدقائق', unit: 'proc/week أو min/week' },
      { symbol: 'T_i', meaning: 'معامل الإشغال المبرر والموثق (افتراضيًا 1 ما لم يوثق المستخدم مبررًا ومصدرًا)', unit: 'بلا وحدة (0 < T ≤ 1)' },
      { symbol: 'U_i', meaning: 'معامل الاستخدام (افتراضيًا 1؛ لا يُضرب مرتين إذا كان مدرجًا في توزيع الأوضاع)', unit: 'بلا وحدة (0 < U ≤ 1)' },
    ],
    applicabilityConditions: [
      'لا تُطبَّق معاملات الإشغال T أو الاستخدام U تلقائيًا دون مبرر ومصدر صريح.',
      'في حساب معدل الجرعة: الزمن هو زمن إصدار الإشعاع الفعلي فقط وليس ساعات دوام الموظف.',
      'تُفصل الكميات والوحدات بوضوح ولا تُجمع Gy مع Sv ولا معدل مع جرعة.',
      'النتيجة تخص الكمية التشغيلية عند النقطة (مثل H*(10)) ولا تُسمى تلقائيًا الجرعة الفعالة لشخص ولا تصدر حكم «آمن».',
    ],
    invalidationCases: [
      'عدم وجود صفوف صالحة، أو قيم سالبة في عدد الإجراءات/الزمن/الأسابيع.',
      'قيمة T أو U خارج النطاق (0, 1].',
      'اختيار معيار مخصص دون إدخال قيمة موجبة ومرجع.',
    ],
    verificationExample: {
      title: 'المثال 1 (أشعة عامة) والمثال 2 (CT متعدد البروتوكولات) والمثال 3 (قسطرة)',
      inputsSummary: 'h=0.0118 µSv × 400 × T=1 × 50 أسبوع | CT: (0.02×100 + 0.08×80 + 0.15×20) × T=0.5',
      expectedResult: '4.72 µSv/week و0.236 mSv/year | CT: 11.4 µSv/week قبل T و5.70 µSv/week عند T=0.5',
      sourceNote: 'الدليل المرجعي، الفصل 20.7',
    },
    lastReviewed: LAST_GLOBAL_REVIEW_DATE,
    status: 'مُراجع',
    version: CALCULATOR_ENGINE_VERSION,
  },
  'transmission-reduction': {
    id: 'transmission-reduction',
    title: 'نسبة الانتقال وعامل الخفض (تقييم الحواجز والواقيات)',
    shortTitle: 'الانتقال وعامل الخفض',
    formulaLatexLike: 'B = H_with / H_without   |   RF = H_without / H_with   |   Reduction(%) = (1 − B) × 100',
    formulaSource: 'الدليل المرجعي، الفصول 8.1 و8.3 و13.4 و20.5 و20.7 (المثال 4)',
    referenceIds: ['iaea-ssg-46'],
    variables: [
      { symbol: 'H_without', meaning: 'الجرعة أو المعدل الصافي دون الحاجز/الواقي (بعد طرح الخلفية)', unit: 'µSv أو µSv/h (نفس الوحدة)' },
      { symbol: 'H_with', meaning: 'الجرعة أو المعدل الصافي مع الحاجز/الواقي (أو حد الكشف DL عند عدم التمييز)', unit: 'نفس وحدة H_without' },
      { symbol: 'B', meaning: 'نسبة الانتقال التجريبية في الهندسة المختبرة فقط', unit: 'بلا وحدة' },
      { symbol: 'RF', meaning: 'عامل الخفض (Reduction Factor)', unit: 'بلا وحدة' },
    ],
    applicabilityConditions: [
      'ثبات الهندسة والفانتوم والزاوية والخرج الفعلي بين القياسين (أو التطبيع لمؤشر خرج موثق عند ثبوت العلاقة).',
      'مراعاة طرح الخلفية وحدود الكشف في كلا القياسين.',
      'إذا كان القياس المحمي تحت حد الكشف (H_with < DL)، تُعرض النتيجة كحد أعلى لنسبة الانتقال (B < DL/H_without) وحد أدنى لعامل الخفض (RF > H_without/DL).',
      'لا يُنتَج سمك تدريع تنفيذي (مثل mm رصاص) من نسبة انتقال مقاسة وحدها دون نموذج طيف وبيانات انتقال معتمدة.',
    ],
    invalidationCases: [
      'H_without ≤ 0 (قسمة على صفر أو غياب إشارة مرجعية صالحة).',
      'عدم تطابق الهندسة أو تغير الخرج/الزاوية دون توثيق وتطبيع مبرر.',
      'H_with ≤ 0 دون تفعيل خيار القراءة تحت حد الكشف DL.',
    ],
    verificationExample: {
      title: 'المثال 4: خفض الواقي (الفصل 20.7)',
      inputsSummary: 'H_without = 0.80 µSv، H_with = 0.08 µSv عند ثبات الخرج والهندسة',
      expectedResult: 'B = 0.100، RF = 10.0، نسبة الخفض = 90.0%',
      sourceNote: 'الدليل المرجعي، الفصل 20.7 (المثال 4)',
    },
    lastReviewed: LAST_GLOBAL_REVIEW_DATE,
    status: 'مُراجع',
    version: CALCULATOR_ENGINE_VERSION,
  },
  'contamination-wipe': {
    id: 'contamination-wipe',
    title: 'التلوث السطحي والمسحات وتصحيح الاضمحلال',
    shortTitle: 'التلوث والمسحات',
    formulaLatexLike: 'R_net = N_s/t_s − N_b/t_b  |  A_wipe = R_net / ε  |  A_coll = A_wipe / S  |  A_rem = A_wipe / (S × f)',
    formulaSource: 'الدليل المرجعي، الفصول 15.4 و20.4 و20.8 (المثال 5 و8)؛ ARPANSA RPS 14.2 (2008) القسم 9.10 وAnnex H',
    referenceIds: ['arpansa-rps-14-2', 'iaea-ssg-46'],
    variables: [
      { symbol: 'N_s, t_s / N_b, t_b', meaning: 'عدّ العينة وزمنها، وعدّ الخلفية (أو Blank) وزمنها', unit: 'counts, s' },
      { symbol: 'ε', meaning: 'كفاءة العد الكلية (counts/disintegration) شاملة الهندسة والفرع الانبعاثي الملائم', unit: 'cps/Bq (0 < ε ≤ 1)' },
      { symbol: 'S', meaning: 'مساحة المسحة الفعلية (لا تُفرض 100 cm² تلقائيًا لجميع الحالات)', unit: 'cm²' },
      { symbol: 'f', meaning: 'كفاءة الاسترجاع (اختياري ومبرر؛ لا يُفترض 1 تلقائيًا لكل الأسطح)', unit: 'بلا وحدة (0 < f ≤ 1)' },
      { symbol: 't_decay, T_1/2', meaning: 'الزمن بين أخذ المسحة وعدّها ونصف العمر الفيزيائي (اختياري)', unit: 'h (نفس الوحدة)' },
    ],
    applicabilityConditions: [
      'لا يُحوَّل العدّ إلى نشاط (Bq) دون كفاءة معايرة ε مناسبة للنظير والهندسة.',
      'لا يُضاف عامل الفرع الانبعاثي مرتين إذا كان مضمنًا داخل ε.',
      'يميز الناتج بوضوح بين «النشاط المجمع لكل مساحة (A_wipe/S)» و«تقدير التلوث القابل للإزالة قبل المسح (A_wipe/(S·f))».',
      'حساب عدم اليقين الإحصائي u(R_net) = √(N_s/t_s² + N_b/t_b²) يمثل المكون الإحصائي فقط (بواسون) ولا يشمل عدم يقين الكفاءة أو المساحة.',
    ],
    invalidationCases: [
      't_s ≤ 0 أو t_b ≤ 0 أو S ≤ 0.',
      'كفاءة ε ≤ 0 أو ε > 1، أو كفاءة استرجاع f ≤ 0 أو f > 1.',
      'تفعيل تصحيح الاضمحلال مع T_1/2 ≤ 0.',
    ],
    verificationExample: {
      title: 'المثال 5: حساب مسحة والمثال 8: اضمحلال (الفصل 20.8)',
      inputsSummary: 'N_s=420 (60 s)، N_b=120 (120 s)، ε=0.30، S=100 cm²، f=0.5 | اضمحلال: A0=800 MBq، T_1/2=6 h، t=12 h',
      expectedResult: 'R_net=6 cps (±0.354)، A_wipe=20 Bq، المجمع=0.20 Bq/cm²، المقدر عند f=0.5 يساوي 0.40 Bq/cm² | A(12h)=200 MBq',
      sourceNote: 'الدليل المرجعي، الفصل 20.8',
    },
    lastReviewed: LAST_GLOBAL_REVIEW_DATE,
    status: 'مُراجع',
    version: CALCULATOR_ENGINE_VERSION,
  },
  'coordinates-distance': {
    id: 'coordinates-distance',
    title: 'الإحداثيات والمسافات الهندسية (2D و3D)',
    shortTitle: 'الإحداثيات والمسافات',
    formulaLatexLike: 'r_xy = √((x_P−x_F)² + (y_P−y_F)²)   |   d = √((x_P−x_F)² + (y_P−y_F)² + (z_P−z_F)²)',
    formulaSource: 'دليل إعداد مخططات غرف الأشعة (الفصل 5 و12)؛ والدليل المرجعي (الفصل 20.5)',
    referenceIds: ['iaea-ssg-46'],
    variables: [
      { symbol: '(x_F, y_F, z_F)', meaning: 'إحداثيات البؤرة أو المصدر (SRC-01) من الأصل المحلي (0,0) ومنسوب أرضية الغرفة FFL=0.00', unit: 'm' },
      { symbol: '(x_P, y_P, z_P)', meaning: 'إحداثيات نقطة القياس (MP) باستخدام z المطلق (منسوب الطابق + ارتفاع الكاشف المحلي)', unit: 'm' },
      { symbol: 'r_xy , d', meaning: 'المسافة الأفقية والمسافة المستقيمة ثلاثية الأبعاد', unit: 'm' },
    ],
    applicabilityConditions: [
      'استخدام نفس الأصل (الركن الداخلي الجنوبي الغربي مثلًا) ونفس الوحدة (متر) ومنسوب z المطلق للطوابق.',
      'المسافة d هندسية مستقيمة وليست حسابًا لتوهين الحاجز.',
      'وجود d لا يبرر تلقائيًا تطبيق قانون التربيع العكسي r2 = r1 × (d1/d2)² على حقل متشتت أو ممتد أو محجوب.',
    ],
    invalidationCases: [
      'مدخلات غير رقمية، أو d2 = 0 عند تفعيل فحص التربيع العكسي الاختياري للمصدر النقطي.',
    ],
    verificationExample: {
      title: 'أمثلة دليل المخططات (الفصل 12)',
      inputsSummary: 'SRC=(3.00, 2.50, 1.50)، MP-04=(6.50, 2.50, 1.20)؛ MP-06=(3.00, 2.50, 4.60)؛ MP-07=(3.00, 2.50, -1.10)',
      expectedResult: 'MP-04: r_xy=3.500 m, d=3.513 m | MP-06: d=3.100 m | MP-07: d=2.600 m',
      sourceNote: 'دليل إعداد مخططات غرف الأشعة، الفصول 5 و12',
    },
    lastReviewed: LAST_GLOBAL_REVIEW_DATE,
    status: 'مُراجع',
    version: CALCULATOR_ENGINE_VERSION,
  },
  'uncertainty-decision': {
    id: 'uncertainty-decision',
    title: 'عدم اليقين المركب والموسع وقاعدة القرار',
    shortTitle: 'عدم اليقين والقرار',
    formulaLatexLike: 'u_c(H_net) = √(u(H_on)² + t²·u(b)² + b²·u(t)²)  |  U = k · u_c  |  [Y − U , Y + U] vs L',
    formulaSource: 'الدليل المرجعي، الفصل 21 (21.1 و21.3)؛ JCGM 100 (GUM)؛ ISO 11929',
    referenceIds: ['jcgm-gum', 'iso-11929'],
    variables: [
      { symbol: 'u_i', meaning: 'مكونات عدم اليقين القياسية المستقلة (المعايرة، التكرار، الخلفية، الطاقة/الاتجاه، التموضع، عبء العمل)', unit: 'نفس وحدة Y (أو نسبي %)' },
      { symbol: 'k', meaning: 'معامل التغطية (الشائع k = 2 لتغطية تقارب 95% عند ملاءمة التوزيع)', unit: 'بلا وحدة (k > 0)' },
      { symbol: 'Y , U , L', meaning: 'النتيجة المقدرة، عدم اليقين الموسع، ومعيار المقارنة المحدد بمرجعه', unit: 'نفس الوحدة' },
    ],
    applicabilityConditions: [
      'الجمع التربيعي البسيط يفترض استقلال المتغيرات؛ عند وجود ارتباط يجب إضافة حدود التغاير.',
      'يمكن فصل عدم يقين القياس عن عدم يقين استقراء التشغيل (عبء العمل والإشغال) لتوضيح مصدر الضعف.',
      'قاعدة القرار التحفظية (Y + U ≤ L مقابل Y − U > L) مقترحة للتوافق المسبق وليست قاعدة قانونية عالمية واحدة.',
    ],
    invalidationCases: [
      'معامل التغطية k ≤ 0 أو مكونات عدم يقين سالبة أو معيار L ≤ 0.',
    ],
    verificationExample: {
      title: 'مثال الفصل 21.3 ومثال التقرير 22.6',
      inputsSummary: 'Y = 9 µSv/week، U = 2 µSv/week، L = 10 µSv/week  |  تقرير 22.6: Y = 4.80، U نسبي = 20%، L = 10',
      expectedResult: 'المجال [7 , 11] يتقاطع مع 10 → نتيجة غير حاسمة  |  تقرير 22.6: Y+U = 5.76 ≤ 10 → أقل من المعيار ضمن الافتراضات',
      sourceNote: 'الدليل المرجعي، الفصول 21.3 و22.6',
    },
    lastReviewed: LAST_GLOBAL_REVIEW_DATE,
    status: 'مُراجع',
    version: CALCULATOR_ENGINE_VERSION,
  },
};

// ============================================================================
// 1. Homogeneous Unit Conversion
// ============================================================================
export type UnitCategory = 'dose_equiv' | 'dose_equiv_rate' | 'kerma_absorbed' | 'kerma_rate' | 'activity' | 'count_rate';

export interface UnitDefinition {
  id: string;
  label: string;
  category: UnitCategory;
  categoryLabelAr: string;
  toBaseFactor: number; // Multiply value by this to reach category base unit
}

export const UNIT_DEFINITIONS: UnitDefinition[] = [
  // Equivalent dose (base: Sv)
  { id: 'Sv', label: 'Sv', category: 'dose_equiv', categoryLabelAr: 'مكافئ الجرعة (Sv)', toBaseFactor: 1 },
  { id: 'mSv', label: 'mSv', category: 'dose_equiv', categoryLabelAr: 'مكافئ الجرعة (Sv)', toBaseFactor: 1e-3 },
  { id: 'uSv', label: 'µSv', category: 'dose_equiv', categoryLabelAr: 'مكافئ الجرعة (Sv)', toBaseFactor: 1e-6 },
  { id: 'nSv', label: 'nSv', category: 'dose_equiv', categoryLabelAr: 'مكافئ الجرعة (Sv)', toBaseFactor: 1e-9 },
  // Equivalent dose rate (base: Sv/h)
  { id: 'Sv/h', label: 'Sv/h', category: 'dose_equiv_rate', categoryLabelAr: 'معدل مكافئ الجرعة (Sv/h)', toBaseFactor: 1 },
  { id: 'mSv/h', label: 'mSv/h', category: 'dose_equiv_rate', categoryLabelAr: 'معدل مكافئ الجرعة (Sv/h)', toBaseFactor: 1e-3 },
  { id: 'uSv/h', label: 'µSv/h', category: 'dose_equiv_rate', categoryLabelAr: 'معدل مكافئ الجرعة (Sv/h)', toBaseFactor: 1e-6 },
  { id: 'nSv/h', label: 'nSv/h', category: 'dose_equiv_rate', categoryLabelAr: 'معدل مكافئ الجرعة (Sv/h)', toBaseFactor: 1e-9 },
  { id: 'uSv/s', label: 'µSv/s', category: 'dose_equiv_rate', categoryLabelAr: 'معدل مكافئ الجرعة (Sv/h)', toBaseFactor: 3600e-6 },
  // Air Kerma / Absorbed Dose (base: Gy)
  { id: 'Gy', label: 'Gy', category: 'kerma_absorbed', categoryLabelAr: 'كرما الهواء / الجرعة الممتصة (Gy)', toBaseFactor: 1 },
  { id: 'mGy', label: 'mGy', category: 'kerma_absorbed', categoryLabelAr: 'كرما الهواء / الجرعة الممتصة (Gy)', toBaseFactor: 1e-3 },
  { id: 'uGy', label: 'µGy', category: 'kerma_absorbed', categoryLabelAr: 'كرما الهواء / الجرعة الممتصة (Gy)', toBaseFactor: 1e-6 },
  { id: 'nGy', label: 'nGy', category: 'kerma_absorbed', categoryLabelAr: 'كرما الهواء / الجرعة الممتصة (Gy)', toBaseFactor: 1e-9 },
  // Kerma rate (base: Gy/h)
  { id: 'Gy/h', label: 'Gy/h', category: 'kerma_rate', categoryLabelAr: 'معدل كرما الهواء (Gy/h)', toBaseFactor: 1 },
  { id: 'mGy/h', label: 'mGy/h', category: 'kerma_rate', categoryLabelAr: 'معدل كرما الهواء (Gy/h)', toBaseFactor: 1e-3 },
  { id: 'uGy/h', label: 'µGy/h', category: 'kerma_rate', categoryLabelAr: 'معدل كرما الهواء (Gy/h)', toBaseFactor: 1e-6 },
  // Activity (base: Bq)
  { id: 'Bq', label: 'Bq', category: 'activity', categoryLabelAr: 'النشاط الإشعاعي (Bq)', toBaseFactor: 1 },
  { id: 'kBq', label: 'kBq', category: 'activity', categoryLabelAr: 'النشاط الإشعاعي (Bq)', toBaseFactor: 1e3 },
  { id: 'MBq', label: 'MBq', category: 'activity', categoryLabelAr: 'النشاط الإشعاعي (Bq)', toBaseFactor: 1e6 },
  { id: 'GBq', label: 'GBq', category: 'activity', categoryLabelAr: 'النشاط الإشعاعي (Bq)', toBaseFactor: 1e9 },
  // Count rate (base: cps)
  { id: 'cps', label: 'cps', category: 'count_rate', categoryLabelAr: 'معدل العدّ (cps/cpm)', toBaseFactor: 1 },
  { id: 'cpm', label: 'cpm', category: 'count_rate', categoryLabelAr: 'معدل العدّ (cps/cpm)', toBaseFactor: 1 / 60 },
  { id: 'kcps', label: 'kcps', category: 'count_rate', categoryLabelAr: 'معدل العدّ (cps/cpm)', toBaseFactor: 1e3 },
];

export interface UnitConversionResult {
  valid: boolean;
  error?: string;
  value?: number;
  unit?: string;
  steps: string[];
  scientificWarning?: string;
}

export function calculateUnitConversion(value: number, fromUnitId: string, toUnitId: string): UnitConversionResult {
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'الرجاء إدخال قيمة رقمية صالحة.', steps: [] };
  }
  const fromU = UNIT_DEFINITIONS.find((u) => u.id === fromUnitId);
  const toU = UNIT_DEFINITIONS.find((u) => u.id === toUnitId);
  if (!fromU || !toU) {
    return { valid: false, error: 'وحدة القياس غير معرّفة في جدول الوحدات.', steps: [] };
  }
  if (fromU.category !== toU.category) {
    let reason = 'لا يمكن التحويل التلقائي بين كميتين فيزيائيتين غير متجانستين.';
    if (
      (fromU.category.startsWith('kerma') && toU.category.startsWith('dose_equiv')) ||
      (fromU.category.startsWith('dose_equiv') && toU.category.startsWith('kerma'))
    ) {
      reason =
        'يُمنع التحويل التلقائي بين Gy (كرما الهواء/الجرعة الممتصة) وSv (مكافئ الجرعة) بمعامل 1 افتراضيًا؛ يلزم تحديد الكمية الأصلية وطاقة الحقل وهندسته ومعامل تحويل موثق.';
    } else if (
      (fromU.category === 'count_rate' && toU.category === 'activity') ||
      (fromU.category === 'activity' && toU.category === 'count_rate')
    ) {
      reason =
        'يُمنع التحويل التلقائي بين معدل العدّ (cps/cpm) والنشاط (Bq) دون كفاءة معايرة (ε) موثقة للنظير والهندسة. استخدم حاسبة التلوث والمسحات.';
    }
    return { valid: false, error: reason, steps: [] };
  }

  const ratio = fromU.toBaseFactor / toU.toBaseFactor;
  const converted = value * ratio;
  return {
    valid: true,
    value: converted,
    unit: toU.label,
    steps: [
      `الفئة المتجانسة: ${fromU.categoryLabelAr}`,
      `التعويض: ${value} ${fromU.label} × (${fromU.toBaseFactor} / ${toU.toBaseFactor})`,
      `النتيجة: ${formatPrecision(converted)} ${toU.label}`,
    ],
    scientificWarning:
      fromU.category === 'count_rate'
        ? 'تذكير: معدل العدّ (cps/cpm) ليس نشاطًا (Bq) ولا معدل جرعة (µSv/h) دون معايرة موثقة.'
        : undefined,
  };
}

// ============================================================================
// 2. Background Subtraction (Integrated Dose & Count Rate)
// ============================================================================
export interface DoseBgInput {
  mode: 'dose';
  hOn: number; // µSv
  bgRate: number; // µSv/h
  windowSec: number; // s
  declaredDetectionLimit?: number | null; // Optional documented DL in µSv
}

export interface CountBgInput {
  mode: 'counts';
  ns: number;
  ts: number; // s
  nb: number;
  tb: number; // s
  computeCurrieDL?: boolean; // Optional documented Currie / ISO-like statistical limit (k_alpha = k_beta = 1.645 for 95%)
}

export interface BackgroundSubtractionResult {
  valid: boolean;
  error?: string;
  netValue?: number;
  unit?: string;
  bgContribution?: number;
  statisticalUncertainty1Sigma?: number;
  decisionThresholdLc?: number;
  detectionLimitLd?: number;
  classification?: 'قيمة صافية موجبة' | 'صفر تمامًا' | 'قيمة صافية سالبة (تذبذب إحصائي — محفوظة دون تحويل لصفر)' | 'غير دالة إحصائيًا / تحت عتبة القرار أو حد الكشف';
  steps: string[];
  notes: string[];
}

export function calculateBackgroundSubtraction(input: DoseBgInput | CountBgInput): BackgroundSubtractionResult {
  if (input.mode === 'dose') {
    const { hOn, bgRate, windowSec, declaredDetectionLimit } = input;
    if (!Number.isFinite(hOn) || !Number.isFinite(bgRate) || !Number.isFinite(windowSec)) {
      return { valid: false, error: 'الرجاء إدخال قيم رقمية صالحة للجرعة الإجمالية والخلفية وزمن النافذة.', steps: [], notes: [] };
    }
    if (windowSec <= 0) {
      return { valid: false, error: 'زمن نافذة التكامل يجب أن يكون أكبر من الصفر.', steps: [], notes: [] };
    }
    if (hOn < 0 || bgRate < 0) {
      return { valid: false, error: 'الجرعة الإجمالية ومعدل الخلفية المقاس لا يمكن أن يكونا سالبين.', steps: [], notes: [] };
    }

    const bgContrib = bgRate * (windowSec / 3600);
    const hNet = hOn - bgContrib;

    let classification: BackgroundSubtractionResult['classification'] = 'قيمة صافية موجبة';
    const notes: string[] = [
      'يُطرح مكافئ الخلفية عن كامل نافذة التكامل الزمنية (t)، وليس زمن إصدار الأشعة فقط.',
    ];

    if (declaredDetectionLimit !== undefined && declaredDetectionLimit !== null && Number.isFinite(declaredDetectionLimit) && declaredDetectionLimit > 0 && hNet < declaredDetectionLimit) {
      classification = 'غير دالة إحصائيًا / تحت عتبة القرار أو حد الكشف';
      notes.push(`القيمة الصافية (${formatPrecision(hNet)} µSv) أقل من حد الكشف الموثق المُدخل (${declaredDetectionLimit} µSv) — تُبلغ النتيجة بأنها لم تتميز فوق حد الكشف بالطريقة المستخدمة.`);
    } else if (hNet < 0) {
      classification = 'قيمة صافية سالبة (تذبذب إحصائي — محفوظة دون تحويل لصفر)';
      notes.push('تُحفظ القيمة السالبة في السجل والحساب الإحصائي ولا تُحوَّل آليًا إلى صفر، ولا تُفسر بوصفها جرعة سالبة فيزيائيًا.');
    } else if (Math.abs(hNet) < 1e-12) {
      classification = 'صفر تمامًا';
      notes.push('النتيجة الصافية تساوي صفرًا حسابيًا؛ ذلك لا يثبت غياب الإشعاع بل يتطلب مقارنة بحد الكشف الموثق للطريقة.');
    }

    return {
      valid: true,
      netValue: hNet,
      unit: 'µSv',
      bgContribution: bgContrib,
      detectionLimitLd: declaredDetectionLimit && declaredDetectionLimit > 0 ? declaredDetectionLimit : undefined,
      classification,
      steps: [
        `تحويل زمن النافذة إلى ساعات: t_h = ${windowSec} / 3600 = ${formatPrecision(windowSec / 3600)} h`,
        `جرعة الخلفية خلال النافذة: H_bg = ${bgRate} µSv/h × ${formatPrecision(windowSec / 3600)} h = ${formatPrecision(bgContrib)} µSv`,
        `الجرعة الصافية: H_net = ${hOn} − ${formatPrecision(bgContrib)} = ${formatPrecision(hNet)} µSv`,
      ],
      notes,
    };
  } else {
    const { ns, ts, nb, tb, computeCurrieDL } = input;
    if (!Number.isFinite(ns) || !Number.isFinite(ts) || !Number.isFinite(nb) || !Number.isFinite(tb)) {
      return { valid: false, error: 'الرجاء إدخال قيم رقمية صالحة لعدّ العينة والخلفية وأزمنة القياس.', steps: [], notes: [] };
    }
    if (ts <= 0 || tb <= 0) {
      return { valid: false, error: 'زمن عدّ العينة (t_s) وزمن عدّ الخلفية (t_b) يجب أن يكونا أكبر من الصفر.', steps: [], notes: [] };
    }
    if (ns < 0 || nb < 0) {
      return { valid: false, error: 'قيم العدّ الخام (N_s وN_b) لا يمكن أن تكون سالبة.', steps: [], notes: [] };
    }

    const rs = ns / ts;
    const rb = nb / tb;
    const rNet = rs - rb;
    const uNet = Math.sqrt(ns / (ts * ts) + nb / (tb * tb));

    // Optional Currie / ISO-style characteristic limits for paired counting (alpha = beta = 0.05 -> k = 1.645)
    let lc: number | undefined;
    let ld: number | undefined;
    const notes: string[] = [
      'تمت مراعاة اختلاف زمن قياس العينة (t_s) عن زمن قياس الخلفية (t_b).',
      'u(R_net) يمثل المكون الإحصائي (بواسون) فقط ولا يطبق على قراءات معدل جرعة إلكترونية مفلترة.',
    ];

    if (computeCurrieDL) {
      const k = 1.645;
      // Standard deviation of net rate when true sample net rate = 0: sigma_0 = sqrt(rb * (1/ts + 1/tb))
      const sigma0 = Math.sqrt(rb * (1 / ts + 1 / tb));
      lc = k * sigma0;
      ld = (k * k) / ts + 2 * lc;
      notes.push('حُسبت عتبة القرار L_c وحد الكشف L_D وفق صيغة بواسون القياسية (α = β = 0.05، k = 1.645)؛ يُوثق ذلك مع النسخة المعتمدة من ISO 11929.');
    } else {
      notes.push('لم يُحسب حد الكشف تلقائيًا؛ فعّل خيار الحساب الإحصائي الموثق عند توافر شروط عدّ بواسون المستقل.');
    }

    let classification: BackgroundSubtractionResult['classification'] = 'قيمة صافية موجبة';
    if (rNet < 0) {
      classification = 'قيمة صافية سالبة (تذبذب إحصائي — محفوظة دون تحويل لصفر)';
      notes.push('تُحفظ القيمة السالبة كما هي إحصائيًا دون تحويلها تلقائيًا إلى صفر.');
    } else if (Math.abs(rNet) < 1e-12) {
      classification = 'صفر تمامًا';
    } else if (lc !== undefined && rNet <= lc) {
      classification = 'غير دالة إحصائيًا / تحت عتبة القرار أو حد الكشف';
    } else if (lc === undefined && rNet < 1.645 * uNet) {
      classification = 'غير دالة إحصائيًا / تحت عتبة القرار أو حد الكشف';
    }

    const steps = [
      `معدل عدّ العينة: R_s = ${ns} / ${ts} = ${formatPrecision(rs)} cps`,
      `معدل عدّ الخلفية: R_b = ${nb} / ${tb} = ${formatPrecision(rb)} cps`,
      `صافي معدل العدّ: R_net = ${formatPrecision(rs)} − ${formatPrecision(rb)} = ${formatPrecision(rNet)} cps`,
      `عدم اليقين الإحصائي (1σ بواسون): u(R_net) = √(${ns}/${ts}² + ${nb}/${tb}²) = ${formatPrecision(uNet)} cps`,
    ];
    if (lc !== undefined && ld !== undefined) {
      steps.push(`عتبة القرار L_c (α=0.05) = ${formatPrecision(lc)} cps | حد الكشف L_D (α=β=0.05) = ${formatPrecision(ld)} cps`);
    }

    return {
      valid: true,
      netValue: rNet,
      unit: 'cps',
      bgContribution: rb,
      statisticalUncertainty1Sigma: uNet,
      decisionThresholdLc: lc,
      detectionLimitLd: ld,
      classification,
      steps,
      notes,
    };
  }
}

// ============================================================================
// 3. Dose Per Exposure & Output Normalization
// ============================================================================
export interface DosePerExposureResult {
  valid: boolean;
  error?: string;
  dosePerExposure?: number;
  normalizedPerOutput?: number;
  outputUnit?: 'mAs' | 'MU';
  steps: string[];
  notes: string[];
}

export function calculateDosePerExposure(
  hNetMicroSv: number,
  exposuresCount: number,
  totalOutput?: number | null,
  outputUnit: 'mAs' | 'MU' = 'mAs'
): DosePerExposureResult {
  if (!Number.isFinite(hNetMicroSv) || !Number.isFinite(exposuresCount)) {
    return { valid: false, error: 'الرجاء إدخال قيم رقمية صالحة.', steps: [], notes: [] };
  }
  if (exposuresCount <= 0 || !Number.isInteger(exposuresCount)) {
    return { valid: false, error: 'عدد التعرضات (n) يجب أن يكون عددًا صحيحًا أكبر من أو يساوي 1.', steps: [], notes: [] };
  }

  const h = hNetMicroSv / exposuresCount;
  const steps = [
    `الجرعة الصافية لكل تعرض: h = H_net / n = ${hNetMicroSv} / ${exposuresCount} = ${formatPrecision(h)} µSv/exposure`,
  ];
  const notes = [
    'تفترض المعادلة تطابق ظروف التشغيل والهندسة عبر جميع التعرضات (n).',
  ];

  let q: number | undefined;
  if (totalOutput !== undefined && totalOutput !== null && !Number.isNaN(totalOutput)) {
    if (totalOutput <= 0) {
      return { valid: false, error: `قيمة الخرج الكلي (${outputUnit}) يجب أن تكون أكبر من الصفر.`, steps: [], notes: [] };
    }
    q = hNetMicroSv / totalOutput;
    steps.push(`التطبيع إلى الخرج: q = ${hNetMicroSv} / ${totalOutput} = ${formatPrecision(q, 6)} µSv/${outputUnit}`);
    notes.push(`لا يُعمم معامل التطبيع q عند تغير kVp أو الطاقة أو حجم الحقل أو الفانتوم أو تفعيل AEC.`);
  }

  if (hNetMicroSv < 0) {
    notes.push('تنبيه: الجرعة الصافية سالبة نتيجة طرح الخلفية؛ احتفظ بها إحصائيًا وراجع حساسية القياس وزمنه.');
  }

  return {
    valid: true,
    dosePerExposure: h,
    normalizedPerOutput: q,
    outputUnit,
    steps,
    notes,
  };
}

// ============================================================================
// 4. Weekly & Annual Estimate with Explicit Comparison Standard
// ============================================================================
export interface WorkloadRowInput {
  id: string;
  label: string;
  inputType: 'per_procedure' | 'dose_rate';
  value: number; // µSv/proc OR µSv/h
  countOrMinutesPerWeek: number; // procs/week OR radiation emission minutes/week
  occupancyT: number; // 0 < T <= 1
  useFactorU: number; // 0 < U <= 1
  tJustification: string;
}

export interface WeeklyAnnualResult {
  valid: boolean;
  error?: string;
  rowResults: { id: string; label: string; weeklyBeforeTU: number; weeklyAfterTU: number }[];
  totalWeeklyBeforeTU?: number;
  totalWeeklyMicroSv?: number;
  totalAnnualMicroSv?: number;
  totalAnnualMilliSv?: number;
  expandedUncertaintyWeekly?: number;
  assessmentOutcome?: AssessmentOutcome;
  assessmentStatement?: string;
  steps: string[];
  notes: string[];
}

export function calculateWeeklyAnnual(
  rows: WorkloadRowInput[],
  weeksPerYear: number,
  relativeExpandedUncertaintyPercent: number | null,
  criterionValue: number | null,
  criterionUnit: 'µSv/week' | 'mSv/year',
  criterionReference: string
): WeeklyAnnualResult {
  if (!rows.length) {
    return { valid: false, error: 'أضف صفًا واحدًا على الأقل لحساب المساهمة الأسبوعية.', rowResults: [], steps: [], notes: [] };
  }
  if (!Number.isFinite(weeksPerYear) || weeksPerYear <= 0 || weeksPerYear > 53) {
    return { valid: false, error: 'عدد أسابيع التشغيل السنوية يجب أن يكون بين 1 و53.', rowResults: [], steps: [], notes: [] };
  }

  const rowResults: WeeklyAnnualResult['rowResults'] = [];
  const steps: string[] = [];
  const notes: string[] = [
    'التقدير يخص الكمية التشغيلية المقاسة عند النقطة (مثل H*(10)) ولا يُسمى تلقائيًا الجرعة الفعالة لشخص.',
  ];

  let totalBeforeTU = 0;
  let totalWeekly = 0;

  for (const row of rows) {
    if (!Number.isFinite(row.value) || !Number.isFinite(row.countOrMinutesPerWeek)) {
      return { valid: false, error: `قيم غير صالحة في الصف «${row.label}».`, rowResults: [], steps: [], notes: [] };
    }
    if (row.countOrMinutesPerWeek < 0) {
      return { valid: false, error: `عدد الإجراءات أو زمن الإشعاع لا يمكن أن يكون سالبًا في «${row.label}».`, rowResults: [], steps: [], notes: [] };
    }
    if (!Number.isFinite(row.occupancyT) || row.occupancyT <= 0 || row.occupancyT > 1) {
      return { valid: false, error: `معامل الإشغال T في «${row.label}» يجب أن يكون أكبر من 0 وحتى 1.`, rowResults: [], steps: [], notes: [] };
    }
    if (!Number.isFinite(row.useFactorU) || row.useFactorU <= 0 || row.useFactorU > 1) {
      return { valid: false, error: `معامل الاستخدام U في «${row.label}» يجب أن يكون أكبر من 0 وحتى 1.`, rowResults: [], steps: [], notes: [] };
    }

    const weeklyRaw =
      row.inputType === 'per_procedure'
        ? row.value * row.countOrMinutesPerWeek
        : row.value * (row.countOrMinutesPerWeek / 60);

    const weeklyAdjusted = weeklyRaw * row.occupancyT * row.useFactorU;
    totalBeforeTU += weeklyRaw;
    totalWeekly += weeklyAdjusted;

    rowResults.push({
      id: row.id,
      label: row.label,
      weeklyBeforeTU: weeklyRaw,
      weeklyAfterTU: weeklyAdjusted,
    });

    if (row.inputType === 'per_procedure') {
      steps.push(
        `${row.label}: ${row.value} µSv/إجراء × ${row.countOrMinutesPerWeek} إجراء/أسبوع × T(${row.occupancyT}) × U(${row.useFactorU}) = ${formatPrecision(weeklyAdjusted)} µSv/week`
      );
    } else {
      steps.push(
        `${row.label}: ${row.value} µSv/h × (${row.countOrMinutesPerWeek}/60 h/أسبوع) × T(${row.occupancyT}) × U(${row.useFactorU}) = ${formatPrecision(weeklyAdjusted)} µSv/week`
      );
    }

    if (row.occupancyT < 1 && !row.tJustification.trim()) {
      notes.push(`تنبيه في «${row.label}»: تم استخدام T = ${row.occupancyT} دون تدوين مبرر أو مصدر الاعتماد.`);
    }
    if (row.useFactorU < 1) {
      notes.push(`تنبيه في «${row.label}»: تحقق من أن معامل الاستخدام U = ${row.useFactorU} لم يُدرج مسبقًا ضمن توزيع الإجراءات.`);
    }
  }

  const totalAnnualMicroSv = totalWeekly * weeksPerYear;
  const totalAnnualMilliSv = totalAnnualMicroSv / 1000;
  steps.push(`المجموع الأسبوعي قبل T وU = ${formatPrecision(totalBeforeTU)} µSv/week | بعد T وU = ${formatPrecision(totalWeekly)} µSv/week`);
  steps.push(`التقدير السنوي (${weeksPerYear} أسبوعًا) = ${formatPrecision(totalAnnualMicroSv)} µSv/year = ${formatPrecision(totalAnnualMilliSv, 4)} mSv/year`);

  let expandedUWeekly: number | undefined;
  if (relativeExpandedUncertaintyPercent !== null && Number.isFinite(relativeExpandedUncertaintyPercent) && relativeExpandedUncertaintyPercent >= 0) {
    expandedUWeekly = Math.abs(totalWeekly) * (relativeExpandedUncertaintyPercent / 100);
    steps.push(`عدم اليقين الموسع الأسبوعي (±${relativeExpandedUncertaintyPercent}%): U = ${formatPrecision(expandedUWeekly)} µSv/week`);
  }

  // Strict decision evaluation — NEVER emits "آمنة"
  let outcome: AssessmentOutcome = 'insufficient_data';
  let statement = 'البيانات غير كافية للتقييم — يلزم تحديد معيار مقارنة موجب ومرجعه المعتمد.';

  if (criterionValue !== null && Number.isFinite(criterionValue) && criterionValue > 0 && criterionReference.trim().length > 0) {
    const comparedValue = criterionUnit === 'µSv/week' ? totalWeekly : totalAnnualMilliSv;
    const uCompared =
      expandedUWeekly !== undefined
        ? criterionUnit === 'µSv/week'
          ? expandedUWeekly
          : (expandedUWeekly * weeksPerYear) / 1000
        : 0;

    if (uCompared > 0) {
      if (comparedValue + uCompared <= criterionValue) {
        outcome = 'below_criterion';
        statement = `التقدير أقل من معيار المقارنة المختار (${criterionValue} ${criterionUnit}) حتى مع إضافة عدم اليقين الموسع (Y+U = ${formatPrecision(comparedValue + uCompared)} ${criterionUnit})، ضمن الافتراضات الموضحة.`;
      } else if (comparedValue - uCompared > criterionValue) {
        outcome = 'above_criterion';
        statement = `التقدير أعلى من معيار المقارنة المختار (${criterionValue} ${criterionUnit}) حتى بعد طرح عدم اليقين الموسع (Y−U = ${formatPrecision(comparedValue - uCompared)} ${criterionUnit})، ضمن الافتراضات الموضحة.`;
      } else {
        outcome = 'inconclusive';
        statement = `النتيجة غير حاسمة: يتقاطع مجال التقدير [${formatPrecision(comparedValue - uCompared)} , ${formatPrecision(comparedValue + uCompared)}] ${criterionUnit} مع معيار المقارنة المختار (${criterionValue} ${criterionUnit})، وتحتاج قياسًا أدق أو مراجعة تشغيلية.`;
      }
    } else {
      if (comparedValue <= criterionValue) {
        outcome = 'below_criterion';
        statement = `التقدير أقل من معيار المقارنة المختار (${criterionValue} ${criterionUnit})، ضمن الافتراضات الموضحة (تنبيه: لم يُدرج عدم يقين موسع في المقارنة).`;
      } else {
        outcome = 'above_criterion';
        statement = `التقدير أعلى من معيار المقارنة المختار (${criterionValue} ${criterionUnit})، ضمن الافتراضات الموضحة.`;
      }
    }
  }

  return {
    valid: true,
    rowResults,
    totalWeeklyBeforeTU: totalBeforeTU,
    totalWeeklyMicroSv: totalWeekly,
    totalAnnualMicroSv,
    totalAnnualMilliSv,
    expandedUncertaintyWeekly: expandedUWeekly,
    assessmentOutcome: outcome,
    assessmentStatement: statement,
    steps,
    notes,
  };
}

// ============================================================================
// 5. Transmission & Reduction Factor
// ============================================================================
export interface TransmissionResult {
  valid: boolean;
  error?: string;
  isLimitBound?: boolean;
  transmissionB?: number;
  reductionFactorRF?: number;
  reductionPercent?: number;
  steps: string[];
  notes: string[];
}

export function calculateTransmissionReduction(
  hWithout: number,
  hWith: number,
  isBelowDetectionLimit: boolean,
  geometryMatched: boolean,
  backgroundSubtracted: boolean
): TransmissionResult {
  if (!Number.isFinite(hWithout) || !Number.isFinite(hWith)) {
    return { valid: false, error: 'الرجاء إدخال قيم رقمية صالحة.', steps: [], notes: [] };
  }
  if (hWithout <= 0) {
    return { valid: false, error: 'القراءة الصافية دون الحاجز/الواقي (H_without) يجب أن تكون أكبر من الصفر.', steps: [], notes: [] };
  }
  if (hWith <= 0) {
    return {
      valid: false,
      error: isBelowDetectionLimit
        ? 'أدخل قيمة حد الكشف الموجبة (DL) لحساب حد نسبة الانتقال.'
        : 'القراءة الصافية مع الحاجز (H_with) يجب أن تكون موجبة، أو فعّل خيار «تحت حد الكشف» وأدخل قيمة حد الكشف DL.',
      steps: [],
      notes: [],
    };
  }

  const B = hWith / hWithout;
  const RF = hWithout / hWith;
  const pct = (1 - B) * 100;

  const notes: string[] = [
    'لا يُنتَج سمك تدريع تنفيذي (مثل mm رصاص أو سمك خرسانة) من نسبة توهين مقاسة وحدها دون نموذج طيف وبيانات انتقال معتمدة.',
  ];
  if (!geometryMatched) {
    notes.push('تحذير جوهري: تم الإشارة إلى عدم تطابق الهندسة أو الخرج بين القياسين؛ النسبة المحسوبة تشمل أثر التغير ولا تُنسب للحاجز/الواقي وحده.');
  }
  if (!backgroundSubtracted) {
    notes.push('تحذير جوهري: لم يُطرح أثر الخلفية؛ النسبة قد تكون منحازة خصوصًا عند القيم المنخفضة.');
  }
  if (isBelowDetectionLimit) {
    notes.push('بما أن القراءة المحمية تحت حد الكشف، تُعرض النتيجة كحد أعلى لنسبة الانتقال وحد أدنى لعامل الخفض وليست قيمة دقيقة.');
  }

  const prefixB = isBelowDetectionLimit ? 'B < ' : 'B = ';
  const prefixRF = isBelowDetectionLimit ? 'RF > ' : 'RF = ';
  const prefixPct = isBelowDetectionLimit ? 'نسبة الخفض > ' : 'نسبة الخفض = ';

  return {
    valid: true,
    isLimitBound: isBelowDetectionLimit,
    transmissionB: B,
    reductionFactorRF: RF,
    reductionPercent: pct,
    steps: [
      `نسبة الانتقال التجريبية: ${prefixB}${hWith} / ${hWithout} = ${formatPrecision(B, 4)}`,
      `عامل الخفض: ${prefixRF}${hWithout} / ${hWith} = ${formatPrecision(RF, 2)}`,
      `${prefixPct}(1 − ${formatPrecision(B, 4)}) × 100 = ${formatPrecision(pct, 2)}%`,
    ],
    notes,
  };
}

// ============================================================================
// 6. Surface Contamination, Wipes & Optional Decay Correction
// ============================================================================
export interface ContaminationResult {
  valid: boolean;
  error?: string;
  rNetCps?: number;
  uRNetCps?: number;
  aWipeBq?: number;
  aWipeDecayCorrectedBq?: number;
  collectedPerAreaBqCm2?: number;
  removableEstimateBqCm2?: number;
  steps: string[];
  notes: string[];
}

export function calculateContaminationWipe(params: {
  ns: number;
  ts: number;
  nb: number;
  tb: number;
  efficiency: number; // counts/disintegration (0 < e <= 1)
  areaCm2: number; // user-specified area
  removalFactor?: number | null; // optional f (0 < f <= 1)
  decayHours?: number | null;
  halfLifeHours?: number | null;
}): ContaminationResult {
  const { ns, ts, nb, tb, efficiency, areaCm2, removalFactor, decayHours, halfLifeHours } = params;
  if ([ns, ts, nb, tb, efficiency, areaCm2].some((v) => !Number.isFinite(v))) {
    return { valid: false, error: 'الرجاء إدخال جميع المدخلات الأساسية بأرقام صالحة.', steps: [], notes: [] };
  }
  if (ts <= 0 || tb <= 0) {
    return { valid: false, error: 'أزمنة العدّ (t_s وt_b) يجب أن تكون أكبر من الصفر.', steps: [], notes: [] };
  }
  if (ns < 0 || nb < 0) {
    return { valid: false, error: 'العدّ الخام لا يمكن أن يكون سالبًا.', steps: [], notes: [] };
  }
  if (efficiency <= 0 || efficiency > 1) {
    return { valid: false, error: 'كفاءة العدّ الكلية ε يجب أن تكون أكبر من 0 وحتى 1 (counts/disintegration).', steps: [], notes: [] };
  }
  if (areaCm2 <= 0) {
    return { valid: false, error: 'مساحة المسحة S يجب أن تكون أكبر من الصفر.', steps: [], notes: [] };
  }
  if (removalFactor !== undefined && removalFactor !== null && (!Number.isFinite(removalFactor) || removalFactor <= 0 || removalFactor > 1)) {
    return { valid: false, error: 'كفاءة الاسترجاع f يجب أن تكون أكبر من 0 وحتى 1 (أو تُترك فارغة عند عدم التقدير قبل المسح).', steps: [], notes: [] };
  }

  const rNet = ns / ts - nb / tb;
  const uRNet = Math.sqrt(ns / (ts * ts) + nb / (tb * tb));
  const aWipe = rNet / efficiency;

  const steps = [
    `صافي معدل العدّ: R_net = (${ns}/${ts}) − (${nb}/${tb}) = ${formatPrecision(rNet)} cps`,
    `عدم اليقين الإحصائي (1σ بواسون): u(R_net) = √(${ns}/${ts}² + ${nb}/${tb}²) = ${formatPrecision(uRNet)} cps`,
    `نشاط المسحة عند وقت العدّ: A_wipe = ${formatPrecision(rNet)} / ${efficiency} = ${formatPrecision(aWipe)} Bq`,
  ];

  let effectiveActivity = aWipe;
  let decayCorrected: number | undefined;
  if (decayHours !== undefined && decayHours !== null && halfLifeHours !== undefined && halfLifeHours !== null) {
    if (!Number.isFinite(decayHours) || !Number.isFinite(halfLifeHours) || halfLifeHours <= 0 || decayHours < 0) {
      return { valid: false, error: 'لتصحيح الاضمحلال، يجب أن يكون نصف العمر موجبًا والزمن المنقضي ≥ 0.', steps: [], notes: [] };
    }
    if (decayHours > 0) {
      // Back-correct to sampling time: A(0) = A(t) * 2^(+t / T_half)
      decayCorrected = aWipe * Math.pow(2, decayHours / halfLifeHours);
      effectiveActivity = decayCorrected;
      steps.push(
        `تصحيح الاضمحلال لزمن أخذ المسحة (t = ${decayHours} h، T½ = ${halfLifeHours} h): A_0 = ${formatPrecision(aWipe)} × 2^(${decayHours}/${halfLifeHours}) = ${formatPrecision(decayCorrected)} Bq`
      );
    }
  }

  const collectedPerArea = effectiveActivity / areaCm2;
  steps.push(`النشاط المجمع لكل وحدة مساحة (S = ${areaCm2} cm²): A_coll = ${formatPrecision(effectiveActivity)} / ${areaCm2} = ${formatPrecision(collectedPerArea, 4)} Bq/cm²`);

  let removableEstimate: number | undefined;
  if (removalFactor && removalFactor > 0) {
    removableEstimate = effectiveActivity / (areaCm2 * removalFactor);
    steps.push(`تقدير التلوث القابل للإزالة قبل المسح (مع f = ${removalFactor}): A_rem = ${formatPrecision(effectiveActivity)} / (${areaCm2} × ${removalFactor}) = ${formatPrecision(removableEstimate, 4)} Bq/cm²`);
  }

  const notes = [
    'لا تقارن النتيجة بمعيار قانوني قبل التحقق هل المعيار يخص النشاط المجمع (A_wipe/S) أم التلوث السطحي المقدر (A_wipe/(S·f)) ومساحته المرجعية.',
    'لا تضف عامل الفرع الانبعاثي مرتين إذا كان مضمنًا داخل كفاءة العد الكلية ε.',
    'u(R_net) يمثل المكون الإحصائي فقط ولا يشمل عدم يقين كفاءة العد أو الاسترجاع أو المساحة.',
  ];
  if (rNet < 0) {
    notes.push('صافي العدّ سالب بفعل التذبذب الإحصائي؛ يُحفظ دون تحويل تلقائي إلى صفر.');
  }

  return {
    valid: true,
    rNetCps: rNet,
    uRNetCps: uRNet,
    aWipeBq: aWipe,
    aWipeDecayCorrectedBq: decayCorrected,
    collectedPerAreaBqCm2: collectedPerArea,
    removableEstimateBqCm2: removableEstimate,
    steps,
    notes,
  };
}

// Standalone physical decay helper (Example 8 verification)
export function calculateRadioactiveDecay(a0: number, elapsedHours: number, halfLifeHours: number): { valid: boolean; value?: number; error?: string } {
  if (!Number.isFinite(a0) || !Number.isFinite(elapsedHours) || !Number.isFinite(halfLifeHours)) {
    return { valid: false, error: 'قيم غير صالحة.' };
  }
  if (a0 < 0 || elapsedHours < 0 || halfLifeHours <= 0) {
    return { valid: false, error: 'النشاط والزمن يجب أن يكونا غير سالبين ونصف العمر موجبًا.' };
  }
  return { valid: true, value: a0 * Math.pow(2, -elapsedHours / halfLifeHours) };
}

// ============================================================================
// 7. Coordinates & 2D/3D Distances (+ Conditional Inverse-Square Check)
// ============================================================================
export interface CoordinatesDistanceResult {
  valid: boolean;
  error?: string;
  dx?: number;
  dy?: number;
  dz?: number;
  horizontalDistanceM?: number;
  distance3DM?: number;
  inverseSquareRate?: number;
  steps: string[];
  notes: string[];
}

export function calculateCoordinatesDistance(params: {
  xf: number;
  yf: number;
  zf: number;
  xp: number;
  yp: number;
  zp: number;
  inverseSquare?: { enabled: boolean; r1: number; d1: number; pointSourceConfirmed: boolean };
}): CoordinatesDistanceResult {
  const { xf, yf, zf, xp, yp, zp, inverseSquare } = params;
  if ([xf, yf, zf, xp, yp, zp].some((v) => !Number.isFinite(v))) {
    return { valid: false, error: 'الرجاء إدخال إحداثيات رقمية صالحة بالمتر.', steps: [], notes: [] };
  }

  const dx = xp - xf;
  const dy = yp - yf;
  const dz = zp - zf;
  const rxy = Math.sqrt(dx * dx + dy * dy);
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const steps = [
    `الفروق الإحداثية: Δx = ${formatPrecision(dx)} m، Δy = ${formatPrecision(dy)} m، Δz = ${formatPrecision(dz)} m`,
    `المسافة الأفقية: r_xy = √((${formatPrecision(dx)})² + (${formatPrecision(dy)})²) = ${formatPrecision(rxy)} m`,
    `المسافة الهندسية ثلاثية الأبعاد: d = √((${formatPrecision(dx)})² + (${formatPrecision(dy)})² + (${formatPrecision(dz)})²) = ${formatPrecision(d)} m`,
  ];

  const notes = [
    'المرجع: الركن الداخلي الجنوبي الغربي (0,0) ومنسوب أرضية غرفة المسح FFL = 0.00 m؛ استخدم z المطلق للطوابق.',
    'هذه مسافة هندسية مستقيمة وليست حسابًا لتوهين الحاجز ولا تبرر وحدها تطبيق قانون التربيع العكسي على حقل متشتت أو ممتد أو محجوب.',
  ];

  let r2: number | undefined;
  if (inverseSquare?.enabled) {
    if (!Number.isFinite(inverseSquare.r1) || !Number.isFinite(inverseSquare.d1) || inverseSquare.r1 < 0 || inverseSquare.d1 <= 0) {
      return { valid: false, error: 'لفحص التربيع العكسي الاختياري، يجب أن تكون d1 > 0 وr1 ≥ 0.', steps: [], notes: [] };
    }
    if (d <= 0) {
      return { valid: false, error: 'المسافة المحسوبة d2 تساوي صفرًا؛ لا يمكن القسمة على صفر.', steps: [], notes: [] };
    }
    r2 = inverseSquare.r1 * Math.pow(inverseSquare.d1 / d, 2);
    steps.push(`تقدير التربيع العكسي لمصدر نقطي غير محجوب: r2 = ${inverseSquare.r1} × (${inverseSquare.d1} / ${formatPrecision(d)})² = ${formatPrecision(r2)}`);
    if (!inverseSquare.pointSourceConfirmed) {
      notes.push('تحذير: لم يتم تأكيد شرط المصدر النقطي غير المحجوب — لا تُعمم هذه القيمة على تشتت غرفة أو قرب حاجز.');
    }
  }

  return {
    valid: true,
    dx,
    dy,
    dz,
    horizontalDistanceM: rxy,
    distance3DM: d,
    inverseSquareRate: r2,
    steps,
    notes,
  };
}

// ============================================================================
// 8. Combined Uncertainty & Decision Rule
// ============================================================================
export interface UncertaintyBudgetInput {
  mode: 'budget' | 'background_propagation';
  resultY: number;
  unit: string;
  coverageK: number;
  limitL: number | null;
  limitReference: string;
  // For budget mode (absolute standard uncertainties in same unit as Y)
  components?: { label: string; u: number; group: 'قياس' | 'تشغيل' }[];
  // For background propagation mode: H_net = H_on - b * t_h
  hOn?: number;
  uHOn?: number;
  bgRate?: number;
  uBgRate?: number;
  tHours?: number;
  uTHours?: number;
}

export interface UncertaintyResult {
  valid: boolean;
  error?: string;
  resultY?: number;
  uMeasurement?: number;
  uOperational?: number;
  uCombined?: number;
  expandedU?: number;
  lowerBound?: number;
  upperBound?: number;
  outcome?: AssessmentOutcome;
  outcomeStatement?: string;
  steps: string[];
  notes: string[];
}

export function calculateUncertaintyDecision(input: UncertaintyBudgetInput): UncertaintyResult {
  const { mode, coverageK, limitL, limitReference, unit } = input;
  if (!Number.isFinite(coverageK) || coverageK <= 0) {
    return { valid: false, error: 'معامل التغطية k يجب أن يكون رقمًا موجبًا (الشائع k = 2).', steps: [], notes: [] };
  }

  let Y = input.resultY;
  let uMeas = 0;
  let uOper = 0;
  let uC = 0;
  const steps: string[] = [];
  const notes: string[] = [
    'الجمع التربيعي يفترض استقلال المكونات؛ عند وجود ارتباط بين متغيرين يلزم إضافة حدود التغاير.',
    'قاعدة القرار (Y+U ≤ L مقابل Y−U > L) قاعدة تحفظية مقترحة للاتفاق المسبق وليست قانونًا عالميًا واحدًا.',
  ];

  if (mode === 'background_propagation') {
    const { hOn = 0, uHOn = 0, bgRate = 0, uBgRate = 0, tHours = 0, uTHours = 0 } = input;
    if ([hOn, uHOn, bgRate, uBgRate, tHours, uTHours].some((v) => !Number.isFinite(v))) {
      return { valid: false, error: 'الرجاء إدخال قيم رقمية صالحة لانتشار عدم يقين طرح الخلفية.', steps: [], notes: [] };
    }
    if (uHOn < 0 || uBgRate < 0 || uTHours < 0 || tHours < 0) {
      return { valid: false, error: 'مكونات عدم اليقين والزمن لا يمكن أن تكون سالبة.', steps: [], notes: [] };
    }
    Y = hOn - bgRate * tHours;
    const varSum = uHOn * uHOn + tHours * tHours * uBgRate * uBgRate + bgRate * bgRate * uTHours * uTHours;
    uC = Math.sqrt(varSum);
    uMeas = uC;
    steps.push(`الصافي: H_net = ${hOn} − (${bgRate} × ${tHours}) = ${formatPrecision(Y)} ${unit}`);
    steps.push(
      `انتشار عدم اليقين: u_c = √(${uHOn}² + ${tHours}²·${uBgRate}² + ${bgRate}²·${uTHours}²) = ${formatPrecision(uC)} ${unit}`
    );
  } else {
    if (!Number.isFinite(Y)) {
      return { valid: false, error: 'الرجاء إدخال قيمة رقمية صالحة للنتيجة Y.', steps: [], notes: [] };
    }
    const comps = input.components ?? [];
    if (!comps.length) {
      return { valid: false, error: 'أضف مكونًا واحدًا على الأقل في ميزانية عدم اليقين.', steps: [], notes: [] };
    }
    for (const c of comps) {
      if (!Number.isFinite(c.u) || c.u < 0) {
        return { valid: false, error: `قيمة عدم اليقين غير صالحة في المكون «${c.label}».`, steps: [], notes: [] };
      }
      if (c.group === 'قياس') uMeas += c.u * c.u;
      else uOper += c.u * c.u;
    }
    uMeas = Math.sqrt(uMeas);
    uOper = Math.sqrt(uOper);
    uC = Math.sqrt(uMeas * uMeas + uOper * uOper);
    steps.push(`عدم يقين القياس المركب: u_meas = ${formatPrecision(uMeas)} ${unit}`);
    steps.push(`عدم يقين استقراء التشغيل: u_oper = ${formatPrecision(uOper)} ${unit}`);
    steps.push(`عدم اليقين المركب الكلي: u_c = √(u_meas² + u_oper²) = ${formatPrecision(uC)} ${unit}`);
  }

  const U = coverageK * uC;
  const low = Y - U;
  const high = Y + U;
  steps.push(`عدم اليقين الموسع (k = ${coverageK}): U = ${coverageK} × ${formatPrecision(uC)} = ${formatPrecision(U)} ${unit}`);
  steps.push(`مجال التغطية [Y − U , Y + U] = [${formatPrecision(low)} , ${formatPrecision(high)}] ${unit}`);

  let outcome: AssessmentOutcome = 'insufficient_data';
  let outcomeStatement = 'البيانات غير كافية للتقييم — أدخل معيار مقارنة L موجبًا ومرجعه المعتمد.';

  if (limitL !== null && Number.isFinite(limitL) && limitL > 0 && limitReference.trim().length > 0) {
    if (high <= limitL) {
      outcome = 'below_criterion';
      outcomeStatement = `التقدير أقل من معيار المقارنة المختار (Y + U = ${formatPrecision(high)} ≤ ${limitL} ${unit})، ضمن الافتراضات الموضحة.`;
    } else if (low > limitL) {
      outcome = 'above_criterion';
      outcomeStatement = `التقدير أعلى من معيار المقارنة المختار (Y − U = ${formatPrecision(low)} > ${limitL} ${unit})، ضمن الافتراضات الموضحة.`;
    } else {
      outcome = 'inconclusive';
      outcomeStatement = `النتيجة غير حاسمة: يتقاطع مجال التغطية [${formatPrecision(low)} , ${formatPrecision(high)}] مع معيار المقارنة (${limitL} ${unit}) — يلزم قياس أدق أو مراجعة تشغيلية.`;
    }
  }

  return {
    valid: true,
    resultY: Y,
    uMeasurement: uMeas,
    uOperational: uOper,
    uCombined: uC,
    expandedU: U,
    lowerBound: low,
    upperBound: high,
    outcome,
    outcomeStatement,
    steps,
    notes,
  };
}

export function formatPrecision(n: number, maxDecimals = 4): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) === 0) return '0';
  if (Math.abs(n) < 0.0001 && Math.abs(n) > 0) {
    return n.toExponential(3);
  }
  return Number(n.toFixed(maxDecimals)).toString();
}

export const CALCULATOR_META_VERSION = CALCULATOR_ENGINE_VERSION;
