import clsx from 'clsx'
import Button from './Button'

export default function Fab({ tonal = false, small = false, className, ...props }) {
  return (
    <Button
      tonal={tonal}
      small={small}
      className={clsx(
        'h-12 w-12 rounded-full p-0 shadow-[0_18px_40px_rgba(51,34,22,0.18)]',
        tonal && 'bg-white text-sage-900',
        className,
      )}
      {...props}
    />
  )
}