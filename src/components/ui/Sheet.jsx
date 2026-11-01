import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'

const DEFAULT_SURFACE =
  'max-h-[92dvh] overflow-hidden rounded-t-4xl border border-slate-200 bg-white/96 shadow-[0_-30px_80px_rgba(15,23,42,0.18)]'

export default function Sheet({
  opened,
  onBackdropClick,
  className,
  surfaceClassName = DEFAULT_SURFACE,
  backdropClassName,
  title = 'Dialogue',
  children,
}) {
  return (
    <Dialog.Root
      open={opened}
      onOpenChange={(open) => {
        if (!open) {
          onBackdropClick?.()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx('fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]', backdropClassName)}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className={clsx(
            'fixed inset-x-0 bottom-0 z-50 outline-none data-[state=open]:animate-sheet-up data-[state=closed]:animate-sheet-down',
            surfaceClassName,
            className,
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
