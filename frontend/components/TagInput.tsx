'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface TagInputProps {
  allTags: Tag[];           // all user tags for autocomplete dropdown
  selectedTags: Tag[];      // currently selected tags for this entry
  onChange: (tags: Tag[]) => void;
  maxTags?: number;
}

export default function TagInput({ allTags, selectedTags, onChange, maxTags = 15 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [warning, setWarning] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suggestions: allTags not already selected, filtered by input
  const suggestions = allTags.filter(
    t => !selectedTags.find(s => s.id === t.id) &&
         t.name.includes(inputValue.toLowerCase().trim())
  );

  function showWarning(msg: string) {
    setWarning(msg);
    setTimeout(() => setWarning(''), 2000);
  }

  function addTag(tag: Tag) {
    if (selectedTags.length >= maxTags) return;
    // Block by name (covers both saved and new tags)
    if (selectedTags.find(t => t.name === tag.name)) {
      showWarning(`"${tag.name}" is already added`);
      return;
    }
    onChange([...selectedTags, tag]);
    setInputValue('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTag(tag: Tag) {
    if (tag.id === -1) {
      // New unsaved tags — match by name since they all share id -1
      onChange(selectedTags.filter(t => !(t.id === -1 && t.name === tag.name)));
    } else {
      onChange(selectedTags.filter(t => t.id !== tag.id));
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-2 min-h-[44px] px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus-within:ring-2 focus-within:ring-zinc-600 focus-within:border-transparent transition cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tag chips */}
        {selectedTags.map(tag => (
          <span
            key={tag.id === -1 ? `new-${tag.name}` : tag.id}
            className="flex items-center gap-1 bg-zinc-700 text-zinc-200 text-xs font-medium px-2.5 py-1 rounded-full"
          >
            #{tag.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-zinc-400 hover:text-white ml-0.5 transition"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {/* Text input */}
        {selectedTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            placeholder={selectedTags.length === 0 ? 'Add tags...' : ''}
            onChange={e => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="flex-1 min-w-[80px] bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none"
          />
        )}
      </div>

      {/* Dropdown */}
      {open && (inputValue.length > 0 || suggestions.length > 0) && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-20 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
          {suggestions.length > 0 && (
            <ul>
              {suggestions.slice(0, 8).map(tag => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onMouseDown={() => addTag(tag)}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    #{tag.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Create new tag if input doesn't match any existing */}
          {inputValue.trim().length > 0 && !suggestions.find(t => t.name === inputValue.trim().toLowerCase()) && (
            <button
              type="button"
              onMouseDown={() => {
                const name = inputValue.trim().toLowerCase();
                if (selectedTags.find(t => t.name === name)) {
                  showWarning(`"${name}" is already added`);
                  setInputValue('');
                  setOpen(false);
                  return;
                }
                onChange([...selectedTags, { id: -1, name, slug: '' }]);
                setInputValue('');
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-800 border-t border-zinc-800 transition"
            >
              Create <span className="text-white font-medium">#{inputValue.trim().toLowerCase()}</span>
            </button>
          )}
        </div>
      )}

      {/* Inline warning */}
      {warning && (
        <p className="text-xs text-amber-400 mt-1.5 pl-1">{warning}</p>
      )}
    </div>
  );
}
