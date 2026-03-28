/**
 * Slider.jsx
 *
 * Labelled range slider that works with 0–1 float values.
 * Renders human-readable left/right labels and a live value display.
 *
 * @example
 * // Activity level — relaxed ↔ very active
 * <Slider
 *   id="activity-level"
 *   label="Activity Level"
 *   value={prefs.activity_level}
 *   onChange={(v) => setPrefs(p => ({ ...p, activity_level: v }))}
 *   leftLabel="Relaxed"
 *   rightLabel="Very Active"
 * />
 *
 * // Culture ↔ Nature balance
 * <Slider
 *   id="culture-nature"
 *   label="Focus"
 *   value={prefs.culture_nature}
 *   onChange={(v) => setPrefs(p => ({ ...p, culture_nature: v }))}
 *   leftLabel="🌿 Nature"
 *   rightLabel="🏛️ Culture"
 * />
 */

/**
 * @param {object}   props
 * @param {string}   props.id          - Links label to input (a11y)
 * @param {string}   props.label       - Visible section label
 * @param {number}   props.value       - Current value (0.0 – 1.0)
 * @param {Function} props.onChange    - Called with new float value on every change
 * @param {string}   [props.leftLabel] - Label for the left (min) end
 * @param {string}   [props.rightLabel]- Label for the right (max) end
 * @param {number}   [props.min=0]
 * @param {number}   [props.max=1]
 * @param {number}   [props.step=0.05]
 * @param {string}   [props.className]
 */
export default function Slider({
  id,
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
  min = 0,
  max = 1,
  step = 0.05,
  className = '',
}) {
  // Convert 0–1 to a friendly percentage for the live display
  const percentage = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-surface-700">
          {label}
        </label>
        <span
          className="text-xs font-semibold tabular-nums text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full"
          aria-live="polite"
          aria-atomic="true"
        >
          {percentage}%
        </span>
      </div>

      {/* Range input */}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="
          w-full h-2 rounded-full appearance-none cursor-pointer
          bg-surface-200 accent-brand-600
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-brand-400 focus-visible:ring-offset-2
        "
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${percentage}%`}
      />

      {/* Left / Right semantic labels */}
      {(leftLabel || rightLabel) && (
        <div className="flex items-center justify-between text-xs text-surface-400">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
