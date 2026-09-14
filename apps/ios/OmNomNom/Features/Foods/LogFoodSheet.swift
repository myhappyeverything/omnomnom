import SwiftUI

/// Sheet to log a chosen food: pick a quantity (in the food's serving unit) and
/// meal type, preview the scaled macros, then create the meal.
struct LogFoodSheet: View {
    let food: FoodRecord
    var defaultMealType: MealType = .inferred()
    var onLogged: (MealRecord) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var quantity: Double
    @State private var mealType: MealType
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(food: FoodRecord, defaultMealType: MealType = .inferred(), onLogged: @escaping (MealRecord) -> Void) {
        self.food = food
        self.defaultMealType = defaultMealType
        self.onLogged = onLogged
        _quantity = State(initialValue: food.servingSize)
        _mealType = State(initialValue: defaultMealType)
    }

    private var scale: Double { food.servingSize > 0 ? quantity / food.servingSize : 1 }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    VStack(spacing: 4) {
                        Text(food.name).font(.title2.weight(.bold)).multilineTextAlignment(.center)
                        if let brand = food.brand, !brand.isEmpty {
                            Text(brand).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }

                    Card {
                        VStack(spacing: Theme.Spacing.md) {
                            Text("\(Int(food.calories * scale))")
                                .font(.system(size: 40, weight: .bold, design: .rounded))
                                .foregroundStyle(Theme.accent)
                                .contentTransition(.numericText())
                            Text("kcal").font(.caption).foregroundStyle(.secondary)
                            Divider()
                            HStack(spacing: Theme.Spacing.md) {
                                macro("Protein", food.proteinG * scale, Theme.protein)
                                macro("Carbs", food.carbsG * scale, Theme.carbs)
                                macro("Fat", food.fatG * scale, Theme.fat)
                                macro("Fibre", food.fibreG * scale, Theme.fibre)
                            }
                        }
                    }

                    Card {
                        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                            HStack {
                                Text("Amount (\(food.servingUnit))")
                                Spacer()
                                Text("\(Int(quantity))").font(.headline).monospacedDigit()
                                Stepper("", value: $quantity, in: 1...5000,
                                        step: food.servingUnit == "g" ? 10 : 1).labelsHidden()
                            }
                            Divider()
                            Picker("Meal", selection: $mealType) {
                                ForEach(MealType.allCases) { Text($0.label).tag($0) }
                            }
                            .pickerStyle(.segmented)
                        }
                    }

                    if let errorMessage {
                        Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                            .font(.subheadline).foregroundStyle(.red)
                    }

                    Button(action: save) {
                        Text(isSaving ? "" : "Add to \(mealType.label)")
                    }
                    .buttonStyle(.primary(loading: isSaving))
                }
                .padding(Theme.Spacing.lg)
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Log food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func macro(_ label: String, _ grams: Double, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text("\(Int(grams))g").font(.subheadline.weight(.bold)).foregroundStyle(color)
                .contentTransition(.numericText())
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func save() {
        guard !isSaving else { return }
        isSaving = true
        errorMessage = nil
        Task {
            do {
                let foodId = try await APIClient.shared.resolveFoodId(food)
                let meal = try await APIClient.shared.createMeal(CreateMealInput(
                    mealType: mealType,
                    loggedAt: ISO8601.string(from: .now),
                    notes: nil, photoR2Key: nil, clientId: UUID().uuidString,
                    items: [MealItemInput(foodId: foodId, recipeId: nil, quantity: quantity,
                                          unit: food.servingUnit, aiConfidence: nil)]
                ))
                Haptics.success()
                onLogged(meal)
                dismiss()
            } catch {
                errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't log this food."
            }
            isSaving = false
        }
    }
}
