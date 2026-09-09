import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { Page } from '../components/ui'

function extractUrl(searchParams) {
  const candidates = [searchParams.get('url'), searchParams.get('text'), searchParams.get('title')]

  for (const candidate of candidates) {
    if (!candidate) continue
    const match = candidate.match(/https?:\/\/\S+/)
    if (match) return match[0]
  }

  return ''
}

export default function ShareTargetPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const sharedUrl = extractUrl(searchParams)

    if (sharedUrl) {
      navigate(`/recipes/import?url=${encodeURIComponent(sharedUrl)}&autoImport=1`, { replace: true })
    } else {
      navigate('/recipes/import', { replace: true })
    }
  }, [searchParams, navigate])

  return (
    <Page>
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-sage-700">
        <LoaderCircle size={28} className="animate-spin" />
        <p className="text-sm">Réception du lien partagé...</p>
      </div>
    </Page>
  )
}
