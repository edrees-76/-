import type { LocalUserProgress, RoomPlanState } from '../types';
import type { SurveyFormsDraft } from '../data/forms';

const PROGRESS_KEY = 'mrs_user_progress_v1';
const DB_NAME = 'mrs_local_workspace_db';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

export const DEFAULT_USER_PROGRESS: LocalUserProgress = {
  selectedTrack: 'beginner',
  completedLessons: [],
  bookmarks: [],
  lastLessonId: null,
  completedChecklists: {},
  scenarioScores: {},
  theme: 'light',
};

export function loadUserProgress(): LocalUserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_USER_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<LocalUserProgress>;
    return {
      ...DEFAULT_USER_PROGRESS,
      ...parsed,
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      completedChecklists: parsed.completedChecklists && typeof parsed.completedChecklists === 'object' ? parsed.completedChecklists : {},
      scenarioScores: parsed.scenarioScores && typeof parsed.scenarioScores === 'object' ? parsed.scenarioScores : {},
    };
  } catch {
    return { ...DEFAULT_USER_PROGRESS };
  }
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
