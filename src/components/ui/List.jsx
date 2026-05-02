import clsx from 'clsx'

export default function List({ inset = false, strong = false, strongIos = false, outlineIos = false, className, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-slate-200 bg-slate-50/90 p-4 backdrop-blur md:p-5 mb-6',
        strong || strongIos || outlineIos ? 'shadow-soft' : '',
        inset ? '' : '',
        className,
      )}
      {...props}
    />
  )
}