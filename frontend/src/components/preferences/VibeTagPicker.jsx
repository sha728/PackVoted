/**
 * VibeTagPicker.jsx
 *
 * A multi-select tag grid. Clicking a tag toggles it on/off.
 * Used for both `required_vibes` and `avoided_vibes`.
 */

const ALL_VIBES = [
  { value: 'adventure',   label: 'Adventure',     emoji: '🧗' },
  { value: 'beach',       label: 'Beach',         emoji: '🏖️' },
  { value: 'culture',     label: 'Culture',       emoji: '🏛️' },
  { value: 'nature',      label: 'Nature',        emoji: '🌿' },
  { value: 'party',       label: 'Party',         emoji: '🎉' },
  { value: 'wellness',    label: 'Wellness',      emoji: '🧘' },
  { value: 'romantic',    label: 'Romantic',      emoji: '💑' },
  { value: 'family',      label: 'Family',        emoji: '👨‍👩‍👧' },
  { value: 'spiritual',   label: 'Spiritual',     emoji: '🕌' },
  { value: 'food',        label: 'Food Scene',    emoji: '🍜' },
  { value: 'nightlife',   label: 'Nightlife',     emoji: '🌃' },
  { value: 'offbeat',     label: 'Offbeat',       emoji: '🗺️' },
  { value: 'hill station',label: 'Hill Station',  emoji: '⛰️' },
  { value: 'heritage',    label: 'Heritage',      emoji: '🏯' },
  { value: 'budget',      label: 'Budget-Friendly', emoji: '💸' },
];

/**
 * @param {object}    props
 * @param {string[]}  props.selected   - Array of currently selected vibe values
 * @param {Function}  props.onChange   - Called with updated string[] on every toggle
 * @param {string}    [props.maxSelect] - Optional cap on selections
 */
export default function VibeTagPicker({ selected, onChange, maxSelect }) {
  function toggle(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      if (maxSelect && selected.length >= maxSelect) return;
      onChange([...selected, value]);
    }
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Vibe options"
    >
      {ALL_VIBES.map(({ value, label, emoji }) => {
        const isSelected = selected.includes(value);
        const isDisabled = !isSelected && maxSelect && selected.length >= maxSelect;

        return (
          <button
            key={value}
            type="button"
            onClick={() => toggle(value)}
            disabled={!!isDisabled}
            aria-pressed={isSelected}
            className={`
              inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5
              text-xs font-medium transition-all duration-150 select-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
              ${
                isSelected
                  ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                  : isDisabled
                  ? 'border-surface-200 bg-surface-50 text-surface-300 cursor-not-allowed'
                  : 'border-surface-200 bg-white text-surface-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
              }
            `}
          >
            <span aria-hidden="true">{emoji}</span>
            {label}
            {isSelected && (
              <span aria-hidden="true" className="ml-0.5 opacity-80">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
