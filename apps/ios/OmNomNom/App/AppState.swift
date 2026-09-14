import SwiftUI
import Observation

/// Lightweight cross-cutting app state: the selected tab and a data-version
/// counter that screens observe to refresh after a quick-add action.
@MainActor
@Observable
final class AppState {
    var selectedTab = 0
    var dataVersion = 0

    func dataChanged() { dataVersion += 1 }
}
