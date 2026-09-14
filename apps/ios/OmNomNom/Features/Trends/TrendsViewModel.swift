import SwiftUI
import Observation

@MainActor
@Observable
final class TrendsViewModel {
    enum Section: String, CaseIterable, Identifiable {
        case nutrition = "Nutrition"
        case weight = "Weight"
        case water = "Water"
        var id: String { rawValue }
    }

    enum Range: String, CaseIterable, Identifiable {
        case week = "7D", month = "30D", quarter = "90D", year = "1Y"
        var id: String { rawValue }
        var days: Int {
            switch self {
            case .week: 7
            case .month: 30
            case .quarter: 90
            case .year: 365
            }
        }
    }

    var section: Section = .nutrition { didSet { Task { await load() } } }
    var range: Range = .month { didSet { Task { await load() } } }

    var scores: [DailyScoreSummary] = []
    var calendarScores: [DailyScoreSummary] = []   // a year, for the history calendar
    var weights: [WeightLogRecord] = []
    var waters: [WaterLogRecord] = []
    var isLoading = false
    var errorMessage: String?

    private let api = APIClient.shared

    // MARK: Loading

    func load() async {
        isLoading = true
        errorMessage = nil
        let bounds = Date.range(daysBack: range.days)
        do {
            switch section {
            case .nutrition:
                scores = try await api.nutritionScoreRange(from: bounds.from, to: bounds.to)
                let year = Date.range(daysBack: 365)
                calendarScores = (try? await api.nutritionScoreRange(from: year.from, to: year.to)) ?? calendarScores
            case .weight:
                weights = try await api.weight(from: Date.range(daysBack: max(range.days, 365)).from,
                                               to: bounds.to)
            case .water:
                waters = try await api.water(from: bounds.from, to: bounds.to)
            }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
        isLoading = false
    }

    // MARK: Weight helpers

    /// Weight logs within the active range, oldest → newest.
    func weightsInRange() -> [WeightLogRecord] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -range.days, to: .now) ?? .now
        return weights
            .compactMap { log -> (Date, WeightLogRecord)? in
                guard let d = ISO8601.date(from: log.loggedAt) else { return nil }
                return (d, log)
            }
            .filter { $0.0 >= cutoff }
            .sorted { $0.0 < $1.0 }
            .map(\.1)
    }

    var latestWeight: WeightLogRecord? {
        weights.max { ($0.loggedAt) < ($1.loggedAt) }
    }

    /// Change (kg) across the current range.
    var weightChange: Double? {
        let inRange = weightsInRange()
        guard let first = inRange.first, let last = inRange.last, first.id != last.id else { return nil }
        return last.weightKg - first.weightKg
    }

    /// Average change per week across the range.
    var weeklyChange: Double? {
        guard let change = weightChange else { return nil }
        let inRange = weightsInRange()
        guard let first = inRange.first, let last = inRange.last,
              let d0 = ISO8601.date(from: first.loggedAt), let d1 = ISO8601.date(from: last.loggedAt),
              d1 > d0 else { return nil }
        let weeks = d1.timeIntervalSince(d0) / (7 * 24 * 3600)
        return weeks > 0 ? change / weeks : nil
    }

    func logWeight(displayValue: Double, system: UnitSystem) async {
        let kg = Units.kg(fromDisplay: displayValue, system)
        do {
            let log = try await api.logWeight(CreateWeightLogInput(
                weightKg: kg, loggedAt: ISO8601.string(from: .now), notes: nil,
                clientId: UUID().uuidString))
            weights.append(log)
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
    }

    func deleteWeight(_ log: WeightLogRecord) async {
        do {
            try await api.deleteWeight(id: log.id)
            weights.removeAll { $0.id == log.id }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
    }

    // MARK: Water helpers

    /// Water totals (ml) bucketed by local day within range, oldest → newest.
    func waterByDay() -> [(date: Date, ml: Double)] {
        let cal = Calendar.current
        var buckets: [Date: Double] = [:]
        for log in waters {
            guard let d = ISO8601.date(from: log.loggedAt) else { continue }
            let day = cal.startOfDay(for: d)
            buckets[day, default: 0] += log.amountMl
        }
        return buckets.map { (date: $0.key, ml: $0.value) }.sorted { $0.date < $1.date }
    }

    // MARK: Nutrition helpers

    var averageScore: Double? {
        guard !scores.isEmpty else { return nil }
        return scores.map(\.score).reduce(0, +) / Double(scores.count)
    }
}
