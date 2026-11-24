import type {
  BeginnerCertificateRecord,
  Lesson,
  LessonQuizRecord,
  LocalUserProgress,
  RoomPlanState,
  TrackId,
} from '../types';
import type { SurveyFormsDraft } from '../data/forms';

const PROGRESS_KEY = 'mrs_user_progress_v1';
const DB_NAME = 'mrs_local_workspace_db';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

export const QUIZ_PASS_THRESHOLD = 0.8;

export const DEFAULT_USER_PROGRESS: LocalUserProgress = {
  selectedTrack: 'beginner',
  completedLessons: [],
  bookmarks: [],
  lastLessonId: null,
  completedChecklists: {},
  scenarioScores: {},
  quizRecords: {},
  theme: 'light',
};

function sanitizeQuizRecords(raw: unknown): Record<string, LessonQuizRecord> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, LessonQuizRecord> = {};
  for (const [lessonId, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== 'object') continue;
    const rec = val as Partial<LessonQuizRecord>;
    if (typeof rec.highestScore === 'number' && typeof rec.totalQuestions === 'number' && rec.totalQuestions > 0) {
      const highestScore = Math.max(0, Math.min(rec.highestScore, rec.totalQuestions));
      const passed = highestScore / rec.totalQuestions >= QUIZ_PASS_THRESHOLD;
      result[lessonId] = {
        highestScore,
        totalQuestions: rec.totalQuestions,
        passed,
        attemptsCount: typeof rec.attemptsCount === 'number' && rec.attemptsCount > 0 ? rec.attemptsCount : 1,
        firstPassedAt: typeof rec.firstPassedAt === 'string' ? rec.firstPassedAt : undefined,
        lastAttemptAt: typeof rec.lastAttemptAt === 'string' ? rec.lastAttemptAt : new Date().toISOString(),
      };
    }
  }
  return result;
}

export function loadUserProgress(): LocalUserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_USER_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<LocalUserProgress>;
    const cert =
      parsed.beginnerCertificate &&
      typeof parsed.beginnerCertificate === 'object' &&
      typeof parsed.beginnerCertificate.earnedAt === 'string' &&
      typeof parsed.beginnerCertificate.certificateNumber === 'string'
        ? {
            earnedAt: parsed.beginnerCertificate.earnedAt,
            recipientName:
              typeof parsed.beginnerCertificate.recipientName === 'string'
                ? parsed.beginnerCertificate.recipientName
                : '',
            certificateNumber: parsed.beginnerCertificate.certificateNumber,
          }
        : undefined;

    const trackCerts: Partial<Record<TrackId, BeginnerCertificateRecord>> = {};
    if (parsed.trackCertificates && typeof parsed.trackCertificates === 'object') {
      for (const tid of ['beginner', 'practitioner', 'quick-review'] as TrackId[]) {
        const rawCert = (parsed.trackCertificates as Record<string, unknown>)[tid] as
          | Partial<BeginnerCertificateRecord>
          | undefined;
        if (rawCert && typeof rawCert === 'object' && typeof rawCert.earnedAt === 'string' && typeof rawCert.certificateNumber === 'string') {
          trackCerts[tid] = {
            earnedAt: rawCert.earnedAt,
            recipientName: typeof rawCert.recipientName === 'string' ? rawCert.recipientName : '',
            certificateNumber: rawCert.certificateNumber,
          };
        }
      }
    }
    if (cert && !trackCerts.beginner) {
      trackCerts.beginner = cert;
    }

    return {
      ...DEFAULT_USER_PROGRESS,
      ...parsed,
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      completedChecklists:
        parsed.completedChecklists && typeof parsed.completedChecklists === 'object' ? parsed.completedChecklists : {},
      scenarioScores: parsed.scenarioScores && typeof parsed.scenarioScores === 'object' ? parsed.scenarioScores : {},
      quizRecords: sanitizeQuizRecords(parsed.quizRecords),
      beginnerCertificate: cert ?? trackCerts.beginner,
      trackCertificates: trackCerts,
    };
  } catch {
    return { ...DEFAULT_USER_PROGRESS };
  }
}

export type LessonQuizStatus = 'not_attempted' | 'passed' | 'failed';

export function getLessonQuizStatus(progress: LocalUserProgress, lessonId: string): LessonQuizStatus {
  const rec = progress.quizRecords?.[lessonId];
  if (!rec || rec.attemptsCount === 0) return 'not_attempted';
  return rec.passed ? 'passed' : 'failed';
}

export function recordQuizAttempt(
  prevProgress: LocalUserProgress,
  lessonId: string,
  score: number,
  total: number,
  now: Date = new Date()
): LocalUserProgress {
  if (total <= 0) return prevProgress;
  const safeScore = Math.max(0, Math.min(Math.round(score), total));
  const prevRec = prevProgress.quizRecords?.[lessonId];
  const prevBestPct = prevRec && prevRec.totalQuestions > 0 ? prevRec.highestScore / prevRec.totalQuestions : -1;
  const newPct = safeScore / total;

  const highestScore = newPct >= prevBestPct ? safeScore : prevRec!.highestScore;
  const totalQuestions = newPct >= prevBestPct ? total : prevRec!.totalQuestions;
  const passed = highestScore / totalQuestions >= QUIZ_PASS_THRESHOLD;
  const nowIso = now.toISOString();

  const nextRecord: LessonQuizRecord = {
    highestScore,
    totalQuestions,
    passed,
    attemptsCount: (prevRec?.attemptsCount ?? 0) + 1,
    firstPassedAt: prevRec?.firstPassedAt ?? (passed ? nowIso : undefined),
    lastAttemptAt: nowIso,
  };

  return {
    ...prevProgress,
    quizRecords: {
      ...(prevProgress.quizRecords ?? {}),
      [lessonId]: nextRecord,
    },
  };
}

