import { Link } from 'react-router-dom';

/* ── Feature data ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '📋',
    title: 'Everyone Votes',
    description:
      'Share a form link with your group. Each person fills in their travel style, budget, and vibe — privately.',
  },
  {
    icon: '🤖',
    title: 'AI Picks the Best Fit',
    description:
      'Our scoring engine weighs everyone\'s preferences fairly and surfaces destinations the whole group will love.',
  },
  {
    icon: '🗺️',
    title: 'Instant Itinerary',
    description:
      'Once you pick a destination, Gemini AI generates a detailed day-by-day plan with real weather data.',
  },
];

const STEPS = [
  { number: '01', label: 'Create a trip & invite your group' },
  { number: '02', label: 'Everyone submits their preferences' },
  { number: '03', label: 'AI ranks destinations for the group' },
  { number: '04', label: 'Pick a place & get a full itinerary' },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="flex flex-col">

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600">
        {/* Decorative background blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-brand-400/10 blur-3xl" />
        </div>

        <div className="container-app relative z-10 py-28 sm:py-36 text-center">
          {/* Eyebrow badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm mb-8">
            <span aria-hidden="true">✈️</span>
            Group travel, finally sorted
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Plan group trips
            <br />
            <span className="text-brand-300">without the arguments.</span>
          </h1>

          {/* Sub-headline */}
          <p
            className="animate-slide-up mx-auto max-w-xl text-lg sm:text-xl text-white/70 mb-10"
            style={{ animationDelay: '80ms' }}
          >
            PackVote collects everyone's preferences, scores destinations with AI,
            and generates a personalised itinerary — in minutes.
          </p>

          {/* CTAs */}
          <div
            className="animate-slide-up flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animationDelay: '160ms' }}
          >
            <Link
              to="/create"
              id="hero-cta"
              className="
                group inline-flex items-center gap-2 rounded-2xl
                bg-white px-8 py-4 text-base font-bold text-brand-700
                shadow-xl shadow-brand-900/30
                hover:bg-brand-50 hover:shadow-2xl hover:-translate-y-0.5
                active:scale-95 transition-all duration-200
              "
            >
              Create Trip
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>

            <a
              href="#how-it-works"
              className="
                inline-flex items-center gap-2 rounded-2xl px-8 py-4
                text-base font-semibold text-white/80 border border-white/20
                hover:bg-white/10 hover:text-white transition-all duration-200
              "
            >
              How it works
            </a>
          </div>

          {/* Social proof strip */}
          <p
            className="animate-fade-in mt-10 text-sm text-white/40"
            style={{ animationDelay: '300ms' }}
          >
            Free to use &nbsp;·&nbsp; No login required &nbsp;·&nbsp; Works for any group size
          </p>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section className="bg-white py-24 sm:py-32" aria-labelledby="features-heading">
        <div className="container-app">
          <div className="text-center mb-16">
            <h2
              id="features-heading"
              className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4"
            >
              One tool. Zero group chat chaos.
            </h2>
            <p className="max-w-xl mx-auto text-surface-500 text-lg">
              PackVote replaces the endless "where should we go?" thread with a
              fair, data-driven decision everyone can stand behind.
            </p>
          </div>

          <ul
            className="grid gap-8 sm:grid-cols-3"
            role="list"
          >
            {FEATURES.map(({ icon, title, description }) => (
              <li
                key={title}
                className="
                  flex flex-col gap-4 rounded-2xl border border-surface-200
                  bg-surface-50 p-8 hover:border-brand-200 hover:bg-brand-50/30
                  hover:-translate-y-1 hover:shadow-md transition-all duration-200
                "
              >
                <span className="text-4xl leading-none" aria-hidden="true">
                  {icon}
                </span>
                <h3 className="text-lg font-bold text-surface-900">{title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="bg-surface-50 py-24 sm:py-32 border-t border-surface-200"
        aria-labelledby="how-heading"
      >
        <div className="container-app">
          <div className="text-center mb-16">
            <h2
              id="how-heading"
              className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4"
            >
              How it works
            </h2>
            <p className="text-surface-500 text-lg">Four steps. That's it.</p>
          </div>

          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {STEPS.map(({ number, label }) => (
              <li
                key={number}
                className="flex flex-col gap-3 rounded-2xl bg-white border border-surface-200 p-6 shadow-sm"
              >
                <span className="text-4xl font-black text-brand-100 leading-none">
                  {number}
                </span>
                <p className="text-sm font-semibold text-surface-700 leading-snug">
                  {label}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ BOTTOM CTA ════════════════════════════════════════ */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-800 py-20">
        <div className="container-app text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to plan your next trip?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
            Create a trip in 60 seconds and let PackVote do the rest.
          </p>
          <Link
            to="/create"
            id="bottom-cta"
            className="
              group inline-flex items-center gap-2 rounded-2xl
              bg-white px-8 py-4 text-base font-bold text-brand-700
              shadow-lg hover:bg-brand-50 hover:-translate-y-0.5
              hover:shadow-xl active:scale-95 transition-all duration-200
            "
          >
            Create Trip
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </section>

    </div>
  );
}
