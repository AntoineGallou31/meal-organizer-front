import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY = 'recipes-scroll'
const MAX_ENTRIES = 20

function readPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

function writePositions(positions) {
  try {
    const entries = Object.entries(positions).slice(-MAX_ENTRIES)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    // Stockage indisponible (navigation privée…) : la position ne sera pas restaurée
  }
}

// Position de scroll liée à l'entrée d'historique : un retour en arrière la retrouve,
// une nouvelle visite repart du haut. `ready` indique que le contenu est chargé.
// Renvoie la fonction à appeler juste avant de quitter la page par un lien.
export default function useScrollRestoration(ready) {
  const { key } = useLocation()
  const handledKeyRef = useRef(null)

  useEffect(() => {
    if (handledKeyRef.current === key) return

    const positions = readPositions()
    const target = positions[key]

    if (target == null) {
      handledKeyRef.current = key
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }

    if (!ready) return

    handledKeyRef.current = key
    delete positions[key]
    writePositions(positions)

    // Les images et les pages suivantes peuvent encore agrandir la page : on insiste quelques images
    let attempts = 0
    const restore = () => {
      window.scrollTo({ top: target, behavior: 'instant' })
      attempts += 1
      if (document.documentElement.scrollHeight - window.innerHeight < target && attempts < 20) {
        requestAnimationFrame(restore)
      }
    }
    requestAnimationFrame(restore)
  }, [key, ready])

  return useCallback(() => {
    const positions = readPositions()
    delete positions[key]
    positions[key] = window.scrollY
    writePositions(positions)
  }, [key])
}
