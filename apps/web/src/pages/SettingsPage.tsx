import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, LogOut, Trash2, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { updateSettings } from '@/api/settings'
import { downloadDataExport, fetchDataExport } from '@/api/export'
import { importDataExport } from '@/lib/dataImport'
import { useSettings, SETTINGS_QUERY_KEY } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/context/AuthContext'

export function SettingsPage() {
  const settingsQuery = useSettings()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const { user, logout, deleteAccount } = useAuth()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (settings) => queryClient.setQueryData(SETTINGS_QUERY_KEY, settings),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not save this setting')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete your account')
    },
  })

  async function handleExport() {
    setIsExporting(true)
    try {
      const data = await fetchDataExport()
      downloadDataExport(data)
      toast.success('Your data was downloaded')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not export your data')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleImportFile(file: File) {
    setIsImporting(true)
    try {
      const text = await file.text()
      const result = await importDataExport(text)
      queryClient.invalidateQueries({ queryKey: ['water'] })
      queryClient.invalidateQueries({ queryKey: ['weight'] })
      if (result.errors.length > 0) {
        toast.error(`Imported with ${result.errors.length} error(s) — see console for details`)
        console.error('Import errors:', result.errors)
      } else {
        toast.success(
          `Imported ${result.waterImported} water and ${result.weightImported} weight entries`,
        )
      }
    } catch {
      toast.error('This file could not be read as an OmNomNom export')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="rounded-card h-40 w-full" />
        <Skeleton className="rounded-card h-32 w-full" />
        <Skeleton className="rounded-card h-32 w-full" />
      </div>
    )
  }

  const settings = settingsQuery.data
  if (!settings) return null

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-foreground text-lg font-semibold">Settings</h1>

      {user && (
        <Card>
          <CardContent>
            <p className="text-foreground text-sm font-medium">{user.name}</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4">
          <p className="text-foreground text-sm font-medium">Preferences</p>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="unitSystem">Units</Label>
            <Select
              value={settings.unitSystem}
              onValueChange={(value) =>
                updateSettingsMutation.mutate({ unitSystem: value as 'metric' | 'imperial' })
              }
            >
              <SelectTrigger id="unitSystem" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg)</SelectItem>
                <SelectItem value="imperial">Imperial (lb)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="theme">Appearance</Label>
            <Select
              value={theme}
              onValueChange={(value) => {
                const next = value as 'light' | 'dark' | 'system'
                setTheme(next)
                updateSettingsMutation.mutate({ theme: next })
              }}
            >
              <SelectTrigger id="theme" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <Button asChild variant="outline" className="w-full">
            <Link to="/notifications">Notification settings</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <p className="text-foreground text-sm font-medium">Your data</p>
          <p className="text-muted-foreground text-xs">
            Download everything OmNomNom has stored for you as a single JSON file. Importing
            restores water and weight entries from an OmNomNom export — safe to re-run, existing
            entries won&apos;t be duplicated.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" disabled={isExporting} onClick={handleExport}>
              <Download size={16} /> {isExporting ? 'Exporting…' : 'Download my data'}
            </Button>
            <Button
              variant="outline"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> {isImporting ? 'Importing…' : 'Import data'}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImportFile(file)
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <p className="text-foreground text-sm font-medium">Legal</p>
          <div className="flex flex-col gap-2">
            <Link to="/privacy" className="text-primary text-sm hover:underline">
              Privacy policy
            </Link>
            <Link to="/terms" className="text-primary text-sm hover:underline">
              Terms of use
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => void logout()}>
            <LogOut size={16} /> Log out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive w-full">
                <Trash2 size={16} /> Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your account and everything in it — meals, water and
                  weight logs, goals, and settings. This can&apos;t be undone. Consider downloading
                  your data first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteAccountMutation.isPending}
                  onClick={() => deleteAccountMutation.mutate()}
                >
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
