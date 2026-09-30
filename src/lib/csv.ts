// Browser-only CSV export for the admin dashboards. Everything in these files came in
// through a public form, so a cell is treated as untrusted on its way into a spreadsheet.

export function formatCsvBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

// A cell starting with =, +, - or @ is read as a formula by Excel and Sheets. That is how
// a crafted name runs in an organiser's spreadsheet, and also how an honest "+61 4..."
// phone number turns into #NAME?. A leading apostrophe makes either one plain text.
function escapeCsvCell(value: string): string {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safeValue) ? `"${safeValue.replace(/"/g, '""')}"` : safeValue;
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Dated so a second export the same week doesn't overwrite the first in Downloads.
export function csvFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
