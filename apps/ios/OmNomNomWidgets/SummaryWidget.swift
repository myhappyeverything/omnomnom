import WidgetKit
import SwiftUI

// MARK: - Timeline

struct SummaryEntry: TimelineEntry {
    let date: Date
    let summary: WidgetSummary?
    let missingToken: Bool
}

struct SummaryProvider: TimelineProvider {
    func placeholder(in context: Context) -> SummaryEntry {
        SummaryEntry(date: .now, summary: .preview, missingToken: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (SummaryEntry) -> Void) {
        Task {
            let entry = await loadEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SummaryEntry>) -> Void) {
        Task {
            let entry = await loadEntry()
            // Refresh roughly every 30 minutes.
            let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now) ?? .now
            completion(Timeline(entries: [entry], policy: .after(next)))
        }
    }

    private func loadEntry() async -> SummaryEntry {
        guard let token = AppGroup.widgetToken else {
            return SummaryEntry(date: .now, summary: nil, missingToken: true)
        }
        let summary = try? await WidgetSummaryFetcher.fetch(token: token)
        return SummaryEntry(date: .now, summary: summary, missingToken: false)
    }
}

// MARK: - Fetch

enum WidgetSummaryFetcher {
    static func fetch(token: String) async throws -> WidgetSummary {
        let now = Date()
        let cal = Calendar.current
        let start = cal.startOfDay(for: now)
        let end = cal.date(byAdding: .day, value: 1, to: start) ?? now
        let iso = ISO8601DateFormatter()
        let tzOffset = -TimeZone.current.secondsFromGMT() / 60

        var components = URLComponents(string: "\(AppGroup.apiBase)/api/widget-summary")!
        components.queryItems = [
            .init(name: "date", value: dateKey(start)),
            .init(name: "from", value: iso.string(from: start)),
            .init(name: "to", value: iso.string(from: end)),
            .init(name: "tzOffsetMinutes", value: String(tzOffset)),
        ]
        var request = URLRequest(url: components.url!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(WidgetSummary.self, from: data)
    }

    private static func dateKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}

// MARK: - Widget

struct SummaryWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "OmNomNomSummary", provider: SummaryProvider()) { entry in
            SummaryWidgetView(entry: entry)
                .containerBackground(Theme.background, for: .widget)
        }
        .configurationDisplayName("Today")
        .description("Your nutrition score and macros at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

extension WidgetSummary {
    static let preview = WidgetSummary(
        score: 78, label: .good, message: "Solid choices today", mascotMood: .happy,
        macros: .init(calories: .init(consumed: 1200, target: 1649),
                      protein: .init(consumed: 90, target: 165),
                      fat: .init(consumed: 30, target: 55)))
}
