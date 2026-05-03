import clsx from 'clsx'

export default function Navbar({ title, left, right, className }) {
  return (
    <header
      className={clsx(
        'sticky top-0 z-20 -mx-4 -mt-4 mb-4 border-b border-slate-200 bg-[rgba(255,255,255,0.88)] px-4 py-2 backdrop-blur-xl ',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          {left ?? <span className="h-11 w-11" aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1 pt-0.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          {right ?? <span className="h-11 w-11" aria-hidden="true" />}
        </div>
      </div>
    </header>
  )
}