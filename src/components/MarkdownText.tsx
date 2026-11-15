import { Fragment, type ReactNode } from 'react';
import { parseMarkdownText, type Inline } from '@/lib/markdownText';

// Renders the formatting speakers can use (decided 2026-11-14; the rules are in
// src/lib/markdownText.ts) as React elements, never as HTML, so nothing a speaker types can
// inject markup or script. Stored text stays plain, and the public API returns it as is.

// Every box whose text this renders offers FormattingHelp, the tooltip explaining these rules.

function renderInline(nodes: Inline[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.kind === 'text') return <Fragment key={key}>{node.text}</Fragment>;
    if (node.kind === 'code') {
      return <code key={key} className="font-mono text-[0.92em] rounded bg-white/[0.08] px-1 py-0.5">{node.text}</code>;
    }
    if (node.kind === 'link') {
      return (
        <a key={key} href={node.href} target="_blank" rel="noopener noreferrer" className="text-google-blue-light underline underline-offset-2 hover:no-underline">
          {renderInline(node.children, key)}
        </a>
      );
    }
    if (node.kind === 'bold') return <strong key={key} className="font-bold text-white/90">{renderInline(node.children, key)}</strong>;
    // Google Sans has no italic face (BRANDING.md), so emphasis is set in the medium weight.
    return <em key={key} className="not-italic font-medium text-white/90">{renderInline(node.children, key)}</em>;
  });
}

export default function MarkdownText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`space-y-3 break-words ${className}`}>
      {parseMarkdownText(text).map((block, blockIndex) => {
        const key = `block-${blockIndex}`;
        if (block.kind === 'heading') {
          // h4 whatever the speaker typed: the text sits under the page's own headings.
          return (
            <h4 key={key} className="font-bold text-white/90 text-[1.05em] leading-snug">
              {renderInline(block.content, key)}
            </h4>
          );
        }
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
