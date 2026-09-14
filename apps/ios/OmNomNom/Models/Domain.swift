import Foundation

// Ported from packages/shared/src/types/domain.ts + types/user.ts.
// Date-ish fields are kept as ISO strings to match the API exactly; use
// `ISO8601.date(from:)` where a Date is needed.

struct PublicUser: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var name: String
    var email: String
    var dateOfBirth: String        // YYYY-MM-DD
    var sex: Sex
    var heightCm: Double
    var createdAt: String
    var updatedAt: String
}

struct GoalRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var goalType: Goal
    var startingWeightKg: Double
    var targetWeightKg: Double
    var targetDuration: TargetDuration
    var customEndDate: String?
    var activityLevel: ActivityLevel
    var bmr: Double
    var tdee: Double
    var calorieTarget: Double
    var calorieTargetOverridden: Bool
    var proteinTargetG: Double
    var proteinTargetOverridden: Bool
    var carbsTargetG: Double
    var carbsTargetOverridden: Bool
    var fatTargetG: Double
    var fatTargetOverridden: Bool
    var fibreTargetG: Double
    var fibreTargetOverridden: Bool
    var waterTargetMl: Double
    var waterTargetOverridden: Bool
    var isActive: Bool
    var createdAt: String
    var updatedAt: String
}

enum FoodSource: String, Codable, Hashable, Sendable {
    case openfoodfacts, usda, custom
}

struct FoodRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var source: FoodSource
    var sourceId: String?
    var barcode: String?
    var name: String
    var brand: String?
    var servingSize: Double
    var servingUnit: String
    var calories: Double
    var proteinG: Double
    var carbsG: Double
    var fatG: Double
    var fibreG: Double
    var isFavourite: Bool?
    /// false = a live external search hit not yet in the DB. Must be materialized
    /// via POST /api/foods/external before logging or favouriting.
    var isLocal: Bool
}

struct RecognizedFoodItem: Codable, Hashable, Sendable {
    var name: String
    var estimatedQuantityGrams: Double
    var confidence: Double
    var matchedFood: FoodRecord?
}

struct PhotoAnalysisResult: Codable, Sendable {
    var imageHash: String
    var r2Key: String
    var items: [RecognizedFoodItem]
    var fromCache: Bool
}

struct LabelAnalysisResult: Codable, Sendable {
    var name: String?
    var brand: String?
    var servingSize: Double?
    var servingUnit: String?
    var calories: Double?
    var proteinG: Double?
    var carbsG: Double?
    var fatG: Double?
    var fibreG: Double?
}

struct RecipeItemRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var foodId: String
    var food: FoodRecord?
    var quantity: Double
    var unit: String
}

struct RecipeRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var name: String
    var servings: Double
    var instructions: String?
    var items: [RecipeItemRecord]
    var caloriesPerServing: Double
    var proteinGPerServing: Double
    var carbsGPerServing: Double
    var fatGPerServing: Double
    var fibreGPerServing: Double
    var createdAt: String
    var updatedAt: String
}

struct MealItemRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var foodId: String?
    var recipeId: String?
    var food: FoodRecord?
    var quantity: Double
    var unit: String
    var calories: Double
    var proteinG: Double
    var carbsG: Double
    var fatG: Double
    var fibreG: Double
    var aiConfidence: Double?
}

struct MealRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var mealType: MealType
    var loggedAt: String
    var photoR2Key: String?
    var notes: String?
    var totalCalories: Double
    var totalProteinG: Double
    var totalCarbsG: Double
    var totalFatG: Double
    var totalFibreG: Double
    var items: [MealItemRecord]
    var createdAt: String
    var updatedAt: String
}

struct WaterLogRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var amountMl: Double
    var loggedAt: String
    var createdAt: String
}

struct WeightLogRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var weightKg: Double
    var loggedAt: String
    var notes: String?
    var createdAt: String
}

struct SettingsRecord: Codable, Hashable, Sendable {
    var unitSystem: UnitSystem
    var theme: AppTheme
    var updatedAt: String
}

struct NotificationSettingsRecord: Codable, Hashable, Sendable {
    var onesignalPlayerId: String?
    var breakfastReminderTime: String?
    var lunchReminderTime: String?
    var dinnerReminderTime: String?
    var waterReminderEnabled: Bool
    var waterReminderIntervalMinutes: Int?
    var weighInReminderTime: String?
    var weighInReminderDays: [Int]
    var quietHoursStart: String?
    var quietHoursEnd: String?
    var timezone: String
    var updatedAt: String
}

struct CustomReminderRecord: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var label: String
    var time: String
    var daysOfWeek: [Int]
    var enabled: Bool
    var createdAt: String
}

struct PublicWidgetToken: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var label: String
    var lastUsedAt: String?
    var createdAt: String
}

struct IssuedWidgetToken: Codable, Identifiable, Hashable, Sendable {
    let id: String
    var label: String
    var lastUsedAt: String?
    var createdAt: String
    var token: String
}

// MARK: - Nutrition score

struct ScoreComponent: Codable, Hashable, Sendable {
    var points: Double
    var maxPoints: Double
}

struct NutritionScoreComponents: Codable, Hashable, Sendable {
    var calories: ScoreComponent
    var protein: ScoreComponent
    var fibre: ScoreComponent
    var foodQuality: ScoreComponent
    var consistency: ScoreComponent
    var water: ScoreComponent
    var loggingCompleteness: ScoreComponent
}

struct NutritionScoreBreakdown: Codable, Hashable, Sendable {
    var score: Double
    var label: NutritionScoreLabel
    var components: NutritionScoreComponents
}

struct DailyScoreSummary: Codable, Identifiable, Hashable, Sendable {
    var dateKey: String
    var score: Double
    var label: NutritionScoreLabel
    var id: String { dateKey }
}

// MARK: - Widget summary

struct WidgetMacro: Codable, Hashable, Sendable {
    var consumed: Double
    var target: Double
}

struct WidgetSummary: Codable, Hashable, Sendable {
    enum MascotMood: String, Codable, Sendable {
        case excited, happy, neutral, sad
    }
    var score: Double
    var label: NutritionScoreLabel
    var message: String
    var mascotMood: MascotMood
    var macros: Macros
    struct Macros: Codable, Hashable, Sendable {
        var calories: WidgetMacro
        var protein: WidgetMacro
        var fat: WidgetMacro
    }
}
