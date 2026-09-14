import SwiftUI

/// Top-level router: shows a splash while restoring the session, then either the
/// signed-out auth flow or the main tab experience, with a soft cross-fade.
struct RootView: View {
    @Environment(Session.self) private var session

    var body: some View {
        ZStack {
            switch session.phase {
            case .launching:
                SplashView()
                    .transition(.opacity)
            case .signedOut:
                AuthFlowView()
                    .transition(.opacity)
            case .signedIn:
                RootTabView()
                    .transition(.opacity)
            }
        }
        .animation(.smooth(duration: 0.35), value: session.phase)
        .task { await session.bootstrap() }
    }
}

private struct SplashView: View {
    @State private var pulse = false
    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            Mascot(size: 108)
                .scaleEffect(pulse ? 1.04 : 0.96)
                .opacity(pulse ? 1 : 0.85)
                .onAppear {
                    withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                        pulse = true
                    }
                }
        }
    }
}
