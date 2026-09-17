// Every email the site sends is built as an HTML string, and most of them echo back
// something a person typed into a public form. Anything interpolated is escaped rather
// than trusted: the form takes any address, so unescaped markup in a name would be mailed,
// from our domain, to whoever that address belongs to.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
