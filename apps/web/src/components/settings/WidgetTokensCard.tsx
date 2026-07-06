import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, Plus, Smartphone, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ApiError } from '@/api/client'
import {
  createWidgetToken,
  listWidgetTokens,
  revokeWidgetToken,
  WIDGET_TOKENS_QUERY_KEY,
} from '@/api/widgetTokens'
import setupScript from '@/lib/scriptable/setup.js?raw'
import smallWidgetScript from '@/lib/scriptable/small-widget.js?raw'
import mediumWidgetScript from '@/lib/scriptable/medium-widget.js?raw'

function formatLastUsed(iso: string | null) {
  if (!iso) return 'Never used'
  return `Last used ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

const SCRIPTABLE_SCRIPTS = [
  { key: 'setup', name: 'OmNomNom Widget Setup', code: setupScript },
  { key: 'small', name: 'OmNomNom Widget Small', code: smallWidgetScript },
  { key: 'medium', name: 'OmNomNom Widget Medium', code: mediumWidgetScript },
] as const

async function copyScript(name: string, code: string) {
  await navigator.clipboard.writeText(code)
  toast.success(`Copied "${name}" — paste it into a new Scriptable script`)
}

export function WidgetTokensCard() {
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [issuedToken, setIssuedToken] = useState<{ token: string; label: string } | null>(null)

  const tokensQuery = useQuery({ queryKey: WIDGET_TOKENS_QUERY_KEY, queryFn: listWidgetTokens })

  const createMutation = useMutation({
    mutationFn: createWidgetToken,
    onSuccess: (issued) => {
      queryClient.invalidateQueries({ queryKey: WIDGET_TOKENS_QUERY_KEY })
      setCreating(false)
      setLabel('')
      setIssuedToken({ token: issued.token, label: issued.label })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not create a widget token')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: revokeWidgetToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGET_TOKENS_QUERY_KEY })
      toast.success('Widget token revoked')
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not revoke this token')
    },
  })

  async function copyIssuedToken() {
    if (!issuedToken) return
    await navigator.clipboard.writeText(issuedToken.token)
    toast.success('Copied to clipboard')
  }

  const tokens = tokensQuery.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Widget access
        </p>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus size={16} /> Generate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate a widget token</DialogTitle>
              <DialogDescription>
                Grants read-only access to today&apos;s score for a home screen widget (e.g.
                Scriptable). It can&apos;t log meals, change settings, or do anything else on your
                account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="widget-token-label">Label</Label>
              <Input
                id="widget-token-label"
                placeholder="iPhone Home Screen"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={60}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={!label.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate(label.trim())}
              >
                {createMutation.isPending ? 'Generating…' : 'Generate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-muted-foreground text-sm">
        Tokens for home screen widgets that read your daily score. Revoke one any time — it
        won&apos;t affect your login.
      </p>

      {tokens.length > 0 && (
        <ul className="space-y-2">
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Smartphone size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-foreground text-sm font-medium">{token.label}</p>
                  <p className="text-muted-foreground text-xs">{formatLastUsed(token.lastUsedAt)}</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke &quot;{token.label}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Any widget using this token will stop updating immediately. You can always
                      generate a new one.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={revokeMutation.isPending}
                      onClick={() => revokeMutation.mutate(token.id)}
                    >
                      Revoke
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-2xl border px-4 py-3">
        <p className="text-foreground text-sm font-medium">Scriptable widget code</p>
        <p className="text-muted-foreground text-sm">
          Install the free{' '}
          <a
            href="https://apps.apple.com/app/scriptable/id1405459188"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Scriptable
          </a>{' '}
          app, then for each script below: create a new script in Scriptable, paste it in, and run
          the setup script once to save your token. Add the widget scripts to your Home Screen via
          long-press → Add Widget → Scriptable.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SCRIPTABLE_SCRIPTS.map((script) => (
            <Button
              key={script.key}
              variant="secondary"
              size="sm"
              onClick={() => void copyScript(script.name, script.code)}
            >
              <Copy size={14} /> {script.name.replace('OmNomNom Widget ', '')}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={issuedToken !== null} onOpenChange={(open) => !open && setIssuedToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your widget token</DialogTitle>
            <DialogDescription>
              Copy this now — for your security, it won&apos;t be shown again. Paste it into the
              Scriptable setup script when prompted.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted overflow-x-auto rounded-lg border p-3">
            <code className="text-xs break-all">{issuedToken?.token}</code>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => void copyScript('OmNomNom Widget Setup', setupScript)}
            >
              <Copy size={16} /> Copy setup script
            </Button>
            <Button onClick={() => void copyIssuedToken()}>
              <Copy size={16} /> Copy token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
