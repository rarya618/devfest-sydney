// Parses the small piece of Markdown that speakers can use in talk abstracts, bios and the other
// proposal text boxes:
//   paragraphs (a blank line between), with single line breaks kept
//   headings ("# ", "## " or "### " at the start of a line), all set as one small heading;
//   the space matters, so "#hashtag" stays as typed
//   bullet lists ("- ", "* " or "• " at the start of a line) and numbered lists ("1. " or "1) ")
//   **bold**, *italic* or _italic_, `code`, and [links](https://...) to http(s) addresses only
// A list may start straight under its intro line, without a blank line, as people type them.
// Anything else shows as typed. The result is plain data for a renderer to turn into elements,
// never HTML, so nothing a speaker types can inject markup.
//
// This file is identical in the gdg-sydney repo (rendered by src/components/MarkdownText.astro)
// and the devfest-sydney repo (rendered by src/components/MarkdownText.tsx): change both together.
// src/lib/formatting.test.ts, also identical in both, checks them against the same cases.

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'link'; href: string; children: Inline[] }
  | { kind: 'bold' | 'italic'; children: Inline[] };

export type Block =
  | { kind: 'heading'; content: Inline[] }
  | { kind: 'paragraph'; lines: Inline[][] }
  | { kind: 'bullets' | 'numbers'; items: Inline[][] };

type RawBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'bullets' | 'numbers'; items: string[] };

const HEADING_LINE = /^\s{0,3}#{1,3}\s+(.+?)(?:\s+#+)?\s*$/;
const BULLET_LINE = /^\s*[-*•]\s+(.*)$/;
const NUMBER_LINE = /^\s*\d{1,3}[.)]\s+(.*)$/;

function toRawBlocks(text: string): RawBlock[] {
  const blocks: RawBlock[] = [];
  let current = null as RawBlock | null;
  const finish = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      finish();
      continue;
    }
    // A heading stands alone: it ends whatever came before, and the next line starts afresh.
    const heading = HEADING_LINE.exec(line);
    if (heading) {
      finish();
      blocks.push({ kind: 'heading', text: heading[1] });
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

function parseInline(text: string): Inline[] {
  const nodes: Inline[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push({ kind: 'text', text: text.slice(lastIndex, index) });
    const [, code, linkText, linkUrl, bold, starItalic, underscoreItalic] = match;
    if (code !== undefined) nodes.push({ kind: 'code', text: code });
    else if (linkText !== undefined) nodes.push({ kind: 'link', href: linkUrl, children: parseInline(linkText) });
    else if (bold !== undefined) nodes.push({ kind: 'bold', children: parseInline(bold) });
    else nodes.push({ kind: 'italic', children: parseInline(starItalic ?? underscoreItalic) });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push({ kind: 'text', text: text.slice(lastIndex) });
  return nodes;
}

export function parseMarkdownText(text: string): Block[] {
  return toRawBlocks(text).map((block): Block => {
    if (block.kind === 'heading') return { kind: 'heading', content: parseInline(block.text) };
    if (block.kind === 'paragraph') return { kind: 'paragraph', lines: block.lines.map(parseInline) };
    return { kind: block.kind, items: block.items.map(parseInline) };
  });
}
