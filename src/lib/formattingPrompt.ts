// The prompt behind "Copy a prompt to format this with your AI tool" under each formatted text
// box: it asks the speaker's own AI tool to put the box's text (or a placeholder, if it's empty)
// into the formatting markdownText.ts understands.
//
// This file is identical in the gdg-sydney repo (the speak page) and the devfest-sydney repo
// (src/components/FormattingHelp.tsx): change both together. src/lib/formatting.test.ts checks it.
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
