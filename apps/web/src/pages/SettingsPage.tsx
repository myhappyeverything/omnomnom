import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, LogOut, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Divider } from '@/components/ui/divider'
import { Skeleton } from '@/components/ui/skeleton'
import { Footer } from '@/components/Footer'
import { ProfileCard } from '@/components/settings/ProfileCard'
import { GoalCard } from '@/components/settings/GoalCard'
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
      <div className="space-y-6 px-6 pt-8 pb-6">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    )
  }

  const settings = settingsQuery.data
  if (!settings) return null

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="text-foreground mb-8 text-3xl font-bold tracking-tight">Settings</h1>

      {user && (
        <>
          <p className="text-foreground text-lg font-semibold">{user.name}</p>
          <p className="text-muted-foreground mb-5 text-sm">{user.email}</p>
          <ProfileCard user={user} />
        </>
      )}

      <Divider className="my-8" />

      {user && <GoalCard user={user} />}

      <Divider className="my-8" />

      <div className="space-y-5">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Preferences
        </p>
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
        <Button asChild variant="secondary" className="w-full">
          <Link to="/notifications">Notification settings</Link>
        </Button>
      </div>

      <Divider className="my-8" />

      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Your data
        </p>
        <p className="text-muted-foreground text-sm">
          Download everything OmNomNom has stored for you as a single JSON file. Importing restores
          water and weight entries from an OmNomNom export — safe to re-run, existing entries
          won&apos;t be duplicated.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="secondary" disabled={isExporting} onClick={handleExport}>
            <Download size={16} /> {isExporting ? 'Exporting…' : 'Download my data'}
          </Button>
          <Button
            variant="secondary"
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
      </div>

      <Divider className="my-8" />

      <div className="space-y-3">
        <Button variant="secondary" className="w-full" onClick={() => void logout()}>
          <LogOut size={16} /> Log out
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" className="text-destructive hover:text-destructive w-full">
              <Trash2 size={16} /> Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your account and everything in it — meals, water and weight
                logs, goals, and settings. This can&apos;t be undone. Consider downloading your data
                first.
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
      </div>

      <Footer />
    </div>
  )
}
