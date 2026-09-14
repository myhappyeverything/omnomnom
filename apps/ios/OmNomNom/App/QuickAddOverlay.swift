import SwiftUI

/// The quick-add fan-out, triggered by the center "Add" tab. It shows a scrim
/// and a column of actions that animate in from the tab bar upward. The trigger
/// lives in the native tab bar (see RootTabView), so there is no floating button.
struct QuickAddMenu: View {
    @Binding var isPresented: Bool
    @Environment(AppState.self) private var appState
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
            if isPresented {
                Color.black.opacity(0.22)
                    .ignoresSafeArea()
                    .onTapGesture { close() }
                    .transition(.opacity)
            }

            VStack(spacing: Theme.Spacing.sm) {
                ForEach(Array(actions.enumerated()), id: \.element.id) { index, action in
                    actionRow(action, index: index)
                }
            }
            .padding(.bottom, 84) // sit clearly above the tab bar
            .allowsHitTesting(isPresented)
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isPresented)
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
                close()
            },
            Action(title: "Photo", symbol: "camera.fill") {
                close(); activeSheet = .photo
            },
            Action(title: "Scan label", symbol: "text.viewfinder") {
                close(); activeSheet = .label
            },
            Action(title: "Water +250 ml", symbol: "drop.fill") {
                Task {
                    _ = try? await APIClient.shared.logWater(CreateWaterLogInput(
                        amountMl: 250, loggedAt: ISO8601.string(from: .now), clientId: UUID().uuidString))
                    appState.dataChanged()
                    Haptics.success()
                }
                close()
            },
        ]
    }

    /// Bottom row (closest to the tab bar) animates in first, then upward.
    private func actionRow(_ action: Action, index: Int) -> some View {
        let stepsFromBottom = Double(actions.count - 1 - index)
        let delay = isPresented ? stepsFromBottom * 0.09 : 0
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
        .frame(width: 230)
        .opacity(isPresented ? 1 : 0)
        .scaleEffect(isPresented ? 1 : 0.8, anchor: .bottom)
        .offset(y: isPresented ? 0 : 28)
        .animation(.spring(response: 0.34, dampingFraction: 0.7).delay(delay), value: isPresented)
    }

    private func close() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { isPresented = false }
    }
}
