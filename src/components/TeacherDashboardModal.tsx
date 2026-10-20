/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Classroom, HomeworkSubmission, Exercise } from '../types/exercise';
import {
  X,
  Plus,
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  Copy,
  Check,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface TeacherDashboardModalProps {
  onClose: () => void;
  exercises: Exercise[];
}

export const TeacherDashboardModal: React.FC<TeacherDashboardModalProps> = ({
  onClose,
  exercises,
}) => {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState<string>('');
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Class creation form state
  const [isCreatingClass, setIsCreatingClass] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('7-А клас');
  const [newTeacherName, setNewTeacherName] = useState<string>('Коваленко О. В.');

  // Assignment creation form state
  const [isCreatingAssignment, setIsCreatingAssignment] = useState<boolean>(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(exercises[0]?.id || 'school-squats-standard');
  const [targetReps, setTargetReps] = useState<number>(20);
  const [minAccuracy, setMinAccuracy] = useState<number>(85);
  const [deadline, setDeadline] = useState<string>('2026-10-25');
  const [instructions, setInstructions] = useState<string>('Згинання суглобів під прямим кутом 90 градусів, тримати темп.');

  // Fetch classes
  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/classes');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setClasses(json.data);
        if (!selectedClassCode) {
          setSelectedClassCode(json.data[0].code);
        }
      }
    } catch (e) {
      console.error('Error fetching classes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch submissions for active class
  const loadSubmissions = async (code: string) => {
    if (!code) return;
    try {
      const res = await fetch(`/api/classes/${code}/submissions`);
      const json = await res.json();
      if (json.success) {
        setSubmissions(json.data);
      }
    } catch (e) {
      console.error('Error fetching submissions:', e);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassCode) {
      loadSubmissions(selectedClassCode);
    }
  }, [selectedClassCode]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, teacherName: newTeacherName }),
      });
      const json = await res.json();
      if (json.success) {
        setClasses([json.data, ...classes]);
        setSelectedClassCode(json.data.code);
        setIsCreatingClass(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassCode) return;

    const chosenEx = exercises.find((ex) => ex.id === selectedExerciseId) || exercises[0];

    try {
      const res = await fetch(`/api/classes/${selectedClassCode}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: chosenEx.id,
          exerciseName: chosenEx.name,
          targetReps,
          minAccuracy,
          deadline,
          instructions,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Refresh classes
        loadClasses();
        setIsCreatingAssignment(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activeClass = classes.find((c) => c.code === selectedClassCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-100">
                  Режим «Вчитель» • Панель управління
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Журнал & ДЗ
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Створення класів, призначення домашніх завдань та онлайн-журнал перевірки AI
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

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Sidebar: Class Selector & New Class */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-neutral-800 p-4 bg-neutral-950/40 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                <span>Мої класи</span>
                <button
                  onClick={() => setIsCreatingClass(!isCreatingClass)}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Новий клас</span>
                </button>
              </div>

              {/* Class Creation Form Inline */}
              {isCreatingClass && (
                <form onSubmit={handleCreateClass} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                  <div className="text-xs font-medium text-neutral-200">Створити новий клас</div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-mono">Назва класу</label>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="напр. 8-Б клас"
                      className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-mono">ПІБ Вчителя</label>
                    <input
                      type="text"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="ПІБ вчителя"
                      className="w-full px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-neutral-600"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold"
                    >
                      Створити
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingClass(false)}
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-400"
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              )}

              {/* List of classes */}
              <div className="space-y-1.5">
                {classes.map((c) => (
                  <div
                    key={c.code}
                    onClick={() => setSelectedClassCode(c.code)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedClassCode === c.code
                        ? 'border-neutral-600 bg-neutral-800/80 shadow-sm'
                        : 'border-neutral-800/60 bg-neutral-900/30 hover:bg-neutral-900/70 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-semibold text-neutral-100">{c.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                        {c.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1">
                      {c.teacherName}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500 font-mono">
                      <span>{c.assignments.length} завдань</span>
                      <span>•</span>
                      <span>{c.students.length} учнів</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Access Code Share Box */}
            {activeClass && (
              <div className="mt-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono">
                <div className="text-[10px] text-neutral-500 uppercase">Код доступу для учнів</div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-sm font-bold text-emerald-400">{activeClass.code}</span>
                  <button
                    onClick={() => copyClassCode(activeClass.code)}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] px-2"
                  >
                    {copiedCode === activeClass.code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === activeClass.code ? 'Скопійовано' : 'Копіювати'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Main Panel: Assignments & Submissions Journal */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {activeClass ? (
              <>
                {/* Active Assignments Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold text-neutral-100">
                        Призначені домашні завдання ({activeClass.assignments.length})
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsCreatingAssignment(!isCreatingAssignment)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Призначити ДЗ</span>
                    </button>
                  </div>

                  {/* Assignment Creator Form */}
                  {isCreatingAssignment && (
                    <form
                      onSubmit={handleCreateAssignment}
                      className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3 mb-4 animate-fade-in text-xs"
                    >
                      <div className="font-semibold text-neutral-200">Параметри домашнього завдання</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-neutral-400 uppercase font-mono">Оберіть вправу</label>
                          <select
                            value={selectedExerciseId}
                            onChange={(e) => setSelectedExerciseId(e.target.value)}
                            className="w-full mt-1 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                          >
                            {exercises.slice(0, 30).map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name} ({ex.categoryName})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-neutral-400 uppercase font-mono">Цільові повтори</label>
                            <input
                              type="number"
                              min={5}
                              max={100}
                              value={targetReps}
                              onChange={(e) => setTargetReps(Number(e.target.value))}
                              className="w-full mt-1 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-neutral-400 uppercase font-mono">Точність (%)</label>
                            <input
                              type="number"
                              min={50}
                              max={100}
                              value={minAccuracy}
                              onChange={(e) => setMinAccuracy(Number(e.target.value))}
                              className="w-full mt-1 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-neutral-400 uppercase font-mono">Дедлайн здачі</label>
                          <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full mt-1 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 uppercase font-mono">Вказівка вчителя</label>
                          <input
                            type="text"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="напр. Контролювати кут 90°"
                            className="w-full mt-1 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingAssignment(false)}
                          className="px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 text-xs"
                        >
                          Скасувати
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs"
                        >
                          Опублікувати ДЗ для класу
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Assignments Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeClass.assignments.map((hw) => (
                      <div key={hw.id} className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-neutral-100 line-clamp-1">{hw.exerciseName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {hw.targetReps} повт
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                          {hw.instructions}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-500 font-mono">
                          <span>Мін. точність: {hw.minAccuracy}%</span>
                          <span>Дедлайн: {hw.deadline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submissions Gradebook Dashboard */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold text-neutral-100">
                        Дашборд успішності (Здані роботи: {submissions.length})
                      </h3>
                    </div>
                  </div>

                  {submissions.length === 0 ? (
                    <div className="p-8 rounded-xl bg-neutral-950/40 border border-neutral-800 text-center text-xs text-neutral-500">
                      Поки що жоден учень не здав завдання для цього класу. Передайте учням код доступу <strong>{activeClass.code}</strong>.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950/60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-900/80 border-b border-neutral-800 text-[10px] uppercase font-mono text-neutral-400">
                          <tr>
                            <th className="py-2.5 px-3">Учень</th>
                            <th className="py-2.5 px-3">Вправа</th>
                            <th className="py-2.5 px-3 text-center">Зараховано</th>
                            <th className="py-2.5 px-3 text-center">Точність AI</th>
                            <th className="py-2.5 px-3 text-center">Оцінка</th>
                            <th className="py-2.5 px-3">Вердикт AI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 font-mono">
                          {submissions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-neutral-900/40 transition-colors">
                              <td className="py-3 px-3 font-semibold text-neutral-200 font-sans">
                                {sub.studentName}
                                <div className="text-[10px] text-neutral-500 font-mono">{sub.formattedDate}</div>
                              </td>
                              <td className="py-3 px-3 text-neutral-300 font-sans line-clamp-1">
                                {sub.exerciseName}
                              </td>
                              <td className="py-3 px-3 text-center text-neutral-200">
                                {sub.validReps} / {sub.targetReps}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  sub.accuracyPercent >= 85
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-amber-400 bg-amber-500/10'
                                }`}>
                                  {sub.accuracyPercent}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                                  sub.grade === 5
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : sub.grade === 4
                                    ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {sub.grade}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-neutral-400 font-sans text-[11px] max-w-xs truncate">
                                {sub.aiVerdict}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-neutral-400 text-xs">
                Оберіть клас або створіть новий для керування завданнями
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
