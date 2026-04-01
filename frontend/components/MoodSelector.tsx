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
    <div>
      <p className="label-caps mb-4 font-inter" style={{ color: 'var(--on-surface-dim)' }}>Current Mood</p>
      <div className="flex gap-4 sm:gap-6 mt-2">
        {moods.map((mood) => {
          const isSelected = selectedMoodId === mood.id;
          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => onSelect(mood.id)}
              className="flex flex-col items-center group relative w-16"
            >
              <div 
                className="w-14 h-14 sm:w-[68px] sm:h-[68px] rounded-[18px] flex items-center justify-center transition-all duration-300 z-10 mb-3"
                style={{
                  background: isSelected ? '#faebcf' : 'transparent',
                  boxShadow: isSelected ? '0 10px 30px -5px rgba(0, 0, 0, 0.08)' : 'none',
                  border: isSelected ? '1px solid rgba(0,0,0,0.04)' : '1px solid transparent',
                  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                <span
                  className="text-3xl sm:text-[2.25rem] transition-all duration-300"
                  style={{
                    filter: isSelected ? 'none' : 'grayscale(15%) opacity(0.85)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {mood.emoji}
                </span>
              </div>
              <span
                className="label-caps transition-all font-inter"
                style={{
                  color: isSelected ? '#6a5a40' : 'var(--outline)',
                  fontWeight: isSelected ? 600 : 500,
                  letterSpacing: '0.08em',
                  fontSize: '0.65rem'
                }}
              >
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
