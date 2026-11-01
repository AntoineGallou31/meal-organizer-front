import { useId, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { PencilLine, X } from 'lucide-react'

// Note modifiable sur place. Le texte est validé au blur, à Entrée ou à Échap ;
// onCommit reçoit le texte nettoyé quand il a changé (une chaîne vide pour une note vidée).
// Un textarea qui grandit avec son contenu affiche la note en entier.
export default function NoteField({ initialValue = '', label = 'Note', draft = false, pending = false, autoFocus = false, onCommit, onRemove }) {
  const id = useId()
  const [value, setValue] = useState(initialValue)
  const textareaRef = useRef(null)
  // Un brouillon est toujours validé, même vide, pour que le parent puisse l'abandonner
  const lastCommittedRef = useRef(draft ? undefined : initialValue.trim())
  const removedRef = useRef(false)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  const commit = () => {
    if (pending || removedRef.current) return
    const text = value.trim()
    if (text === lastCommittedRef.current) return
    lastCommittedRef.current = text
    onCommit(text)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.blur()
    } else if (event.key === 'Escape') {
      // Échap ferme aussi le panneau : on enregistre avant
      commit()
    }
  }

  const handleRemove = () => {
    removedRef.current = true
    onRemove()
  }

  return (
    <div
      aria-busy={pending || undefined}
      className={clsx(
        'flex items-start gap-2.5 rounded-2xl bg-amber-100 py-1 pr-1 pl-3 text-amber-900 focus-within:ring-2 focus-within:ring-amber-800',
        pending && 'opacity-60',
      )}
    >
      <PencilLine size={18} aria-hidden="true" className="mt-[13px] flex-none" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        ref={textareaRef}
        rows={1}
        value={value}
        readOnly={pending}
        autoFocus={autoFocus}
        enterKeyHint="done"
        placeholder={draft ? 'Écrire une note…' : undefined}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="min-h-11 min-w-0 flex-1 resize-none overflow-hidden bg-transparent py-[11px] text-[15px]/[22px] text-amber-900 outline-none placeholder:text-amber-800/80"
      />
      <button
        type="button"
        aria-label={draft ? 'Abandonner la note' : 'Supprimer la note'}
        disabled={pending}
        // Garde le focus dans le champ : sinon le blur enregistrerait la note juste avant de la supprimer
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleRemove}
        className="flex size-11 flex-none items-center justify-center rounded-full text-amber-800 transition hover:bg-amber-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 disabled:opacity-50"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
