/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { UserWorkoutHistoryItem } from '../types/exercise';
import {
  X,
  History,
  TrendingUp,
  Award,
  Calendar,
  Compass,
  Clock,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface WorkoutHistoryModalProps {
  onClose: () => void;
}

export const WorkoutHistoryModal: React.FC<WorkoutHistoryModalProps> = ({ onClose }) => {
  const [history, setHistory] = useState<UserWorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<UserWorkoutHistoryItem | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory(data.data);
          if (data.data.length > 0) {
            setSelectedItem(data.data[0]);
          }
        }
      })
      .catch((err) => console.error('Error fetching history:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const totalSessions = history.length;
  const totalRepsDone = history.reduce((acc, cur) => acc + (cur.validReps || 0), 0);
  const avgGrade = totalSessions > 0
    ? (history.reduce((acc, cur) => acc + (cur.grade || 0), 0) / totalSessions).toFixed(1)
    : '5.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Історія тренувань та прогрес техніки
              </h2>
              <p className="text-xs text-neutral-400">
                Збережені сесії з показниками амплітуди, швидкості та оцінкою AI
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

        {/* Top Summary Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-neutral-950/40 border-b border-neutral-800 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase">Сесій виконано</div>
            <div className="text-xl font-bold text-neutral-100 mt-0.5">{totalSessions}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase">Зарахованих повторень</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{totalRepsDone}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div className="text-[10px] text-neutral-500 uppercase">Середній бал AI</div>
            <div className="text-xl font-bold text-neutral-100 mt-0.5">{avgGrade} / 5</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* List of past workouts */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-800 overflow-y-auto p-3 space-y-2">
            {history.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                Історія поки що порожня. Виконайте вправу, щоб зафіксувати перший аналіз!
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                    selectedItem?.id === item.id
                      ? 'border-neutral-600 bg-neutral-800/80 shadow-sm'
                      : 'border-neutral-800/60 bg-neutral-950/40 hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-neutral-200 line-clamp-1">{item.exerciseName}</span>
                    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      item.grade === 5
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.grade === 4
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {item.grade}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-400 mt-1">
                    {item.formattedDate}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-neutral-500">
                    <span>{item.validReps} / {item.totalReps} повт</span>
                    <span>•</span>
                    <span>Кут: {item.averageAmplitude}°</span>
                    <span>•</span>
                    <span>{item.tempoSpeed} с/повт</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detailed view of selected workout session */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {selectedItem ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                      {selectedItem.categoryName}
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      {selectedItem.formattedDate}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-100 mt-1">
                    {selectedItem.exerciseName}
                  </h3>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                  <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                    <div className="text-[10px] text-neutral-500 uppercase">Амплітуда</div>
                    <div className="text-lg font-bold text-neutral-100 mt-0.5">
                      {selectedItem.averageAmplitude}°
                    </div>
                    <div className="text-[10px] text-neutral-500">Еталон: {selectedItem.targetAmplitude}°</div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                    <div className="text-[10px] text-neutral-500 uppercase">Швидкість / темп</div>
                    <div className="text-lg font-bold text-neutral-100 mt-0.5">
                      {selectedItem.tempoSpeed} <span className="text-xs font-normal text-neutral-400">с/повт</span>
                    </div>
                    <div className="text-[10px] text-neutral-500">Час: {selectedItem.durationSeconds}с</div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                    <div className="text-[10px] text-neutral-500 uppercase">Зараховано</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">
                      {selectedItem.validReps} <span className="text-xs font-normal text-neutral-400">/ {selectedItem.totalReps}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {selectedItem.totalReps > 0 ? Math.round((selectedItem.validReps / selectedItem.totalReps) * 100) : 0}% успішність
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
                    <div className="text-[10px] text-neutral-500 uppercase">Оцінка физри</div>
                    <div className="text-lg font-bold text-neutral-100 mt-0.5">
                      «{selectedItem.grade}»
                    </div>
                    <div className="text-[10px] text-neutral-500">Симетрія: {selectedItem.symmetryScore}%</div>
                  </div>
                </div>

                {/* Overall Verdict Banner */}
                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs space-y-2">
                  <div className="font-semibold text-neutral-200 flex items-center gap-1.5 font-mono">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>Загальний вердикт по техніці</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    {selectedItem.overallVerdict}
                  </p>
                </div>

                {/* AI Detailed Breakdown if exists */}
                {selectedItem.aiReport && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {selectedItem.aiReport.positiveAspects && selectedItem.aiReport.positiveAspects.length > 0 && (
                      <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800">
                        <div className="font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Сильні сторони:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-neutral-400 text-[11px]">
                          {selectedItem.aiReport.positiveAspects.map((pos, idx) => (
                            <li key={idx}>{pos}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedItem.aiReport.humanLanguageCorrections && selectedItem.aiReport.humanLanguageCorrections.length > 0 && (
                      <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800">
                        <div className="font-semibold text-amber-400 mb-1.5">
                          Поради людською мовою:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-neutral-400 text-[11px]">
                          {selectedItem.aiReport.humanLanguageCorrections.map((corr, idx) => (
                            <li key={idx}>{corr}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-neutral-500">
                Оберіть тренування зі списку ліворуч для перегляду деталей
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
