import SwiftUI
import Observation

@MainActor
@Observable
private final class OnboardingDraft {
    // Account
    var name = ""
    var email = ""
    var password = ""
    var dateOfBirth = Calendar.current.date(byAdding: .year, value: -30, to: .now) ?? .now
    var sex: Sex = .male
    var heightCm: Double = 175
    var currentWeightKg: Double = 75

    // Goal
    var goalType: Goal = .loseWeight
    var targetWeightKg: Double = 70
    var targetDuration: TargetDuration = .eightWeeks
    var customEndDate = Calendar.current.date(byAdding: .month, value: 2, to: .now) ?? .now
    var activityLevel: ActivityLevel = .lightlyActive

    var accountValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        email.contains("@") && password.count >= 8 &&
        heightCm > 50 && currentWeightKg > 20
    }

    var plan: GoalPlan.Result {
        GoalPlan.calculate(
            dateOfBirth: ISO8601.dateOnlyString(from: dateOfBirth),
            sex: sex, heightCm: heightCm, currentWeightKg: currentWeightKg,
            targetWeightKg: goalType == .maintain ? currentWeightKg : targetWeightKg,
            goalType: goalType, activityLevel: activityLevel,
            targetDuration: targetDuration,
            customEndDate: targetDuration == .custom ? ISO8601.dateOnlyString(from: customEndDate) : nil
        )
    }

    func registerInput() -> RegisterInput {
        RegisterInput(name: name.trimmingCharacters(in: .whitespaces),
                      email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                      password: password,
                      dateOfBirth: ISO8601.dateOnlyString(from: dateOfBirth),
                      sex: sex, heightCm: heightCm)
    }

    func goalInput(from plan: GoalPlan.Result) -> CreateGoalInput {
        CreateGoalInput(
            goalType: goalType,
            startingWeightKg: currentWeightKg,
            targetWeightKg: goalType == .maintain ? currentWeightKg : targetWeightKg,
            targetDuration: targetDuration,
            customEndDate: targetDuration == .custom ? ISO8601.dateOnlyString(from: customEndDate) : nil,
            activityLevel: activityLevel,
            bmr: plan.bmr, tdee: plan.tdee,
            calorieTarget: plan.calorieTarget, calorieTargetOverridden: false,
            proteinTargetG: plan.proteinTargetG, proteinTargetOverridden: false,
            carbsTargetG: plan.carbsTargetG, carbsTargetOverridden: false,
            fatTargetG: plan.fatTargetG, fatTargetOverridden: false,
            fibreTargetG: plan.fibreTargetG, fibreTargetOverridden: false,
            waterTargetMl: plan.waterTargetMl, waterTargetOverridden: false
        )
    }
}

struct OnboardingView: View {
    @Environment(Session.self) private var session
    @State private var draft = OnboardingDraft()
    @State private var step = 0
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private let stepCount = 3

