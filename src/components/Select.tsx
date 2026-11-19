'use client';

// The app's dropdown, replacing the native <select>, whose open list is drawn by the browser and
// the OS: it ignored Google Sans, the radius scale and the dark surfaces, and looked different
// in every browser (issue #10).
//
// A WAI-ARIA select-only combobox: focus stays on the trigger button and aria-activedescendant
// points at the highlighted option. Keyboard: Down, Up, Enter, Space or a letter opens it; Up and
// Down move, Home and End jump, Page Up and Page Down move ten, typing jumps to a match, Enter or
// Space chooses, Escape closes, and Tab closes and moves on without changing the value.
//
// The list opens in the top layer (the Popover API), so it is never clipped by a modal's
// scrolling body and never pinned inside an ancestor with a transform (animate-page-in leaves
// one on the page shells), and it sits above the admin's z-[60] modals.
//
// A <label htmlFor={id}> names it as it named the native element, and the trigger takes the
// field's classes, so it looks closed exactly as the field it replaces did.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface SelectOption<Value extends string> {
  value: Value;
  label: string;
}

interface SelectProps<Value extends string> {
  value: Value;
  options: ReadonlyArray<SelectOption<Value>>;
  onChange: (value: Value) => void;
  /** Classes for the trigger, usually the field classes of the form it sits in. */
  className: string;
  id?: string;
  /** Text size of the open list, matching the trigger: `base` for the public and portal forms. */
  size?: 'sm' | 'base';
  disabled?: boolean;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

const LIST_GAP = 6;
const VIEWPORT_MARGIN = 8;
const LIST_MAX_HEIGHT = 320;
const LIST_MIN_CAP = 320;
const PAGE_STEP = 10;
const TYPEAHEAD_RESET_MS = 500;

interface ListPlacement {
  top?: number;
  bottom?: number;
  left: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
  opensUpward: boolean;
}

export default function Select<Value extends string>({
  value,
  options,
  onChange,
  className,
  id,
  size = 'sm',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: SelectProps<Value>) {
  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId}`;
  const listboxId = `${triggerId}-listbox`;
  const optionId = (index: number) => `${triggerId}-option-${index}`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeaheadBuffer = useRef('');
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState<ListPlacement | null>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : '';

  const placeList = useCallback(() => {
    const trigger = triggerRef.current;
    const list = listRef.current;
    if (!trigger || !list) return;
    const triggerBox = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Closes once the field has scrolled out of sight, as a native list does, rather than
    // leaving the list floating over unrelated content.
    if (triggerBox.bottom < 0 || triggerBox.top > viewportHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = viewportHeight - triggerBox.bottom - LIST_GAP - VIEWPORT_MARGIN;
    const spaceAbove = triggerBox.top - LIST_GAP - VIEWPORT_MARGIN;
    const wantedHeight = Math.min(list.scrollHeight, LIST_MAX_HEIGHT);
    const opensUpward = spaceBelow < wantedHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(Math.min(LIST_MAX_HEIGHT, opensUpward ? spaceAbove : spaceBelow), 120);

    // As wide as the field, so a long label wraps inside it rather than stretching the list
    // across the page. A small pill picker may grow to LIST_MIN_CAP so its labels stay readable.
    const maxWidth = Math.min(Math.max(triggerBox.width, LIST_MIN_CAP), viewportWidth - VIEWPORT_MARGIN * 2);
    const minWidth = Math.min(triggerBox.width, maxWidth);
    const listWidth = Math.min(Math.max(list.offsetWidth, minWidth), maxWidth);
    const left = Math.max(VIEWPORT_MARGIN, Math.min(triggerBox.left, viewportWidth - VIEWPORT_MARGIN - listWidth));

    setPlacement({
      top: opensUpward ? undefined : triggerBox.bottom + LIST_GAP,
      bottom: opensUpward ? viewportHeight - triggerBox.top + LIST_GAP : undefined,
      left,
      minWidth,
      maxWidth,
      maxHeight,
      opensUpward,
    });
  }, []);

  // Shows and hides the list in the top layer, placed against the trigger before it paints.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (isOpen) {
      if (!list.matches(':popover-open')) list.showPopover();
      placeList();
    } else if (list.matches(':popover-open')) {
      list.hidePopover();
    }
  }, [isOpen, placeList]);

  // Follows the field while the page or a modal scrolls, and closes on a click elsewhere.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    window.addEventListener('scroll', placeList, true);
    window.addEventListener('resize', placeList);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('scroll', placeList, true);
      window.removeEventListener('resize', placeList);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, placeList]);

  // Keeps the highlighted option in view as the keyboard moves through a long list.
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    // optionId only depends on triggerId, which never changes for a mounted select.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex]);

  useEffect(() => () => {
    if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
  }, []);

  function openList(startIndex = selectedIndex >= 0 ? selectedIndex : 0) {
    if (disabled || options.length === 0) return;
    setActiveIndex(clampIndex(startIndex));
    setIsOpen(true);
  }

  function closeList() {
    setIsOpen(false);
  }

  function choose(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    closeList();
    triggerRef.current?.focus();
  }

  function clampIndex(index: number) {
    return Math.max(0, Math.min(options.length - 1, index));
  }

  // Jumps to the next option whose label starts with what has been typed in the last half
  // second. Typing the same letter again cycles through the options starting with it.
  function matchTypeahead(character: string): number {
    if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = setTimeout(() => {
      typeaheadBuffer.current = '';
    }, TYPEAHEAD_RESET_MS);
    typeaheadBuffer.current += character.toLowerCase();

    const typed = typeaheadBuffer.current;
    const isRepeatedLetter = typed.split('').every((letter) => letter === typed[0]);
    const searchText = isRepeatedLetter ? typed[0] : typed;
    const fromIndex = isOpen ? activeIndex : selectedIndex;
    const startOffset = isRepeatedLetter || typed.length === 1 ? 1 : 0;

    for (let step = 0; step < options.length; step += 1) {
      const candidate = (Math.max(fromIndex, 0) + startOffset + step) % options.length;
      if (options[candidate].label.toLowerCase().startsWith(searchText)) return candidate;
    }
    return -1;
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    const { key, altKey } = event;
    const isPrintable = key.length === 1 && !event.ctrlKey && !event.metaKey;
    const isTyping = typeaheadBuffer.current.length > 0;

    if (!isOpen) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || (key === ' ' && !isTyping)) {
        event.preventDefault();
        openList();
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault();
        openList(key === 'Home' ? 0 : options.length - 1);
      } else if (isPrintable) {
        event.preventDefault();
        const match = matchTypeahead(key);
        openList(match >= 0 ? match : undefined);
      }
      return;
    }

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => clampIndex(index + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (altKey) choose(activeIndex);
        else setActiveIndex((index) => clampIndex(index - 1));
        return;
      case 'PageDown':
        event.preventDefault();
        setActiveIndex((index) => clampIndex(index + PAGE_STEP));
        return;
      case 'PageUp':
        event.preventDefault();
        setActiveIndex((index) => clampIndex(index - PAGE_STEP));
        return;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      case 'Enter':
        event.preventDefault();
        choose(activeIndex);
        return;
      case 'Escape':
        // Stopped here so a modal or menu listening for Escape stays open; only the list closes.
        event.preventDefault();
        event.stopPropagation();
        closeList();
        return;
      case 'Tab':
        closeList();
        return;
      default:
        if (key === ' ' && !isTyping) {
          event.preventDefault();
          choose(activeIndex);
        } else if (isPrintable) {
          event.preventDefault();
          const match = matchTypeahead(key);
          if (match >= 0) setActiveIndex(match);
        }
    }
  }

  const listTextClass = size === 'base' ? 'text-base' : 'text-sm';

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => (isOpen ? closeList() : openList())}
        onKeyDown={handleKeyDown}
        // A Space that opened or chose would otherwise click the button again on release.
        onKeyUp={(event) => {
          if (event.key === ' ') event.preventDefault();
        }}
        onBlur={closeList}
        className={`${className} inline-flex items-center justify-between gap-3 text-left cursor-pointer disabled:cursor-not-allowed`}
      >
        <span className="truncate min-w-0">{selectedLabel}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-4 h-4 shrink-0 opacity-70 transition-transform duration-200 ease-[var(--ease-settle)] ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M4 6.25 8 10l4-3.75" />
        </svg>
      </button>

      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        popover="manual"
        aria-labelledby={ariaLabel ? undefined : triggerId}
        aria-label={ariaLabel}
        data-placement={placement?.opensUpward ? 'above' : 'below'}
        // Keeps focus on the trigger while an option is pressed, so the list doesn't close on blur.
        onMouseDown={(event) => event.preventDefault()}
        // Stops a choice from reaching a clickable card behind the field (the admin's proposal
        // cards open and close on a click anywhere outside their controls).
        onClick={(event) => event.stopPropagation()}
        style={{
          top: placement?.top ?? 'auto',
          bottom: placement?.bottom ?? 'auto',
          left: placement?.left ?? 0,
          right: 'auto',
          minWidth: placement?.minWidth,
          maxWidth: placement?.maxWidth,
          maxHeight: placement?.maxHeight,
        }}
        className={`select-list m-0 p-1.5 overflow-y-auto overscroll-contain bg-surface-raised text-off-white border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.45)] ${listTextClass}`}
      >
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          const isActive = index === activeIndex;
          return (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={isSelected}
              onPointerMove={() => {
                if (activeIndex !== index) setActiveIndex(index);
              }}
              onClick={() => choose(index)}
              className={`flex items-start gap-2.5 rounded-lg pl-2.5 pr-4 py-2 pointer-coarse:py-3 cursor-pointer select-none transition-colors duration-150
                ${isActive ? 'bg-white/[0.08]' : ''}
                ${isSelected ? 'font-bold text-off-white' : 'text-white/80'}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 shrink-0 mt-[calc((1lh-1rem)/2)] text-google-blue ${isSelected ? '' : 'invisible'}`}
              >
                <path d="m3.5 8.5 3 3 6-7" />
              </svg>
              <span className="min-w-0">{option.label}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
