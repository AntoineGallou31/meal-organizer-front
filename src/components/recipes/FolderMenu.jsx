import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, Ellipsis, Palette, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sheet } from '../ui'
import { api } from '../../lib/api'
import { getWriteErrorMessage } from '../../lib/recipes'
import { FOCUS_RING, MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from './styles'

// Couleurs proposées pour un dossier : celles déjà utilisées en base, complétées
const FOLDER_COLORS = [
  { value: '#EF4444', name: 'Rouge' },
  { value: '#F97316', name: 'Orange' },
  { value: '#F59E0B', name: 'Ambre' },
  { value: '#D4A574', name: 'Sable' },
  { value: '#22C55E', name: 'Vert' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#3B82F6', name: 'Bleu' },
  { value: '#8B5CF6', name: 'Violet' },
  { value: '#EC4899', name: 'Rose' },
  { value: '#64748B', name: 'Ardoise' },
]

const SECONDARY_BUTTON = clsx(
  'h-11 rounded-full border border-sage-200 bg-white px-4 text-sm font-semibold text-sage-900 transition hover:bg-sage-50 disabled:opacity-50',
  FOCUS_RING,
)
const PRIMARY_BUTTON = clsx(
  'h-11 rounded-full px-4 text-sm font-semibold text-white transition disabled:opacity-50',
  FOCUS_RING,
  'focus-visible:ring-offset-2',
)

function SheetBody({ title, children }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="text-base font-semibold text-sage-900">{title}</div>
      {children}
    </div>
  )
}

function ErrorMessage({ error }) {
  return error ? (
    <p role="alert" className="text-sm text-red-700">
      {getWriteErrorMessage(error)}
    </p>
  ) : null
}

function RenameForm({ category, mutation, onCancel }) {
  const [name, setName] = useState(category.name ?? '')
  const trimmed = name.trim()

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed && trimmed !== category.name) mutation.mutate({ name: trimmed })
        else onCancel()
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-sage-700">Nom du dossier</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
          required
          autoFocus
          className="h-[46px] rounded-[14px] border border-sage-200 bg-white px-3.5 text-base text-sage-900 outline-none focus-visible:border-sage-500 focus-visible:ring-2 focus-visible:ring-terracotta-700/30"
        />
      </label>
      <ErrorMessage error={mutation.error} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className={SECONDARY_BUTTON}>
          Annuler
        </button>
        <button
          type="submit"
          disabled={!trimmed || mutation.isPending}
          className={clsx(PRIMARY_BUTTON, 'bg-terracotta-700 hover:bg-terracotta-800')}
        >
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

function ColorPicker({ category, mutation }) {
  const current = String(category.color ?? '').toUpperCase()

  return (
    <>
      <div role="group" aria-label="Couleurs" className="grid grid-cols-5 gap-3">
        {FOLDER_COLORS.map((color) => {
          const selected = color.value === current
          return (
            <button
              key={color.value}
              type="button"
              aria-label={color.name}
              aria-pressed={selected}
              disabled={mutation.isPending}
              onClick={() => (selected ? null : mutation.mutate({ color: color.value }))}
              className={clsx(
                'flex size-11 items-center justify-center justify-self-center rounded-full text-white transition disabled:opacity-60',
                selected && 'ring-2 ring-sage-900 ring-offset-2',
                FOCUS_RING,
                'focus-visible:ring-offset-2',
              )}
              style={{ backgroundColor: color.value }}
            >
              {selected ? <Check size={18} aria-hidden="true" /> : null}
            </button>
          )
        })}
      </div>
      <ErrorMessage error={mutation.error} />
    </>
  )
}

// Menu « ⋯ » d'un dossier (catégorie réelle, hors catégorie par défaut)
export default function FolderMenu({ category }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState(null)

  const updateMutation = useMutation({
    mutationFn: (payload) => api.updateCategory(category.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDialog(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteCategory(category.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['recipes-stats'] })
      navigate('/recipes', { replace: true })
    },
  })

  const open = (name) => {
    updateMutation.reset()
    deleteMutation.reset()
    setDialog(name)
  }
  const close = () => setDialog(null)

  return (
    <>
      {/* Non modal : le menu se ferme proprement quand un panneau s'ouvre à sa place */}
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label="Options du dossier"
            className={clsx(
              'flex size-11 flex-none items-center justify-center rounded-full text-sage-700 transition hover:bg-sage-100',
              FOCUS_RING,
            )}
          >
            <Ellipsis size={20} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={4} collisionPadding={16} className={MENU_CONTENT_CLASS}>
            <DropdownMenu.Item onSelect={() => open('rename')} className={MENU_ITEM_CLASS}>
              <Pencil size={18} aria-hidden="true" className="text-sage-500" />
              Renommer
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => open('color')} className={MENU_ITEM_CLASS}>
              <Palette size={18} aria-hidden="true" className="text-sage-500" />
              Changer la couleur
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="mx-2 my-1 h-px bg-sage-100" />
            <DropdownMenu.Item
              onSelect={() => open('delete')}
              className={clsx(MENU_ITEM_CLASS, 'text-red-700 data-[highlighted]:bg-red-50')}
            >
              <Trash2 size={18} aria-hidden="true" />
              Supprimer le dossier
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Sheet opened={dialog === 'rename'} onBackdropClick={close} title="Renommer le dossier">
        <SheetBody title="Renommer le dossier">
          <RenameForm category={category} mutation={updateMutation} onCancel={close} />
        </SheetBody>
      </Sheet>

      <Sheet opened={dialog === 'color'} onBackdropClick={close} title="Changer la couleur du dossier">
        <SheetBody title="Changer la couleur">
          <ColorPicker category={category} mutation={updateMutation} />
          <button type="button" onClick={close} className={SECONDARY_BUTTON}>
            Fermer
          </button>
        </SheetBody>
      </Sheet>

      <Sheet opened={dialog === 'delete'} onBackdropClick={close} title="Supprimer le dossier">
        <SheetBody title={`Supprimer le dossier « ${category.name} » ?`}>
          <p className="-mt-2 text-sm text-sage-700">Les recettes qu’il contient ne sont pas supprimées.</p>
          <ErrorMessage error={deleteMutation.error} />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={close} className={SECONDARY_BUTTON}>
              Annuler
            </button>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              className={clsx(PRIMARY_BUTTON, 'bg-red-700 hover:bg-red-800')}
            >
              {deleteMutation.isPending ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </SheetBody>
      </Sheet>
    </>
  )
}
