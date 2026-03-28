/**
 * ClimateSelector.jsx
 *
 * Radio-button group for climate preference.
 * Values match the FastAPI `climate_preference` field exactly.
 */

const CLIMATE_OPTIONS = [
  { value: 'hot',   label: 'Hot',   emoji: '☀️',  description: '30°C+' },
  { value: 'warm',  label: 'Warm',  emoji: '🌤️',  description: '22–30°C' },
  { value: 'mild',  label: 'Mild',  emoji: '⛅',  description: '15–22°C' },
  { value: 'cold',  label: 'Cold',  emoji: '🌨️',  description: '5–15°C' },
  { value: 'snow',  label: 'Snow',  emoji: '❄️',  description: 'Below 5°C' },
];

/**
 * @param {object}   props
 * @param {string}   props.value      - Currently selected climate value
 * @param {Function} props.onChange   - Called with the new value string
 * @param {string}   [props.error]
 */
export default function ClimateSelector({ value, onChange, error }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-surface-700 mb-3">
        Preferred Climate
        <span className="ml-1 text-red-500" aria-hidden="true">*</span>
      </legend>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup">
        {CLIMATE_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`
                flex flex-col items-center gap-1 rounded-xl border-2 p-3 cursor-pointer
                transition-all duration-150 select-none
                ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50'
                }
              `}
            >
              <input
                type="radio"
                name="climate"
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className="text-2xl leading-none" aria-hidden="true">
                {opt.emoji}
              </span>
              <span className="text-xs font-semibold">{opt.label}</span>
              <span className="text-[10px] text-surface-400">{opt.description}</span>
            </label>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </fieldset>
  );
}
