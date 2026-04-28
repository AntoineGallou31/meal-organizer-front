import clsx from 'clsx'
import { ChevronLeft } from 'lucide-react'
import Button from './Button'

export default function BackButton({ className, ...props }) {
  return (
    <Button clear small className={clsx('rounded-full p-2', className)} {...props}>
      <ChevronLeft size={22} />
    </Button>
  )
}