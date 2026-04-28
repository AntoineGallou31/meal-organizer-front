import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import { ChevronLeft, LoaderCircle, Search, X } from 'lucide-react'

function getButtonClasses({ clear, tonal, small, large, className }) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50',
    clear
      ? 'bg-transparent text-sage-800 hover:bg-black/5'
      : tonal
        ? 'border border-sage-200 bg-sage-50 text-sage-900 shadow-sm hover:border-sage-300 hover:bg-sage-100'
        : 'bg-sage-700 text-white shadow-soft hover:-translate-y-0.5 hover:bg-sage-600',
    small ? 'px-3 py-2 text-sm' : large ? 'px-5 py-3 text-base' : 'px-4 py-2.5 text-sm',
    className,
  )
}

export function Button({ clear = false, tonal = false, small = false, large = false, className, type = 'button', ...props }) {
  return <button type={type} className={getButtonClasses({ clear, tonal, small, large, className })} {...props} />
}

export function Fab({ tonal = false, small = false, className, ...props }) {
  return (
    <Button
      tonal={tonal}
      small={small}
      className={clsx(
        'h-12 w-12 rounded-full p-0 shadow-[0_18px_40px_rgba(51,34,22,0.18)]',
        tonal && 'bg-white text-sage-900',
        className,
      )}
      {...props}
    />
  )
}

export function Chip({ children, media, className, onClick, ...props }) {
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

export function Block({ strong = false, className, ...props }) {
  return (
    <section
      className={clsx(
        'rounded-3xl border border-cream-200 bg-white/82 p-4 backdrop-blur md:p-5',
        strong ? 'shadow-soft' : 'shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function BlockTitle({ className, ...props }) {
  return <div className={clsx('mb-3 px-1 text-xs font-semibold uppercase tracking-[0.22em] text-sage-600', className)} {...props} />
}

export function Page({ className, ...props }) {
  return <main className={clsx('mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8', className)} {...props} />
}

export function Navbar({ title, subtitle, left, right, className }) {
  return (
    <header
      className={clsx(
        'sticky top-0 z-20 -mx-4 mb-4 border-b border-white/40 bg-[color:rgba(255,250,244,0.78)] px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          {left ?? <span className="h-11 w-11" aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1 pt-0.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-sage-900 sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-sage-700">{subtitle}</p> : null}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          {right ?? <span className="h-11 w-11" aria-hidden="true" />}
        </div>
      </div>
    </header>
  )
}

export function List({ inset = false, strong = false, strongIos = false, outlineIos = false, className, ...props }) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-3xl border border-cream-200 bg-white/85 shadow-sm',
        strong || strongIos || outlineIos ? 'shadow-soft' : '',
        inset ? 'mx-4' : '',
        className,
      )}
      {...props}
    />
  )
}

export function ListItem({ header, title, text, footer, after, className, onClick, disabled = false, ...props }) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'flex w-full items-start gap-4 border-b border-cream-100 px-4 py-3 text-left last:border-b-0',
        onClick && !disabled ? 'transition hover:bg-cream-50' : '',
        disabled ? 'opacity-60' : '',
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {header ? <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sage-600">{header}</div> : null}
        {title ? <div className="text-sm font-semibold text-sage-900">{title}</div> : null}
        {text ? <div className="mt-1 text-sm leading-6 text-sage-700">{text}</div> : null}
        {footer ? <div className="mt-1 text-xs leading-5 text-sage-600">{footer}</div> : null}
      </div>
      {after ? <div className="shrink-0 pt-0.5">{after}</div> : null}
    </Component>
  )
}

function renderFieldControl({ type, inputClassName, children, ...props }) {
  const controlClasses = clsx(
    'w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition placeholder:text-sage-400 focus:border-sage-400 focus:ring-2 focus:ring-sage-200',
    type === 'textarea' ? 'min-h-32 resize-y' : '',
    inputClassName,
  )

  if (type === 'textarea') {
    return <textarea className={controlClasses} {...props} />
  }

  if (type === 'select') {
    return (
      <select className={controlClasses} {...props}>
        {children}
      </select>
    )
  }

  return <input type={type} className={controlClasses} {...props} />
}

export function ListInput({ label, type = 'text', inputClassName, className, children, ...props }) {
  return (
    <label className={clsx('block border-b border-cream-100 px-4 py-3 last:border-b-0', className)}>
      {label ? <div className="mb-2 text-sm font-semibold text-sage-800">{label}</div> : null}
      {renderFieldControl({ type, inputClassName, children, ...props })}
    </label>
  )
}

export function Preloader({ className, ...props }) {
  return <LoaderCircle className={clsx('animate-spin text-sage-600', className)} size={20} {...props} />
}

export function Searchbar({ value, onChange, disableButton, onDisableButtonClick, placeholder = 'Rechercher', className }) {
  return (
    <div className={clsx('flex w-full items-center gap-2 rounded-full border border-cream-200 bg-white/90 px-4 py-3 shadow-sm', className)}>
      <Search size={18} className="shrink-0 text-sage-500" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-400"
      />
      {disableButton ? null : (
        <button
          type="button"
          onClick={onDisableButtonClick}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sage-500 transition hover:bg-cream-100 hover:text-sage-700"
          aria-label="Effacer la recherche"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export function Sheet({ opened, onBackdropClick, className, backdropClassName, children }) {
  return (
    <Dialog.Root
      open={opened}
      onOpenChange={(open) => {
        if (!open) {
          onBackdropClick?.()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx('fixed inset-0 z-40 bg-charcoal-950/45 backdrop-blur-[2px]', backdropClassName)}
        />
        <Dialog.Content
          className={clsx(
            'fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-hidden rounded-t-[2rem] border border-white/70 bg-white/96 shadow-[0_-30px_80px_rgba(31,24,18,0.22)] outline-none data-[state=open]:animate-sheet-up data-[state=closed]:animate-sheet-down',
            className,
          )}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function BackButton({ className, ...props }) {
  return (
    <Button clear small className={clsx('rounded-full p-2', className)} {...props}>
      <ChevronLeft size={22} />
    </Button>
  )
}
