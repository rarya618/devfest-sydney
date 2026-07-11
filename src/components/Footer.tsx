import Link from 'next/link';

export default function Footer({ light = false }: { light?: boolean }) {
  return (
    <footer
      className={light ? 'bg-off-white py-12 px-6' : 'bg-[#070B14] py-12 px-6'}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Links */}
        <div className={`flex flex-wrap justify-center gap-6 text-sm mb-10 ${light ? 'text-black-02/55' : 'text-white/40'}`}>
          <Link href="/call-for-speakers" className={light ? 'hover:text-black-02 transition-colors' : 'hover:text-white transition-colors'}>
            Call for Speakers
          </Link>
          <Link href="/code-of-conduct" className={light ? 'hover:text-black-02 transition-colors' : 'hover:text-white transition-colors'}>
            Code of Conduct
          </Link>
          <a
            href="https://gdgsydney.com"
            target="_blank"
            rel="noopener noreferrer"
            className={light ? 'hover:text-black-02 transition-colors' : 'hover:text-white transition-colors'}
          >
            GDG Sydney
          </a>
        </div>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs ${
            light ? 'text-black-02/30' : 'text-white/20'
          }`}
        >
          <span>© 2026 GDG Sydney. All rights reserved.</span>
          <span className="hidden sm:inline">·</span>
          <span>Organised by GDG Sydney</span>
        </div>
      </div>
    </footer>
  );
}
