import { useEffect, useState } from 'react'

// Passe à true (une fois pour toutes) quand l'élément approche de l'écran.
// Renvoie la ref à poser sur l'élément et l'état.
export default function useInView({ rootMargin = '300px 0px' } = {}) {
  const [node, setNode] = useState(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!node || inView) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true)
      },
      { rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, inView, rootMargin])

  return [setNode, inView]
}
