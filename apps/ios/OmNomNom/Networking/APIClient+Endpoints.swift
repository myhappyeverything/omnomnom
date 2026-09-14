import Foundation

/// Typed wrappers over every REST endpoint the app uses. Response envelopes like
/// `{ "foods": [...] }` are unwrapped via `Wrapped`.
extension APIClient {
    private func json<Body: Encodable>(_ body: Body) throws -> Data { try encode(body) }

    /// tzOffsetMinutes in the JS `Date.getTimezoneOffset()` convention the API expects.
    static var tzOffsetMinutes: Int { -TimeZone.current.secondsFromGMT() / 60 }

    // MARK: Profile

    func me() async throws -> PublicUser {
        try await send(Endpoint(path: "/api/auth/me"), as: Wrapped<PublicUser>.self).value
    }

    func updateProfile(_ input: UpdateProfileInput) async throws -> PublicUser {
        try await send(Endpoint(method: "PATCH", path: "/api/auth/me", body: try json(input)),
                       as: Wrapped<PublicUser>.self).value
    }

    func deleteAccount() async throws {
        _ = try await sendData(Endpoint(method: "DELETE", path: "/api/auth/me"))
    }

    // MARK: Goals

    func activeGoal() async throws -> GoalRecord? {
        do {
            return try await send(Endpoint(path: "/api/goals/active"), as: Wrapped<GoalRecord>.self).value
        } catch let error as APIError {
            if case let .server(status, _) = error, status == 404 { return nil }
            throw error
        }
    }

    func createGoal(_ input: CreateGoalInput) async throws -> GoalRecord {
        try await send(Endpoint(method: "POST", path: "/api/goals", body: try json(input)),
                       as: Wrapped<GoalRecord>.self).value
    }

    func updateGoalOverrides(_ input: UpdateGoalOverridesInput) async throws -> GoalRecord {
        try await send(Endpoint(method: "PATCH", path: "/api/goals/active", body: try json(input)),
                       as: Wrapped<GoalRecord>.self).value
    }

    // MARK: Foods

    func searchFoods(query: String, limit: Int = 20) async throws -> [FoodRecord] {
        try await send(Endpoint(path: "/api/foods", query: [
            .init(name: "q", value: query),
            .init(name: "limit", value: String(limit)),
        ]), as: Wrapped<[FoodRecord]>.self).value
    }

    func recentFoods() async throws -> [FoodRecord] {
        try await send(Endpoint(path: "/api/foods/recent"), as: Wrapped<[FoodRecord]>.self).value
    }

    func frequentFoods() async throws -> [FoodRecord] {
        try await send(Endpoint(path: "/api/foods/frequent"), as: Wrapped<[FoodRecord]>.self).value
    }

    func favouriteFoods() async throws -> [FoodRecord] {
        try await send(Endpoint(path: "/api/foods/favourites"), as: Wrapped<[FoodRecord]>.self).value
    }

    func createCustomFood(_ input: CreateCustomFoodInput) async throws -> FoodRecord {
        try await send(Endpoint(method: "POST", path: "/api/foods", body: try json(input)),
                       as: Wrapped<FoodRecord>.self).value
    }

    func setFavourite(foodId: String, _ favourite: Bool) async throws {
        _ = try await sendData(Endpoint(method: favourite ? "PUT" : "DELETE",
                                        path: "/api/foods/\(foodId)/favourite"))
    }

    /// Materialize a live external search hit into a real DB row, returning its id.
    /// Mirrors resolveFoodId() in apps/web/src/api/foods.ts.
    func resolveFoodId(_ food: FoodRecord) async throws -> String {
        if food.isLocal { return food.id }
        let body = ExternalFoodBody(food)
        let resolved = try await send(Endpoint(method: "POST", path: "/api/foods/external", body: try json(body)),
                                      as: Wrapped<FoodRecord>.self).value
        return resolved.id
    }

    private struct ExternalFoodBody: Encodable {
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
        init(_ f: FoodRecord) {
            source = f.source; sourceId = f.sourceId; barcode = f.barcode
            name = f.name; brand = f.brand; servingSize = f.servingSize; servingUnit = f.servingUnit
            calories = f.calories; proteinG = f.proteinG; carbsG = f.carbsG; fatG = f.fatG; fibreG = f.fibreG
        }
    }

    // MARK: Meals

    func meals(from: String, to: String) async throws -> [MealRecord] {
        try await send(Endpoint(path: "/api/meals", query: [
            .init(name: "from", value: from),
            .init(name: "to", value: to),
        ]), as: Wrapped<[MealRecord]>.self).value
    }

    func createMeal(_ input: CreateMealInput) async throws -> MealRecord {
        try await send(Endpoint(method: "POST", path: "/api/meals", body: try json(input)),
                       as: Wrapped<MealRecord>.self).value
    }

    func deleteMeal(id: String) async throws {
        _ = try await sendData(Endpoint(method: "DELETE", path: "/api/meals/\(id)"))
    }

    // MARK: Water

    func water(from: String, to: String) async throws -> [WaterLogRecord] {
        try await send(Endpoint(path: "/api/water", query: [
            .init(name: "from", value: from),
            .init(name: "to", value: to),
        ]), as: Wrapped<[WaterLogRecord]>.self).value
    }

