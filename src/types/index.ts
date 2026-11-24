export type ReviewStatus = 'مُراجع' | 'يحتاج مراجعة' | 'مسودة';

export type LessonCompletionStatus = 'مكتمل' | 'قيد الإعداد';

export type TrackId = 'beginner' | 'practitioner' | 'quick-review';

export interface ReferenceItem {
  id: string;
  code: string;
  title: string;
  organization: string;
  edition: string;
  year: string;
  sectionOrPage: string;
  category: 'معيار دولي' | 'دليل فني' | 'نشرة مصنّع' | 'منهجية إحصائية';
  lastReviewed: string;
  status: ReviewStatus;
  notes: string;
  url?: string;
}

export interface ScientificMeta {
  referenceIds: string[];
  lastReviewed: string;
  status: ReviewStatus;
  assumptions: string[];
  limitations: string[];
}

export interface QuizReferenceCitation {
  referenceId: string;
  standardDoc: string;
  sectionOrPage: string;
}

export interface LessonQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  citation?: QuizReferenceCitation;
}

export interface WorkedExample {
  title: string;
  dataType: 'بيانات تعليمية محاكاة' | 'بيانات مرجعية موثقة';
  scenario: string;
  steps: string[];
  result: string;
  caution: string;
}

export interface Lesson {
  id: string;
  number: number;
  unitId: string;
  title: string;
  summary: string;
  contentStatus: LessonCompletionStatus;
  trackTags: TrackId[];
  objectives: string[];
  prerequisites: string[];
  sections: {
    heading: string;
    body: string;
    bullets?: string[];
  }[];
  quantitiesAndUnits: {
    symbol: string;
    name: string;
    unit: string;
    note: string;
  }[];
  workflowSteps: string[];
  workedExample?: WorkedExample;
  commonMistakes: string[];
  checklist: string[];
  quiz: LessonQuizQuestion[];
  meta: ScientificMeta;
}

export interface CurriculumUnit {
  id: string;
  letter: string;
  title: string;
  description: string;
}

export type EquipmentTaskCategory =
  | 'dose-rate'
  | 'pulsed'
  | 'contamination'
  | 'neutron'
  | 'personal'
  | 'search';

export type EquipmentClass = 'جهاز مسح متكامل' | 'مسبار / كاشف خارجي' | 'منظومة جهاز + مسبار' | 'وحدة قراءة' | 'نظام مختبري' | 'مقياس جرعة شخصي' | 'كاشف بحث أولي';

export interface EquipmentItem {
  id: string;
  number: string;
  manufacturer: string;
  model: string;
  variantsNote: string;
  classification: EquipmentClass;
  tasks: EquipmentTaskCategory[];
  imageStatus: {
    available: boolean;
    sourceAttribution: string;
    rightsNote: string;
  };
  detectorType: string;
  quantities: string[];
  units: string[];
  measurementRange: string;
  energyRange: string;
  pulsedSuitability: {
    level: 'مناسب بشروط موثقة' | 'محدود / يحتاج تحققًا' | 'غير مناسب / غير مخصص';
    details: string;
  };
  suitableUses: string[];
  limitations: string[];
  calibrationAndCheck: string[];
  requiredAccessories: string[];
  acceptanceChecklist: string[];
  recommendationContext: string;
  meta: ScientificMeta;
}

export interface ComparisonStandard {
  id: string;
  label: string;
  value: number;
  unit: 'µSv/week' | 'mSv/year' | 'Bq/cm²';
  period: string;
  reference: string;
  classification: 'قيمة مرجعية دولية' | 'هدف تصميم تعليمي افتراضي' | 'مخصص من المستخدم';
  note: string;
}

export type AssessmentOutcome =
  | 'below_criterion'
  | 'above_criterion'
  | 'inconclusive'
  | 'insufficient_data';

export interface RoomBarrier {
  id: string; // BAR-01..BAR-04
  name: string;
  side: 'west' | 'south' | 'east' | 'north';
  lengthM: number;
  thicknessM: number;
  material: string;
  shieldingSpec: string;
  infoSource: string;
  verificationStatus: 'موثق بمخطط التدريع' | 'مقاس عند فتحة متاحة' | 'مذكور من المنشأة ولم يُتحقق' | 'غير معلوم — يحتاج إلى مصدر';
}

