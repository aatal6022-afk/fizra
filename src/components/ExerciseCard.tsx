/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Exercise } from '../types/exercise';
import { Video, Star, Compass, Award, ChevronRight } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  onSelectExercise: (exercise: Exercise) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onSelectExercise,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <div
      onClick={() => onSelectExercise(exercise)}
      className="group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/90 hover:border-neutral-700/80 transition-all duration-150 cursor-pointer active:scale-[0.99] select-none"
    >
      {/* Top Header: Category & Favorite */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800/80">
              {exercise.categoryName}
            </span>
            <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-950/60 border border-neutral-800/50">
              {exercise.difficulty}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(exercise.id, e);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isFavorite
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/60'
            }`}
            title={isFavorite ? 'Видалити з обраного' : 'Додати в обране'}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors leading-snug mb-1.5 line-clamp-2">
          {exercise.name}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">
          {exercise.description}
        </p>

        {/* Muscle group chips */}
        {exercise.targetMuscleGroups && exercise.targetMuscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {exercise.targetMuscleGroups.slice(0, 3).map((muscle, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-800/60 text-neutral-400 truncate max-w-[130px]"
              >
                {muscle.split('(')[0].trim()}
              </span>
            ))}
            {exercise.targetMuscleGroups.length > 3 && (
              <span className="text-[10px] px-1 py-0.5 text-neutral-500 font-mono">
                +{exercise.targetMuscleGroups.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" title="Шкільний норматив на оцінку «5»">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-200 font-medium">«5»: {exercise.normativeGrade5}</span>
          </div>

          <div className="flex items-center gap-1" title="Еталонний кут згинання">
            <Compass className="w-3.5 h-3.5 text-neutral-500" />
            <span>{exercise.targetAngle}°</span>
          </div>

          {exercise.videoUrl && (
            <div className="flex items-center gap-1 text-neutral-500" title="Є відеодемонстрація">
              <Video className="w-3 h-3 text-neutral-400" />
            </div>
          )}
        </div>

        <div className="flex items-center text-neutral-500 group-hover:text-neutral-300 transition-colors">
          <span className="text-[10px] hidden sm:inline mr-1 font-sans">Деталі</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
