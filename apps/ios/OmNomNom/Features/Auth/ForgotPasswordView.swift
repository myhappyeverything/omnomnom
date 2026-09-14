import SwiftUI

struct ForgotPasswordView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var stage: Stage = .email
    @State private var email = ""
    @State private var code = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private enum Stage { case email, reset, done }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    switch stage {
                    case .email: emailStep
                    case .reset: resetStep
                    case .done: doneStep
                    }
                    if let errorMessage {
                        Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                            .font(.subheadline).foregroundStyle(.red)
                    }
                }
                .padding(Theme.Spacing.lg)
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Reset password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            }
            .scrollDismissesKeyboard(.interactively)
        }
    }

    private var emailStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Forgot your password?").font(.title2.weight(.bold))
                Text("Enter your email and we'll send you a 6-digit code.")
                    .foregroundStyle(.secondary)
            }
            FormField(title: "Email", systemImage: "envelope.fill", text: $email,
                      keyboard: .emailAddress, textContentType: .emailAddress)
            Button(action: sendCode) { Text(isSubmitting ? "" : "Send code") }
                .buttonStyle(.primary(loading: isSubmitting))
                .disabled(isSubmitting || !email.contains("@"))
        }
    }

    private var resetStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Enter your code").font(.title2.weight(.bold))
                Text("If an account exists for \(email), a 6-digit code is on its way. Enter it below with a new password.")
                    .foregroundStyle(.secondary)
            }
            FormField(title: "6-digit code", systemImage: "number", text: $code, keyboard: .numberPad)
            FormField(title: "New password (8+ characters)", systemImage: "lock.fill",
                      text: $password, secure: true, textContentType: .newPassword)
            Button(action: resetPassword) { Text(isSubmitting ? "" : "Reset password") }
                .buttonStyle(.primary(loading: isSubmitting))
                .disabled(isSubmitting || code.count != 6 || password.count < 8)
            Button("Didn't get a code? Send again") { sendCode() }
                .font(.subheadline.weight(.semibold)).foregroundStyle(Theme.accent)
        }
    }

    private var doneStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
            VStack(alignment: .leading, spacing: 6) {
                Label("Password reset", systemImage: "checkmark.circle.fill")
                    .font(.title2.weight(.bold)).foregroundStyle(Theme.fibre)
                Text("You can now sign in with your new password.").foregroundStyle(.secondary)
            }
            Button("Back to sign in") { dismiss() }
                .buttonStyle(.primary)
        }
    }

    private func sendCode() {
        guard !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil
        Task {
            do {
                try await APIClient.shared.forgotPassword(email: email.trimmingCharacters(in: .whitespaces).lowercased())
                withAnimation { stage = .reset }
            } catch {
                errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't send a code. Try again."
            }
            isSubmitting = false
        }
    }

    private func resetPassword() {
        guard !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil
        Task {
            do {
                try await APIClient.shared.resetPassword(
                    email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                    code: code.trimmingCharacters(in: .whitespaces), password: password)
                Haptics.success()
                withAnimation { stage = .done }
            } catch {
                errorMessage = (error as? APIError)?.errorDescription ?? "That code didn't work. Check it and try again."
            }
            isSubmitting = false
        }
    }
}
