'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface TagInputProps {
  allTags: Tag[]; 
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  maxTags?: number;
}

export default function TagInput({ allTags, selectedTags, onChange, maxTags = 15 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [warning, setWarning] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      onChange(selectedTags.filter(t => !(t.id === -1 && t.name === tag.name)));
    } else {
      onChange(selectedTags.filter(t => t.id !== tag.id));
    }
  }

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
        className="flex flex-wrap gap-2 min-h-[44px] px-3 py-2 rounded-xl cursor-text transition"
        style={{ background: 'var(--surface-container-low)', border: '1px solid transparent' }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tag chips */}
        {selectedTags.map(tag => (
          <span
            key={tag.id === -1 ? `new-${tag.name}` : tag.id}
            className="flex items-center gap-1 label-caps px-2.5 py-1 rounded-full font-inter"
            style={{ background: 'var(--surface-container-high)', color: 'var(--primary-dim)' }}
          >
            #{tag.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="ml-0.5 transition"
              style={{ color: 'var(--on-surface-dim)' }}
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
            placeholder={selectedTags.length === 0 ? 'Add tags…' : ''}
            onChange={e => { setInputValue(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const trimmed = inputValue.trim().toLowerCase();
                if (!trimmed) return;
                const match = suggestions.find(t => t.name === trimmed);
                if (match) {
                  addTag(match);
                } else {
                  if (selectedTags.find(t => t.name === trimmed)) {
                    showWarning(`"${trimmed}" is already added`);
                    setInputValue('');
                    return;
                  }
                  addTag({ id: -1, name: trimmed, slug: '' });
                }
              } else if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
                removeTag(selectedTags[selectedTags.length - 1]);
              }
            }}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm"
            style={{ color: 'var(--on-surface)', fontFamily: "'Inter', system-ui, sans-serif" }}
          />
        )}
      </div>

      {/* Dropdown */}
      {open && (inputValue.length > 0 || suggestions.length > 0) && (
        <div
          className="absolute top-full mt-1.5 left-0 right-0 z-20 rounded-xl shadow-xl overflow-hidden"
          style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}
        >
          {suggestions.length > 0 && (
            <ul>
              {suggestions.slice(0, 8).map(tag => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onMouseDown={() => addTag(tag)}
                    className="w-full text-left px-4 py-2.5 text-sm transition"
                    style={{ color: 'var(--on-surface)', fontFamily: "'Noto Serif', serif" }}
                  >
                    #{tag.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Create new tag */}
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
              className="w-full text-left px-4 py-2.5 text-sm transition"
              style={{
                color: 'var(--on-surface-dim)',
                borderTop: '1px solid var(--outline-variant)',
              }}
            >
              Create{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>#{inputValue.trim().toLowerCase()}</span>
            </button>
          )}
        </div>
      )}

      {warning && (
        <p className="text-xs mt-1.5 pl-1" style={{ color: '#c97c1a' }}>{warning}</p>
      )}
    </div>
  );
}
