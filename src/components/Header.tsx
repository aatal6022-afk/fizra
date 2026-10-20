/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Code, BookOpen, Search, SlidersHorizontal } from 'lucide-react';

interface HeaderProps {
  activeTab: 'catalog' | 'standards' | 'about';
  setActiveTab: (tab: 'catalog' | 'standards' | 'about') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalExercises: number;
  onOpenPythonModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  totalExercises,
  onOpenPythonModal,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Project Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700/70 flex items-center justify-center text-neutral-200">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-neutral-100">ФИЗ-АНАЛИЗ</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 font-mono">
                  {totalExercises} упражнений
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Биомеханика физкультуры • Компьютерное зрение
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по упражнению, мышцам, нормативу..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-900/80 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 hover:text-neutral-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-neutral-800 text-neutral-100 font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Каталог
              </button>
              <button
                onClick={() => setActiveTab('standards')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'standards'
                    ? 'bg-neutral-800 text-neutral-100 font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Школьные нормативы
              </button>
            </nav>

            <button
              onClick={onOpenPythonModal}
              title="Открыть шаблон Python OpenCV скрипта"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700 transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline font-mono text-[11px]">Python скрипт</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по 1000 упражнениям..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

      </div>
    </header>
  );
};
