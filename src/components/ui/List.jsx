import clsx from 'clsx'

export default function List({ ...props }) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-slate-200 bg-white p-4 md:p-5 mb-6'
      )}
      {...props}
    />
  )
}