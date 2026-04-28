import clsx from 'clsx'

export default function ListItem({ header, title, text, footer, after, className, onClick, disabled = false, ...props }) {
  const isInteractive = typeof onClick === 'function' && !disabled

  const handleKeyDown = (event) => {
    if (!isInteractive) return
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    onClick(event)
  }

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        'flex w-full items-start gap-4 border-b border-slate-200 px-4 py-3 text-left last:border-b-0',
        isInteractive ? 'cursor-pointer transition hover:bg-slate-100' : '',
        disabled ? 'opacity-60' : '',
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {header ? <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{header}</div> : null}
        {title ? <div className="text-sm font-semibold text-slate-900">{title}</div> : null}
        {text ? <div className="mt-1 text-sm leading-6 text-slate-700">{text}</div> : null}
        {footer ? <div className="mt-1 text-xs leading-5 text-slate-600">{footer}</div> : null}
      </div>
      {after ? <div className="shrink-0 pt-0.5">{after}</div> : null}
    </div>
  )
}