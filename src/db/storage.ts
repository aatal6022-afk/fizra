/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Exercise, UserWorkoutHistoryItem, Classroom, HomeworkAssignment, HomeworkSubmission } from '../types/exercise';
import { EXERCISES_DATABASE } from '../data/exercisesData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

interface DatabaseSchema {
  exercises: Exercise[];
  history: UserWorkoutHistoryItem[];
  classes: Classroom[];
  submissions: HomeworkSubmission[];
}

const SEED_CLASSES: Classroom[] = [
  {
    id: 'class-7a',
    code: '7A-SPORT',
    name: '7-А клас (Гімназія №1)',
    teacherName: 'Коваленко О. В.',
    createdAt: '2026-10-15T08:00:00.000Z',
    students: ['Шевченко Данило', 'Іваненко Максим', 'Мельник Софія', 'Козак Артем', 'Бондар Анна'],
    assignments: [
      {
        id: 'hw-1',
        classCode: '7A-SPORT',
        exerciseId: 'school-squats-standard',
        exerciseName: 'Приседания классические (школьный норматив ОФП)',
        targetReps: 20,
        minAccuracy: 85,
        deadline: '2026-10-25',
        instructions: 'Опускатися до кута 90 градусів у коліні. Тримати спину рівно, п’яти не відривати від підлоги.',
        createdAt: '2026-10-16T09:00:00.000Z',
      },
      {
        id: 'hw-2',
        classCode: '7A-SPORT',
        exerciseId: 'school-pushups-floor',
        exerciseName: 'Сгибание и разгибание рук в упоре лежа (Отжимания)',
        targetReps: 15,
        minAccuracy: 80,
        deadline: '2026-10-28',
        instructions: 'Тіло пряме, лікті згинати під 90 градусів, грудьми майже торкатися підлоги.',
        createdAt: '2026-10-18T10:00:00.000Z',
      },
    ],
  },
  {
    id: 'class-9b',
    code: '9B-OLYMP',
    name: '9-Б клас (ОФП & ГТО)',
    teacherName: 'Ткаченко В. М.',
    createdAt: '2026-10-17T08:00:00.000Z',
    students: ['Григоренко Ілля', 'Сидоренко Вікторія', 'Павленко Денис'],
    assignments: [
      {
        id: 'hw-3',
        classCode: '9B-OLYMP',
        exerciseId: 'school-pushups-floor',
        exerciseName: 'Сгибание и разгибание рук в упоре лежа (Отжимания)',
        targetReps: 25,
        minAccuracy: 85,
        deadline: '2026-10-26',
        instructions: 'Норматив 9-го класу. Чітка фіксація у верхній та нижній точці.',
        createdAt: '2026-10-17T11:00:00.000Z',
      },
    ],
  },
];

const SEED_SUBMISSIONS: HomeworkSubmission[] = [];

const SEED_HISTORY: UserWorkoutHistoryItem[] = [];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.classes && parsed.submissions) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading db.json, reinitializing:', e);
    }

    const initial: DatabaseSchema = {
      exercises: EXERCISES_DATABASE,
      history: SEED_HISTORY,
      classes: SEED_CLASSES,
      submissions: SEED_SUBMISSIONS,
    };
    this.save(initial);
    return initial;
  }

  private save(data: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db.json:', e);
    }
  }

  // --- EXERCISES ---
  public getExercises(query?: string, category?: string): Exercise[] {
    let result = this.data.exercises;

    if (category && category !== 'all') {
      result = result.filter((ex) => ex.category === category);
    }

    if (query) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.description.toLowerCase().includes(q) ||
          ex.targetMuscleGroups?.some((m) => m.toLowerCase().includes(q)) ||
          ex.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getExerciseById(id: string): Exercise | undefined {
    return this.data.exercises.find((ex) => ex.id === id);
  }

  public addExercise(exercise: Exercise): Exercise {
    this.data.exercises.unshift(exercise);
    this.save(this.data);
    return exercise;
  }

  // --- WORKOUT HISTORY ---
  public getHistory(): UserWorkoutHistoryItem[] {
    return this.data.history;
  }

  public addHistoryItem(item: Omit<UserWorkoutHistoryItem, 'id' | 'date' | 'formattedDate'>): UserWorkoutHistoryItem {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    const newItem: UserWorkoutHistoryItem = {
      ...item,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: now.toISOString(),
      formattedDate,
    };

    this.data.history.unshift(newItem);
    this.save(this.data);
    return newItem;
  }

  // --- CLASSROOMS (TEACHER) ---
  public getAllClasses(): Classroom[] {
    return this.data.classes;
  }

  public getClassByCode(code: string): Classroom | undefined {
    const clean = code.trim().toUpperCase();
    return this.data.classes.find((c) => c.code.toUpperCase() === clean);
  }

  public createClass(name: string, teacherName: string): Classroom {
    // Generate clean unique 6-character access code
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = name.replace(/[^а-яa-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'PE';
    const code = `${prefix}-${randSuffix}`;

    const newClass: Classroom = {
      id: `class-${Date.now()}`,
      code,
      name,
      teacherName: teacherName || 'Викладач фізичної культури',
      createdAt: new Date().toISOString(),
      assignments: [],
      students: [],
    };

    this.data.classes.unshift(newClass);
    this.save(this.data);
    return newClass;
  }

  public createAssignment(classCode: string, assignment: Omit<HomeworkAssignment, 'id' | 'classCode' | 'createdAt'>): HomeworkAssignment | null {
    const cls = this.getClassByCode(classCode);
    if (!cls) return null;

    const newAssignment: HomeworkAssignment = {
      ...assignment,
      id: `hw-${Date.now()}`,
      classCode: cls.code,
      createdAt: new Date().toISOString(),
    };

    cls.assignments.unshift(newAssignment);
    this.save(this.data);
    return newAssignment;
  }

  public enrollStudent(classCode: string, studentName: string): boolean {
    const cls = this.getClassByCode(classCode);
    if (!cls) return false;
    const cleanName = studentName.trim();
    if (!cls.students.includes(cleanName)) {
      cls.students.push(cleanName);
      this.save(this.data);
    }
    return true;
  }

  // --- SUBMISSIONS (JOURNAL) ---
  public getSubmissions(classCode?: string): HomeworkSubmission[] {
    if (classCode) {
      const clean = classCode.trim().toUpperCase();
      return this.data.submissions.filter((s) => s.classCode.toUpperCase() === clean);
    }
    return this.data.submissions;
  }

  public submitHomework(submissionData: Omit<HomeworkSubmission, 'id' | 'submittedAt' | 'formattedDate'>): HomeworkSubmission {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    const submission: HomeworkSubmission = {
      ...submissionData,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: now.toISOString(),
      formattedDate,
    };

    // Auto enroll student if not in list
    this.enrollStudent(submission.classCode, submission.studentName);

    this.data.submissions.unshift(submission);
    this.save(this.data);
    return submission;
  }
}

export const dbManager = new DatabaseManager();
