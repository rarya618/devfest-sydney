import { Fragment, type ReactNode } from 'react';

// Renders the small piece of Markdown that talk abstracts use (decided 2026-11-14), as React
// elements, never as HTML, so nothing a speaker types can inject markup or script:
//   paragraphs (a blank line between), with single line breaks kept
//   bullet lists ("- ", "* " or "• " at the start of a line) and numbered lists ("1. " or "1) ")
//   **bold**, *italic* or _italic_, `code`, and [links](https://...) to http(s) addresses only
// A list may start straight under its intro line, without a blank line, as people type them.
// Anything else shows as typed. Stored text stays plain, and the public API returns it as is.

// The line under every abstract box, so speakers and organisers know what will be formatted.
export const MARKDOWN_HINT = 'Formatting: start a line with - for a bullet point, wrap words in **two asterisks** for bold, and write links as [text](https://…).';

type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'bullets' | 'numbers'; items: string[] };

const BULLET_LINE = /^\s*[-*•]\s+(.*)$/;
const NUMBER_LINE = /^\s*\d{1,3}[.)]\s+(.*)$/;

function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  // Typed through a cast: a plain null would narrow it for good, since finish() reassigns it.
  let current = null as Block | null;
  const finish = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      finish();
      continue;
    }
    const bullet = BULLET_LINE.exec(line);
    const number = bullet ? null : NUMBER_LINE.exec(line);
    const listKind = bullet ? 'bullets' : number ? 'numbers' : null;
    if (listKind) {
      const item = (bullet ?? number)![1];
      if (current?.kind === listKind) current.items.push(item);
      else {
        finish();
        current = { kind: listKind, items: [item] };
      }
    } else if (current?.kind === 'paragraph') {
      current.lines.push(line.trim());
    } else {
      finish();
      current = { kind: 'paragraph', lines: [line.trim()] };
    }
  }
  finish();
  return blocks;
}

// Code first, so nothing inside backticks is read as formatting; then links, bold, italics.
// An italic marker must hug its text ("*word*"), so "2 * 3 * 4" stays as typed.
const INLINE = /`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*\n]+?)\*\*|(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])|(?<![\w_])_(?!\s)([^_\n]+?)(?<!\s)_(?![\w_])/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));
    const key = `${keyPrefix}-${index}`;
    const [, code, linkText, linkUrl, bold, starItalic, underscoreItalic] = match;
    if (code !== undefined) {
      nodes.push(<code key={key} className="font-mono text-[0.92em] rounded bg-white/[0.08] px-1 py-0.5">{code}</code>);
    } else if (linkText !== undefined) {
      nodes.push(
        <a key={key} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-google-blue-light underline underline-offset-2 hover:no-underline">
          {renderInline(linkText, key)}
        </a>
      );
    } else if (bold !== undefined) {
      nodes.push(<strong key={key} className="font-bold text-white/90">{renderInline(bold, key)}</strong>);
    } else {
      // Google Sans has no italic face (BRANDING.md), so emphasis is set in the medium weight.
      nodes.push(<em key={key} className="not-italic font-medium text-white/90">{renderInline(starItalic ?? underscoreItalic, key)}</em>);
    }
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export default function MarkdownText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`space-y-3 break-words ${className}`}>
      {toBlocks(text).map((block, blockIndex) => {
        const key = `block-${blockIndex}`;
        if (block.kind === 'paragraph') {
          return (
            <p key={key}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  {renderInline(line, `${key}-${lineIndex}`)}
                </Fragment>
              ))}
            </p>
          );
        }
        const ListTag = block.kind === 'bullets' ? 'ul' : 'ol';
        return (
          <ListTag key={key} className={`${block.kind === 'bullets' ? 'list-disc' : 'list-decimal'} pl-5 space-y-1 marker:text-white/50`}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}
