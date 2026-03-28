/**
 * WeatherBadge.jsx
 *
 * Compact weather chip for a single day.
 * Accepts a weather entry from the API's `weather_data` map.
 *
 * @example
 * <WeatherBadge date="2026-03-15" data={weatherData["2026-03-15"]} />
 */

/* Maps backend condition strings → emoji */
const CONDITION_EMOJI = {
  'Clear sky':     '☀️',
  'Partly cloudy': '⛅',
  'Foggy':         '🌫️',
  'Drizzle':       '🌦️',
  'Rain':          '🌧️',
  'Snow':          '❄️',
  'Thunderstorm':  '⛈️',
  'Cloudy':        '☁️',
};

/**
 * @param {object} props
 * @param {string} props.date  - ISO date string e.g. "2026-03-15"
 * @param {object} props.data  - { max_temp, min_temp, condition, precipitation, rain_chance }
 */
export default function WeatherBadge({ date, data }) {
  if (!data) return null;

  const { max_temp, min_temp, condition, rain_chance } = data;
  const emoji = CONDITION_EMOJI[condition] ?? '🌡️';

  // Short weekday label
  const weekday = date
    ? new Date(date).toLocaleDateString('en-IN', { weekday: 'short' })
    : '';

  return (
    <div
      className="
        inline-flex items-center gap-2 rounded-full border border-surface-200
        bg-white px-3 py-1.5 text-xs shadow-sm
      "
      aria-label={`Weather: ${condition}, ${max_temp}°C high, ${min_temp}°C low`}
    >
      <span aria-hidden="true" className="text-base leading-none">{emoji}</span>
      <span className="font-medium text-surface-700">{condition}</span>
      <span className="text-surface-400">
        {weekday && <>{weekday} · </>}
        {max_temp != null ? `${Math.round(max_temp)}°` : '—'}
        <span className="text-surface-300">/</span>
        {min_temp != null ? `${Math.round(min_temp)}°C` : '—'}
      </span>
      {rain_chance === 'High' && (
        <span className="text-blue-500 font-semibold" title="High rain chance">
          💧
        </span>
      )}
    </div>
  );
}
