import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Sticky glassmorphic top navigation bar.
 *
 * Active link detection uses exact match for '/' and
 * startsWith for all other routes.
 */

const NAV_LINKS = [
  { to: '/', label: 'Home' },
];

function isLinkActive(linkTo, pathname) {
  if (linkTo === '/') return pathname === '/';
  return pathname.startsWith(linkTo);
}

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/80 backdrop-blur-md">
      <nav
        className="container-app flex items-center justify-between h-16"
        aria-label="Main navigation"
      >
        {/* ── Logo ────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2 group" aria-label="PackVote home">
          <span className="text-2xl leading-none" role="img" aria-hidden="true">
            🎒
          </span>
          <span className="text-xl font-bold tracking-tight text-surface-900 group-hover:text-brand-600 transition-colors">
            PackVote
          </span>
        </Link>

        {/* ── Nav links + CTA ─────────────────── */}
        <ul className="flex items-center gap-1" role="list">
          {NAV_LINKS.map(({ to, label }) => {
            const active = isLinkActive(to, pathname);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                    }
                  `}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          
          {user ? (
            <>
              <li>
                <Link to="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-surface-600 hover:text-surface-900 hover:bg-surface-100">
                  Dashboard
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-surface-600 hover:text-surface-900 hover:bg-surface-100">
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-surface-600 hover:text-surface-900 hover:bg-surface-100">
                Log In
              </Link>
            </li>
          )}

          {/* Primary CTA — always visible */}
          <li>
            <Link
              to="/create"
              className={`
                ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                transition-all duration-200 active:scale-95
                ${
                  pathname.startsWith('/create')
                    ? 'bg-brand-700 text-white shadow-md'
                    : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md'
                }
              `}
              aria-current={pathname.startsWith('/create') ? 'page' : undefined}
            >
              <span aria-hidden="true">+</span>
              Plan a Trip
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
