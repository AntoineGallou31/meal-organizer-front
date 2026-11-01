import { useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { Plus, X } from 'lucide-react'
import { Sheet } from '../ui'
import { formatDayLong, getSlotItems, getSlotLabel, isPendingItem, splitItems } from '../../lib/mealPlan'
import MoveDuplicateView from './MoveDuplicateView'
import NoteField from './NoteField'
import RecipeCard from './RecipeCard'
import SeasonIdeas from './SeasonIdeas'
import UndoSnackbar from './UndoSnackbar'

const SHEET_SURFACE =
  'flex h-[min(760px,92dvh)] flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.12)]'

const addButtonClass =
  'flex h-12 items-center justify-center gap-2 rounded-[14px] border px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

export default function MealSheet({
  target,
  days,
  notice,
  onUndo,
  onDismissNotice,
  onClose,
  onAddRecipe,
  onAddItem,
  onUpdateNote,
  onRemoveItem,
  onTransferItem,
}) {
  // Garde le dernier créneau affiché pour que le contenu reste visible pendant l'animation de fermeture
  const [shownTarget, setShownTarget] = useState(target)
  if (target && (target.date !== shownTarget?.date || target.slot !== shownTarget?.slot)) {
    setShownTarget(target)
  }

  const current = target ?? shownTarget
  const isToday = current ? dayjs(current.date).isSame(dayjs(), 'day') : false
  const dayLabel = current ? formatDayLong(current.date) : ''
  const slotLabel = current ? getSlotLabel(current.slot) : ''
  const items = current ? getSlotItems(days.find((day) => day.date === current.date), current.slot) : []

  return (
    <Sheet
      opened={Boolean(target)}
      onBackdropClick={onClose}
      title={`${dayLabel}, ${slotLabel.toLowerCase()}`}
      surfaceClassName={SHEET_SURFACE}
      className="mx-auto max-w-xl"
    >
      <div className="flex flex-none flex-col gap-4 px-5 pt-2">
        <div aria-hidden="true" className="h-[5px] w-10 self-center rounded-[3px] bg-sage-300" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-terracotta-700">
              {dayLabel}
              {isToday ? " · Aujourd'hui" : null}
            </p>
            <h2 className="text-[22px]/[30px] font-semibold tracking-[-0.01em] text-sage-900">{slotLabel}</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex size-11 flex-none items-center justify-center rounded-full bg-sage-100 text-sage-700 transition hover:bg-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {current ? (
        <MealSheetBody
          // Repart d'un état vierge (brouillon de note…) à chaque créneau
          key={`${current.date}-${current.slot}`}
          date={current.date}
          slot={current.slot}
          slotLabel={slotLabel}
          items={items}
          onClose={onClose}
          onAddRecipe={onAddRecipe}
          onAddItem={onAddItem}
          onUpdateNote={onUpdateNote}
          onRemoveItem={onRemoveItem}
          onTransferItem={onTransferItem}
          hasNotice={Boolean(target && notice)}
        />
      ) : null}

      {/* Hors du panneau, le bandeau serait inerte tant que la modale est ouverte */}
      <UndoSnackbar
        notice={target ? notice : null}
        onUndo={onUndo}
        onDismiss={onDismissNotice}
        className="absolute inset-x-4 bottom-[100px] z-10"
      />
    </Sheet>
  )
}

function MealSheetBody({
  date,
  slot,
  slotLabel,
  items,
  onClose,
  onAddRecipe,
  onAddItem,
  onUpdateNote,
  onRemoveItem,
  onTransferItem,
  hasNotice,
}) {
  const menuTitleId = useId()
  // Laisse défiler le bas du contenu au-dessus du bandeau tant qu'il est affiché
  const scrollAreaClass = clsx(
    'flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-4',
    hasNotice ? 'pb-24' : 'pb-2',
  )
  const actionsIdPrefix = useId()
  const getActionsId = (item) => `${actionsIdPrefix}-${item.id}`

  // Sous-vue « Vers quel repas ? » : { mode: 'move' | 'duplicate', item }
  const [transfer, setTransfer] = useState(null)
  // En quittant la sous-vue, le focus revient sur le menu de la recette (ou sur le titre
  // de la liste si la recette a été déplacée)
  const focusAfterTransferRef = useRef(null)
  useEffect(() => {
    if (transfer || !focusAfterTransferRef.current) return
    document.getElementById(focusAfterTransferRef.current)?.focus()
    focusAfterTransferRef.current = null
  }, [transfer])

  const closeTransfer = (focusId) => {
    focusAfterTransferRef.current = focusId
    setTransfer(null)
  }

  const handleTransferPick = (destinationDate, destinationSlot) => {
    onTransferItem({ item: transfer.item, date: destinationDate, slot: destinationSlot, mode: transfer.mode })
    closeTransfer(transfer.mode === 'move' ? menuTitleId : getActionsId(transfer.item))
  }

  // Note en cours de saisie. Une fois validée, elle reste affichée (grisée) jusqu'à ce que
  // l'item optimiste soit rendu à sa place : sans ça, le contenu remonterait un instant
  // et le tap qui a provoqué le blur pourrait tomber à côté de son bouton.
  const [draft, setDraft] = useState(null)
  if (draft?.tempId && items.some((item) => item.id === draft.tempId)) {
    setDraft(null)
  }
  const { recipes, notes } = splitItems(items)
  const excludedRecipeIds = new Set(recipes.map((item) => item.recipeId ?? item.recipe?.id))
  const menuTitle =
    items.length === 0 ? 'Au menu' : `Au menu · ${items.length} ${items.length > 1 ? 'éléments' : 'élément'}`

  const handleNoteCommit = (item, text) => {
    if (text === (item.note ?? '').trim()) return
    if (text === '') {
      onRemoveItem(item)
    } else {
      onUpdateNote(item, text)
    }
  }

  const handleDraftCommit = (text) => {
    if (!text) {
      setDraft(null)
      return
    }
    const tempId = onAddItem({ date, slot, type: 'note', note: text })
    setDraft((current) => (current ? { ...current, tempId } : current))
  }

  const footer = (
    <div className="flex-none px-5 pt-4 pb-6">
      <button
        type="button"
        onClick={onClose}
        className="h-[52px] w-full rounded-[14px] bg-terracotta-700 text-base font-semibold text-white transition hover:bg-terracotta-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700 focus-visible:ring-offset-2"
      >
        Terminé
      </button>
    </div>
  )

  if (transfer) {
    return (
      <>
        <div key="transfer" className={scrollAreaClass}>
          <MoveDuplicateView
            mode={transfer.mode}
            item={transfer.item}
            origin={{ date, slot }}
            onBack={() => closeTransfer(getActionsId(transfer.item))}
            onPick={handleTransferPick}
          />
        </div>
        {footer}
      </>
    )
  }

  return (
    <>
      <div key="menu" className={clsx(scrollAreaClass, 'gap-4')}>
        <section aria-labelledby={menuTitleId} className="flex flex-col gap-2">
          <h3
            id={menuTitleId}
            tabIndex={-1}
            className="text-[11px]/4 font-semibold uppercase tracking-[0.06em] text-sage-500 outline-none"
          >
            {menuTitle}
          </h3>

          {items.length === 0 && draft === null ? (
            <p className="py-1 text-sm text-sage-500">Rien de prévu pour ce repas.</p>
          ) : null}

          {recipes.map((item) => (
            <RecipeCard
              key={item.id}
              item={item}
              pending={isPendingItem(item)}
              actionsId={getActionsId(item)}
              onMove={() => setTransfer({ mode: 'move', item })}
              onDuplicate={() => setTransfer({ mode: 'duplicate', item })}
              onRemove={() => onRemoveItem(item)}
            />
          ))}

          {notes.map((item, index) => (
            <NoteField
              // La note repart du texte du cache quand il change (enregistrement, retour arrière)
              key={`${item.id}:${item.note}`}
              label={notes.length > 1 ? `Note ${index + 1}` : 'Note'}
              initialValue={item.note ?? ''}
              pending={isPendingItem(item)}
              onCommit={(text) => handleNoteCommit(item, text)}
              onRemove={() => onRemoveItem(item)}
            />
          ))}

          {draft !== null ? (
            <NoteField
              key={draft.key}
              draft
              autoFocus
              pending={Boolean(draft.tempId)}
              label="Nouvelle note"
              onCommit={handleDraftCommit}
              onRemove={() => setDraft(null)}
            />
          ) : null}
        </section>

        <div className="grid flex-none grid-cols-2 gap-2">
          <button
            type="button"
            aria-label="Ajouter une recette"
            onClick={() => onAddRecipe(date, slot)}
            className={`${addButtonClass} border-terracotta-200 bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100 focus-visible:ring-terracotta-700`}
          >
            <Plus size={18} aria-hidden="true" />
            Recette
          </button>
          <button
            type="button"
            aria-label="Ajouter une note"
            onClick={() => setDraft({ key: Date.now(), tempId: null })}
            className={`${addButtonClass} border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-800`}
          >
            <Plus size={18} aria-hidden="true" />
            Note
          </button>
        </div>

        <div aria-hidden="true" className="h-px flex-none bg-sage-100" />

        <SeasonIdeas
          slotLabel={slotLabel}
          excludedRecipeIds={excludedRecipeIds}
          onAdd={(recipe) => onAddItem({ date, slot, type: 'recipe', recipe })}
        />
      </div>

      {footer}
    </>
  )
}
