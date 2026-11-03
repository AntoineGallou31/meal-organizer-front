import { useId, useMemo } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import clsx from 'clsx'
import { ArrowUpDown, Heart, Leaf, Link2, PencilLine, Plus } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import FolderCard from '../components/recipes/FolderCard'
import RecipePicker from '../components/recipes/RecipePicker'
import RecipeSearchResults from '../components/recipes/RecipeSearchResults'
import SearchField from '../components/recipes/SearchField'
import { FOCUS_RING, MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from '../components/recipes/styles'
import useCategories from '../hooks/useCategories'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useRecipeStats from '../hooks/useRecipeStats'
import useScrollRestoration from '../hooks/useScrollRestoration'
import useUpdateSearchParams from '../hooks/useUpdateSearchParams'
import {
  formatCount,
  formatRecipeCount,
  FROM_FOLDERS_STATE,
  getFolderPath,
  getSelection,
  getVisibleFolders,
  isInCurrentMonth,
  pickFallbackColor,
  SPECIAL_FOLDERS,
} from '../lib/recipes'

const SHORTCUTS = [
  { folder: SPECIAL_FOLDERS.saison, icon: Leaf, tint: 'bg-lime-100 text-lime-800' },
  { folder: SPECIAL_FOLDERS.favoris, icon: Heart, tint: 'bg-rose-100 text-rose-700' },
  { folder: SPECIAL_FOLDERS['a-completer'], icon: PencilLine, tint: 'bg-amber-100 text-amber-800' },
]

const FOLDER_SORT_LABELS = { filled: 'Les plus remplis', az: 'De A à Z' }

function AddRecipeMenu() {
  const navigate = useNavigate()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Ajouter une recette"
          className={clsx(
            'flex size-11 flex-none items-center justify-center rounded-full bg-terracotta-700 text-white transition hover:bg-terracotta-800 focus-visible:ring-offset-2',
            FOCUS_RING,
          )}
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} collisionPadding={16} className={MENU_CONTENT_CLASS}>
          <DropdownMenu.Item onSelect={() => navigate('/recipes/import')} className={MENU_ITEM_CLASS}>
            <Link2 size={18} aria-hidden="true" className="text-sage-500" />
            Importer depuis un lien
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => navigate('/recipes/new')} className={MENU_ITEM_CLASS}>
            <PencilLine size={18} aria-hidden="true" className="text-sage-500" />
            Créer une recette
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function Shortcuts({ stats, onNavigate }) {
  return (
    <section aria-label="Raccourcis" className="px-4 pt-[18px]">
      <ul className="grid grid-cols-3 gap-2">
        {SHORTCUTS.map(({ folder, icon, tint }) => {
          const Icon = icon
          const count = stats?.[folder.statKey]
          return (
            <li key={folder.id} className="min-w-0">
              <Link
                to={getFolderPath(folder.id)}
                state={FROM_FOLDERS_STATE}
                onClick={onNavigate}
                className={clsx(
                  'flex h-full flex-col gap-2.5 rounded-2xl border border-sage-200 bg-white p-2.5 text-sage-900 transition hover:border-sage-300',
                  FOCUS_RING,
                )}
              >
                <span className={clsx('flex size-8 items-center justify-center rounded-full', tint)}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[13px]/[17px] font-semibold">{folder.name}</span>
                  {count != null ? <span className="text-xs text-sage-500">{formatRecipeCount(count)}</span> : null}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function FoldersSkeleton() {
  return (
    <div role="status" className="grid grid-cols-2 gap-x-3 gap-y-3.5 pt-1">
      <span className="sr-only">Chargement des dossiers…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} aria-hidden="true" className="flex flex-col">
          <div className="h-3 w-[46%] rounded-t-[10px] bg-sage-100" />
          <div className="h-[160px] animate-pulse rounded-[0_16px_16px_16px] bg-sage-100" />
        </div>
      ))}
    </div>
  )
}

function FolderGrid({ categoriesQuery, folders, sort, onSortChange, onNavigate }) {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="px-4 pt-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 id={titleId} className="text-[17px]/6 font-semibold text-sage-900">
          Dossiers
        </h2>
        <button
          type="button"
          aria-label={`Trier les dossiers : ${FOLDER_SORT_LABELS[sort]}`}
          onClick={() => onSortChange(sort === 'az' ? 'filled' : 'az')}
          className={clsx(
            'flex h-11 items-center gap-1.5 rounded-xl pr-1 pl-2 text-[13px] font-medium text-sage-700 transition hover:text-sage-900',
            FOCUS_RING,
          )}
        >
          <ArrowUpDown size={15} aria-hidden="true" />
          {FOLDER_SORT_LABELS[sort]}
        </button>
      </div>

      {categoriesQuery.isPending ? (
        <FoldersSkeleton />
      ) : categoriesQuery.isError ? (
        <ErrorState message="Impossible de charger les dossiers" onRetry={() => categoriesQuery.refetch()} />
      ) : folders.length === 0 ? (
        <p className="pt-2 text-sm text-sage-500">Aucun dossier pour le moment.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-3.5 pt-1">
          {folders.map((folder) => (
            <li key={folder.id} className="min-w-0">
              <FolderCard folder={folder} to={getFolderPath(folder.id)} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FoldersPage() {
  const [searchParams, updateSearchParams] = useUpdateSearchParams()
  const search = searchParams.get('q') ?? ''
  const sort = searchParams.get('sort') === 'az' ? 'az' : 'filled'
  const isSearching = search.trim() !== ''
  const term = useDebouncedValue(search.trim(), 250)

  const categoriesQuery = useCategories()
  const statsQuery = useRecipeStats()
  const stats = statsQuery.data
  const folders = useMemo(() => getVisibleFolders(categoriesQuery.data, sort), [categoriesQuery.data, sort])
  const saveScroll = useScrollRestoration(isSearching || !categoriesQuery.isPending)

  const subtitle = [
    stats ? formatRecipeCount(stats.total) : null,
    categoriesQuery.data ? formatCount(folders.length, 'dossier') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const getCardProps = (recipe) => ({
    color: pickFallbackColor(recipe.id),
    seasonBadge: isInCurrentMonth(recipe),
    withCookCount: statsQuery.isSuccess,
    onNavigate: saveScroll,
  })

  return (
    <div className="mx-auto w-full max-w-xl pb-4">
      <header className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-[26px]/[34px] font-semibold tracking-[-0.02em] text-sage-900">Recettes</h1>
          {subtitle ? <p className="text-xs text-sage-500">{subtitle}</p> : null}
        </div>
        <AddRecipeMenu />
      </header>

      <div className="px-4 pt-3.5">
        <SearchField
          label="Rechercher dans toutes les recettes"
          value={search}
          onChange={(value) => updateSearchParams({ q: value })}
        />
      </div>

      {isSearching ? (
        <RecipeSearchResults term={term} getCardProps={getCardProps} />
      ) : (
        <>
          <Shortcuts stats={stats} onNavigate={saveScroll} />
          <FolderGrid
            categoriesQuery={categoriesQuery}
            folders={folders}
            sort={sort}
            onSortChange={(value) => updateSearchParams({ sort: value === 'az' ? 'az' : null })}
            onNavigate={saveScroll}
          />
        </>
      )}
    </div>
  )
}

export default function RecipesPage() {
  const [searchParams] = useSearchParams()
  const selection = getSelection(searchParams)

  return selection ? <RecipePicker selection={selection} /> : <FoldersPage />
}
