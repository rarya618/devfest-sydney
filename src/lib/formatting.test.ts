// Run with `npm test`. This file is identical in the gdg-sydney and devfest-sydney repos, as are
// the two files it checks, so both repos hold their copies to the same cases: change all three
// together, in both repos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdownText, type Inline } from './markdownText.ts';
import { formattingPrompt } from './formattingPrompt.ts';

const text = (value: string): Inline => ({ kind: 'text', text: value });
const line = (value: string): Inline[] => [text(value)];

const cases: { name: string; input: string; expected: ReturnType<typeof parseMarkdownText> }[] = [
  {
    name: 'paragraphs split on blank lines and keep single line breaks',
    input: 'First line\nsecond line\n\n\nNext paragraph',
    expected: [
      { kind: 'paragraph', lines: [line('First line'), line('second line')] },
      { kind: 'paragraph', lines: [line('Next paragraph')] },
    ],
  },
  {
    name: 'Windows line endings',
    input: 'One\r\nTwo\r\n\r\nThree',
    expected: [
      { kind: 'paragraph', lines: [line('One'), line('Two')] },
      { kind: 'paragraph', lines: [line('Three')] },
    ],
  },
  {
    name: 'headings stand alone, closing hashes drop, and a hashtag stays as typed',
    input: 'Intro\n## What you will learn ##\nBody\n#hashtag\n#### Four is too many',
    expected: [
      { kind: 'paragraph', lines: [line('Intro')] },
      { kind: 'heading', content: line('What you will learn') },
      { kind: 'paragraph', lines: [line('Body'), line('#hashtag'), line('#### Four is too many')] },
    ],
  },
  {
    name: 'a list may start straight under its intro line',
    input: 'You will learn:\n- one\n* two\n• three',
    expected: [
      { kind: 'paragraph', lines: [line('You will learn:')] },
      { kind: 'bullets', items: [line('one'), line('two'), line('three')] },
    ],
  },
  {
    name: 'numbered lists, and a switch of list kind starts a new list',
    input: '1. first\n2) second\n- a bullet',
    expected: [
      { kind: 'numbers', items: [line('first'), line('second')] },
      { kind: 'bullets', items: [line('a bullet')] },
    ],
  },
  {
    name: 'a line after a list starts a paragraph',
    input: '- item\nafterwards',
    expected: [
      { kind: 'bullets', items: [line('item')] },
      { kind: 'paragraph', lines: [line('afterwards')] },
    ],
  },
  {
    name: 'bold, both italics and code',
    input: '**bold** and *star* and _underscore_ and `**not bold**`',
    expected: [{
      kind: 'paragraph',
      lines: [[
        { kind: 'bold', children: line('bold') },
        text(' and '),
        { kind: 'italic', children: line('star') },
        text(' and '),
        { kind: 'italic', children: line('underscore') },
        text(' and '),
        { kind: 'code', text: '**not bold**' },
      ]],
    }],
  },
  {
    name: 'links to http(s) only, with formatting inside',
    input: '[**Slides**](https://example.com/a) [bad](javascript:alert(1))',
    expected: [{
      kind: 'paragraph',
      lines: [[
        { kind: 'link', href: 'https://example.com/a', children: [{ kind: 'bold', children: line('Slides') }] },
        text(' [bad](javascript:alert(1))'),
      ]],
    }],
  },
  {
    name: 'stray asterisks and underscores stay as typed',
    input: '2 * 3 * 4 and snake_case_name and * spaced *',
    expected: [{ kind: 'paragraph', lines: [line('2 * 3 * 4 and snake_case_name and * spaced *')] }],
  },
  {
    name: 'formatting inside a heading and a list item',
    input: '## A **bold** heading\n- see [docs](http://example.com)',
    expected: [
      { kind: 'heading', content: [text('A '), { kind: 'bold', children: line('bold') }, text(' heading')] },
      { kind: 'bullets', items: [[text('see '), { kind: 'link', href: 'http://example.com', children: line('docs') }]] },
    ],
  },
];

for (const { name, input, expected } of cases) {
  test(`parseMarkdownText: ${name}`, () => {
    assert.deepEqual(parseMarkdownText(input), expected);
  });
}

test('formattingPrompt names the box and includes its trimmed text', () => {
  assert.equal(
    formattingPrompt('talk abstract', '  My talk\n'),
    'Reformat my talk abstract for a talk proposal form. The form supports only this formatting:\n' +
      '- A line starting with "## " is a heading\n' +
      '- A line starting with "- " is a bullet point\n' +
      '- **Two asterisks** around words make them bold\n' +
      '- [text](https://example.com) is a link\n\n' +
      'Keep my wording and meaning, and fix only the formatting. Use bullets where I list things, ' +
      'and headings only to split a longer text into parts. ' +
      'Do not add tables, emoji or any other Markdown. ' +
      'Reply with only the reformatted text, ready to paste back into the form.\n\n' +
      'My talk abstract:\nMy talk',
  );
});

test('formattingPrompt leaves a placeholder for an empty box', () => {
  assert.ok(formattingPrompt('bio', ' \n').endsWith('My bio:\n[paste it here]'));
});
