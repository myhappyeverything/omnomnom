import Foundation

/// Shared storage between the app and its widget extension (App Group). The app
/// writes the minted widget token here so the widget can call /api/widget-summary.
enum AppGroup {
    static let id = "group.com.pocketlibraries.omnomnom"
    static let apiBase = "https://omnomnom-api.wasim-811.workers.dev"

    private static let tokenKey = "widgetToken"
    private static let tokenIdKey = "widgetTokenId"

    static var defaults: UserDefaults? { UserDefaults(suiteName: id) }

    static var widgetToken: String? {
        get { defaults?.string(forKey: tokenKey) }
        set {
            if let newValue { defaults?.set(newValue, forKey: tokenKey) }
            else { defaults?.removeObject(forKey: tokenKey) }
        }
    }

    static var widgetTokenId: String? {
        get { defaults?.string(forKey: tokenIdKey) }
        set {
            if let newValue { defaults?.set(newValue, forKey: tokenIdKey) }
            else { defaults?.removeObject(forKey: tokenIdKey) }
        }
    }
}
