// The centred date and venue line above a subpage's H1. Stacked and centred on a phone, with
// the separator dot only once the two sit side by side.
export default function EventDateVenue() {
  return (
    <p className="mb-6 flex flex-col items-center sm:flex-row sm:justify-center gap-1.5 sm:gap-2.5 text-base font-bold text-white/80 animate-fade-in">
      <span className="flex items-center gap-2.5">
        <span>Saturday, 10 October 2026</span>
        <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" aria-hidden="true" />
      </span>
      <span>Torrens University, Surry Hills</span>
    </p>
  );
}
