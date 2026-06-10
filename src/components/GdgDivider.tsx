export default function GdgDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden="true">
      <span className="w-3 h-3 rounded-full bg-google-blue" />
      <span className="w-3 h-3 rounded-full bg-google-red" />
      <span className="w-3 h-3 rounded-full bg-google-yellow" />
      <span className="w-3 h-3 rounded-full bg-google-green" />
    </div>
  );
}
