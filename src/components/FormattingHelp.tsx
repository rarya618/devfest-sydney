'use client';

import { useEffect, useRef, useState } from 'react';
import { MARKDOWN_HINT } from '@/components/MarkdownText';

// The formatting line under a text box that MarkdownText renders, with a button that copies a
// prompt asking the speaker's own AI tool to put the box's text into that formatting. The
// speak page on gdgsydney.com (src/components/FormattingHelp.astro there) offers the same
// prompt, so keep the two worded alike.
export function formattingPrompt(label: string, text: string): string {
  return (
    `Reformat my ${label} for a talk proposal form. The form supports only this formatting:\n` +
    '- A line starting with "## " is a heading\n' +
    '- A line starting with "- " is a bullet point\n' +
    '- **Two asterisks** around words make them bold\n' +
    '- [text](https://example.com) is a link\n\n' +
    'Keep my wording and meaning, and fix only the formatting. Use bullets where I list things, ' +
    'and headings only to split a longer text into parts. ' +
    'Do not add tables, emoji or any other Markdown. ' +
    'Reply with only the reformatted text, ready to paste back into the form.\n\n' +
    `My ${label}:\n${text.trim() || '[paste it here]'}`
  );
}

const IDLE = 'Copy a prompt to format this with your AI tool';

export default function FormattingHelp({
  id,
  label,
  value,
  // formStyles' hintClass without its top margin: the wrapper below spaces this from the box.
  hintClassName = 'text-xs text-white/50',
}: {
  id: string;
  label: string;
  value: string;
  /** The formatting line's text classes, to match the form's other hints. No margin. */
  hintClassName?: string;
}) {
  const [status, setStatus] = useState(IDLE);
  const resetTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const copy = async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(formattingPrompt(label, value));
      copied = true;
    } catch {
      // A browser without clipboard access for this page.
    }
    setStatus(copied ? 'Copied. Paste it into your AI tool, then paste its answer back here.' : "Couldn't copy. Your browser blocked the clipboard.");
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setStatus(IDLE), 4000);
  };

  return (
    <div className="mt-1.5 flex flex-col items-start gap-1">
      <p id={id} className={hintClassName}>{MARKDOWN_HINT}</p>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 text-left text-xs font-medium text-google-blue-light hover:underline underline-offset-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-google-blue-light"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden="true" className="shrink-0">
          <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
          <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
        </svg>
        <span aria-live="polite">{status}</span>
      </button>
    </div>
  );
}
