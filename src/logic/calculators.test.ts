import assert from 'node:assert/strict';
import {
  calculateBackgroundSubtraction,
  calculateContaminationWipe,
  calculateCoordinatesDistance,
  calculateDosePerExposure,
  calculateRadioactiveDecay,
  calculateTransmissionReduction,
  calculateUncertaintyDecision,
  calculateUnitConversion,
  calculateWeeklyAnnual,
} from './calculators.ts';

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

function approx(actual: number | undefined, expected: number, tol = 1e-3) {
  assert.ok(actual !== undefined && Math.abs(actual - expected) <= tol, `Expected ${expected} ± ${tol}, got ${actual}`);
}

// 1. Unit Conversion Tests
test('Unit conversion: 1 mSv -> 1000 µSv', () => {
  const res = calculateUnitConversion(1, 'mSv', 'uSv');
  assert.equal(res.valid, true);
  approx(res.value, 1000, 1e-9);
});

test('Unit conversion: 60 cpm -> 1 cps', () => {
  const res = calculateUnitConversion(60, 'cpm', 'cps');
  assert.equal(res.valid, true);
  approx(res.value, 1, 1e-9);
});

test('Unit conversion blocks Gy -> Sv automatic conversion', () => {
  const res = calculateUnitConversion(10, 'uGy', 'uSv');
  assert.equal(res.valid, false);
  assert.ok(res.error?.includes('Gy'));
});

test('Unit conversion blocks cps -> Bq automatic conversion', () => {
  const res = calculateUnitConversion(100, 'cps', 'Bq');
  assert.equal(res.valid, false);
});

// 2. Background Subtraction (PDF Example 1 & Negative Net Preservation)
test('Background subtraction (PDF Ex 1): 0.120 µSv, 0.060 µSv/h, 120 s -> 0.118 µSv', () => {
  const res = calculateBackgroundSubtraction({ mode: 'dose', hOn: 0.12, bgRate: 0.06, windowSec: 120 });
  assert.equal(res.valid, true);
  approx(res.bgContribution, 0.002, 1e-6);
  approx(res.netValue, 0.118, 1e-6);
});

test('Background subtraction preserves negative net value without clamping to 0', () => {
  const res = calculateBackgroundSubtraction({ mode: 'dose', hOn: 0.001, bgRate: 0.06, windowSec: 120 });
  assert.equal(res.valid, true);
  approx(res.netValue, -0.001, 1e-6);
  assert.ok(res.netValue! < 0);
});

test('Background subtraction rejects zero time window', () => {
  const res = calculateBackgroundSubtraction({ mode: 'counts', ns: 100, ts: 0, nb: 50, tb: 60 });
  assert.equal(res.valid, false);
});

// 3. Dose per Exposure & Normalization (PDF Examples 1 & 6)
test('Dose per exposure (PDF Ex 1): 0.118 µSv / 10 -> 0.0118 µSv/exp', () => {
  const res = calculateDosePerExposure(0.118, 10);
  assert.equal(res.valid, true);
  approx(res.dosePerExposure, 0.0118, 1e-6);
});

test('LINAC leakage normalization (PDF Ex 6): 0.40 µSv / 1000 MU -> 0.00040 µSv/MU', () => {
  const res = calculateDosePerExposure(0.4, 1, 1000, 'MU');
  assert.equal(res.valid, true);
  approx(res.normalizedPerOutput, 0.0004, 1e-7);
});

// 4. Weekly & Annual Estimates (PDF Examples 1, 2, 3)
test('Weekly/Annual (PDF Ex 1): 0.0118 × 400 × 50 -> 4.72 µSv/wk, 0.236 mSv/yr', () => {
  const res = calculateWeeklyAnnual(
    [{ id: '1', label: 'أشعة عامة', inputType: 'per_procedure', value: 0.0118, countOrMinutesPerWeek: 400, occupancyT: 1, useFactorU: 1, tJustification: 'إشغال كامل' }],
    50,
    null,
    10,
    'µSv/week',
    'معيار تدريبي'
  );
  assert.equal(res.valid, true);
  approx(res.totalWeeklyMicroSv, 4.72, 1e-4);
  approx(res.totalAnnualMilliSv, 0.236, 1e-4);
  assert.equal(res.assessmentOutcome, 'below_criterion');
});

test('Weekly CT multi-protocol (PDF Ex 2): 11.4 µSv/wk before T, 5.70 µSv/wk at T=0.5', () => {
  const res = calculateWeeklyAnnual(
    [
      { id: '1', label: 'رأس', inputType: 'per_procedure', value: 0.02, countOrMinutesPerWeek: 100, occupancyT: 0.5, useFactorU: 1, tJustification: 'معتمد' },
      { id: '2', label: 'جسم', inputType: 'per_procedure', value: 0.08, countOrMinutesPerWeek: 80, occupancyT: 0.5, useFactorU: 1, tJustification: 'معتمد' },
      { id: '3', label: 'متعدد المراحل', inputType: 'per_procedure', value: 0.15, countOrMinutesPerWeek: 20, occupancyT: 0.5, useFactorU: 1, tJustification: 'معتمد' },
    ],
    50,
    null,
    10,
    'µSv/week',
    'معيار تدريبي'
  );
  assert.equal(res.valid, true);
  approx(res.totalWeeklyBeforeTU, 11.4, 1e-4);
  approx(res.totalWeeklyMicroSv, 5.7, 1e-4);
});

