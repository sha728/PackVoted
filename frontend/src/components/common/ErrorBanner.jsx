import { useState } from 'react';

/**
 * ErrorBanner.jsx
 *
 * Dismissible, accessible error alert.
 * Returns null when the user dismisses it or when `message` is falsy.
 *
 * @example
 * <ErrorBanner message={error} onDismiss={() => setError(null)} />
 *
 * // Or let the banner manage its own dismiss state:
 * <ErrorBanner message={error} />
 */

/**
 * @param {object}    props
 * @param {string}    props.message     - Error text to display
 * @param {string}    [props.title]     - Optional bold heading (defaults to "Error")
 * @param {Function}  [props.onDismiss] - Called when the × button is clicked;
 *                                        if omitted the banner manages its own state
 * @param {string}    [props.className]
 */
export default function ErrorBanner({
  message,
  title = 'Something went wrong',
  onDismiss,
  className = '',
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        flex items-start gap-3 rounded-xl border border-red-200
        bg-red-50 px-4 py-3 text-sm text-red-800 animate-fade-in
        ${className}
      `}
    >
      {/* Icon */}
      <svg
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-red-700">{message}</p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="
          -mr-1 -mt-0.5 ml-auto flex-shrink-0 rounded-md p-1 text-red-500
          hover:bg-red-100 hover:text-red-700 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400
        "
        aria-label="Dismiss error"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
