import { Link } from 'react-router-dom';

/**
 * Minimal site footer.
 * - Dynamic copyright year
 * - Quick navigation links
 * - Responsive flex layout: stacks on mobile, row on sm+
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-200 bg-white">
      <div className="container-app py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* ── Brand blurb ─────────────────── */}
          <div className="flex items-center gap-2 text-surface-500">
            <span aria-hidden="true">🎒</span>
            <p className="text-sm">
              <span className="font-semibold text-surface-700">PackVote</span>
              {' '}— Plan together, travel better.
            </p>
          </div>

          {/* ── Links ───────────────────────── */}
          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-5 text-sm text-surface-500" role="list">
              <li>
                <Link to="/" className="hover:text-surface-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/create" className="hover:text-surface-900 transition-colors">
                  Plan a Trip
                </Link>
              </li>
              <li>
                <a
                  href="mailto:packvoted@gmail.com"
                  className="hover:text-surface-900 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          {/* ── Copyright ───────────────────── */}
          <p className="text-xs text-surface-400 sm:text-right">
            &copy; {year} PackVote. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
}
