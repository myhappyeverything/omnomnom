import SwiftUI

/// The center "+" button that nestles into the Liquid Glass tab bar, raised just
/// slightly, and fans out quick-add actions one by one from the bar upward.
struct QuickAddOverlay: View {
    @Environment(AppState.self) private var appState
    @State private var expanded = false
    @State private var activeSheet: Sheet?

    private enum Sheet: Identifiable {
        case photo, label
        var id: Int { hashValue }
    }

    private struct Action: Identifiable {
        let id = UUID()
        let title: String
        let symbol: String
        let run: () -> Void
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            if expanded {
                Color.black.opacity(0.22)
                    .ignoresSafeArea()
                    .onTapGesture { collapse() }
                    .transition(.opacity)
            }

            VStack(spacing: Theme.Spacing.sm) {
                ForEach(Array(actions.enumerated()), id: \.element.id) { index, action in
                    actionRow(action, index: index)
                }
                plusButton
            }
            .padding(.bottom, 6)
        }
        .fullScreenCover(item: $activeSheet) { sheet in
            switch sheet {
            case .photo: PhotoLogView { _ in appState.dataChanged() }
            case .label: ScanLabelView { _ in appState.dataChanged() }
            }
        }
    }

    private var actions: [Action] {
        [
            Action(title: "Search food", symbol: "magnifyingglass") {
                appState.selectedTab = 1
                collapse()
            },
            Action(title: "Photo", symbol: "camera.fill") {
                collapse(); activeSheet = .photo
            },
            Action(title: "Scan label", symbol: "text.viewfinder") {
                collapse(); activeSheet = .label
            },
            Action(title: "Water +250 ml", symbol: "drop.fill") {
                Task {
                    _ = try? await APIClient.shared.logWater(CreateWaterLogInput(
                        amountMl: 250, loggedAt: ISO8601.string(from: .now), clientId: UUID().uuidString))
                    appState.dataChanged()
                    Haptics.success()
                }
                collapse()
            },
        ]
    }

    /// Bottom row (closest to the +) animates first.
    private func actionRow(_ action: Action, index: Int) -> some View {
        let delay = Double(actions.count - 1 - index) * 0.05
        return Button {
            Haptics.tap()
            action.run()
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: action.symbol).font(.subheadline).frame(width: 22)
                Text(action.title).font(.subheadline.weight(.semibold))
            }
            .foregroundStyle(Theme.accentDeep)
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassEffect(.regular.interactive(), in: .capsule)
        }
        .frame(width: 220)
        .opacity(expanded ? 1 : 0)
        .scaleEffect(expanded ? 1 : 0.9, anchor: .bottom)
        .offset(y: expanded ? 0 : 16)
        .animation(.spring(response: 0.32, dampingFraction: 0.72).delay(expanded ? delay : 0), value: expanded)
        .allowsHitTesting(expanded)
    }

    private var plusButton: some View {
        Button {
            Haptics.tap()
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) { expanded.toggle() }
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 54, height: 54)
                .background(
                    LinearGradient(colors: [Theme.accent, Theme.accentDeep],
                                   startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: .circle)
                .overlay(Circle().strokeBorder(.white.opacity(0.6), lineWidth: 3))
                .rotationEffect(.degrees(expanded ? 45 : 0))
                .shadow(color: Theme.accentDeep.opacity(0.35), radius: 6, y: 2)
        }
        .accessibilityLabel(expanded ? "Close quick add" : "Quick add")
    }

    private func collapse() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { expanded = false }
    }
}
