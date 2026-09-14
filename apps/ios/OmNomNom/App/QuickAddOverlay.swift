import SwiftUI

/// The raised center "+" button that floats above the Liquid Glass tab bar and
/// fans out quick-add actions. It's a separate floating layer, so it doesn't
/// affect the system tab bar's glass.
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
                Color.black.opacity(0.25)
                    .ignoresSafeArea()
                    .onTapGesture { collapse() }
                    .transition(.opacity)
            }

            VStack(spacing: Theme.Spacing.md) {
                if expanded {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        ForEach(actions) { action in
                            actionRow(action)
                        }
                    }
                    .transition(.scale(scale: 0.85, anchor: .bottom).combined(with: .opacity))
                }

                plusButton
            }
            .padding(.bottom, 34)
        }
        .fullScreenCover(item: $activeSheet) { sheet in
            switch sheet {
            case .photo:
                PhotoLogView { _ in appState.dataChanged() }
            case .label:
                ScanLabelView { _ in appState.dataChanged() }
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

    private func actionRow(_ action: Action) -> some View {
        Button {
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
    }

    private var plusButton: some View {
        Button {
            Haptics.tap()
            withAnimation(.spring(response: 0.32, dampingFraction: 0.7)) { expanded.toggle() }
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 62, height: 62)
                .background(
                    LinearGradient(colors: [Theme.accent, Theme.accentDeep],
                                   startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: .circle)
                .rotationEffect(.degrees(expanded ? 45 : 0))
                .shadow(color: Theme.accentDeep.opacity(0.4), radius: 10, y: 4)
        }
        .accessibilityLabel(expanded ? "Close quick add" : "Quick add")
    }

    private func collapse() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { expanded = false }
    }
}