test('Cath lab mixed rate + runs (PDF Ex 3): 70 µSv/week', () => {
  // 20 procedures * 10 min = 200 min/week at 12 µSv/h => 40 µSv/wk; 20 * 10 runs = 200 runs at 0.15 µSv/run => 30 µSv/wk -> total 70 µSv/wk
  const res = calculateWeeklyAnnual(
    [
      { id: 'f', label: 'تنظير', inputType: 'dose_rate', value: 12, countOrMinutesPerWeek: 200, occupancyT: 1, useFactorU: 1, tJustification: 'كامل' },
      { id: 'a', label: 'تصوير runs', inputType: 'per_procedure', value: 0.15, countOrMinutesPerWeek: 200, occupancyT: 1, useFactorU: 1, tJustification: 'كامل' },
    ],
    50,
    null,
    null,
    'µSv/week',
    ''
  );
  assert.equal(res.valid, true);
  approx(res.totalWeeklyMicroSv, 70, 1e-4);
  assert.equal(res.assessmentOutcome, 'insufficient_data');
});

// 5. Transmission & Reduction (PDF Ex 4)
test('Transmission & Reduction (PDF Ex 4): 0.80 -> 0.08 µSv gives B=0.10, RF=10, 90%', () => {
  const res = calculateTransmissionReduction(0.8, 0.08, false, true, true);
  assert.equal(res.valid, true);
  approx(res.transmissionB, 0.1, 1e-6);
  approx(res.reductionFactorRF, 10, 1e-6);
  approx(res.reductionPercent, 90, 1e-6);
});

test('Transmission rejects H_without = 0 (division by zero)', () => {
  const res = calculateTransmissionReduction(0, 0.08, false, true, true);
  assert.equal(res.valid, false);
});

// 6. Contamination Wipe & Decay (PDF Ex 5 & 8)
test('Contamination wipe (PDF Ex 5): Ns=420/60s, Nb=120/120s, ε=0.30, S=100, f=0.5', () => {
  const res = calculateContaminationWipe({ ns: 420, ts: 60, nb: 120, tb: 120, efficiency: 0.3, areaCm2: 100, removalFactor: 0.5 });
  assert.equal(res.valid, true);
  approx(res.rNetCps, 6, 1e-6);
  approx(res.uRNetCps, 0.35355, 1e-3);
  approx(res.aWipeBq, 20, 1e-6);
  approx(res.collectedPerAreaBqCm2, 0.2, 1e-6);
  approx(res.removableEstimateBqCm2, 0.4, 1e-6);
});

test('Radioactive decay (PDF Ex 8): 800 MBq, T½=6 h, t=12 h -> 200 MBq', () => {
  const res = calculateRadioactiveDecay(800, 12, 6);
  assert.equal(res.valid, true);
  approx(res.value, 200, 1e-6);
});

// 7. Coordinates & Distances (Room Plan Guide Ch 12)
test('Coordinates 2D/3D (Plan Guide Ch 12): SRC(3,2.5,1.5) -> MP-04(6.5,2.5,1.2) = 3.513 m', () => {
  const res = calculateCoordinatesDistance({ xf: 3, yf: 2.5, zf: 1.5, xp: 6.5, yp: 2.5, zp: 1.2 });
  assert.equal(res.valid, true);
  approx(res.horizontalDistanceM, 3.5, 1e-6);
  approx(res.distance3DM, 3.5128, 1e-3);
});

test('Coordinates Vertical (Plan Guide Ch 12): Upper MP-06 = 3.10 m, Lower MP-07 = 2.60 m', () => {
  const up = calculateCoordinatesDistance({ xf: 3, yf: 2.5, zf: 1.5, xp: 3, yp: 2.5, zp: 4.6 });
  const down = calculateCoordinatesDistance({ xf: 3, yf: 2.5, zf: 1.5, xp: 3, yp: 2.5, zp: -1.1 });
  approx(up.distance3DM, 3.1, 1e-6);
  approx(down.distance3DM, 2.6, 1e-6);
});

// 8. Uncertainty & Decision Rule (PDF Ch 21.3 & 22.6)
test('Decision rule inconclusive overlap (PDF Ch 21.3): Y=9, U=2, L=10 -> inconclusive', () => {
  const res = calculateUncertaintyDecision({
    mode: 'budget',
    resultY: 9,
    unit: 'µSv/week',
    coverageK: 2,
    limitL: 10,
    limitReference: 'معيار تدريبي',
    components: [{ label: 'مركب', u: 1, group: 'قياس' }],
  });
  assert.equal(res.valid, true);
  approx(res.expandedU, 2, 1e-6);
  assert.equal(res.outcome, 'inconclusive');
});

test('Decision rule below criterion (PDF Ch 22.6): Y=4.80, U=0.96, L=10 -> below_criterion', () => {
  const res = calculateUncertaintyDecision({
    mode: 'budget',
    resultY: 4.8,
    unit: 'µSv/week',
    coverageK: 2,
    limitL: 10,
    limitReference: 'معيار تدريبي 22.6',
    components: [{ label: 'مركب 10%', u: 0.48, group: 'قياس' }],
  });
  assert.equal(res.valid, true);
  approx(res.upperBound, 5.76, 1e-4);
  assert.equal(res.outcome, 'below_criterion');
});

console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
