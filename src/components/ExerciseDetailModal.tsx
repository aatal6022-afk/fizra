/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Exercise } from '../types/exercise';
import {
  X,
  Video,
  Compass,
  AlertCircle,
  CheckCircle2,
  Award,
  Star,
  Share2,
  Check,
  Layers,
  Activity,
  ExternalLink,
} from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);

  if (!exercise) return null;

  const handleShare = () => {
    const shareText = `${exercise.name}\n${exercise.description}\nЦільові м'язи: ${exercise.targetMuscleGroups?.join(', ')}\nНорматив «5»: ${exercise.normativeGrade5} ${exercise.unit}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Bar Handle */}
        <div className="w-12 h-1 rounded-full bg-neutral-700/60 mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              {exercise.categoryName}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
              {exercise.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleFavorite?.(exercise.id)}
              className={`p-2 rounded-lg border transition-colors ${
                isFavorite
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
              }`}
              title={isFavorite ? 'В обраному' : 'Додати в обране'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 transition-colors"
              title="Скопіювати опис"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 transition-colors"
              title="Закрити"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Title and Video Demo */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-100 tracking-tight leading-snug">
              {exercise.name}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
              {exercise.description}
            </p>

            {exercise.videoUrl && (
              <div className="mt-3">
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-xs text-neutral-200 transition-colors font-mono"
                >
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  <span>Дивитися відеодемонстрацію</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500" />
                </a>
              </div>
            )}
          </div>

          {/* Target Muscle Groups */}
          {exercise.targetMuscleGroups && exercise.targetMuscleGroups.length > 0 && (
            <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="text-[10px] uppercase font-mono text-neutral-400 font-semibold tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Цільові м'язові групи</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {exercise.targetMuscleGroups.map((muscle, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-200 font-medium"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Modifications */}
          {exercise.modifications && exercise.modifications.length > 0 && (
            <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="text-[10px] uppercase font-mono text-neutral-400 font-semibold tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
                <span>Можливі модифікації та варіанти</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300 list-disc list-inside">
                {exercise.modifications.map((mod, idx) => (
                  <li key={idx} className="leading-relaxed">{mod}</li>
                ))}
              </ul>
            </div>
          )}

          {/* School PE Normative Benchmarks */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-neutral-400 font-semibold tracking-wider">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Шкільні нормативи для оцінювання</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-emerald-900/40">
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  Оцінка «5»
                </span>
                <div className="text-base sm:text-lg font-bold text-neutral-100 mt-1.5">
                  {exercise.normativeGrade5} <span className="text-[11px] font-normal text-neutral-400">{exercise.unit}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold border border-neutral-700">
                  Оцінка «4»
                </span>
                <div className="text-base sm:text-lg font-bold text-neutral-100 mt-1.5">
                  {exercise.normativeGrade4} <span className="text-[11px] font-normal text-neutral-400">{exercise.unit}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-bold border border-neutral-700">
                  Оцінка «3»
                </span>
                <div className="text-base sm:text-lg font-bold text-neutral-100 mt-1.5">
                  {exercise.normativeGrade3} <span className="text-[11px] font-normal text-neutral-400">{exercise.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Biomechanical Angle Standards */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-2.5 font-mono">
            <div className="flex items-center gap-1.5 text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">
              <Compass className="w-3.5 h-3.5 text-neutral-400" />
              <span>Біомеханічний паспорт амплітуди</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <div className="text-[9px] text-neutral-500 uppercase">Вихідний кут</div>
                <div className="text-sm font-semibold text-neutral-200 mt-0.5">{exercise.startAngle}°</div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900 border border-emerald-500/30">
                <div className="text-[9px] text-emerald-400 uppercase">Еталон кута</div>
                <div className="text-sm font-semibold text-emerald-400 mt-0.5">{exercise.targetAngle}°</div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <div className="text-[9px] text-neutral-500 uppercase">Коридор зарахування</div>
                <div className="text-sm font-semibold text-neutral-200 mt-0.5">{exercise.minAcceptableAngle}° – {exercise.maxAcceptableAngle}°</div>
              </div>
            </div>

            <p className="text-xs text-neutral-400 font-sans pt-1">
              Цільовий суглоб: <strong className="text-neutral-200">{exercise.targetJoint}</strong>. {exercise.peBenchmarkTip}
            </p>
          </div>

          {/* Key Checkpoints & Common Mistakes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Як правильно виконувати:</span>
              </div>
              <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                {exercise.keyCheckpoints.map((pt, idx) => (
                  <li key={idx} className="leading-relaxed">{pt}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Типові помилки:</span>
              </div>
              <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                {exercise.commonMistakes.map((err, idx) => (
                  <li key={idx} className="leading-relaxed">{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs">
          <span className="text-[11px] text-neutral-500 font-mono">
            ID: {exercise.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-semibold transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