    func logWater(_ input: CreateWaterLogInput) async throws -> WaterLogRecord {
        try await send(Endpoint(method: "POST", path: "/api/water", body: try json(input)),
                       as: Wrapped<WaterLogRecord>.self).value
    }

    func deleteWater(id: String) async throws {
        _ = try await sendData(Endpoint(method: "DELETE", path: "/api/water/\(id)"))
    }

    // MARK: Weight

    func weight(from: String, to: String) async throws -> [WeightLogRecord] {
        try await send(Endpoint(path: "/api/weight", query: [
            .init(name: "from", value: from),
            .init(name: "to", value: to),
        ]), as: Wrapped<[WeightLogRecord]>.self).value
    }

    func logWeight(_ input: CreateWeightLogInput) async throws -> WeightLogRecord {
        try await send(Endpoint(method: "POST", path: "/api/weight", body: try json(input)),
                       as: Wrapped<WeightLogRecord>.self).value
    }

    func deleteWeight(id: String) async throws {
        _ = try await sendData(Endpoint(method: "DELETE", path: "/api/weight/\(id)"))
    }

    // MARK: Settings

    func settings() async throws -> SettingsRecord {
        try await send(Endpoint(path: "/api/settings"), as: Wrapped<SettingsRecord>.self).value
    }

    func updateSettings(_ input: UpdateSettingsInput) async throws -> SettingsRecord {
        try await send(Endpoint(method: "PATCH", path: "/api/settings", body: try json(input)),
                       as: Wrapped<SettingsRecord>.self).value
    }

    // MARK: Notifications

    func notificationSettings() async throws -> NotificationSettingsRecord {
        try await send(Endpoint(path: "/api/notifications/settings"),
                       as: Wrapped<NotificationSettingsRecord>.self).value
    }

    func updateNotificationSettings(_ input: UpdateNotificationSettingsInput) async throws -> NotificationSettingsRecord {
        try await send(Endpoint(method: "PATCH", path: "/api/notifications/settings", body: try json(input)),
                       as: Wrapped<NotificationSettingsRecord>.self).value
    }

    func customReminders() async throws -> [CustomReminderRecord] {
        try await send(Endpoint(path: "/api/notifications/reminders"),
                       as: Wrapped<[CustomReminderRecord]>.self).value
    }

    func createReminder(_ input: CreateCustomReminderInput) async throws -> CustomReminderRecord {
        try await send(Endpoint(method: "POST", path: "/api/notifications/reminders", body: try json(input)),
                       as: Wrapped<CustomReminderRecord>.self).value
    }

    func updateReminder(id: String, _ input: UpdateCustomReminderInput) async throws -> CustomReminderRecord {
        try await send(Endpoint(method: "PATCH", path: "/api/notifications/reminders/\(id)", body: try json(input)),
                       as: Wrapped<CustomReminderRecord>.self).value
    }

    func deleteReminder(id: String) async throws {
        _ = try await sendData(Endpoint(method: "DELETE", path: "/api/notifications/reminders/\(id)"))
    }

    /// Full JSON backup. Returned raw so it can be handed to a share sheet.
    func exportData() async throws -> Data {
        try await sendData(Endpoint(path: "/api/export"))
    }

    // MARK: AI

    func analyzePhoto(_ input: AnalyzeImageInput) async throws -> PhotoAnalysisResult {
        try await send(Endpoint(method: "POST", path: "/api/ai/analyze-photo", body: try json(input)))
    }

    func analyzeLabel(_ input: AnalyzeImageInput) async throws -> LabelAnalysisResult {
        try await send(Endpoint(method: "POST", path: "/api/ai/analyze-label", body: try json(input)))
    }

    func mealPhotoURL(hash: String) -> URL {
        baseURL.appendingPathComponent("/api/ai/photo/\(hash)")
    }

    // MARK: Nutrition score

    func nutritionScore(date: String? = nil) async throws -> NutritionScoreBreakdown {
        var query: [URLQueryItem] = [.init(name: "tzOffsetMinutes", value: String(Self.tzOffsetMinutes))]
        if let date { query.append(.init(name: "date", value: date)) }
        return try await send(Endpoint(path: "/api/nutrition-score", query: query))
    }

    func nutritionScoreRange(from: String, to: String) async throws -> [DailyScoreSummary] {
        try await send(Endpoint(path: "/api/nutrition-score/range", query: [
            .init(name: "from", value: from),
            .init(name: "to", value: to),
            .init(name: "tzOffsetMinutes", value: String(Self.tzOffsetMinutes)),
        ]), as: Wrapped<[DailyScoreSummary]>.self).value
    }

    // MARK: Widget tokens

    func widgetTokens() async throws -> [PublicWidgetToken] {
        try await send(Endpoint(path: "/api/widget-tokens"), as: Wrapped<[PublicWidgetToken]>.self).value
    }

    func issueWidgetToken(label: String) async throws -> IssuedWidgetToken {
        struct Body: Encodable { var label: String }
        return try await send(Endpoint(method: "POST", path: "/api/widget-tokens", body: try json(Body(label: label))))
    }

    func revokeWidgetToken(id: String) async throws {
        _ = try await sendData(Endpoint(method: "DELETE", path: "/api/widget-tokens/\(id)"))
    }
}
