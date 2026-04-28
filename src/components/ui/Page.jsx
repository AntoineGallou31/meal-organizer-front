import clsx from 'clsx'

export default function Page({ className, ...props }) {
  return <main className={clsx('mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8', className)} {...props} />
}