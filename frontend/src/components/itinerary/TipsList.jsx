/**
 * TipsList.jsx
 *
 * Reusable styled list for packing tips, food suggestions,
 * and travel tips. Accepts an icon to distinguish sections.
 *
 * @example
 * <TipsList title="Packing Tips" icon="🎒" items={itinerary.packing_tips} />
 * <TipsList title="Local Food to Try" icon="🍜" items={itinerary.local_food_to_try} variant="food" />
 */

const VARIANT_STYLES = {
  default: {
    li:   'border-surface-100 bg-surface-50 text-surface-700',
    dot:  'bg-surface-400',
  },
  food: {
    li:   'border-amber-100 bg-amber-50 text-amber-900',
    dot:  'bg-amber-400',
  },
  tip: {
    li:   'border-brand-100 bg-brand-50 text-brand-900',
    dot:  'bg-brand-400',
  },
};

/**
 * @param {object}   props
 * @param {string}   props.title
 * @param {string}   props.icon
 * @param {string[]} props.items
 * @param {'default'|'food'|'tip'} [props.variant='default']
 */
export default function TipsList({ title, icon, items = [], variant = 'default' }) {
  if (!items.length) return null;

  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;

  return (
    <section aria-labelledby={`tips-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <h3
        id={`tips-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="flex items-center gap-2 text-base font-bold text-surface-900 mb-4"
      >
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>

      <ul className="flex flex-col gap-2" role="list">
        {items.map((item, i) => (
          <li
            key={i}
            className={`
              flex items-start gap-3 rounded-xl border px-4 py-3 text-sm
              leading-relaxed ${styles.li}
            `}
          >
            <span
              className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${styles.dot}`}
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
