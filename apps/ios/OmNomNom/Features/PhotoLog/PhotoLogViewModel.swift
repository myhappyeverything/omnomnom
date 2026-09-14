import SwiftUI
import Observation

@MainActor
@Observable
final class PhotoLogViewModel {
    enum Stage: Equatable { case capture, analyzing, review }

    struct DraftItem: Identifiable {
        let id = UUID()
        var recognized: RecognizedFoodItem
        var matchedFood: FoodRecord?
        var quantity: Double
        var include: Bool
    }

    var stage: Stage = .capture
    var previewImage: UIImage?
    var items: [DraftItem] = []
    var mealType: MealType = .inferred()
    var fromCache = false
    var errorMessage: String?
    var isSaving = false

    private let api = APIClient.shared
    private var r2Key: String?

    func analyze(_ image: UIImage) async {
        previewImage = image
        stage = .analyzing
        errorMessage = nil
        guard let payload = ImageCompression.encode(image) else {
            errorMessage = "Couldn't process that photo."
            stage = .capture
            return
        }
        do {
            let result = try await api.analyzePhoto(payload)
            r2Key = result.r2Key
            fromCache = result.fromCache
            items = result.items.map { recognized in
                DraftItem(
                    recognized: recognized,
                    matchedFood: recognized.matchedFood,
                    quantity: defaultQuantity(for: recognized),
                    include: recognized.matchedFood != nil
                )
            }
            stage = .review
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't analyze this photo."
            stage = .capture
        }
    }

    private func defaultQuantity(for item: RecognizedFoodItem) -> Double {
        guard let food = item.matchedFood else { return item.estimatedQuantityGrams }
        return food.servingUnit == "g" ? item.estimatedQuantityGrams : food.servingSize
    }

    var confirmedCount: Int { items.filter { $0.include && $0.matchedFood != nil }.count }

    func save() async -> MealRecord? {
        let confirmed = items.filter { $0.include && $0.matchedFood != nil }
        guard !confirmed.isEmpty else { return nil }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            var mealItems: [MealItemInput] = []
            for draft in confirmed {
                guard let food = draft.matchedFood else { continue }
                let foodId = try await api.resolveFoodId(food)
                mealItems.append(MealItemInput(
                    foodId: foodId, recipeId: nil, quantity: draft.quantity,
                    unit: food.servingUnit, aiConfidence: draft.recognized.confidence))
            }
            return try await api.createMeal(CreateMealInput(
                mealType: mealType,
                loggedAt: ISO8601.string(from: .now),
                notes: nil, photoR2Key: r2Key, clientId: UUID().uuidString,
                items: mealItems))
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't save this meal."
            return nil
        }
    }
}
