import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneDisplayMode(): boolean {
  const iosStandalone = (navigator as { standalone?: boolean }).standalone === true
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone
}

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
}

export interface InstallPromptState {
  /** True once the browser has signalled the app is installable (Chrome/Edge/Android). */
  canInstall: boolean
  /** True on iOS Safari, which never fires beforeinstallprompt — needs manual instructions. */
  isIos: boolean
  /** True if already running as an installed PWA — callers should hide install UI entirely. */
  isInstalled: boolean
  promptInstall: () => Promise<void>
}

export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplayMode)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setDeferredPrompt(null)
  }

  return {
    canInstall: deferredPrompt !== null,
    isIos: isIosDevice(),
    isInstalled,
    promptInstall,
  }
}
