/**
 * Loader.jsx
 *
 * Two export shapes:
 *
 * 1. <Loader />           — Full-section centred spinner (default)
 * 2. <Loader inline />    — Small inline spinner for buttons / tight spaces
 *
 * @example
 * {loading && <Loader message="Generating your itinerary…" />}
 */

/**
 * @param {object}  props
 * @param {boolean} [props.inline]   - Render as a small inline SVG instead of full block
 * @param {string}  [props.message]  - Optional loading message shown below the spinner
 * @param {string}  [props.className]
 */
export default function Loader({ inline = false, message, className = '' }) {
  const spinner = (
    <svg
      className={`animate-spin text-brand-500 ${inline ? 'h-5 w-5' : 'h-10 w-10'}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );

  if (inline) {
    return <span className={className} role="status" aria-label="Loading">{spinner}</span>;
  }

  return (
    <div
      role="status"
      aria-label={message ?? 'Loading'}
      className={`flex flex-col items-center justify-center gap-4 py-20 ${className}`}
    >
      {spinner}
      {message && (
        <p className="text-sm text-surface-500 animate-pulse">{message}</p>
      )}
    </div>
  );
}
