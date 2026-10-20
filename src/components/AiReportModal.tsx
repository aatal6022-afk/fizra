/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AiEvaluationReport, Exercise } from '../types/exercise';
import {
  X,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Send,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';

interface AiReportModalProps {
  report: AiEvaluationReport;
  exercise: Exercise;
  totalReps: number;
  validReps: number;
  averageAngle: number;
  symmetryScore: number;
  durationSeconds: number;
  onClose: () => void;
  onRetry: () => void;
  homeworkInfo?: {
    studentName: string;
    classCode: string;
    className: string;
  };
}

export const AiReportModal: React.FC<AiReportModalProps> = ({
  report,
  exercise,
  totalReps,
  validReps,
  averageAngle,
  symmetryScore,
  durationSeconds,
  onClose,
  onRetry,
  homeworkInfo,
}) => {
  const [copied, setCopied] = useState(false);

  const copyReport = () => {
    const text = `
Звіт з біомеханіки: ${exercise.name}
Учень: ${homeworkInfo ? homeworkInfo.studentName + ' (' + homeworkInfo.className + ')' : 'Спортсмен'}
Оцінка: «${report.grade}»
Виконано: ${validReps} з ${totalReps} правильних повторень
Середній кут: ${averageAngle}° (Еталон: ${exercise.targetAngle}°)
Симетрія: ${symmetryScore}%
Вердикт AI: ${report.summary}
Поради: ${report.humanLanguageCorrections.join('; ')}
Коментар вчителя: ${report.peTeacherComment}
`;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-100">
                  Звіт аналізу техніки (Gemini AI & Біомеханіка)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Оцінка: {report.grade}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {exercise.name} • Еталон амплітуди {exercise.targetAngle}°
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
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Homework Submission Badge if submitted */}
          {homeworkInfo && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-emerald-300">
                  ДЗ успішно надіслано в журнал вчителя!
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Учень: <strong>{homeworkInfo.studentName}</strong> • Клас: {homeworkInfo.className} ({homeworkInfo.classCode})
                </p>
              </div>
            </div>
          )}

          {/* Big Grade & Summary Card */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 flex flex-col items-center justify-center shrink-0 font-mono">
              <span className="text-[9px] text-neutral-400 uppercase">Бал</span>
              <span className="text-2xl font-black text-emerald-400 leading-none mt-0.5">
                {report.grade}
              </span>
              <span className="text-[8px] text-neutral-500 mt-0.5">з 5</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-neutral-200 uppercase font-mono tracking-wider">
                Загальний вердикт вчителя та AI
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {report.summary}
              </p>
            </div>
          </div>

          {/* Biomechanical Telemetry Grid */}
          <div className="grid grid-cols-4 gap-2 font-mono text-center text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <div className="text-[9px] text-neutral-500 uppercase">Зараховано</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{validReps} / {totalReps}</div>
              <div className="text-[9px] text-neutral-500">{totalReps > 0 ? Math.round((validReps / totalReps) * 100) : 0}%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <div className="text-[9px] text-neutral-500 uppercase">Середній кут</div>
              <div className="text-base font-bold text-neutral-100 mt-0.5">{averageAngle}°</div>
              <div className="text-[9px] text-neutral-500">Ціль: {exercise.targetAngle}°</div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <div className="text-[9px] text-neutral-500 uppercase">Симетрія</div>
              <div className="text-base font-bold text-neutral-100 mt-0.5">{symmetryScore}%</div>
              <div className="text-[9px] text-neutral-500">Баланс</div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <div className="text-[9px] text-neutral-500 uppercase">Темп</div>
              <div className="text-base font-bold text-neutral-100 mt-0.5">
                {totalReps > 0 ? (durationSeconds / totalReps).toFixed(1) : '0'}с
              </div>
              <div className="text-[9px] text-neutral-500">{durationSeconds} сек</div>
            </div>
          </div>

          {/* Human Language Corrections */}
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2 text-xs">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Що виправити людською мовою:</span>
            </div>
            <ul className="space-y-1.5 text-neutral-300 list-disc list-inside text-xs leading-relaxed">
              {report.humanLanguageCorrections.map((corr, idx) => (
                <li key={idx}>{corr}</li>
              ))}
            </ul>
          </div>

          {/* Positive Points & Teacher Comment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-800">
              <div className="font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Що зроблено правильно:</span>
              </div>
              <ul className="space-y-1 text-neutral-400 text-[11px] list-disc list-inside">
                {report.positiveAspects.map((pos, idx) => (
                  <li key={idx}>{pos}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-800">
              <div className="font-semibold text-neutral-300 mb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Коментар викладача фізри:</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                {report.peTeacherComment}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={copyReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопійовано' : 'Скопіювати звіт'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Спробувати ще раз</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-semibold transition-colors"
            >
              Закрити
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
