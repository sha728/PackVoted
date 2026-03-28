/**
 * Card.jsx
 *
 * A general-purpose surface container.
 * Accepts an optional `hover` prop to add lift-on-hover effect
 * and a `padding` prop for consistent spacing control.
 *
 * @example
 * <Card hover>
 *   <h3>Destination Name</h3>
 * </Card>
 *
 * <Card padding="lg" className="border-brand-200">
 *   ...
 * </Card>
 */

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * @param {object}  props
 * @param {'none'|'sm'|'md'|'lg'} [props.padding='md']
 * @param {boolean} [props.hover]     - Adds scale + shadow lift on hover
 * @param {string}  [props.className] - Extra classes
 * @param {React.ElementType} [props.as='div']
 */
export default function Card({
  padding = 'md',
  hover = false,
  className = '',
  as: Tag = 'div',
  children,
  ...rest
}) {
  return (
    <Tag
      className={`
        rounded-2xl border border-surface-200 bg-white shadow-sm
        ${PADDING[padding]}
        ${
          hover
            ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
            : ''
        }
        ${className}
      `}
      {...rest}
    >
      {children}
    </Tag>
  );
}
