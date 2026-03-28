import ScoreBreakdown from './ScoreBreakdown';
import Button from '../common/Button';

/**
 * DestinationCard.jsx
 *
 * Renders one AI-ranked destination recommendation.
 *
 * @param {object}   props
 * @param {object}   props.rec           - Full recommendation object from the API
 * @param {number}   props.rank          - 1-based rank position
 * @param {boolean}  props.selecting     - True when this card's select button is in-flight
 * @param {Function} props.onSelect      - Called when "Select Destination" is clicked
 */
export default function DestinationCard({ rec, rank, selecting, onSelect }) {
  const { destination, score, explanation, conflict_warning, breakdown, category } = rec;

  // explanation is an object { summary, warning, metrics, ... } — extract the text
  const explanationText =
    typeof explanation === 'string' ? explanation : explanation?.summary ?? '';
  const warningText =
    conflict_warning || (typeof explanation === 'object' ? explanation?.warning : '') || '';

  const pct      = Math.round((score ?? 0) * 100);
  const isTop    = rank === 1;

  /* ── Cost display ──────────────────────────────────────── */
  const dailyCost = destination?.daily_cost;
  const costStr =
    dailyCost != null
      ? `₹${Number(dailyCost).toLocaleString()} / day`
      : null;

  /* ── Activities ────────────────────────────────────────── */
  const activities = destination?.activities?.slice(0, 4) ?? [];

  return (
    <article
      className={`
        relative rounded-2xl border bg-white shadow-sm overflow-hidden
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${isTop ? 'border-brand-300 ring-1 ring-brand-200' : 'border-surface-200'}
      `}
      aria-label={`${destination?.name} — rank ${rank}`}
    >
      {/* ── Top badge ──────────────────────────────────── */}
      {isTop && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-brand-300" />
      )}

      <div className="p-6">
        {/* ── Header row ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            {/* Rank + top pick badge */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-surface-400 tabular-nums">
                #{rank}
              </span>
              {isTop && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                  ⭐ Top Pick
                </span>
              )}
              {category && (
                <span className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-500 capitalize">
                  {category}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-surface-900 truncate">
              {destination?.name}
            </h2>
            <p className="text-sm text-surface-500">
              {destination?.state ?? 'India'}
            </p>
          </div>

          {/* ── Circular score ─────────────────────────── */}
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center
              w-16 h-16 rounded-2xl bg-surface-50 border border-surface-200"
            aria-label={`Match score: ${pct}%`}
          >
            <span
              className={`text-2xl font-black tabular-nums leading-none
                ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-brand-600' : 'text-amber-500'}`}
            >
              {pct}
            </span>
            <span className="text-[10px] text-surface-400 font-medium">/ 100</span>
          </div>
        </div>

        {/* ── Score breakdown ─────────────────────────────── */}
        <div className="mb-4">
          <ScoreBreakdown breakdown={breakdown} />
        </div>

        {/* ── Explanation ─────────────────────────────────── */}
        {explanationText && (
          <p className="text-sm text-surface-600 leading-relaxed mb-4 border-l-2 border-brand-200 pl-3">
            {explanationText}
          </p>
        )}

        {/* ── Metadata row ────────────────────────────────── */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-xs text-surface-500">
          {costStr && (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">💰</span> {costStr}
            </span>
          )}
          {destination?.best_time && (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">📅</span> Best: {destination.best_time}
            </span>
          )}
        </div>

        {/* ── Activities ──────────────────────────────────── */}
        {activities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {activities.map((act) => (
              <span
                key={act}
                className="rounded-full bg-surface-100 px-2.5 py-1 text-xs text-surface-600 font-medium"
              >
                {act}
              </span>
            ))}
          </div>
        )}

        {/* ── Conflict warning ────────────────────────────── */}
        {warningText && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <span aria-hidden="true" className="flex-shrink-0">⚠️</span>
            <span>{warningText}</span>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────── */}
        <Button
          onClick={onSelect}
          loading={selecting}
          className="w-full mt-1"
          id={`select-${destination?.name?.toLowerCase().replace(/\s+/g, '-')}`}
        >
          Select {destination?.name} →
        </Button>
      </div>
    </article>
  );
}