    var body: some View {
        VStack(spacing: 0) {
            ProgressView(value: Double(step + 1), total: Double(stepCount))
                .tint(Theme.accent)
                .padding(.horizontal, Theme.Spacing.lg)
                .padding(.top, Theme.Spacing.sm)

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    switch step {
                    case 0: accountStep
                    case 1: goalStep
                    default: reviewStep
                    }
                }
                .padding(Theme.Spacing.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
                .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity),
                                        removal: .move(edge: .leading).combined(with: .opacity)))
                .id(step)
            }

            bottomBar
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("Set up your plan")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: Steps

    private var accountStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            stepTitle("Tell us about you", "We use this to calculate your targets.")
            FormField(title: "Name", systemImage: "person.fill", text: $draft.name, textContentType: .name)
            FormField(title: "Email", systemImage: "envelope.fill", text: $draft.email,
                      keyboard: .emailAddress, textContentType: .emailAddress)
            FormField(title: "Password (8+ characters)", systemImage: "lock.fill",
                      text: $draft.password, secure: true, textContentType: .newPassword)

            Card {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    DatePicker("Date of birth", selection: $draft.dateOfBirth,
                               in: ...Date.now, displayedComponents: .date)
                    Divider()
                    Picker("Sex", selection: $draft.sex) {
                        Text("Male").tag(Sex.male)
                        Text("Female").tag(Sex.female)
                    }
                    .pickerStyle(.segmented)
                    Divider()
                    stepper("Height", value: $draft.heightCm, range: 120...220, unit: "cm")
                    Divider()
                    stepper("Current weight", value: $draft.currentWeightKg, range: 30...250, unit: "kg")
                }
            }
        }
    }

    private var goalStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            stepTitle("What's your goal?", "Pick a target and pace.")
            Picker("Goal", selection: $draft.goalType) {
                ForEach(Goal.allCases, id: \.self) { Text($0.label).tag($0) }
            }
            .pickerStyle(.segmented)

            Card {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    if draft.goalType != .maintain {
                        stepper("Target weight", value: $draft.targetWeightKg, range: 30...250, unit: "kg")
                        Divider()
                        Picker("Timeframe", selection: $draft.targetDuration) {
                            ForEach(TargetDuration.allCases, id: \.self) { Text($0.label).tag($0) }
                        }
                        if draft.targetDuration == .custom {
                            DatePicker("Target date", selection: $draft.customEndDate,
                                       in: Date.now..., displayedComponents: .date)
                        }
                        Divider()
                    }
                    Picker("Activity level", selection: $draft.activityLevel) {
                        ForEach(ActivityLevel.allCases, id: \.self) { Text($0.label).tag($0) }
                    }
                }
            }
        }
    }

    private var reviewStep: some View {
        let plan = draft.plan
        return VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            stepTitle("Your daily plan", "Calculated from your details — you can fine-tune later.")

            Card {
                VStack(spacing: Theme.Spacing.md) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Daily calories").font(.subheadline).foregroundStyle(.secondary)
                            Text("\(Int(plan.calorieTarget)) kcal")
                                .font(.system(size: 34, weight: .bold, design: .rounded))
                                .foregroundStyle(Theme.accent)
                                .contentTransition(.numericText())
                        }
                        Spacer()
                        Image(systemName: "flame.fill").font(.system(size: 40)).foregroundStyle(Theme.accent.opacity(0.5))
                    }
                    Divider()
                    HStack(spacing: Theme.Spacing.md) {
                        macroPill("Protein", plan.proteinTargetG, Theme.protein)
                        macroPill("Carbs", plan.carbsTargetG, Theme.carbs)
                        macroPill("Fat", plan.fatTargetG, Theme.fat)
                    }
                    HStack(spacing: Theme.Spacing.md) {
                        macroPill("Fibre", plan.fibreTargetG, Theme.fibre)
                        macroPill("Water", plan.waterTargetMl / 1000, Theme.water, unit: "L")
                    }
                }
            }

            Card {
                HStack {
                    metric("BMR", "\(Int(plan.bmr))")
                    Divider().frame(height: 34)
                    metric("TDEE", "\(Int(plan.tdee))")
                    Divider().frame(height: 34)
                    metric("BMI", String(format: "%.1f", GoalPlan.bmi(weightKg: draft.currentWeightKg, heightCm: draft.heightCm)))
                }
            }

            if let errorMessage {
                Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                    .font(.subheadline).foregroundStyle(.red)
            }
        }
        .animation(.snappy, value: plan)
    }

    // MARK: Bottom bar

    private var bottomBar: some View {
        HStack(spacing: Theme.Spacing.md) {
            if step > 0 {
                Button {
                    withAnimation(.snappy) { step -= 1 }
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.headline)
                        .frame(width: 52, height: 52)
                        .glassEffect(.regular, in: .circle)
                }
            }
            Button(action: advance) {
                Text(step == stepCount - 1 ? (isSubmitting ? "" : "Start tracking") : "Continue")
            }
            .buttonStyle(.primary(loading: isSubmitting))
            .disabled(step == 0 && !draft.accountValid)
        }
        .padding(Theme.Spacing.lg)
        .background(.ultraThinMaterial)
    }

    private func advance() {
        if step < stepCount - 1 {
            withAnimation(.snappy) { step += 1 }
            return
        }
        guard !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil
        let plan = draft.plan
        Task {
            do {
                try await session.register(account: draft.registerInput(), goal: draft.goalInput(from: plan))
            } catch {
                errorMessage = (error as? APIError)?.errorDescription ?? "Couldn't create your account."
            }
            isSubmitting = false
        }
    }

    // MARK: Bits

    private func stepTitle(_ title: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.title.weight(.bold))
            Text(subtitle).foregroundStyle(.secondary)
        }
    }

    private func stepper(_ label: String, value: Binding<Double>, range: ClosedRange<Double>, unit: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            Text("\(Int(value.wrappedValue)) \(unit)").foregroundStyle(.secondary).monospacedDigit()
            Stepper(label, value: value, in: range).labelsHidden()
        }
    }

    private func macroPill(_ label: String, _ grams: Double, _ color: Color, unit: String = "g") -> some View {
        VStack(spacing: 2) {
            Text(unit == "L" ? String(format: "%.1f", grams) : "\(Int(grams))")
                .font(.headline).foregroundStyle(color).contentTransition(.numericText())
            Text("\(label) (\(unit))").font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.opacity(0.12), in: .rect(cornerRadius: Theme.Radius.control))
    }

    private func metric(_ label: String, _ value: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.headline).monospacedDigit()
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}
