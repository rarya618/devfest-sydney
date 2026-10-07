// Shared by the two job board forms. Same input treatment as the other public forms, with
// the blue focus the BRANDING.md interactive-states note asks for.
const inputBase =
  'w-full bg-white/[0.05] border rounded-lg px-5 py-2.5 text-white text-base placeholder-white/60 outline-none transition-colors focus:bg-white/[0.08] focus:border-google-blue focus:ring-2 focus:ring-google-blue/40';

export const inputNormal = `${inputBase} border-white/35`;
export const inputError = `${inputBase} border-google-red-light bg-google-red/5`;
export const labelClass = 'block text-sm font-bold text-white/85 mb-1.5';
export const errorClass = 'mt-1.5 text-xs text-google-red-light';
export const hintClass = 'mt-1.5 text-xs text-white/50';
export const submitClass =
  'inline-flex items-center justify-center gap-2.5 px-7 py-2 bg-google-blue-deep text-white text-base font-bold rounded border border-google-blue-deep transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed';

export function optionButtonClass(selected: boolean, hasError: boolean): string {
  if (hasError && !selected) return 'border-google-red-light bg-google-red/5 text-white/70';
  if (selected) return 'border-google-blue bg-google-blue/15 text-white';
  return 'border-white/35 bg-white/[0.04] text-white/70 hover:border-white/60';
}
