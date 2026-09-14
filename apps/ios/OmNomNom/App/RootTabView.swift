import SwiftUI

/// The app's root. On iOS 26 this `TabView` automatically adopts the floating
/// Liquid Glass tab bar; each tab owns its own `NavigationStack`. A raised
/// quick-add button floats above the bar as a separate layer.
struct RootTabView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var appState = appState
        TabView(selection: $appState.selectedTab) {
            Tab("Home", systemImage: "house.fill", value: 0) {
                DashboardView()
            }
            Tab("Foods", systemImage: "fork.knife", value: 1) {
                FoodsView()
            }
            Tab("Trends", systemImage: "chart.line.uptrend.xyaxis", value: 2) {
                TrendsView()
            }
            Tab("Settings", systemImage: "gearshape.fill", value: 3) {
                SettingsView()
            }
        }
        .overlay(alignment: .bottom) {
            QuickAddOverlay()
        }
    }
}
