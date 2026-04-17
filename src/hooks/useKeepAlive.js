import { useCallback, useEffect, useRef } from 'react'

export function useKeepAlive(url, intervalMinutes = 10) {
  const intervalRef = useRef(null)

  const clearPingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const ping = useCallback(async () => {
    if (!url) {
      return
    }

    if (document.visibilityState !== 'visible') {
      return
    }

    if (!navigator.onLine) {
      return
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      console.log(`[keep-alive] success: ${new Date().toISOString()} (${url})`)
    } catch (error) {
      console.error(`[keep-alive] failure: ${new Date().toISOString()} (${url})`, error)
    }
  }, [url])

  useEffect(() => {
    if (!url) {
      console.warn('[keep-alive] disabled: no URL configured')
      return undefined
    }

    const intervalMs = Math.max(1, Number(intervalMinutes) || 10) * 60 * 1000

    const start = () => {
      if (intervalRef.current) {
        return
      }

      intervalRef.current = setInterval(() => {
        void ping()
      }, intervalMs)
    }

    const stop = () => {
      clearPingInterval()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void ping()
        start()
        return
      }

      stop()
      console.log('[keep-alive] paused: tab hidden or browser offline')
    }

    const onOnline = () => {
      if (document.visibilityState !== 'visible') {
        return
      }

      console.log('[keep-alive] resumed: browser is online')
      void ping()
      start()
    }

    const onOffline = () => {
      stop()
      console.log('[keep-alive] paused: browser is offline')
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    if (document.visibilityState === 'visible' && navigator.onLine) {
      void ping()
      start()
    } else {
      console.log('[keep-alive] idle: waiting for visible + online state')
    }

    return () => {
      clearPingInterval()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [clearPingInterval, intervalMinutes, ping, url])
}
