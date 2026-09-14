import SwiftUI

/// The OmNomNom mascot. Idle "breathing" loop, plus a springy one-off bounce you
/// can trigger (e.g. when a meal is logged). Mirrors the web Mascot component's
/// motion and respects Reduce Motion.
struct Mascot: View {
    var size: CGFloat = 76
    /// Increment this value to play a bounce (e.g. `bounceToken += 1`).
    var bounceToken: Int = 0

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var breathe = false
    @State private var bounceOffset: CGFloat = 0

    var body: some View {
        Image("Mascot")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .scaleEffect(breathe ? 1.035 : 1.0)
            .offset(y: bounceOffset)
            .accessibilityLabel("OmNomNom mascot")
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 3.2).repeatForever(autoreverses: true)) {
                    breathe = true
                }
            }
            .onChange(of: bounceToken) { _, _ in
                guard !reduceMotion else { return }
                // Springy overshoot, matching the web's cubic-bezier(0.34,1.56,0.64,1).
                withAnimation(.spring(response: 0.32, dampingFraction: 0.5)) {
                    bounceOffset = -10
                }
                withAnimation(.spring(response: 0.35, dampingFraction: 0.7).delay(0.18)) {
                    bounceOffset = 0
                }
            }
    }
}
