/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExerciseCategory =
  | 'school_standard' // Школьные нормативы и ГТО
  | 'calisthenics'     // ОФП и собственный вес
  | 'legs'             // Ноги и таз
  | 'back'             // Спина и осанка
  | 'chest'            // Грудные мышцы
  | 'shoulders_arms'   // Плечи и руки
  | 'core'             // Пресс и кор
  | 'stretching';      // Растяжка и мобильность

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  categoryName: string;
  difficulty: 'Базовий' | 'Середній' | 'Просунутий' | 'Базовый' | 'Средний' | 'Продвинутый';
  targetJoint:
    | 'Колінний суглоб'
    | 'Ліктьовий суглоб'
    | 'Кульшовий суглоб'
    | 'Хребет / Кор'
    | 'Плечовий суглоб'
    | 'Коленный сустав'
    | 'Локтевой сустав'
    | 'Тазобедренный сустав'
    | 'Позвоночник / Кор'
    | 'Плечевой сустав';
  jointKey: 'knee' | 'elbow' | 'hip' | 'spine' | 'shoulder';
  
  targetMuscleGroups: string[]; // Цільові м'язові групи
  videoUrl?: string;            // Посилання на відео-демонстрацію
  modifications: string[];      // Можливі модифікації

  // Biomechanical Angle Standards (degrees)
  startAngle: number;         // e.g. 175° (starting extended)
  targetAngle: number;        // e.g. 90° (optimal inflection/depth)
  minAcceptableAngle: number; // e.g. 80° (lower threshold)
  maxAcceptableAngle: number; // e.g. 105° (upper threshold)
  
  unit: 'повторень' | 'секунд' | 'повторений';
  normativeGrade5: number;
  normativeGrade4: number;
  normativeGrade3: number;
  
  description: string;
  keyCheckpoints: string[];
  commonMistakes: string[];
  peBenchmarkTip: string;
  tags: string[];
}

export interface JointPoint {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  score?: number;
}

export interface SkeletonPose {
  nose?: JointPoint;
  leftShoulder?: JointPoint;
  rightShoulder?: JointPoint;
  leftElbow?: JointPoint;
  rightElbow?: JointPoint;
  leftWrist?: JointPoint;
  rightWrist?: JointPoint;
  leftHip?: JointPoint;
  rightHip?: JointPoint;
  leftKnee?: JointPoint;
  rightKnee?: JointPoint;
  leftAnkle?: JointPoint;
  rightAnkle?: JointPoint;
  confidence: number;
}

export interface RepetitionLog {
  repNumber: number;
  minAngle: number;
  maxAngle: number;
  durationSeconds: number;
  isSuccessful: boolean;
  score: number; // 0..100
  feedback: string;
  timestamp: number;
}

export interface WorkoutSessionSummary {
  exerciseId: string;
  exerciseName: string;
  totalDurationSeconds: number;
  totalReps: number;
  validReps: number;
  invalidReps: number;
  averageAngleAchieved: number;
  targetAngle: number;
  overallFormScore: number;
  symmetryScore: number;
  tempoPaceSeconds: number;
  repetitions: RepetitionLog[];
  gradeEstimate: 5 | 4 | 3 | 2;
}

export interface AiEvaluationReport {
  grade: number; // 2..5
  summary: string;
  positiveAspects: string[];
  technicalErrors: string[];
  humanLanguageCorrections: string[];
  peTeacherComment: string;
  biomechanicalBreakdown: {
    amplitudeCompliance: string;
    tempoControl: string;
    jointSafety: string;
  };
}

export interface UserWorkoutHistoryItem {
  id: string;
  date: string;
  formattedDate: string;
  exerciseId: string;
  exerciseName: string;
  categoryName: string;
  averageAmplitude: number;
  targetAmplitude: number;
  tempoSpeed: number;
  totalReps: number;
  validReps: number;
  symmetryScore: number;
  durationSeconds: number;
  overallVerdict: string;
  grade: number;
  aiReport?: AiEvaluationReport;
}

// --- CLASSROOM, HOMEWORK & JOURNAL TYPES ---

export interface HomeworkAssignment {
  id: string;
  classCode: string;
  exerciseId: string;
  exerciseName: string;
  targetReps: number;        // e.g. 20 повторений
  minAccuracy: number;       // e.g. 85% точность
  deadline: string;          // e.g. "2026-10-25"
  instructions: string;
  createdAt: string;
}

export interface HomeworkSubmission {
  id: string;
  assignmentId: string;
  classCode: string;
  studentName: string;       // Прізвище та ім'я учня
  exerciseName: string;
  submittedAt: string;
  formattedDate: string;
  completedReps: number;
  validReps: number;
  targetReps: number;
  accuracyPercent: number;
  isPassed: boolean;
  grade: number;             // 5, 4, 3, 2
  averageAmplitude: number;
  tempoSpeed: number;
  aiVerdict: string;
  technicalErrors: string[];
  positiveAspects: string[];
}

export interface Classroom {
  id: string;
  code: string;              // Unique code e.g. "7A-SPORT"
  name: string;              // e.g. "7-А клас"
  teacherName: string;       // e.g. "Коваленко О. В."
  createdAt: string;
  assignments: HomeworkAssignment[];
  students: string[];        // List of enrolled student names
}
