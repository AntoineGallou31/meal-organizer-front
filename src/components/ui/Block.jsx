import clsx from 'clsx'

export default function Block({ strong = false, className, ...props }) {
  return (
    <section
      className={clsx(
        'rounded-3xl border border-slate-200 bg-slate-50/90 p-4 backdrop-blur md:p-5',
        strong ? 'shadow-soft' : 'shadow-sm',
        className,
      )}
      {...props}
    />
  )
}