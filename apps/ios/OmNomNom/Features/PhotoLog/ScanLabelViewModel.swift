import SwiftUI
import Observation

@MainActor
@Observable
final class ScanLabelViewModel {
    enum Stage: Equatable { case capture, analyzing, form }

    var stage: Stage = .capture
    var previewImage: UIImage?

    // Editable custom-food fields (prefilled from the label analysis).
    var name = ""
    var brand = ""
    var servingSize: Double = 100
    var servingUnit = "g"
    var calories: Double = 0
    var proteinG: Double = 0
    var carbsG: Double = 0
    var fatG: Double = 0
    var fibreG: Double = 0
    var mealType: MealType = .inferred()

    var errorMessage: String?
    var isSaving = false

    private let api = APIClient.shared

    var canSave: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty && servingSize > 0 }

    func analyze(_ image: UIImage) async {
        previewImage = image
        stage = .analyzing
        errorMessage = nil
        guard let payload = ImageCompression.encode(image) else {
            errorMessage = "Couldn't process that photo."; stage = .capture; return
        }
        do {
            let result = try await api.analyzeLabel(payload)
            if let n = result.name { name = n }
            if let b = result.brand { brand = b }
            if let s = result.servingSize { servingSize = s }
            if let u = result.servingUnit { servingUnit = u }
            if let c = result.calories { calories = c }
            if let p = result.proteinG { proteinG = p }
            if let c = result.carbsG { carbsG = c }
            if let f = result.fatG { fatG = f }
            if let f = result.fibreG { fibreG = f }
            stage = .form
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't read that label."
            stage = .capture
        }
    }

    /// Create the custom food, then log it as a meal (mirrors ScanLabelPage).
    func save() async -> MealRecord? {
        guard canSave else { return nil }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            let food = try await api.createCustomFood(CreateCustomFoodInput(
                name: name.trimmingCharacters(in: .whitespaces),
                brand: brand.isEmpty ? nil : brand,
                servingSize: servingSize, servingUnit: servingUnit,
                calories: calories, proteinG: proteinG, carbsG: carbsG, fatG: fatG, fibreG: fibreG,
                barcode: nil))
            return try await api.createMeal(CreateMealInput(
                mealType: mealType, loggedAt: ISO8601.string(from: .now),
                notes: nil, photoR2Key: nil, clientId: UUID().uuidString,
                items: [MealItemInput(foodId: food.id, recipeId: nil, quantity: servingSize,
                                      unit: servingUnit, aiConfidence: nil)]))
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't save this food."
            return nil
        }
    }
}
