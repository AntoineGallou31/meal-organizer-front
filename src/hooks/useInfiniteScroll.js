import { useEffect, useState } from 'react'

// Charge la page suivante quand la sentinelle approche de l'écran.
// Renvoie la ref à poser sur la sentinelle.
export default function useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage }) {
  const [node, setNode] = useState(null)

  useEffect(() => {
    if (!node || !hasNextPage || isFetchingNextPage) return undefined

    // Ré-observé après chaque page : si la sentinelle est encore visible, la suivante se charge aussi
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) fetchNextPage({ cancelRefetch: false })
      },
      { rootMargin: '240px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, hasNextPage, isFetchingNextPage, fetchNextPage])

  return setNode
}
