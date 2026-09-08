import { useEffect, useState } from 'react'

const DESKTOP_BREAKPOINT = '(min-width: 900px)'
const DEVICE_WIDTH = 390
const DEVICE_HEIGHT = 844

function isInsideIframe() {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

export default function PhoneFrame({ children }) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_BREAKPOINT).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT)
    const update = () => setIsDesktop(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }

    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  if (isInsideIframe() || !isDesktop) {
    return children
  }

  return (
    <div className="phone-frame-backdrop">
      <div className="phone-frame">
        <iframe
          key="phone-frame-iframe"
          title="Aperçu mobile"
          src={window.location.href}
          className="phone-frame-screen"
          width={DEVICE_WIDTH}
          height={DEVICE_HEIGHT}
        />
      </div>
    </div>
  )
}
