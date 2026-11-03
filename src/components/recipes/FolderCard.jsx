import clsx from 'clsx'
import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import useFolderPreviews from '../../hooks/useFolderPreviews'
import useInView from '../../hooks/useInView'
import { formatRecipeCount, FROM_FOLDERS_STATE } from '../../lib/recipes'
import CoverImage from './CoverImage'
import { FOCUS_RING } from './styles'

function PreviewTile({ loading, src, color, showIcon }) {
  if (loading) return <span className="block size-full animate-pulse bg-sage-100" />
  return <CoverImage src={src} color={color} iconSize={24} showIcon={showIcon} />
}

// Carte en forme de dossier : un onglet blanc collé au corps, une ombre commune sur le lien.
// L'aperçu montre les photos des premières recettes du dossier.
export default function FolderCard({ folder, to, onNavigate }) {
  const [ref, inView] = useInView()
  const { images, isLoading } = useFolderPreviews(folder, inView)
  const [first, second, third] = images

  return (
    <Link
      ref={ref}
      to={to}
      state={FROM_FOLDERS_STATE}
      onClick={onNavigate}
      className={clsx('flex flex-col rounded-2xl text-sage-900', FOCUS_RING)}
      style={{ filter: 'drop-shadow(0 4px 10px rgba(15, 23, 42, 0.07))' }}
    >
      <span aria-hidden="true" className="block h-3 w-[46%] rounded-t-[10px] bg-white" />
      <span className="flex flex-col gap-2 rounded-[0_16px_16px_16px] bg-white px-1.5 pt-1.5 pb-2.5">
        <span
          aria-hidden="true"
          className="grid h-[104px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] grid-rows-2 gap-[3px] overflow-hidden rounded-xl"
        >
          <span className="row-span-2 min-h-0">
            <PreviewTile loading={isLoading} src={first} color={folder.color} showIcon />
          </span>
          <span className="min-h-0">
            <PreviewTile loading={isLoading} src={second} color={folder.color} showIcon={false} />
          </span>
          <span className="min-h-0">
            <PreviewTile loading={isLoading} src={third} color={folder.color} showIcon={false} />
          </span>
        </span>

        <span className="flex flex-col gap-px px-1">
          <span className="flex min-w-0 items-center gap-1.5 text-sm/[19px] font-semibold">
            <span
              aria-hidden="true"
              className="size-2 flex-none rounded-full"
              style={{ backgroundColor: folder.color || '#64748b' }}
            />
            <span className="truncate">{folder.name}</span>
          </span>
          <span className="text-xs text-sage-500">{formatRecipeCount(folder.recipe_count)}</span>
          {folder.season_count > 0 ? (
            <span className="flex items-center gap-1 text-xs text-lime-800">
              <Leaf size={11} aria-hidden="true" />
              {folder.season_count} de saison
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  )
}
