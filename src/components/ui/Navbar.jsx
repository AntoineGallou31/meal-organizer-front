import clsx from 'clsx'

export default function Navbar({ title, subtitle, left, right, className }) {
  return (
    <header
      className={clsx(
        'sticky top-0 z-20 -mx-4 -mt-4 mb-4 border-b border-slate-200 bg-[rgba(255,255,255,0.88)] px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          {left ?? <span className="h-11 w-11" aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1 pt-0.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          {right ?? <span className="h-11 w-11" aria-hidden="true" />}
        </div>
      </div>
    </header>
  )
}