import { useId } from 'react'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ErrorState from '../ErrorState'
import { formatRecipeCount, FROM_FOLDERS_STATE, getFolderPath } from '../../lib/recipes'
import CoverImage from './CoverImage'
import { FOCUS_RING } from './styles'

// Liste compacte des dossiers du mode sélection (« Ou parcours tes dossiers »)
export default function FolderList({ categoriesQuery, folders, search, onNavigate }) {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="px-4 pt-5">
      <h2 id={titleId} className="mb-2.5 text-[13px]/[18px] font-semibold text-sage-700">
        Ou parcours tes dossiers
      </h2>

      {categoriesQuery.isPending ? (
        <div role="status" className="h-64 animate-pulse rounded-2xl bg-sage-100">
          <span className="sr-only">Chargement des dossiers…</span>
        </div>
      ) : categoriesQuery.isError ? (
        <ErrorState message="Impossible de charger les dossiers" onRetry={() => categoriesQuery.refetch()} />
      ) : folders.length === 0 ? (
        <p className="text-sm text-sage-500">Aucun dossier pour le moment.</p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-2xl border border-sage-200 bg-white">
          {folders.map((folder, index) => {
            const count = [
              formatRecipeCount(folder.recipe_count),
              folder.season_count > 0 ? `${folder.season_count} de saison` : null,
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <li key={folder.id} className={clsx(index > 0 && 'border-t border-sage-100')}>
                <Link
                  to={getFolderPath(folder.id, search)}
                  state={FROM_FOLDERS_STATE}
                  onClick={onNavigate}
                  className={clsx(
                    'flex min-h-16 items-center gap-3 py-2 pr-2 pl-2.5 text-sage-900 transition hover:bg-sage-50 focus-visible:ring-inset',
                    FOCUS_RING,
                  )}
                >
                  <span aria-hidden="true" className="block size-[46px] flex-none overflow-hidden rounded-[11px]">
                    <CoverImage src={folder.preview_images?.[0]} color={folder.color} iconSize={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="flex min-w-0 items-center gap-1.5 text-[15px]/5 font-medium">
                      <span
                        aria-hidden="true"
                        className="size-2 flex-none rounded-full"
                        style={{ backgroundColor: folder.color || '#64748b' }}
                      />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className="text-xs text-sage-500">{count}</span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" className="mr-1.5 flex-none text-sage-500" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