export interface BeginnerEligibilitySummary {
  eligible: boolean;
  completedCount: number;
  totalLessons: number;
  passedQuizzesCount: number;
  totalQuizzes: number;
  missingLessonIds: string[];
  failedOrMissingQuizLessonIds: string[];
  averageBestPercent: number | null;
}

export function checkBeginnerTrackEligibility(
  progress: LocalUserProgress,
  beginnerLessons: Lesson[]
): BeginnerEligibilitySummary {
  const totalLessons = beginnerLessons.length;
  const quizLessons = beginnerLessons.filter((l) => l.quiz.length > 0);
  const totalQuizzes = quizLessons.length;

  const missingLessonIds = beginnerLessons
    .filter((l) => !progress.completedLessons.includes(l.id))
    .map((l) => l.id);

  const failedOrMissingQuizLessonIds = quizLessons
    .filter((l) => getLessonQuizStatus(progress, l.id) !== 'passed')
    .map((l) => l.id);

  const completedCount = totalLessons - missingLessonIds.length;
  const passedQuizzesCount = totalQuizzes - failedOrMissingQuizLessonIds.length;

  const attemptedPercentages: number[] = [];
  for (const l of quizLessons) {
    const rec = progress.quizRecords?.[l.id];
    if (rec && rec.attemptsCount > 0 && rec.totalQuestions > 0) {
      attemptedPercentages.push((rec.highestScore / rec.totalQuestions) * 100);
    }
  }

  const averageBestPercent =
    attemptedPercentages.length > 0
      ? Math.round(attemptedPercentages.reduce((acc, v) => acc + v, 0) / attemptedPercentages.length)
      : null;

  const eligible =
    totalLessons > 0 &&
    missingLessonIds.length === 0 &&
    failedOrMissingQuizLessonIds.length === 0;

  return {
    eligible,
    completedCount,
    totalLessons,
    passedQuizzesCount,
    totalQuizzes,
    missingLessonIds,
    failedOrMissingQuizLessonIds,
    averageBestPercent,
  };
}

export function generateCertificateNumber(date: Date = new Date(), trackId: TrackId = 'beginner'): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  const prefix = trackId === 'practitioner' ? 'PRC' : trackId === 'quick-review' ? 'QCK' : 'BEG';
  return `MRS-${prefix}-${y}${m}${d}-${suffix}`;
}

export function getTrackCertificate(
  progress: LocalUserProgress,
  trackId: TrackId
): BeginnerCertificateRecord | undefined {
  return progress.trackCertificates?.[trackId] ?? (trackId === 'beginner' ? progress.beginnerCertificate : undefined);
}

export function issueTrackCertificate(
  prevProgress: LocalUserProgress,
  trackId: TrackId,
  recipientName: string,
  now: Date = new Date()
): LocalUserProgress {
  const trimmedName = recipientName.trim();
  const existing = getTrackCertificate(prevProgress, trackId);
  const nextCert: BeginnerCertificateRecord = existing
    ? {
        ...existing,
        recipientName: trimmedName || existing.recipientName,
      }
    : {
        earnedAt: now.toISOString(),
        recipientName: trimmedName,
        certificateNumber: generateCertificateNumber(now, trackId),
      };

  return {
    ...prevProgress,
    beginnerCertificate: trackId === 'beginner' ? nextCert : prevProgress.beginnerCertificate,
    trackCertificates: {
      ...(prevProgress.trackCertificates ?? {}),
      [trackId]: nextCert,
    },
  };
}

export function issueBeginnerCertificate(
  prevProgress: LocalUserProgress,
  recipientName: string,
  now: Date = new Date()
): LocalUserProgress {
  return issueTrackCertificate(prevProgress, 'beginner', recipientName, now);
}

export function saveUserProgress(progress: LocalUserProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

// IndexedDB helper for larger structured drafts (Forms F01-F07, Room Plan)
function openDraftDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveDraftRecord<T>(key: string, value: T): Promise<void> {
  const db = await openDraftDB();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  try {
    localStorage.setItem(`mrs_draft_${key}`, JSON.stringify(value));
  } catch {
    // Fallback ignored if quota exceeded
  }
}

export async function loadDraftRecord<T>(key: string, fallback: T): Promise<T> {
  const db = await openDraftDB();
  if (db) {
    const idbValue = await new Promise<T | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    if (idbValue !== null) return idbValue;
  }
  try {
    const raw = localStorage.getItem(`mrs_draft_${key}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // Ignore parse error
  }
  return fallback;
}

export interface FullBackupPayload {
  schemaVersion: string;
  exportedAt: string;
  progress: LocalUserProgress;
  formsDraft?: SurveyFormsDraft;
  roomPlan?: RoomPlanState;
}

export function triggerDownloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvLines = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))];
  // Include UTF-8 BOM so Excel displays Arabic headers and cells cleanly
  triggerDownloadFile(filename, '\uFEFF' + csvLines.join('\r\n'), 'text/csv;charset=utf-8;');
}
