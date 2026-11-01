import clsx from 'clsx'
import { RotateCcw, X } from 'lucide-react'

// Bandeau « X retiré · Annuler », réutilisé pour les erreurs (sans action d'annulation).
// La zone role="status" reste montée même vide pour que les lecteurs d'écran annoncent le message.
export default function UndoSnackbar({ notice, onUndo, onDismiss, className }) {
  return (
    <div role="status" className={clsx('pointer-events-none', className)}>
      {notice ? (
        <div className="pointer-events-auto flex animate-sheet-up items-center gap-3 rounded-2xl bg-sage-900 py-3 pr-2 pl-4 text-white shadow-[0_12px_32px_rgba(15,23,42,0.28)]">
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="text-sm/[19px] font-medium break-words">{notice.title}</span>
            {notice.detail ? <span className="text-xs text-sage-300">{notice.detail}</span> : null}
          </div>

          {notice.type === 'undo' ? (
            <button
              type="button"
              onClick={onUndo}
              className="flex h-11 flex-none items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-terracotta-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Annuler
            </button>
          ) : (
            <button
              type="button"
              aria-label="Fermer le message"
              onClick={onDismiss}
              className="flex size-11 flex-none items-center justify-center rounded-xl text-sage-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
