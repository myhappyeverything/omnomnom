import { useState } from 'react'
import { X } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { cn } from '@/utils/cn'

const DISMISSED_KEY = 'purple:install-prompt-dismissed'

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
        'fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-3 rounded-2xl',
        'bg-violet-900 px-4 py-3 text-white shadow-lg sm:inset-x-auto sm:right-4 sm:w-96',
      )}
    >
      <div className="text-sm">
        {canInstall ? (
          <>
            <p className="font-medium">Install Purple</p>
            <p className="text-white/80">
              Add it to your home screen for quick, full-screen access.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">Install Purple</p>
            <p className="text-white/80">
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
            className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-violet-900"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="rounded-full p-1.5 text-white/80 hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
