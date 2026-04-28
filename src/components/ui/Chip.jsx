import clsx from 'clsx'

export default function Chip({ children, media, className, onClick, ...props }) {
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium transition',
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-soft' : 'cursor-default',
        className,
      )}
      {...props}
    >
      {media}
      <span>{children}</span>
    </Component>
  )
}