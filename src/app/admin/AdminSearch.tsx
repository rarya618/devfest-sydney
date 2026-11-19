'use client';

// The admin's search: a round button that opens into a field. It replaced five pasted copies
// that had drifted (three different open/close rules, and an outside click that threw the
// typed search away). Here a click elsewhere only collapses an empty field, Escape clears and
// closes it, and the query is never lost by accident.

import { useEffect, useId, useRef, useState } from 'react';

interface AdminSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** What it searches, as the field's accessible name: "Search speakers by name, email or talk". */
  label: string;
  placeholder: string;
}

export default function AdminSearch({ value, onChange, label, placeholder }: AdminSearchProps) {
  const [isOpen, setIsOpen] = useState(Boolean(value));
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const isExpanded = isOpen || Boolean(value);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node) && !inputRef.current?.value) setIsOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  function clearAndClose() {
    onChange('');
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      role="search"
      className={`relative shrink-0 h-10 rounded-full bg-white/[0.06] transition-[width,background-color] duration-300 ease-[var(--ease-settle)] ${
        isExpanded ? 'w-full sm:w-80' : 'w-10 hover:bg-white/[0.1]'
      }`}
    >
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={label}
          title="Search"
          className="press absolute inset-0 inline-flex items-center justify-center rounded-full text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
        >
          <SearchIcon className="w-4 h-4" />
        </button>
      )}
      {isExpanded && (
        <>
          <label htmlFor={inputId} className="sr-only">{label}</label>
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60 pointer-events-none" />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                clearAndClose();
              }
            }}
            placeholder={placeholder}
            className="w-full h-10 rounded-full bg-transparent border border-transparent pl-9 pr-10 text-sm text-off-white placeholder:text-white/60 focus:outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/40 [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="button"
            onClick={clearAndClose}
            aria-label="Clear and close search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <circle cx="7" cy="7" r="5" />
      <path strokeLinecap="round" d="M11 11l3.5 3.5" />
    </svg>
  );
}
