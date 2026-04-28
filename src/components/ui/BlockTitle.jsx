import clsx from 'clsx'

export default function BlockTitle({ className, ...props }) {
  return <div className={clsx('mb-3 px-1 text-xs font-semibold uppercase tracking-[0.22em] text-sage-600', className)} {...props} />
}