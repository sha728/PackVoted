/**
 * ScoreBreakdown.jsx
 *
 * Animated progress bars for the four scoring dimensions
 * returned by the backend: budget, weather, activities, vibe.
 */

const DIMENSIONS = [
  { key: 'budget',   label: 'Budget Fit',    emoji: '💰' },
  { key: 'climate',  label: 'Climate Match',  emoji: '🌤️' },
  { key: 'activity', label: 'Activities',    emoji: '🏄' },
  { key: 'vibe',     label: 'Vibe Match',    emoji: '✨' },
];

/**
 * @param {object} props
 * @param {object} props.breakdown  - { budget, weather, activities, vibe } (0–1 values)
 */
export default function ScoreBreakdown({ breakdown = {} }) {
  return (
    <dl className="flex flex-col gap-2.5">
      {DIMENSIONS.map(({ key, label, emoji }) => {
        const raw   = breakdown[key] ?? 0;
        const pct   = Math.round(Math.min(1, Math.max(0, raw)) * 100);
        const color =
          pct >= 75 ? 'bg-emerald-500' :
          pct >= 50 ? 'bg-brand-500'   :
          pct >= 25 ? 'bg-amber-400'   :
                      'bg-red-400';

        return (
          <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <dt className="text-xs text-surface-500 flex items-center gap-1">
              <span aria-hidden="true">{emoji}</span>
              {label}
            </dt>
            <dd className="text-xs font-semibold tabular-nums text-surface-700 text-right">
              {pct}%
            </dd>

            {/* Progress bar — spans full width */}
            <div
              className="col-span-2 h-1.5 rounded-full bg-surface-100 overflow-hidden"
              role="meter"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label}: ${pct}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
