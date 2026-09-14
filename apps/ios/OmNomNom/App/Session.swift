import SwiftUI
import Observation
import WidgetKit

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
        // Record the starting weight from onboarding as the first weigh-in so it
        // shows on the dashboard, trends, and settings.
        _ = try? await api.logWeight(CreateWeightLogInput(
            weightKg: goal.startingWeightKg, loggedAt: ISO8601.string(from: .now),
            notes: nil, clientId: UUID().uuidString))
        await loadProfile(existingUser: user)
    }

    func logout() async {
        await revokeWidgetToken()
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
            await ensureWidgetToken()
        } catch {
            // Couldn't load the profile even though refresh worked - treat as signed out.
            phase = .signedOut
        }
    }

    func refreshGoal() async {
        activeGoal = (try? await api.activeGoal()) ?? activeGoal
    }

    func updateGoal(_ overrides: UpdateGoalOverridesInput) async {
        if let goal = try? await api.updateGoalOverrides(overrides) { activeGoal = goal }
    }

    func updateSettings(unitSystem: UnitSystem? = nil, theme: AppTheme? = nil) async {
        do {
            settings = try await api.updateSettings(UpdateSettingsInput(unitSystem: unitSystem, theme: theme))
        } catch {
            // Non-fatal; leave existing settings in place.
        }
    }

    func updateProfile(name: String? = nil, dateOfBirth: String? = nil, heightCm: Double? = nil) async {
        if let user = try? await api.updateProfile(UpdateProfileInput(name: name, dateOfBirth: dateOfBirth, heightCm: heightCm)) {
            self.user = user
        }
    }

    /// Create a fresh active goal (used when the user re-runs their goal setup).
    func setGoal(_ input: CreateGoalInput) async {
        if let goal = try? await api.createGoal(input) { activeGoal = goal }
    }

    func deleteAccount() async throws {
        await revokeWidgetToken()
        try await api.deleteAccount()
        user = nil; activeGoal = nil; settings = nil
        api.clearSession()
        phase = .signedOut
    }

    // MARK: Widget token (provisioned silently for the home-screen widget)

    private func ensureWidgetToken() async {
        guard AppGroup.widgetToken == nil else { return }
        if let issued = try? await api.issueWidgetToken(label: "iPhone") {
            AppGroup.widgetToken = issued.token
            AppGroup.widgetTokenId = issued.id
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    private func revokeWidgetToken() async {
        if let id = AppGroup.widgetTokenId {
            try? await api.revokeWidgetToken(id: id)
        }
        AppGroup.widgetToken = nil
        AppGroup.widgetTokenId = nil
        WidgetCenter.shared.reloadAllTimelines()
    }
}
