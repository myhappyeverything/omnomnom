import Foundation

// Ported from packages/shared/src/constants.ts - keep in sync with the API.

enum Sex: String, Codable, CaseIterable, Sendable {
    case male, female
}

enum ActivityLevel: String, Codable, CaseIterable, Sendable {
    case sedentary
    case lightlyActive = "lightly_active"
    case moderatelyActive = "moderately_active"
    case veryActive = "very_active"
    case extremelyActive = "extremely_active"

    var multiplier: Double {
        switch self {
        case .sedentary: 1.2
        case .lightlyActive: 1.375
        case .moderatelyActive: 1.55
        case .veryActive: 1.725
        case .extremelyActive: 1.9
        }
    }

    var label: String {
        switch self {
        case .sedentary: "Sedentary"
        case .lightlyActive: "Lightly active"
        case .moderatelyActive: "Moderately active"
        case .veryActive: "Very active"
        case .extremelyActive: "Extremely active"
        }
    }
}

enum Goal: String, Codable, CaseIterable, Sendable {
    case loseWeight = "lose_weight"
    case maintain
    case gainWeight = "gain_weight"

    var label: String {
        switch self {
        case .loseWeight: "Lose weight"
        case .maintain: "Maintain"
        case .gainWeight: "Gain weight"
        }
    }
}

enum TargetDuration: String, Codable, CaseIterable, Sendable {
    case twoWeeks = "2_weeks"
    case fourWeeks = "4_weeks"
    case eightWeeks = "8_weeks"
    case twelveWeeks = "12_weeks"
    case custom

    var weeks: Int? {
        switch self {
        case .twoWeeks: 2
        case .fourWeeks: 4
        case .eightWeeks: 8
        case .twelveWeeks: 12
        case .custom: nil
        }
    }

    var label: String {
        switch self {
        case .twoWeeks: "2 weeks"
        case .fourWeeks: "4 weeks"
        case .eightWeeks: "8 weeks"
        case .twelveWeeks: "12 weeks"
        case .custom: "Custom"
        }
    }
}

enum MealType: String, Codable, CaseIterable, Identifiable, Sendable {
    case breakfast, lunch, dinner, snack
    var id: String { rawValue }

    var label: String {
        switch self {
        case .breakfast: "Breakfast"
        case .lunch: "Lunch"
        case .dinner: "Dinner"
        case .snack: "Snack"
        }
    }

    var symbol: String {
        switch self {
        case .breakfast: "sunrise.fill"
        case .lunch: "sun.max.fill"
        case .dinner: "moon.stars.fill"
        case .snack: "carrot.fill"
        }
    }

    /// Mirrors apps/web/src/utils/mealType.ts - infer a meal type from the hour.
    static func inferred(from date: Date = .now, calendar: Calendar = .current) -> MealType {
        switch calendar.component(.hour, from: date) {
        case ..<11: .breakfast
        case ..<15: .lunch
        case ..<20: .dinner
        default: .snack
        }
    }
}

enum UnitSystem: String, Codable, CaseIterable, Sendable {
    case metric, imperial
}

enum AppTheme: String, Codable, CaseIterable, Sendable {
    case light, dark, system
}

enum NutritionScoreLabel: String, Codable, Sendable {
    case excellent = "Excellent"
    case good = "Good"
    case fair = "Fair"
    case needsImprovement = "Needs Improvement"

    /// Score bands from constants.ts: excellent ≥85, good ≥70, fair ≥50.
    static func from(score: Double) -> NutritionScoreLabel {
        switch score {
        case 85...: .excellent
        case 70..<85: .good
        case 50..<70: .fair
        default: .needsImprovement
        }
    }
}

enum AppConstants {
    static let waterQuickAddMl: [Int] = [250, 500, 750, 1000]
}
