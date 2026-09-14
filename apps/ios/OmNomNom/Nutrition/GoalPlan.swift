import Foundation

/// Client-side goal-plan math, ported from packages/shared/src/nutrition/calculate.ts.
/// The onboarding wizard computes the full plan here; the API only persists it.
enum GoalPlan {
    static let kcalPerKg: Double = 7700
    static let maxDailyDeficit: Double = 1000
    static let maxDailySurplus: Double = 500
    static let minCalories: Double = 1200

    struct Result: Equatable {
        var bmr: Double
        var tdee: Double
        var calorieTarget: Double
        var proteinTargetG: Double
        var carbsTargetG: Double
        var fatTargetG: Double
        var fibreTargetG: Double
        var waterTargetMl: Double
    }

    static func age(fromDateOfBirth dob: String, now: Date = .now, calendar: Calendar = .current) -> Int {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        guard let birth = formatter.date(from: dob) else { return 0 }
        let components = calendar.dateComponents([.year], from: birth, to: now)
        return max(0, components.year ?? 0)
    }

    /// Mifflin–St Jeor.
    static func bmr(weightKg: Double, heightCm: Double, age: Int, sex: Sex) -> Double {
        let base = 10 * weightKg + 6.25 * heightCm - 5 * Double(age)
        return (base + (sex == .male ? 5 : -161)).rounded()
    }

    static func tdee(bmr: Double, activityLevel: ActivityLevel) -> Double {
        (bmr * activityLevel.multiplier).rounded()
    }

    static func calorieTarget(
        tdee: Double,
        goalType: Goal,
        currentWeightKg: Double,
        targetWeightKg: Double,
        weeks: Int
    ) -> Double {
        guard goalType != .maintain, weeks > 0 else { return tdee }
        let totalDelta = (targetWeightKg - currentWeightKg) * kcalPerKg
        let perDay = totalDelta / (Double(weeks) * 7)
        let capped: Double
        if perDay < 0 {
            capped = max(perDay, -maxDailyDeficit)
        } else {
            capped = min(perDay, maxDailySurplus)
        }
        return max(minCalories, (tdee + capped).rounded())
    }

    static func macroTargets(calories: Double, weightKg: Double, goalType: Goal) -> (protein: Double, carbs: Double, fat: Double, fibre: Double) {
        let proteinPerKg: Double = switch goalType {
        case .loseWeight: 2.2
        case .maintain: 1.8
        case .gainWeight: 2.0
        }
        var protein = (weightKg * proteinPerKg).rounded()
        var fat = max(20, (calories * 0.30 / 9).rounded())
        let remainingKcal = calories - protein * 4 - fat * 9
        var carbs = max(50, (remainingKcal / 4).rounded())
        // Guard against negative values on extreme inputs.
        if protein < 0 { protein = 0 }
        if fat < 20 { fat = 20 }
        if carbs < 50 { carbs = 50 }
        let fibre = (calories / 1000 * 14).rounded()
        return (protein, carbs, fat, fibre)
    }

    static func waterTargetMl(weightKg: Double) -> Double {
        let raw = weightKg * 35
        let rounded = (raw / 50).rounded() * 50
        return min(4000, max(1500, rounded))
    }

    static func bmi(weightKg: Double, heightCm: Double) -> Double {
        let m = heightCm / 100
        guard m > 0 else { return 0 }
        return weightKg / (m * m)
    }

    static func healthyBmiRange(heightCm: Double) -> (min: Double, max: Double) {
        let m = heightCm / 100
        return ((18.5 * m * m).rounded(toPlaces: 1), (24.9 * m * m).rounded(toPlaces: 1))
    }

    /// Full plan - mirrors calculateGoalPlan().
    static func calculate(
        dateOfBirth: String,
        sex: Sex,
        heightCm: Double,
        currentWeightKg: Double,
        targetWeightKg: Double,
        goalType: Goal,
        activityLevel: ActivityLevel,
        targetDuration: TargetDuration,
        customEndDate: String?,
        now: Date = .now
    ) -> Result {
        let age = age(fromDateOfBirth: dateOfBirth, now: now)
        let bmrValue = bmr(weightKg: currentWeightKg, heightCm: heightCm, age: age, sex: sex)
        let tdeeValue = tdee(bmr: bmrValue, activityLevel: activityLevel)
        let weeks = resolveWeeks(targetDuration: targetDuration, customEndDate: customEndDate, now: now)
        let calories = calorieTarget(
            tdee: tdeeValue,
            goalType: goalType,
            currentWeightKg: currentWeightKg,
            targetWeightKg: targetWeightKg,
            weeks: weeks
        )
        let macros = macroTargets(calories: calories, weightKg: currentWeightKg, goalType: goalType)
        return Result(
            bmr: bmrValue,
            tdee: tdeeValue,
            calorieTarget: calories,
            proteinTargetG: macros.protein,
            carbsTargetG: macros.carbs,
            fatTargetG: macros.fat,
            fibreTargetG: macros.fibre,
            waterTargetMl: waterTargetMl(weightKg: currentWeightKg)
        )
    }

    private static func resolveWeeks(targetDuration: TargetDuration, customEndDate: String?, now: Date) -> Int {
        if let weeks = targetDuration.weeks { return weeks }
        guard let customEndDate else { return 0 }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        guard let end = formatter.date(from: customEndDate) else { return 0 }
        let days = Calendar.current.dateComponents([.day], from: now, to: end).day ?? 0
        return max(0, Int((Double(days) / 7).rounded()))
    }
}

extension Double {
    func rounded(toPlaces places: Int) -> Double {
        let factor = pow(10, Double(places))
        return (self * factor).rounded() / factor
    }
}
