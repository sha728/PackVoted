import WeatherBadge from './WeatherBadge';

/**
 * DayCard.jsx
 *
 * A single day in the itinerary timeline.
 * The timeline connector (vertical line + dot) is rendered
 * by the parent — this card handles only its own content.
 *
 * @param {object} props
 * @param {object} props.day          - Day plan object from the API
 * @param {number} props.day.day      - Day number (1-based)
 * @param {string} props.day.theme    - The day's headline theme
 * @param {string} props.day.morning
 * @param {string} props.day.afternoon
 * @param {string} props.day.evening
 * @param {string[]} props.day.meals
 * @param {string} props.day.weather_note
 * @param {object} [props.weatherData]  - The full weather_data map
 * @param {string[]} [props.dateDates]  - Ordered ISO date strings (one per day)
 */

const TIME_SLOTS = [
  { key: 'morning',   label: 'Morning',   emoji: '🌅' },
  { key: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { key: 'evening',   label: 'Evening',   emoji: '🌆' },
];

export default function DayCard({ day, weatherData, dateDates = [] }) {
  const {
    day: dayNum,
    theme,
    morning,
    afternoon,
    evening,
    meals = [],
    weather_note,
  } = day;

  // Match this day to a weather entry (day is 1-based, dateDates is 0-indexed)
  const dateKey    = dateDates[dayNum - 1] ?? null;
  const weatherDay = dateKey ? weatherData?.[dateKey] : null;

  return (
    <article
      className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden"
      aria-label={`Day ${dayNum}: ${theme}`}
    >
      {/* ── Card header ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-surface-100">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-0.5">
            Day {dayNum}
          </p>
          <h2 className="text-lg font-bold text-surface-900 leading-snug">
            {theme}
          </h2>
        </div>
        {weatherDay && (
          <div className="flex-shrink-0 pt-0.5">
            <WeatherBadge date={dateKey} data={weatherDay} />
          </div>
        )}
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        {/* ── Time slots ─────────────────────────────────── */}
        <dl className="flex flex-col gap-3">
          {TIME_SLOTS.map(({ key, label, emoji }) => {
            const content = day[key];
            if (!content) return null;
            return (
              <div key={key} className="flex gap-3">
                <dt className="flex-shrink-0 flex items-center gap-1.5 w-28 text-xs font-semibold text-surface-500 pt-0.5">
                  <span aria-hidden="true">{emoji}</span>
                  {label}
                </dt>
                <dd className="text-sm text-surface-700 leading-relaxed">
                  {content}
                </dd>
              </div>
            );
          })}
        </dl>

        {/* ── Meals ──────────────────────────────────────── */}
        {meals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-surface-500 mb-2 flex items-center gap-1">
              <span aria-hidden="true">🍽️</span> Meals
            </p>
            <ul className="flex flex-col gap-1" role="list">
              {meals.map((meal, i) => (
                <li key={i} className="text-xs text-surface-600 leading-relaxed pl-2 border-l-2 border-surface-100">
                  {meal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Weather note ──────────────────────────────── */}
        {weather_note && (
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-800">
            <span aria-hidden="true" className="flex-shrink-0 text-sm">🌤️</span>
            <span>{weather_note}</span>
          </div>
        )}
      </div>
    </article>
  );
}
