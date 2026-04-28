import clsx from 'clsx'
import { LoaderCircle } from 'lucide-react'

export default function Preloader({ className, ...props }) {
  return <LoaderCircle className={clsx('animate-spin text-sage-600', className)} size={20} {...props} />
}