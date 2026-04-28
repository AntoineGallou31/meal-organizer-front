import clsx from 'clsx'

export default function List({ inset = false, strong = false, strongIos = false, outlineIos = false, className, ...props }) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/90 shadow-sm',
        strong || strongIos || outlineIos ? 'shadow-soft' : '',
        inset ? 'mx-4' : '',
        className,
      )}
      {...props}
    />
  )
}