import SwiftUI
import Observation

/// Lightweight cross-cutting app state: the selected tab, a data-version counter
/// that screens observe to refresh after a quick-add action, and a transient
/// toast for small encouragements.
@MainActor
@Observable
final class AppState {
    var selectedTab = 0
    var dataVersion = 0
    var toast: Toast?

    struct Toast: Identifiable, Equatable {
        let id = UUID()
        let text: String
    }

    func dataChanged() { dataVersion += 1 }

    /// Show a brief encouraging toast without touching data.
    func celebrate(_ text: String) { toast = Toast(text: text) }

    /// Something was logged: refresh dependent screens and celebrate.
    func didLog(_ text: String) {
        dataVersion += 1
        toast = Toast(text: text)
    }

    /// A short, non-corny cheer for a logged meal.
    func mealCheer() -> String {
        ["Nice one", "Well done", "Logged", "Good stuff", "Keep it up"].randomElement() ?? "Logged"
    }
}
