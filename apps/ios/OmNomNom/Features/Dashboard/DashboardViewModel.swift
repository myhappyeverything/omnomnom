import SwiftUI
import Observation

@MainActor
@Observable
final class DashboardViewModel {
    var meals: [MealRecord] = []
    var waterLogs: [WaterLogRecord] = []
    var latestWeight: WeightLogRecord?
    var score: NutritionScoreBreakdown?
    var isLoading = false
    var errorMessage: String?

    private let api = APIClient.shared

    // Derived totals for today.
    var consumedCalories: Double { meals.reduce(0) { $0 + $1.totalCalories } }
    var consumedProtein: Double { meals.reduce(0) { $0 + $1.totalProteinG } }
    var consumedCarbs: Double { meals.reduce(0) { $0 + $1.totalCarbsG } }
    var consumedFat: Double { meals.reduce(0) { $0 + $1.totalFatG } }
    var consumedFibre: Double { meals.reduce(0) { $0 + $1.totalFibreG } }
    var consumedWaterMl: Double { waterLogs.reduce(0) { $0 + $1.amountMl } }

    func mealsByType() -> [(type: MealType, meals: [MealRecord])] {
        MealType.allCases.map { type in
            (type, meals.filter { $0.mealType == type })
        }
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        let today = Date.todayRange()
        let recent = Date.range(daysBack: 60)
        do {
            async let mealsTask = api.meals(from: today.from, to: today.to)
            async let waterTask = api.water(from: today.from, to: today.to)
            async let weightTask = try? await api.weight(from: recent.from, to: recent.to)
            async let scoreTask = try? await api.nutritionScore()

            meals = try await mealsTask
            waterLogs = try await waterTask
            latestWeight = (await weightTask ?? []).max(by: { ($0.loggedAt) < ($1.loggedAt) })
            score = await scoreTask
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't load your day."
        }
        isLoading = false
    }

    func addWater(ml: Int) async {
        do {
            let log = try await api.logWater(CreateWaterLogInput(
                amountMl: Double(ml), loggedAt: ISO8601.string(from: .now),
                clientId: UUID().uuidString))
            waterLogs.append(log)
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
    }
}
