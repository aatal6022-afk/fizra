/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Classroom, HomeworkAssignment, Exercise } from '../types/exercise';
import {
  X,
  GraduationCap,
  ArrowRight,
  Camera,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface StudentHomeworkModalProps {
  onClose: () => void;
  onStartHomeworkSession: (assignment: HomeworkAssignment, studentName: string, classCode: string, className: string, exercise: Exercise) => void;
  exercises: Exercise[];
}

export const StudentHomeworkModal: React.FC<StudentHomeworkModalProps> = ({
  onClose,
  onStartHomeworkSession,
  exercises,
}) => {
  const [classCode, setClassCode] = useState<string>('7A-SPORT');
  const [studentName, setStudentName] = useState<string>('Шевченко Данило');
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearchClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/classes/${encodeURIComponent(classCode.trim())}`);
      const json = await res.json();
      if (json.success && json.data) {
        setClassroom(json.data);
      } else {
        setError(json.error || 'Клас із таким кодом не знайдено. Перевірте код у вчителя.');
        setClassroom(null);
      }
    } catch (err: any) {
      setError('Помилка підключення до сервера');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = (assignment: HomeworkAssignment) => {
    if (!studentName.trim()) {
      setError('Будь ласка, вкажіть ваше Прізвище та ім’я');
      return;
    }
    if (!classroom) return;

    const matchedExercise = exercises.find((ex) => ex.id === assignment.exerciseId) || exercises[0];

    onStartHomeworkSession(
      assignment,
      studentName.trim(),
      classroom.code,
      classroom.name,
      matchedExercise
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Режим «Учень» • Виконання ДЗ з физ-ри
              </h2>
              <p className="text-xs text-neutral-400">
                Вхід за кодом класу, виконання нормативів перед камерою та авто-здача в журнал
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Step 1: Input Code & Student Name */}
          <form onSubmit={handleSearchClass} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
            <div className="text-xs font-semibold text-neutral-200 uppercase font-mono tracking-wider">
              1. Авторизація учня
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-mono">Код класу (напр. 7A-SPORT)</label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="7A-SPORT"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 font-mono text-xs focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase font-mono">Прізвище та ім’я учня</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Шевченко Данило"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Перевірка коду...' : 'Знайти активні завдання класу'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 2: Show Found Class & Active Homework List */}
          {classroom && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{classroom.name} (Вчитель: {classroom.teacherName})</span>
                </div>
                <span>{classroom.assignments.length} завдань</span>
              </div>

              {classroom.assignments.length === 0 ? (
                <div className="p-6 rounded-xl bg-neutral-950/50 border border-neutral-800 text-center text-xs text-neutral-400">
                  У цьому класі наразі немає активних домашніх завдань.
                </div>
              ) : (
                <div className="space-y-3">
                  {classroom.assignments.map((hw) => (
                    <div
                      key={hw.id}
                      className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-neutral-100">{hw.exerciseName}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {hw.targetReps} повторень
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
                          {hw.instructions}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono pt-1">
                          <span>Мін. точність: {hw.minAccuracy}%</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Дедлайн: {hw.deadline}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStart(hw)}
                        className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Розпочати ДЗ</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
