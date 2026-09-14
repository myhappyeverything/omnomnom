import Foundation

// Request bodies (Encodable) and response envelopes (Decodable) that mirror the
// Zod schemas in packages/shared/src/schemas and the wrapped API responses.

// MARK: Auth

struct RegisterInput: Encodable, Sendable {
    var name: String
    var email: String
    var password: String
    var dateOfBirth: String
    var sex: Sex
    var heightCm: Double
}

struct LoginInput: Encodable, Sendable {
    var email: String
    var password: String
}

struct ForgotPasswordInput: Encodable, Sendable {
    var email: String
}

struct ResetPasswordInput: Encodable, Sendable {
    var email: String
    var code: String
    var password: String
}

struct UpdateProfileInput: Encodable, Sendable {
    var name: String?
    var dateOfBirth: String?
    var heightCm: Double?
}

struct AuthResponse: Decodable, Sendable {
    var user: PublicUser
    var accessToken: String
}

struct AccessTokenResponse: Decodable, Sendable {
    var accessToken: String
}

// MARK: Goals

struct CreateGoalInput: Encodable, Sendable {
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
}

struct UpdateGoalOverridesInput: Encodable, Sendable {
    var calorieTarget: Double?
    var proteinTargetG: Double?
    var carbsTargetG: Double?
    var fatTargetG: Double?
    var fibreTargetG: Double?
    var waterTargetMl: Double?
}

// MARK: Foods

struct CreateCustomFoodInput: Encodable, Sendable {
    var name: String
    var brand: String?
    var servingSize: Double
    var servingUnit: String
    var calories: Double
    var proteinG: Double
    var carbsG: Double
    var fatG: Double
    var fibreG: Double
    var barcode: String?
}

// MARK: Meals

struct MealItemInput: Encodable, Sendable {
    var foodId: String?
    var recipeId: String?
    var quantity: Double
    var unit: String
    var aiConfidence: Double?
}

struct CreateMealInput: Encodable, Sendable {
    var mealType: MealType
    var loggedAt: String
    var notes: String?
    var photoR2Key: String?
    var clientId: String?
    var items: [MealItemInput]
}

// MARK: Water / weight

struct CreateWaterLogInput: Encodable, Sendable {
    var amountMl: Double
    var loggedAt: String?
    var clientId: String?
}

struct CreateWeightLogInput: Encodable, Sendable {
    var weightKg: Double
    var loggedAt: String?
    var notes: String?
    var clientId: String?
}

// MARK: Settings / notifications

struct UpdateSettingsInput: Encodable, Sendable {
    var unitSystem: UnitSystem?
    var theme: AppTheme?
}

/// Full notification-settings payload. Encodes every field (nulls explicit) so a
/// PATCH reliably clears reminders the user turned off.
struct UpdateNotificationSettingsInput: Encodable, Sendable {
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

    enum CodingKeys: String, CodingKey {
        case breakfastReminderTime, lunchReminderTime, dinnerReminderTime
        case waterReminderEnabled, waterReminderIntervalMinutes
        case weighInReminderTime, weighInReminderDays
        case quietHoursStart, quietHoursEnd, timezone
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try encodeOptional(&c, breakfastReminderTime, .breakfastReminderTime)
        try encodeOptional(&c, lunchReminderTime, .lunchReminderTime)
        try encodeOptional(&c, dinnerReminderTime, .dinnerReminderTime)
        try c.encode(waterReminderEnabled, forKey: .waterReminderEnabled)
        try encodeOptional(&c, waterReminderIntervalMinutes, .waterReminderIntervalMinutes)
        try encodeOptional(&c, weighInReminderTime, .weighInReminderTime)
        try c.encode(weighInReminderDays, forKey: .weighInReminderDays)
        try encodeOptional(&c, quietHoursStart, .quietHoursStart)
        try encodeOptional(&c, quietHoursEnd, .quietHoursEnd)
        try c.encode(timezone, forKey: .timezone)
    }

    private func encodeOptional<T: Encodable>(_ c: inout KeyedEncodingContainer<CodingKeys>, _ value: T?, _ key: CodingKeys) throws {
        if let value { try c.encode(value, forKey: key) } else { try c.encodeNil(forKey: key) }
    }
}

struct CreateCustomReminderInput: Encodable, Sendable {
    var label: String
    var time: String
    var daysOfWeek: [Int]
    var enabled: Bool
}

struct UpdateCustomReminderInput: Encodable, Sendable {
    var label: String?
    var time: String?
    var daysOfWeek: [Int]?
    var enabled: Bool?
}

// MARK: AI

struct AnalyzeImageInput: Encodable, Sendable {
    var imageBase64: String
    var mimeType: String
}

// MARK: Generic response envelopes

struct Wrapped<T: Decodable & Sendable>: Decodable, Sendable {
    // Decodes single-key wrapper objects like { "meal": {...} } / { "foods": [...] }.
    let value: T
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: DynamicKey.self)
        guard let key = container.allKeys.first else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath,
                                                    debugDescription: "Empty wrapper object"))
        }
        value = try container.decode(T.self, forKey: key)
    }
    private struct DynamicKey: CodingKey {
        var stringValue: String
        var intValue: Int? { nil }
        init?(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }
}

struct SuccessResponse: Decodable, Sendable {
    var success: Bool
}