export interface RoomAdjacency {
  id: string;
  code: string;
  position: 'west' | 'south' | 'east' | 'north' | 'above' | 'below' | 'roof';
  label: string;
  use: string;
  occupantCategory: 'عاملون' | 'جمهور' | 'مرضى' | 'غير متاح / صيانة';
  occupancyPattern: string;
  occupancySource: string;
  elevationM: number;
  accessibility: 'متاح للفحص' | 'دخول مقيد' | 'غير متاح أثناء الزيارة — لم يُتحقق من الإشغال';
}

export interface RoomPoint {
  id: string; // MP-01..MP-07
  label: string;
  locationDescription: string;
  x: number;
  y: number;
  z: number;
  floorLevel: 'same' | 'above' | 'below';
  localHeightM: number;
}

export interface RoomPlanState {
  planTitle: string;
  roomCode: string;
  lengthX: number; // meters
  widthY: number; // meters
  clearHeightZ: number; // meters
  slabAboveM: number;
  slabBelowM: number;
  upperFloorFFL: number;
  lowerFloorFFL: number;
  northAngleDeg: number;
  northVerified: boolean;
  source: {
    id: string; // SRC-01
    x: number;
    y: number;
    z: number;
    label: string;
  };
  table: {
    id: string; // TAB-01
    x: number;
    y: number;
    widthM: number;
    lengthM: number;
    heightM: number;
  };
  wallBucky: {
    id: string;
    x: number;
    y: number;
    z: number;
  };
  door: {
    id: string;
    wall: 'south';
    offsetFromWestM: number;
    widthM: number;
  };
  window: {
    id: string;
    wall: 'south';
    offsetFromWestM: number;
    widthM: number;
  };
  controlStationLabel: string;
  roofStatus: string;
  barriers: RoomBarrier[];
  adjacencies: RoomAdjacency[];
  points: RoomPoint[];
}

export interface ScenarioDefect {
  id: string;
  type: 'جهاز غير مناسب' | 'خلفية غير مقاسة' | 'وحدات أو أزمنة غير متطابقة' | 'نقطة قياس ناقصة' | 'بيانات غير كافية للاستنتاج';
  description: string;
  correctAction: string;
}

export interface TrainingScenario {
  id: string;
  order: number;
  title: string;
  modality: string;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  isReferenceCase?: boolean;
  isSimulatedNotice: string;
  objectives: string[];
  roomSummary: {
    dimensions: string;
    adjacencies: string[];
    geometryNotes: string;
  };
  operatingData: { label: string; value: string }[];
  equipmentSelection: {
    proposedDeviceId: string;
    proposedDeviceName: string;
    isSuitable: boolean;
    rationale: string;
    recommendedAlternative?: string;
  };
  measurementPoints: {
    code: string;
    location: string;
    coordinates: string;
    rawReading: string;
    background: string;
    windowOrTime: string;
    notes: string;
  }[];
  embeddedDefects: ScenarioDefect[];
  calculationsSummary: {
    formulaUsed: string;
    steps: string[];
    result: string;
    criterionUsed: string;
    assessmentOutcome: AssessmentOutcome;
    assessmentStatement: string;
  };
  reportExcerpt: string;
  questions: LessonQuizQuestion[];
  meta: ScientificMeta;
}

export interface GlossaryEntry {
  id: string;
  termAr: string;
  termEn: string;
  category:
    | 'نطاق المسح والفصل المفاهيمي'
    | 'كميات ووحدات'
    | 'معايير وحدود'
    | 'أجهزة وكواشف'
    | 'إحصاء وعدم يقين'
    | 'تلوث وطب نووي';
  definition: string;
  distinctionNote: string;
  referenceIds: string[];
}

export interface LessonQuizRecord {
  highestScore: number;
  totalQuestions: number;
  passed: boolean; // highestScore / totalQuestions >= 0.8
  attemptsCount: number;
  firstPassedAt?: string;
  lastAttemptAt: string;
}

export interface BeginnerCertificateRecord {
  earnedAt: string;
  recipientName: string;
  certificateNumber: string; // MRS-BEG-YYYYMMDD-XXXX
}

export interface LocalUserProgress {
  selectedTrack: TrackId;
  completedLessons: string[];
  bookmarks: { type: 'lesson' | 'equipment' | 'calculator' | 'scenario'; id: string; title: string; route: string }[];
  lastLessonId: string | null;
  completedChecklists: Record<string, boolean[]>;
  scenarioScores: Record<string, { score: number; total: number }>;
  quizRecords: Record<string, LessonQuizRecord>;
  beginnerCertificate?: BeginnerCertificateRecord;
  trackCertificates?: Partial<Record<TrackId, BeginnerCertificateRecord>>;
  theme: 'light' | 'dark';
}
