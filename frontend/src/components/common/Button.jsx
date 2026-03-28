/**
 * Button.jsx
 *
 * Variants:
 *   primary   — filled brand blue (default)
 *   secondary — ghost/outline style
 *   danger    — red, for destructive actions
 *
 * Sizes: sm | md (default) | lg
 *
 * @example
 * <Button onClick={handleSubmit} loading={isSubmitting}>Create Trip</Button>
 * <Button variant="secondary" as="a" href="/create">Get Started</Button>
 */

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ' +
  'cursor-pointer select-none';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.97] ' +
    'focus-visible:ring-brand-500 shadow-sm hover:shadow-md',
  secondary:
    'border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 ' +
    'hover:border-surface-400 active:scale-[0.97] focus-visible:ring-brand-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97] ' +
    'focus-visible:ring-red-500 shadow-sm',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

/** Minimal inline spinner used inside the button */
function ButtonSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/**
 * @param {object}  props
 * @param {'primary'|'secondary'|'danger'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading]   - Shows spinner, disables interaction
 * @param {boolean} [props.disabled]
 * @param {string}  [props.className] - Extra classes merged in
 * @param {React.ElementType} [props.as='button'] - Render as any element (e.g. 'a')
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  as: Tag = 'button',
  children,
  ...rest
}) {
  return (
    <Tag
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      aria-busy={loading ? 'true' : undefined}
      {...rest}
    >
      {loading && <ButtonSpinner />}
      {children}
    </Tag>
  );
}
