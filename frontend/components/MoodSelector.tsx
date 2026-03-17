import React from 'react';

export interface Mood {
  id: number;
  label: string;
  emoji: string;
  value: number;
}

interface MoodSelectorProps {
  moods: Mood[];
  selectedMoodId: number | null;
  onSelect: (id: number) => void;
}

export default function MoodSelector({ moods, selectedMoodId, onSelect }: MoodSelectorProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <label className="block text-sm font-medium text-zinc-400 mb-4">
        How are you feeling today?
      </label>
      <div className="flex flex-wrap gap-3">
        {moods.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => onSelect(mood.id)}
            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              selectedMoodId === mood.id
                ? 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500 scale-105'
                : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
            }`}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-xs font-medium text-zinc-300 capitalize">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
