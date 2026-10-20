/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Exercise } from './types/exercise';
import { CATEGORIES, EXERCISES_DATABASE } from './data/exercisesData';
import { ExerciseCard } from './components/ExerciseCard';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import {
  Search,
  X,
  Star,
  Shuffle,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const POPULAR_MUSCLES = [
  'Всі м\'язи',
  'Прес',
  'Квадрицепс',
  'Грудні м\'язи',
  'Сідничні',
  'Найширші',
  'Трицепс',
  'Плечі',
  'Біцепс',
  'Литки',
];

export default function App() {
  const [exercises] = useState<Exercise[]>(EXERCISES_DATABASE);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Всі м\'язи');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('fiz_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const itemsPerPage = 20;

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fiz_favorites', JSON.stringify(favorites));
    } catch {
      // Storage unavailable
    }
  }, [favorites]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered Exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // Favorite filter
      if (onlyFavorites && !favorites.includes(ex.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && ex.category !== selectedCategory) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) {
        return false;
      }

      // Muscle group filter
      if (selectedMuscle !== 'Всі м\'язи') {
        const needle = selectedMuscle.toLowerCase();
        const matchesMuscle = ex.targetMuscleGroups?.some((m) =>
          m.toLowerCase().includes(needle)
        );
        if (!matchesMuscle) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = ex.name.toLowerCase().includes(q);
        const descMatch = ex.description.toLowerCase().includes(q);
        const muscleMatch = ex.targetMuscleGroups?.some((m) =>
          m.toLowerCase().includes(q)
        );
        const tagMatch = ex.tags?.some((t) => t.toLowerCase().includes(q));
        const jointMatch = ex.targetJoint.toLowerCase().includes(q);

        if (!nameMatch && !descMatch && !muscleMatch && !tagMatch && !jointMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    exercises,
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    selectedMuscle,
    onlyFavorites,
    favorites,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedMuscle, onlyFavorites]);

  // Pagination
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const paginatedExercises = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExercises.slice(start, start + itemsPerPage);
  }, [filteredExercises, currentPage]);

  // Random exercise picker ("Випадкова вправа")
  const handleRandomExercise = () => {
    if (filteredExercises.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredExercises.length);
      setSelectedExercise(filteredExercises[randomIndex]);
    } else if (exercises.length > 0) {
      const randomIndex = Math.floor(Math.random() * exercises.length);
      setSelectedExercise(exercises[randomIndex]);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedMuscle('Всі м\'язи');
    setOnlyFavorites(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-neutral-800">
      
      {/* Search Header (Google / Spotlight Minimalist Mobile-First Style) */}
      <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 space-y-3">
          
          {/* Brand & Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-100 flex items-center gap-1.5">
                  <span>ФІЗ-ПОШУК</span>
                  <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {exercises.length} вправ
                  </span>
                </h1>
                <p className="text-[11px] text-neutral-500 hidden sm:block">
                  Мінімалістичний довідник вправ з фізичної культури та ЗФП
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRandomExercise}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs font-mono transition-colors"
                title="Випадкова вправа"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Випадкова</span>
              </button>

              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                  onlyFavorites
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 font-semibold'
                    : 'border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Показати лише обрані"
              >
                <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{favorites.length}</span>
              </button>
            </div>
          </div>

          {/* Central Mobile-First Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук вправи, м'яза (прес, квадрицепс...), нормативу..."
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips Scrollbar (Swipeable on phones) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap font-medium ${
                selectedCategory === 'all'
                  ? 'bg-neutral-100 text-neutral-950 font-bold border-white'
                  : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Всі ({exercises.length})
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-100 text-neutral-950 font-bold border-white'
                    : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 space-y-4">
        
        {/* Sub-Filters: Target Muscle Chips & Difficulty */}
        <div className="space-y-2">
          {/* Quick Muscle Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px] font-mono">
            {POPULAR_MUSCLES.map((muscle) => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap ${
                  selectedMuscle === muscle
                    ? 'bg-neutral-800 border-neutral-600 text-neutral-100 font-semibold'
                    : 'bg-neutral-900/40 border-neutral-800/60 text-neutral-400 hover:text-neutral-300'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>

          {/* Result counter and difficulty switcher */}
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono pt-1">
            <div className="flex items-center gap-2">
              <span>Знайдено: <strong className="text-neutral-200">{filteredExercises.length}</strong></span>
              {onlyFavorites && (
                <span className="text-amber-400">(лише обрані)</span>
              )}
            </div>

            {/* Difficulty filter buttons */}
            <div className="flex items-center gap-1">
              {['all', 'Базовий', 'Середній', 'Просунутий'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedDifficulty(lvl)}
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] border transition-colors ${
                    selectedDifficulty === lvl
                      ? 'border-neutral-600 bg-neutral-800 text-neutral-100'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {lvl === 'all' ? 'Будь-який рівень' : lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercises List (Mobile-optimized cards) */}
        {filteredExercises.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-neutral-900/20 border border-neutral-800/80 text-center space-y-3 my-6">
            <p className="text-sm text-neutral-400">
              За вашим запитом нічого не знайдено
            </p>
            <p className="text-xs text-neutral-500">
              Спробуйте змінити пошуковий запит, скинути фільтр м'язів або обрати іншу категорію
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-200 hover:text-white transition-colors"
            >
              Скинути всі фільтри
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {paginatedExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onSelectExercise={(ex) => setSelectedExercise(ex)}
                isFavorite={favorites.includes(exercise.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 pb-8 border-t border-neutral-800/80 text-xs font-mono">
            <div className="text-neutral-500 text-[11px]">
              {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredExercises.length)} з {filteredExercises.length}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 disabled:opacity-30 hover:text-white transition-colors"
                title="Попередня сторінка"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-neutral-300 px-2 text-xs">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 disabled:opacity-30 hover:text-white transition-colors"
                title="Наступна сторінка"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-5 text-xs text-neutral-500 font-mono text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <div>ФІЗ-ПОШУК • {exercises.length} вправ з технікою, м'язами та нормативами</div>
          <div className="text-[11px] text-neutral-600">
            ЗФП, шкільна програма, нормативи, силова витривалість та розтяжка
          </div>
        </div>
      </footer>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          isFavorite={favorites.includes(selectedExercise.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}

    </div>
  );
}
