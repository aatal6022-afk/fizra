import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAngle, calculateSymmetry, calculateSchoolGrade, ExerciseRepetitionTracker } from './biomechanics.ts';
import type { Exercise } from '../types/exercise.ts';

test('calculateAngle computes exact right angle (90 degrees)', () => {
  const a = { x: 0, y: 1 };
  const b = { x: 0, y: 0 };
  const c = { x: 1, y: 0 };
  const angle = calculateAngle(a, b, c);
  assert.equal(angle, 90);
});

test('calculateAngle computes straight angle (180 degrees)', () => {
  const a = { x: 0, y: -1 };
  const b = { x: 0, y: 0 };
  const c = { x: 0, y: 1 };
  const angle = calculateAngle(a, b, c);
  assert.equal(angle, 180);
});

test('calculateAngle computes acute angle (45 degrees)', () => {
  const a = { x: 1, y: 0 };
  const b = { x: 0, y: 0 };
  const c = { x: 1, y: 1 };
  const angle = calculateAngle(a, b, c);
  assert.equal(angle, 45);
});

test('calculateSymmetry gives 100 for equal angles and penalizes difference', () => {
  assert.equal(calculateSymmetry(90, 90), 100);
  assert.equal(calculateSymmetry(90, 80), 75); // 10 deg diff * 2.5 = 25 penalty => 75
});

test('calculateSchoolGrade accurately computes 5, 4, 3, 2 against standards', () => {
  // Benchmark: 20 reps for 5, 15 for 4, 10 for 3
  assert.equal(calculateSchoolGrade(25, 20, 15, 10), 5);
  assert.equal(calculateSchoolGrade(20, 20, 15, 10), 5);
  assert.equal(calculateSchoolGrade(18, 20, 15, 10), 4);
  assert.equal(calculateSchoolGrade(12, 20, 15, 10), 3);
  assert.equal(calculateSchoolGrade(7, 20, 15, 10), 2);
});

test('ExerciseRepetitionTracker tracks squat inflection, lockout and counts valid reps', () => {
  const testExercise: Exercise = {
    id: 'test-squat',
    name: 'Приседания',
    category: 'school_standard',
    categoryName: 'Школьные нормативы',
    difficulty: 'Базовый',
    targetJoint: 'Коленный сустав',
    jointKey: 'knee',
    startAngle: 175,
    targetAngle: 90,
    minAcceptableAngle: 80,
    maxAcceptableAngle: 100,
    targetMuscleGroups: ['Квадрицепс', 'Ягодичные'],
    modifications: ['Без отягощения'],
    unit: 'повторений',
    normativeGrade5: 20,
    normativeGrade4: 15,
    normativeGrade3: 10,
    description: 'Тестовое приседание',
    keyCheckpoints: [],
    commonMistakes: [],
    peBenchmarkTip: '',
    tags: [],
  };

  const tracker = new ExerciseRepetitionTracker(testExercise);

  // Standing start
  let res = tracker.update(175, 1000);
  assert.equal(res.phase, 'idle');
  assert.equal(tracker.getCounts().total, 0);

  // Descent begins
  res = tracker.update(140, 1500);
  assert.equal(res.phase, 'inflection');

  // Bottom depth reached at 88 degrees (perfect target inside 80..100)
  res = tracker.update(88, 2000);
  assert.equal(res.isInsideOptimalRange, true);

  // Ascent back to standing position (172 degrees)
  res = tracker.update(172, 2800);
  assert.equal(tracker.getCounts().total, 1);
  assert.equal(tracker.getCounts().valid, 1);
  assert.ok(res.repCompleted);
  assert.equal(res.repCompleted?.isSuccessful, true);
});
