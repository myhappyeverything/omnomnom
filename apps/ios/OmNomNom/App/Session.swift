import SwiftUI
import Observation

/// App-wide auth + profile state. Drives whether the user sees onboarding/login
/// or the main tab experience.
@MainActor
@Observable
final class Session {
    enum Phase: Equatable {
        case launching
        case signedOut
        case signedIn
    }

    var phase: Phase = .launching
    var user: PublicUser?
    var activeGoal: GoalRecord?
    var settings: SettingsRecord?

    private let api = APIClient.shared

    /// Cold-start: try to restore a session from the stored refresh token.
    func bootstrap() async {
        let restored = await api.restoreSession()
        guard restored else {
            phase = .signedOut
            return
        }
        await loadProfile()
    }

    func login(email: String, password: String) async throws {
        let user = try await api.login(LoginInput(email: email, password: password))
        self.user = user
        await loadProfile(existingUser: user)
    }

    /// Register then create the computed goal in one flow (mirrors OnboardingPage).
    func register(account: RegisterInput, goal: CreateGoalInput) async throws {
        let user = try await api.register(account)
        self.user = user
        _ = try await api.createGoal(goal)
        await loadProfile(existingUser: user)
    }

    func logout() async {
        await api.logout()
        user = nil
        activeGoal = nil
        settings = nil
        phase = .signedOut
    }

    private func loadProfile(existingUser: PublicUser? = nil) async {
        do {
            if let existingUser {
                user = existingUser
            } else {
                user = try await api.me()
            }
            activeGoal = try? await api.activeGoal()
            settings = try? await api.settings()
            phase = .signedIn
        } catch {
            // Couldn't load the profile even though refresh worked — treat as signed out.
            phase = .signedOut
        }
    }

    func refreshGoal() async {
        activeGoal = (try? await api.activeGoal()) ?? activeGoal
    }

    func updateSettings(unitSystem: UnitSystem? = nil, theme: AppTheme? = nil) async {
        do {
            settings = try await api.updateSettings(UpdateSettingsInput(unitSystem: unitSystem, theme: theme))
        } catch {
            // Non-fatal; leave existing settings in place.
        }
    }

    func updateProfile(dateOfBirth: String? = nil, heightCm: Double? = nil) async {
        if let user = try? await api.updateProfile(UpdateProfileInput(dateOfBirth: dateOfBirth, heightCm: heightCm)) {
            self.user = user
        }
    }

    func deleteAccount() async throws {
        try await api.deleteAccount()
        user = nil; activeGoal = nil; settings = nil
        api.clearSession()
        phase = .signedOut
    }
}
