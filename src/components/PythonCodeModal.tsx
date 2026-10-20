/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Exercise } from '../types/exercise';
import { generatePythonScriptForExercise } from '../utils/pythonScriptTemplate';
import { X, Code, Copy, Check, Download, Terminal } from 'lucide-react';

interface PythonCodeModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ exercise, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!exercise) return null;

  const pythonScript = generatePythonScriptForExercise(exercise);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pe_tracker_${exercise.id}.py`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Python скрипт для физкультури (OpenCV + MediaPipe)
              </h2>
              <p className="text-xs text-neutral-400">
                Готовий код для шкільного/університетського проєкту з побудовою графіків у Matplotlib
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

        {/* Code display */}
        <div className="p-4 flex-1 overflow-y-auto bg-neutral-950 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800/80 text-[11px] text-neutral-300 mb-3 flex items-center justify-between">
            <span>Вимоги: <code className="text-emerald-400">pip install opencv-python mediapipe numpy matplotlib</code></span>
            <span className="text-[10px] text-neutral-500">Python 3.9+</span>
          </div>
          <pre className="text-neutral-300 overflow-x-auto p-4 rounded-xl bg-neutral-900 border border-neutral-800 leading-relaxed text-[11px]">
            {pythonScript}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-3 text-xs">
          <span className="text-neutral-400 text-[11px]">
            Скрипт розрахований на веб-камеру вашого ноутбука або ПК
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Завантажити .py</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопійовано!' : 'Скопіювати код'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
