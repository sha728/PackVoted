/**
 * Input.jsx
 *
 * A labelled, accessible text-style input.
 * Renders an optional helper text and an error message slot.
 *
 * @example
 * <Input
 *   id="creator-email"
 *   label="Your Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   error={errors.email}
 *   required
 * />
 */

/**
 * @param {object}  props
 * @param {string}  props.id          - Links <label> to <input> (required for a11y)
 * @param {string}  props.label       - Visible label text
 * @param {string}  [props.helper]    - Optional hint below the input
 * @param {string}  [props.error]     - Error message; turns border red and adds aria-invalid
 * @param {string}  [props.className] - Extra classes on the wrapper div
 */
export default function Input({
  id,
  label,
  helper,
  error,
  className = '',
  ...rest
}) {
  const inputId = id;
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label */}
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-surface-700"
      >
        {label}
        {rest.required && (
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        )}
      </label>

      {/* Input */}
      <input
        id={inputId}
        className={`
          w-full rounded-xl border px-4 py-2.5 text-sm text-surface-900
          placeholder:text-surface-400 bg-white
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-0
          ${
            error
              ? 'border-red-400 focus:ring-red-300'
              : 'border-surface-300 focus:border-brand-500 focus:ring-brand-200'
          }
          disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed
        `}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[helperId, errorId].filter(Boolean).join(' ') || undefined}
        {...rest}
      />

      {/* Helper text */}
      {helper && !error && (
        <p id={helperId} className="text-xs text-surface-400">
          {helper}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
