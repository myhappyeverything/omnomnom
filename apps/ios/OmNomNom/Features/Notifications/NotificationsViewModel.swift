import SwiftUI
import Observation
import UserNotifications

/// HH:MM ↔ Date helpers, kept outside the @Observable class so they can be used
/// in stored-property default values.
enum HHMM {
    static func date(from hhmm: String) -> Date {
        let parts = hhmm.split(separator: ":").compactMap { Int($0) }
        return Calendar.current.date(bySettingHour: parts.first ?? 9, minute: parts.count > 1 ? parts[1] : 0,
                                     second: 0, of: .now) ?? .now
    }

    static func string(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.hour, .minute], from: date)
        return String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
    }
}

@MainActor
@Observable
final class NotificationsViewModel {
    // Meal reminders
    var breakfastEnabled = false
    var breakfastTime = HHMM.date(from: "08:00")
    var lunchEnabled = false
    var lunchTime = HHMM.date(from: "12:30")
    var dinnerEnabled = false
    var dinnerTime = HHMM.date(from: "19:00")

    // Water
    var waterEnabled = false
    var waterInterval = 120

    // Weigh-in
    var weighInEnabled = false
    var weighInTime = HHMM.date(from: "07:30")
    var weighInDays: Set<Int> = [1]   // Monday (0=Sun…6=Sat)

    // Quiet hours
    var quietEnabled = false
    var quietStart = HHMM.date(from: "22:00")
    var quietEnd = HHMM.date(from: "07:00")

    var reminders: [CustomReminderRecord] = []
    var authStatus: UNAuthorizationStatus = .notDetermined
    var isLoading = false
    var isSaving = false
    var errorMessage: String?

    private let api = APIClient.shared
    private var settings: NotificationSettingsRecord?

    func load() async {
        isLoading = true
        authStatus = await NotificationScheduler.authorizationStatus()
        do {
            async let s = api.notificationSettings()
            async let r = api.customReminders()
            let settings = try await s
            self.settings = settings
            apply(settings)
            reminders = try await r
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
        isLoading = false
    }

    private func apply(_ s: NotificationSettingsRecord) {
        if let t = s.breakfastReminderTime { breakfastEnabled = true; breakfastTime = HHMM.date(from: t) }
        if let t = s.lunchReminderTime { lunchEnabled = true; lunchTime = HHMM.date(from: t) }
        if let t = s.dinnerReminderTime { dinnerEnabled = true; dinnerTime = HHMM.date(from: t) }
        waterEnabled = s.waterReminderEnabled
        if let i = s.waterReminderIntervalMinutes { waterInterval = i }
        if let t = s.weighInReminderTime { weighInEnabled = true; weighInTime = HHMM.date(from: t) }
        if !s.weighInReminderDays.isEmpty { weighInDays = Set(s.weighInReminderDays) }
        if let start = s.quietHoursStart, let end = s.quietHoursEnd {
            quietEnabled = true; quietStart = HHMM.date(from: start); quietEnd = HHMM.date(from: end)
        }
    }

    func requestPermission() async {
        _ = await NotificationScheduler.requestAuthorization()
        authStatus = await NotificationScheduler.authorizationStatus()
    }

    func save() async {
        isSaving = true
        errorMessage = nil
        let input = UpdateNotificationSettingsInput(
            breakfastReminderTime: breakfastEnabled ? HHMM.string(breakfastTime) : nil,
            lunchReminderTime: lunchEnabled ? HHMM.string(lunchTime) : nil,
            dinnerReminderTime: dinnerEnabled ? HHMM.string(dinnerTime) : nil,
            waterReminderEnabled: waterEnabled,
            waterReminderIntervalMinutes: waterEnabled ? waterInterval : nil,
            weighInReminderTime: weighInEnabled ? HHMM.string(weighInTime) : nil,
            weighInReminderDays: weighInEnabled ? weighInDays.sorted() : [],
            quietHoursStart: quietEnabled ? HHMM.string(quietStart) : nil,
            quietHoursEnd: quietEnabled ? HHMM.string(quietEnd) : nil,
            timezone: TimeZone.current.identifier)
        do {
            let updated = try await api.updateNotificationSettings(input)
            settings = updated
            if authStatus != .authorized { await requestPermission() }
            await NotificationScheduler.reschedule(settings: updated, reminders: reminders)
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't save reminders."
        }
        isSaving = false
    }

    // MARK: Custom reminders

    func addReminder(label: String, time: Date, days: Set<Int>) async {
        do {
            let created = try await api.createReminder(CreateCustomReminderInput(
                label: label, time: HHMM.string(time), daysOfWeek: days.sorted(), enabled: true))
            reminders.append(created)
            if let settings { await NotificationScheduler.reschedule(settings: settings, reminders: reminders) }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
    }

    func deleteReminder(_ reminder: CustomReminderRecord) async {
        do {
            try await api.deleteReminder(id: reminder.id)
            reminders.removeAll { $0.id == reminder.id }
            if let settings { await NotificationScheduler.reschedule(settings: settings, reminders: reminders) }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
    }

}
