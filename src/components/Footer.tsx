import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#070B14] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-google-blue" />
                <span className="w-2 h-2 rounded-full bg-google-red" />
                <span className="w-2 h-2 rounded-full bg-google-yellow" />
                <span className="w-2 h-2 rounded-full bg-google-green" />
              </div>
              <span className="font-bold text-white text-sm">DevFest Sydney 2026</span>
            </div>
            <p className="text-sm text-white/30">
              Organised by GDG Sydney · 10 October 2026
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 text-sm text-white/40">
            <Link href="/call-for-speakers" className="hover:text-white transition-colors">
              Call for Speakers
            </Link>
            <Link href="/code-of-conduct" className="hover:text-white transition-colors">
              Code of Conduct
            </Link>
            <a
              href="https://gdg.community.dev/gdg-sydney/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GDG Sydney
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <span>© 2026 GDG Sydney. All rights reserved.</span>
          <span>Presented by Google Developer Groups</span>
        </div>
      </div>
    </footer>
  );
}
