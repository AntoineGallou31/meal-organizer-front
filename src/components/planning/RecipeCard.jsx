import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import clsx from 'clsx'
import { ArrowRightLeft, BookOpen, Clock, Copy, Ellipsis, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { formatRecipeMeta } from '../../lib/mealPlan'
import RecipeThumb from './RecipeThumb'

const menuItemClass =
  'flex h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none data-[disabled]:cursor-default data-[disabled]:opacity-50'

export default function RecipeCard({ item, pending = false, actionsId, onMove, onDuplicate, onRemove }) {
  const navigate = useNavigate()
  const recipe = item.recipe
  const title = recipe?.title ?? 'Recette'
  const recipeUrl = recipe?.id ? `/recipes/${recipe.id}` : null
  const meta = formatRecipeMeta(recipe)

  const content = (
    <>
      <RecipeThumb recipe={recipe} iconSize={20} className="size-12 rounded-xl" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[15px]/5 font-medium text-sage-900">{title}</span>
        {meta ? (
          <span className="flex items-center gap-[5px] text-xs text-sage-500">
            {recipe?.prepTime ? <Clock size={13} aria-hidden="true" className="flex-none" /> : null}
            {meta}
          </span>
        ) : null}
      </span>
    </>
  )

  return (
    <div
      aria-busy={pending || undefined}
      className={clsx(
        'flex items-center gap-3 rounded-2xl border border-sage-200 bg-white py-2 pr-1 pl-2',
        pending && 'opacity-60',
      )}
    >
      {recipeUrl && !pending ? (
        <Link
          to={recipeUrl}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700"
        >
          {content}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>
      )}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild disabled={pending}>
          <button
            type="button"
            id={actionsId}
            aria-label={`Actions pour ${title}`}
            className="flex size-11 flex-none items-center justify-center rounded-full text-sage-500 transition hover:bg-sage-100 hover:text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700 disabled:opacity-50"
          >
            <Ellipsis size={20} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            collisionPadding={16}
            className="z-60 min-w-[220px] rounded-2xl border border-sage-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
          >
            <DropdownMenu.Item
              disabled={!recipeUrl}
              onSelect={() => navigate(recipeUrl)}
              className={clsx(menuItemClass, 'text-sage-900 data-[highlighted]:bg-sage-100')}
            >
              <BookOpen size={18} aria-hidden="true" className="text-sage-500" />
              Voir la recette
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={onMove} className={clsx(menuItemClass, 'text-sage-900 data-[highlighted]:bg-sage-100')}>
              <ArrowRightLeft size={18} aria-hidden="true" className="text-sage-500" />
              Déplacer…
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={onDuplicate} className={clsx(menuItemClass, 'text-sage-900 data-[highlighted]:bg-sage-100')}>
              <Copy size={18} aria-hidden="true" className="text-sage-500" />
              Dupliquer…
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="mx-2 my-1 h-px bg-sage-100" />
            <DropdownMenu.Item
              onSelect={onRemove}
              className={clsx(menuItemClass, 'text-red-700 data-[highlighted]:bg-red-50')}
            >
              <Trash2 size={18} aria-hidden="true" />
              Retirer
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
