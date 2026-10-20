/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { JointPoint, RepetitionLog, Exercise } from '../types/exercise.ts';

/**
 * Calculates the angle in degrees at vertex B formed by segments BA and BC.
 * Returns a value in [0, 180].
 */
export function calculateAngle(a: JointPoint, b: JointPoint, c: JointPoint): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle * 10) / 10;
}

/**
 * Evaluates symmetry between left and right limb angles.
 * Returns percentage 0..100.
 */
export function calculateSymmetry(leftAngle: number, rightAngle: number): number {
  const diff = Math.abs(leftAngle - rightAngle);
  // Each degree of asymmetry penalizes 2%
  const score = Math.max(0, Math.min(100, Math.round(100 - diff * 2.5)));
  return score;
}

/**
 * Evaluates school physical education mark (5, 4, 3, 2)
 */
export function calculateSchoolGrade(validReps: number, g5: number, g4: number, g3: number): 5 | 4 | 3 | 2 {
  if (validReps >= g5) return 5;
  if (validReps >= g4) return 4;
  if (validReps >= g3) return 3;
  return 2;
}

export interface TrackerUpdateResult {
  currentAngle: number;
  phase: 'idle' | 'inflection' | 'lockout';
  repCompleted?: RepetitionLog;
  feedbackCue: string;
  isInsideOptimalRange: boolean;
}

/**
 * Biomechanical state machine for tracking exercise repetition quality and tempo
 */
export class ExerciseRepetitionTracker {
  private exercise: Exercise;
  private phase: 'idle' | 'inflection' | 'lockout' = 'idle';
  private repStartTime: number = 0;
  private minAngleAchieved: number = 180;
  private maxAngleAchieved: number = 0;
  private repCount: number = 0;
  private validRepCount: number = 0;

  constructor(exercise: Exercise) {
    this.exercise = exercise;
  }

  public reset(exercise?: Exercise) {
    if (exercise) this.exercise = exercise;
    this.phase = 'idle';
    this.repStartTime = 0;
    this.minAngleAchieved = 180;
    this.maxAngleAchieved = 0;
    this.repCount = 0;
    this.validRepCount = 0;
  }

  public getCounts() {
    return {
      total: this.repCount,
      valid: this.validRepCount,
      invalid: this.repCount - this.validRepCount,
    };
  }

  /**
   * Processes a new frame's measured joint angle
   */
  public update(currentAngle: number, timestamp: number = Date.now()): TrackerUpdateResult {
    const { startAngle, targetAngle, minAcceptableAngle, maxAcceptableAngle } = this.exercise;
    
    // Normalization bounds
    const isStartExtended = startAngle > targetAngle; // Standard for squats/pushups: 170° down to 90°
    const startThreshold = isStartExtended ? startAngle - 20 : startAngle + 20;
    const inflectionThreshold = isStartExtended ? maxAcceptableAngle + 10 : minAcceptableAngle - 10;
    
    let feedbackCue = 'В исходном положении';
    let isInsideOptimalRange = false;
    let repCompleted: RepetitionLog | undefined;

    // Check if within target corridor
    if (currentAngle >= minAcceptableAngle && currentAngle <= maxAcceptableAngle) {
      isInsideOptimalRange = true;
      feedbackCue = 'Отличная амплитуда!';
    } else if (isStartExtended && currentAngle < minAcceptableAngle) {
      feedbackCue = 'Слишком глубоко (перегрузка сустава)';
    } else if (isStartExtended && currentAngle > maxAcceptableAngle && this.phase === 'inflection') {
      feedbackCue = 'Опускайся ниже до эталона';
    }

    if (this.phase === 'idle') {
      // Waiting for motion to begin
      if (isStartExtended ? currentAngle < startThreshold : currentAngle > startThreshold) {
        this.phase = 'inflection';
        this.repStartTime = timestamp;
        this.minAngleAchieved = currentAngle;
        this.maxAngleAchieved = currentAngle;
        feedbackCue = 'Движение началось';
      }
    } else if (this.phase === 'inflection') {
      // In active phase of repetition
      this.minAngleAchieved = Math.min(this.minAngleAchieved, currentAngle);
      this.maxAngleAchieved = Math.max(this.maxAngleAchieved, currentAngle);

      // Check if returned to starting lockout
      const returnedToLockout = isStartExtended
        ? currentAngle >= startThreshold - 5
        : currentAngle <= startThreshold + 5;

      if (returnedToLockout) {
        const durationSec = Math.max(0.5, (timestamp - this.repStartTime) / 1000);
        this.repCount++;

        // Evaluate amplitude success
        const achievedPeak = isStartExtended ? this.minAngleAchieved : this.maxAngleAchieved;
        const reachedTarget = isStartExtended
          ? achievedPeak <= maxAcceptableAngle
          : achievedPeak >= minAcceptableAngle;

        let score = 100;
        let repFeedback = 'Идеальное повторение';

        if (!reachedTarget) {
          const deviation = isStartExtended
            ? achievedPeak - maxAcceptableAngle
            : minAcceptableAngle - achievedPeak;
          score = Math.max(30, Math.round(100 - deviation * 2.5));
          repFeedback = 'Недостаточная амплитуда (недосед / неполное сгибание)';
        } else if (isStartExtended && achievedPeak < minAcceptableAngle - 15) {
          score = 80;
          repFeedback = 'Избыточная глубина (опасность перегрузки связок)';
        }

        const isSuccessful = score >= 70;
        if (isSuccessful) {
          this.validRepCount++;
        }

        repCompleted = {
          repNumber: this.repCount,
          minAngle: Math.round(this.minAngleAchieved),
          maxAngle: Math.round(this.maxAngleAchieved),
          durationSeconds: Math.round(durationSec * 10) / 10,
          isSuccessful,
          score,
          feedback: repFeedback,
          timestamp,
        };

        // Reset for next repetition
        this.phase = 'idle';
        this.minAngleAchieved = 180;
        this.maxAngleAchieved = 0;
        feedbackCue = `Повторение ${this.repCount}: ${repFeedback}`;
      }
    }

    return {
      currentAngle,
      phase: this.phase,
      repCompleted,
      feedbackCue,
      isInsideOptimalRange,
    };
  }
}
