import Foundation

/// Weight unit conversion + display, honoring the user's unit system.
enum Units {
    static let lbPerKg = 2.2046226218

    static func weightUnit(_ system: UnitSystem) -> String {
        system == .imperial ? "lb" : "kg"
    }

    /// Convert a stored kg value into the display value for the user's system.
    static func displayWeight(_ kg: Double, _ system: UnitSystem) -> Double {
        system == .imperial ? kg * lbPerKg : kg
    }

    /// Convert a value the user typed (in their unit) back to kg for the API.
    static func kg(fromDisplay value: Double, _ system: UnitSystem) -> Double {
        system == .imperial ? value / lbPerKg : value
    }

    static func formattedWeight(_ kg: Double, _ system: UnitSystem, decimals: Int = 1) -> String {
        String(format: "%.\(decimals)f %@", displayWeight(kg, system), weightUnit(system))
    }

    /// Height display: cm for metric, feet + inches for imperial.
    static func heightLabel(_ cm: Double, _ system: UnitSystem) -> String {
        guard system == .imperial else { return "\(Int(cm.rounded())) cm" }
        let totalInches = cm / 2.54
        let feet = Int(totalInches / 12)
        let inches = Int(totalInches.truncatingRemainder(dividingBy: 12).rounded())
        return "\(feet)′ \(inches)″"
    }
}
