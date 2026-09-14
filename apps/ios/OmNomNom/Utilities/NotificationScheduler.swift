import Foundation
import UserNotifications

/// Schedules on-device reminders from the user's notification settings. Native
/// uses local notifications (the web backend drives push via OneSignal/cron).
enum NotificationScheduler {
    static func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    static func authorizationStatus() async -> UNAuthorizationStatus {
        await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
    }

    /// Clear and rebuild every scheduled reminder from the current settings.
    static func reschedule(settings: NotificationSettingsRecord, reminders: [CustomReminderRecord]) async {
        let center = UNUserNotificationCenter.current()
        center.removeAllPendingNotificationRequests()

        var requests: [UNNotificationRequest] = []

        if let t = settings.breakfastReminderTime {
            requests.append(daily(id: "meal.breakfast", title: "Breakfast time",
                                  body: "Log your breakfast to start the day right.", hhmm: t))
        }
        if let t = settings.lunchReminderTime {
            requests.append(daily(id: "meal.lunch", title: "Lunch time",
                                  body: "Don't forget to log your lunch.", hhmm: t))
        }
        if let t = settings.dinnerReminderTime {
            requests.append(daily(id: "meal.dinner", title: "Dinner time",
                                  body: "Log your dinner before you wind down.", hhmm: t))
        }
        if let t = settings.weighInReminderTime {
            let days = settings.weighInReminderDays.isEmpty ? Array(1...7) : settings.weighInReminderDays
            for day in days {
                requests.append(weekly(id: "weighin.\(day)", title: "Weigh-in reminder",
                                       body: "Time to log your weight.", hhmm: t, weekday: day))
            }
        }
        if settings.waterReminderEnabled, let interval = settings.waterReminderIntervalMinutes, interval >= 30 {
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: Double(interval * 60), repeats: true)
            requests.append(request(id: "water.interval", title: "Hydration",
                                    body: "Time for some water.", trigger: trigger))
        }
        for reminder in reminders where reminder.enabled {
            let days = reminder.daysOfWeek.isEmpty ? Array(1...7) : reminder.daysOfWeek
            for day in days {
                requests.append(weekly(id: "custom.\(reminder.id).\(day)", title: reminder.label,
                                       body: "Reminder from OmNomNom.", hhmm: reminder.time, weekday: day))
            }
        }

        for request in requests {
            try? await center.add(request)
        }
    }

    // MARK: Builders

    /// `weekday` uses the app's 0=Sunday…6=Saturday convention (as stored); we map
    /// to Calendar's 1=Sunday…7=Saturday.
    private static func weekly(id: String, title: String, body: String, hhmm: String, weekday: Int) -> UNNotificationRequest {
        var components = timeComponents(hhmm)
        components.weekday = (weekday % 7) + 1
        return request(id: id, title: title, body: body,
                       trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: true))
    }

    private static func daily(id: String, title: String, body: String, hhmm: String) -> UNNotificationRequest {
        request(id: id, title: title, body: body,
                trigger: UNCalendarNotificationTrigger(dateMatching: timeComponents(hhmm), repeats: true))
    }

    private static func request(id: String, title: String, body: String, trigger: UNNotificationTrigger) -> UNNotificationRequest {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        return UNNotificationRequest(identifier: id, content: content, trigger: trigger)
    }

    private static func timeComponents(_ hhmm: String) -> DateComponents {
        let parts = hhmm.split(separator: ":").compactMap { Int($0) }
        var components = DateComponents()
        components.hour = parts.count > 0 ? parts[0] : 9
        components.minute = parts.count > 1 ? parts[1] : 0
        return components
    }
}
