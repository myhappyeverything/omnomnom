import SwiftUI

/// The quick-add fan-out, triggered by the center "Add" tab. It shows a scrim
/// and a column of actions that reveal one at a time from the tab bar upward.
/// The reveal is driven by an explicit timed loop so the stagger is reliable.
struct QuickAddMenu: View {
    @Binding var isPresented: Bool
    @Environment(AppState.self) private var appState
    @State private var revealed = 0
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
            Color.black.opacity(isPresented ? 0.22 : 0)
                .ignoresSafeArea()
                .allowsHitTesting(isPresented)
                .onTapGesture { close() }
                .animation(.easeInOut(duration: 0.2), value: isPresented)

            VStack(spacing: Theme.Spacing.sm) {
                ForEach(Array(actions.enumerated()), id: \.element.id) { index, action in
                    actionRow(action, index: index)
                }
            }
            .padding(.bottom, 84) // sit clearly above the tab bar
            .allowsHitTesting(isPresented)
        }
        .onChange(of: isPresented) { _, open in
            if open { revealSequentially() }
            else { withAnimation(.easeIn(duration: 0.12)) { revealed = 0 } }
        }
        .fullScreenCover(item: $activeSheet) { sheet in
            switch sheet {
            case .photo: PhotoLogView { _ in appState.dataChanged() }
            case .label: ScanLabelView { _ in appState.dataChanged() }
            }
        }
    }

    /// Reveal from the bottom row upward, one every ~80ms.
    private func revealSequentially() {
        revealed = 0
        Task { @MainActor in
            for step in 1...actions.count {
                withAnimation(.spring(response: 0.34, dampingFraction: 0.7)) { revealed = step }
                try? await Task.sleep(for: .milliseconds(80))
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

    private func actionRow(_ action: Action, index: Int) -> some View {
        // Bottom row (closest to the tab bar) is revealed first.
        let fromBottom = actions.count - 1 - index
        let shown = revealed > fromBottom
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
        .opacity(shown ? 1 : 0)
        .scaleEffect(shown ? 1 : 0.8, anchor: .bottom)
        .offset(y: shown ? 0 : 30)
        .allowsHitTesting(shown)
    }

    private func close() {
        withAnimation(.easeIn(duration: 0.12)) { revealed = 0 }
        isPresented = false
    }
}
