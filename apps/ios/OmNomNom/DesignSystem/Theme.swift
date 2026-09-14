import SwiftUI

/// Central design tokens for OmNomNom. Colors are defined in code (with dark-mode
/// variants) so the whole app reads as one system in both appearances.
enum Theme {
    // MARK: Brand colors

    /// Warm OmNomNom orange — the primary accent, carried over from the web app.
    static let accent = Color(light: 0xF97316, dark: 0xFB923C)
    static let accentDeep = Color(light: 0xEA580C, dark: 0xF97316)
    /// Mustard highlight used for "saved"/favourite affordances.
    static let mustard = Color(light: 0xE0A400, dark: 0xF5C042)

    /// App background — a soft off-white in light, near-black in dark.
    static let background = Color(light: 0xFBF7F2, dark: 0x0E0D0C)
    /// Surface behind glass cards on plain backgrounds.
    static let surface = Color(light: 0xFFFFFF, dark: 0x1A1817)

    // MARK: Semantic macro colors (protein/carbs/fat/fibre)

    static let protein = Color(light: 0xE0533D, dark: 0xF07A63)
    static let carbs = Color(light: 0xE0A400, dark: 0xF5C042)
    static let fat = Color(light: 0x8B5CF6, dark: 0xA78BFA)
    static let fibre = Color(light: 0x2FA36B, dark: 0x4ECB8C)
    static let water = Color(light: 0x2E9BE0, dark: 0x5BB6F0)

    // MARK: Spacing scale

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
    }

    // MARK: Corner radii

    enum Radius {
        static let card: CGFloat = 22
        static let control: CGFloat = 14
        static let pill: CGFloat = 999
    }
}

extension Color {
    /// Build a color from separate light/dark hex values.
    init(light: UInt, dark: UInt) {
        self.init(uiColor: UIColor { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(hex: dark)
                : UIColor(hex: light)
        })
    }
}

private extension UIColor {
    convenience init(hex: UInt) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}
