import assert from 'node:assert/strict';
import { LESSONS } from '../data/lessons.ts';
import type { LocalUserProgress } from '../types/index.ts';
import {
  checkBeginnerTrackEligibility,
  getLessonQuizStatus,
  getTrackCertificate,
  issueBeginnerCertificate,
  issueTrackCertificate,
  loadUserProgress,
  recordQuizAttempt,
  DEFAULT_USER_PROGRESS,
} from './storage.ts';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`PASS | ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL | ${name}:`, err instanceof Error ? err.message : err);
  }
}

// Mock localStorage for Node environment
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => {
    store.clear();
  },
  key: (i: number) => Array.from(store.keys())[i] ?? null,
  get length() {
    return store.size;
  },
};

test('Backward compatibility: migrates legacy progress without quizRecords', () => {
  store.clear();
  store.set(
    'mrs_user_progress_v1',
    JSON.stringify({
      selectedTrack: 'beginner',
      completedLessons: ['L01-concepts-scope', 'L02-quantities-units-criteria'],
      bookmarks: [{ type: 'lesson', id: 'L01-concepts-scope', title: 'L01', route: '/library/L01-concepts-scope' }],
      lastLessonId: 'L02-quantities-units-criteria',
      completedChecklists: { lesson_L01: [true, false] },
      theme: 'dark',
    })
  );
  const loaded = loadUserProgress();
  assert.deepEqual(loaded.completedLessons, ['L01-concepts-scope', 'L02-quantities-units-criteria']);
  assert.equal(loaded.bookmarks.length, 1);
  assert.equal(loaded.theme, 'dark');
  assert.deepEqual(loaded.quizRecords, {});
  assert.equal(getLessonQuizStatus(loaded, 'L01-concepts-scope'), 'not_attempted');
});

test('Quiz status distinguishes not_attempted from 0/4 failed and keeps highestScore', () => {
  let prog: LocalUserProgress = { ...DEFAULT_USER_PROGRESS, quizRecords: {} };
  assert.equal(getLessonQuizStatus(prog, 'L01-concepts-scope'), 'not_attempted');

  prog = recordQuizAttempt(prog, 'L01-concepts-scope', 0, 4, new Date('2026-11-25T10:00:00Z'));
  assert.equal(getLessonQuizStatus(prog, 'L01-concepts-scope'), 'failed');
  assert.equal(prog.quizRecords['L01-concepts-scope'].highestScore, 0);
  assert.equal(prog.quizRecords['L01-concepts-scope'].attemptsCount, 1);

  prog = recordQuizAttempt(prog, 'L01-concepts-scope', 3, 4, new Date('2026-11-25T10:05:00Z'));
  assert.equal(getLessonQuizStatus(prog, 'L01-concepts-scope'), 'failed'); // 75% < 80%
  assert.equal(prog.quizRecords['L01-concepts-scope'].highestScore, 3);

  prog = recordQuizAttempt(prog, 'L01-concepts-scope', 4, 4, new Date('2026-11-25T10:10:00Z'));
  assert.equal(getLessonQuizStatus(prog, 'L01-concepts-scope'), 'passed');
  assert.equal(prog.quizRecords['L01-concepts-scope'].firstPassedAt, '2026-11-25T10:10:00.000Z');

  // Lower retry should not overwrite highestScore or firstPassedAt
  prog = recordQuizAttempt(prog, 'L01-concepts-scope', 2, 4, new Date('2026-11-25T10:15:00Z'));
  assert.equal(prog.quizRecords['L01-concepts-scope'].highestScore, 4);
  assert.equal(prog.quizRecords['L01-concepts-scope'].passed, true);
  assert.equal(prog.quizRecords['L01-concepts-scope'].attemptsCount, 4);
  assert.equal(prog.quizRecords['L01-concepts-scope'].firstPassedAt, '2026-11-25T10:10:00.000Z');
});

test('Beginner track eligibility requires 100% lessons AND >= 80% on every quiz (75% blocks)', () => {
  const beginnerLessons = LESSONS.filter((l) => l.trackTags.includes('beginner'));
  assert.equal(beginnerLessons.length, 15);
  assert.ok(beginnerLessons.every((l) => l.quiz.length === 4));

  let prog = {
    ...DEFAULT_USER_PROGRESS,
    completedLessons: beginnerLessons.map((l) => l.id),
    quizRecords: {},
  };

  for (let i = 0; i < beginnerLessons.length; i++) {
    const score = i === 0 ? 3 : 4; // 75% on first lesson
    prog = recordQuizAttempt(prog, beginnerLessons[i].id, score, 4);
  }

  const blocked = checkBeginnerTrackEligibility(prog, beginnerLessons);
  assert.equal(blocked.eligible, false);
  assert.equal(blocked.failedOrMissingQuizLessonIds.length, 1);

  // Raise first lesson to 4/4 (100%) -> unlocks immediately
  prog = recordQuizAttempt(prog, beginnerLessons[0].id, 4, 4);
  const unlocked = checkBeginnerTrackEligibility(prog, beginnerLessons);
  assert.equal(unlocked.eligible, true);
  assert.equal(unlocked.passedQuizzesCount, 15);
  assert.equal(unlocked.averageBestPercent, 100);
});

test('Certificate issuance locks earnedAt and certificateNumber across name updates', () => {
  let prog: LocalUserProgress = { ...DEFAULT_USER_PROGRESS, quizRecords: {} };
  const t1 = new Date('2026-11-25T12:00:00Z');
  prog = issueBeginnerCertificate(prog, 'أحمد محمد', t1);
  const cert1 = prog.beginnerCertificate;
  assert.ok(cert1);
  assert.equal(cert1.earnedAt, '2026-11-25T12:00:00.000Z');
  assert.match(cert1.certificateNumber, /^MRS-BEG-20261125-[A-Z0-9]{4}$/);

  const firstNumber = cert1.certificateNumber;
  const t2 = new Date('2026-11-26T12:00:00Z');
  prog = issueBeginnerCertificate(prog, 'د. أحمد محمد', t2);
  const cert2 = prog.beginnerCertificate;
  assert.ok(cert2);
  assert.equal(cert2.recipientName, 'د. أحمد محمد');
  assert.equal(cert2.earnedAt, '2026-11-25T12:00:00.000Z');
  assert.equal(cert2.certificateNumber, firstNumber);
});

test('Multi-track certificates & all 25 lessons have 4 cited questions', () => {
  assert.equal(LESSONS.length, 25);
  assert.ok(LESSONS.every((l) => l.contentStatus === 'مكتمل' && l.quiz.length === 4 && l.quiz.every((q) => Boolean(q.citation))));

  let prog: LocalUserProgress = { ...DEFAULT_USER_PROGRESS, quizRecords: {} };
  prog = issueTrackCertificate(prog, 'practitioner', 'م. سارة خالد', new Date('2026-11-25T14:00:00Z'));
  const prcCert = getTrackCertificate(prog, 'practitioner');
  assert.ok(prcCert);
  assert.match(prcCert.certificateNumber, /^MRS-PRC-20261125-[A-Z0-9]{4}$/);

  prog = issueTrackCertificate(prog, 'quick-review', 'د. علي حسن', new Date('2026-11-25T15:00:00Z'));
  const qckCert = getTrackCertificate(prog, 'quick-review');
  assert.ok(qckCert);
  assert.match(qckCert.certificateNumber, /^MRS-QCK-20261125-[A-Z0-9]{4}$/);
});

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
