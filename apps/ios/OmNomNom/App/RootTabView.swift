import SwiftUI

/// The app's root. On iOS 26 this `TabView` automatically adopts the floating
/// Liquid Glass tab bar; each tab owns its own `NavigationStack`.
struct RootTabView: View {
    var body: some View {
        TabView {
            Tab("Home", systemImage: "house.fill") {
                DashboardView()
            }
            Tab("Foods", systemImage: "fork.knife") {
                FoodsView()
            }
            Tab("Trends", systemImage: "chart.line.uptrend.xyaxis") {
                TrendsView()
            }
            Tab("Settings", systemImage: "gearshape.fill") {
                SettingsView()
            }
        }
    }
}
