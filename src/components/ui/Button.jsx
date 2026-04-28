import clsx from 'clsx'

function getButtonClasses({ clear, tonal, small, large, className }) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50',
    clear
      ? 'bg-transparent text-sage-700 hover:bg-slate-100'
      : tonal
        ? 'border border-slate-200 bg-white text-sage-900 shadow-sm hover:border-slate-300 hover:bg-slate-50'
        : 'bg-terracotta-500 text-white shadow-soft hover:-translate-y-0.5 hover:bg-terracotta-600',
    small ? 'px-3 py-2 text-sm' : large ? 'px-5 py-3 text-base' : 'px-4 py-2.5 text-sm',
    className,
  )
}

export default function Button({ clear = false, tonal = false, small = false, large = false, className, type = 'button', ...props }) {
  return <button type={type} className={getButtonClasses({ clear, tonal, small, large, className })} {...props} />
}