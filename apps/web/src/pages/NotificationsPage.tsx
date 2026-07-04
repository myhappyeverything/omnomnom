import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ApiError } from '@/api/client'
import {
  createCustomReminder,
  deleteCustomReminder,
  getNotificationSettings,
  listCustomReminders,
  updateCustomReminder,
  updateNotificationSettings,
} from '@/api/notifications'
import { isPushSupported, requestPushSubscription } from '@/lib/oneSignal'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WATER_INTERVAL_OPTIONS = [30, 60, 90, 120, 180]

function DayOfWeekPicker({
  value,
  onChange,
}: {
  value: number[]
  onChange: (days: number[]) => void
}) {
  return (
    <div className="flex gap-1.5">
      {DAY_LABELS.map((label, day) => {
        const selected = value.includes(day)
        return (
          <button
            key={day}
            type="button"
            aria-pressed={selected}
            aria-label={
              ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
            }
            onClick={() =>
              onChange(
                selected ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b),
              )
            }
            className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function reportError(error: unknown, fallback: string) {
  toast.error(error instanceof ApiError ? error.message : fallback)
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [subscribing, setSubscribing] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5])

  const settingsQuery = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: getNotificationSettings,
  })
  const remindersQuery = useQuery({
    queryKey: ['notifications', 'reminders'],
    queryFn: listCustomReminders,
  })

  const updateMutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (settings) => queryClient.setQueryData(['notifications', 'settings'], settings),
    onError: (error) => reportError(error, 'Could not save this setting'),
  })

  const createReminderMutation = useMutation({
    mutationFn: createCustomReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'reminders'] })
      toast.success('Reminder added')
      setAddOpen(false)
      setNewLabel('')
      setNewTime('09:00')
      setNewDays([1, 2, 3, 4, 5])
    },
    onError: (error) => reportError(error, 'Could not add this reminder'),
  })

  const toggleReminderMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateCustomReminder(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'reminders'] }),
    onError: (error) => reportError(error, 'Could not update this reminder'),
  })

  const deleteReminderMutation = useMutation({
    mutationFn: deleteCustomReminder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'reminders'] }),
    onError: (error) => reportError(error, 'Could not remove this reminder'),
  })

  async function handleEnablePush() {
    setSubscribing(true)
    try {
      const playerId = await requestPushSubscription()
      if (!playerId) {
        toast.error('Notification permission was not granted')
        return
      }
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      updateMutation.mutate({ onesignalPlayerId: playerId, timezone })
      toast.success('Push notifications enabled')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not enable notifications')
    } finally {
      setSubscribing(false)
    }
  }

  if (settingsQuery.isLoading || remindersQuery.isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="rounded-card h-24 w-full" />
        <Skeleton className="rounded-card h-48 w-full" />
        <Skeleton className="rounded-card h-32 w-full" />
      </div>
    )
  }

  const settings = settingsQuery.data
  const reminders = remindersQuery.data ?? []
  if (!settings) return null

  const pushEnabled = Boolean(settings.onesignalPlayerId)
  const supported = isPushSupported()

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-foreground text-lg font-semibold">Notifications</h1>

      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {pushEnabled ? (
              <Bell className="text-primary" size={20} />
            ) : (
              <BellOff className="text-muted-foreground" size={20} />
            )}
            <div>
              <p className="text-foreground text-sm font-medium">Push notifications</p>
              <p className="text-muted-foreground text-xs">
                {!supported
                  ? 'Not supported in this browser'
                  : pushEnabled
                    ? 'Enabled on this device'
                    : 'Off — enable to get reminders'}
              </p>
            </div>
          </div>
          {supported &&
            (pushEnabled ? (
              <Button
                variant="outline"
                size="sm"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ onesignalPlayerId: null })}
              >
                Disable
              </Button>
            ) : (
              <Button size="sm" disabled={subscribing} onClick={handleEnablePush}>
                Enable
              </Button>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-foreground text-sm font-medium">Meal reminders</p>
          {(
            [
              ['breakfastReminderTime', 'Breakfast'],
              ['lunchReminderTime', 'Lunch'],
              ['dinnerReminderTime', 'Dinner'],
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="flex items-center justify-between gap-4">
              <Label htmlFor={field}>{label}</Label>
              <Input
                id={field}
                type="time"
                className="w-32"
                value={settings[field] ?? ''}
                onChange={(e) => updateMutation.mutate({ [field]: e.target.value || null })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="waterReminderEnabled">Water reminders</Label>
            <Switch
              id="waterReminderEnabled"
              checked={settings.waterReminderEnabled}
              onCheckedChange={(checked) =>
                updateMutation.mutate({
                  waterReminderEnabled: checked,
                  waterReminderIntervalMinutes: settings.waterReminderIntervalMinutes ?? 60,
                })
              }
            />
          </div>
          {settings.waterReminderEnabled && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="waterReminderInterval">Every</Label>
              <Select
                value={String(settings.waterReminderIntervalMinutes ?? 60)}
                onValueChange={(value) =>
                  updateMutation.mutate({ waterReminderIntervalMinutes: Number(value) })
                }
              >
                <SelectTrigger id="waterReminderInterval" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WATER_INTERVAL_OPTIONS.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-foreground text-sm font-medium">Weigh-in reminder</p>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="weighInReminderTime">Time</Label>
            <Input
              id="weighInReminderTime"
              type="time"
              className="w-32"
              value={settings.weighInReminderTime ?? ''}
              onChange={(e) =>
                updateMutation.mutate({ weighInReminderTime: e.target.value || null })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label>Days</Label>
            <DayOfWeekPicker
              value={settings.weighInReminderDays}
              onChange={(days) => updateMutation.mutate({ weighInReminderDays: days })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-foreground text-sm font-medium">Quiet hours</p>
          <p className="text-muted-foreground text-xs">
            No reminders will be sent during this window.
          </p>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="quietHoursStart">From</Label>
            <Input
              id="quietHoursStart"
              type="time"
              className="w-32"
              value={settings.quietHoursStart ?? ''}
              onChange={(e) => updateMutation.mutate({ quietHoursStart: e.target.value || null })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="quietHoursEnd">To</Label>
            <Input
              id="quietHoursEnd"
              type="time"
              className="w-32"
              value={settings.quietHoursEnd ?? ''}
              onChange={(e) => updateMutation.mutate({ quietHoursEnd: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-medium">Custom reminders</p>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus size={14} /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New reminder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newReminderLabel">Label</Label>
                    <Input
                      id="newReminderLabel"
                      value={newLabel}
                      maxLength={100}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Take vitamins"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newReminderTime">Time</Label>
                    <Input
                      id="newReminderTime"
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Days</Label>
                    <DayOfWeekPicker value={newDays} onChange={setNewDays} />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    className="w-full"
                    disabled={
                      newLabel.trim().length === 0 ||
                      newDays.length === 0 ||
                      createReminderMutation.isPending
                    }
                    onClick={() =>
                      createReminderMutation.mutate({
                        label: newLabel.trim(),
                        time: newTime,
                        daysOfWeek: newDays,
                        enabled: true,
                      })
                    }
                  >
                    Add reminder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {reminders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No custom reminders yet.</p>
          ) : (
            reminders.map((reminder, index) => (
              <div key={reminder.id}>
                {index > 0 && <Separator className="mb-3" />}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-foreground text-sm font-medium">{reminder.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {reminder.time} · {reminder.daysOfWeek.map((d) => DAY_LABELS[d]).join(' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={reminder.enabled}
                      aria-label={`Toggle ${reminder.label}`}
                      onCheckedChange={(checked) =>
                        toggleReminderMutation.mutate({ id: reminder.id, enabled: checked })
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Delete ${reminder.label}`}
                      onClick={() => deleteReminderMutation.mutate(reminder.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
