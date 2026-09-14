import SwiftUI

struct LoginView: View {
    @Environment(Session.self) private var session
    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @FocusState private var focused: Field?

    private enum Field { case email, password }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Welcome back")
                        .font(.largeTitle.weight(.bold))
                    Text("Sign in to keep your streak going.")
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: Theme.Spacing.md) {
                    FormField(title: "Email", systemImage: "envelope.fill",
                              text: $email, keyboard: .emailAddress, textContentType: .emailAddress)
                        .focused($focused, equals: .email)
                        .submitLabel(.next)
                        .onSubmit { focused = .password }
                    FormField(title: "Password", systemImage: "lock.fill",
                              text: $password, secure: true, textContentType: .password)
                        .focused($focused, equals: .password)
                        .submitLabel(.go)
                        .onSubmit { submit() }
                }

                if let errorMessage {
                    Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }

                Button(action: submit) {
                    Text(isSubmitting ? "" : "Sign in")
                }
                .buttonStyle(.primary(loading: isSubmitting))
                .disabled(isSubmitting || email.isEmpty || password.isEmpty)
            }
            .padding(Theme.Spacing.lg)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Sign in")
        .navigationBarTitleDisplayMode(.inline)
        .scrollDismissesKeyboard(.interactively)
    }

    private func submit() {
        guard !isSubmitting else { return }
        focused = nil
        isSubmitting = true
        withAnimation { errorMessage = nil }
        Task {
            do {
                try await session.login(email: email.trimmingCharacters(in: .whitespaces), password: password)
            } catch {
                withAnimation {
                    errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't sign in. Try again."
                }
            }
            isSubmitting = false
        }
    }
}
