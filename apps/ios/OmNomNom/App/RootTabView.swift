import SwiftUI

/// The app's root. On iOS 26 this `TabView` automatically adopts the floating
/// Liquid Glass tab bar. The center "Add" tab is an action rather than a page:
/// selecting it reverts to the previous tab and opens the quick-add menu.
struct RootTabView: View {
    @Environment(AppState.self) private var appState
    @State private var previousTab = 0
    @State private var showQuickAdd = false

    private let addTab = 2

    var body: some View {
        @Bindable var appState = appState
        TabView(selection: $appState.selectedTab) {
            Tab("Home", systemImage: "house.fill", value: 0) {
                DashboardView()
            }
            Tab("Foods", systemImage: "fork.knife", value: 1) {
                FoodsView()
            }
            Tab("Add", systemImage: "plus.circle.fill", value: addTab) {
                Color.clear
            }
            Tab("Trends", systemImage: "chart.line.uptrend.xyaxis", value: 3) {
                TrendsView()
            }
            Tab("Settings", systemImage: "gearshape.fill", value: 4) {
                SettingsView()
            }
        }
        .onChange(of: appState.selectedTab) { _, newValue in
            // The center "Add" tab is an action: revert to the previous tab and
            // toggle the quick-add menu instead of showing a page.
            if newValue == addTab {
                appState.selectedTab = previousTab
                Haptics.tap()
                showQuickAdd.toggle()
            } else {
                previousTab = newValue
            }
        }
        .overlay {
            QuickAddMenu(isPresented: $showQuickAdd)
        }
        .overlay(alignment: .top) {
            if let toast = appState.toast {
                ToastView(text: toast.text)
                    .id(toast.id)
                    .padding(.top, Theme.Spacing.sm)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .task(id: toast.id) {
                        try? await Task.sleep(for: .seconds(1.8))
                        withAnimation { appState.toast = nil }
                    }
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: appState.toast)
    }
}

private struct ToastView: View {
    let text: String
    var body: some View {
        Label(text, systemImage: "checkmark.circle.fill")
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.primary)
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.vertical, 10)
            .glassEffect(.regular.tint(Theme.accent.opacity(0.28)), in: .capsule)
    }
}
