import Foundation

/// Shared formatters + day math. The API emits ISO-8601 datetimes and
/// `yyyy-MM-dd` birth dates; these helpers parse/format them consistently.
enum ISO8601 {
    // Foundation date formatters are thread-safe for formatting/parsing.
    nonisolated(unsafe) static let datetime: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    nonisolated(unsafe) static let datetimeNoFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    nonisolated(unsafe) static let dateOnly: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "UTC")
        return f
    }()

    static func date(from string: String) -> Date? {
        datetime.date(from: string) ?? datetimeNoFraction.date(from: string) ?? dateOnly.date(from: string)
    }

    static func string(from date: Date) -> String {
        datetimeNoFraction.string(from: date)
    }

    static func dateOnlyString(from date: Date) -> String {
        dateOnly.string(from: date)
    }
}

extension Date {
    /// [startOfDay, startOfNextDay) in the user's current calendar.
    static func todayRange(calendar: Calendar = .current, now: Date = .now) -> (from: String, to: String) {
        let start = calendar.startOfDay(for: now)
        let end = calendar.date(byAdding: .day, value: 1, to: start) ?? now
        return (ISO8601.string(from: start), ISO8601.string(from: end))
    }

    static func range(daysBack: Int, calendar: Calendar = .current, now: Date = .now) -> (from: String, to: String) {
        let end = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now)) ?? now
        let start = calendar.date(byAdding: .day, value: -daysBack, to: calendar.startOfDay(for: now)) ?? now
        return (ISO8601.string(from: start), ISO8601.string(from: end))
    }
}
