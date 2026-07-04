import { useState } from 'react'
import { X } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { cn } from '@/utils/cn'

const DISMISSED_KEY = 'omnomnom:install-prompt-dismissed'

export function InstallPrompt() {
  const { canInstall, isIos, isInstalled, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1')

  if (isInstalled || dismissed || (!canInstall && !isIos)) return null

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      className={cn(
        'fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 rounded-2xl',
        'bg-primary text-primary-foreground px-4 py-3 shadow-lg sm:inset-x-auto sm:right-4 sm:w-96',
      )}
    >
      <div className="text-sm">
        {canInstall ? (
          <>
            <p className="font-medium">Install OmNomNom</p>
            <p className="text-primary-foreground/80">
              Add it to your home screen for quick, full-screen access.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">Install OmNomNom</p>
            <p className="text-primary-foreground/80">
              Tap the Share icon, then &quot;Add to Home Screen&quot;.
            </p>
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className="bg-primary-foreground text-primary rounded-full px-3 py-1.5 text-sm font-medium"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="text-primary-foreground/80 rounded-full p-1.5 hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
