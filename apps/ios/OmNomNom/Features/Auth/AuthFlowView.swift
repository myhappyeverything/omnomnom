import SwiftUI

/// Signed-out experience: a warm landing screen that routes to sign-in or the
/// onboarding wizard.
struct AuthFlowView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Theme.accent.opacity(0.18), Theme.background],
                    startPoint: .top, endPoint: .center
                )
                .ignoresSafeArea()

                VStack(spacing: Theme.Spacing.xl) {
                    Spacer()
                    VStack(spacing: Theme.Spacing.md) {
                        Mascot(size: 148)
                        Text("OmNomNom")
                            .font(.system(size: 40, weight: .heavy, design: .rounded))
                        Text("Snap your plate. Know your day.\nEffortless nutrition tracking.")
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()

                    VStack(spacing: Theme.Spacing.md) {
                        NavigationLink {
                            OnboardingView()
                        } label: {
                            Text("Get started")
                        }
                        .buttonStyle(.primary)

                        NavigationLink {
                            LoginView()
                        } label: {
                            Text("I already have an account")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Theme.accent)
                        }
                    }
                    .padding(.horizontal, Theme.Spacing.lg)
                    .padding(.bottom, Theme.Spacing.xl)
                }
            }
        }
    }
}
