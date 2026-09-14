import SwiftUI

struct SettingsView: View {
    @Environment(Session.self) private var session

    @State private var theme: AppTheme = .system
    @State private var unitSystem: UnitSystem = .metric
    @State private var latestWeight: WeightLogRecord?
    @State private var showEditProfile = false
    @State private var showEditGoal = false
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var exportURL: URL?
    @State private var showShare = false
    @State private var isExporting = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    Text("Settings")
                        .font(.largeTitle.weight(.bold))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, Theme.Spacing.xs)

                    profileGroup
                    goalGroup
                    preferencesGroup

                    SettingsGroup {
                        NavigationLink { NotificationsView() } label: {
                            SettingsRow(icon: "bell.badge.fill", tint: Theme.accent, title: "Notifications", showChevron: true)
                        }
                        .buttonStyle(.plain)
                    }

                    dataGroup
                    aboutGroup
                    accountGroup
                }
                .padding(Theme.Spacing.md)
            }
            .background(Theme.background.ignoresSafeArea())
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 52) }
            .toolbar(.hidden, for: .navigationBar)
            .tint(Theme.accent)
            .task {
                theme = session.settings?.theme ?? .system
                unitSystem = session.settings?.unitSystem ?? .metric
                await loadLatestWeight()
            }
            .sheet(isPresented: $showEditProfile, onDismiss: { Task { await loadLatestWeight() } }) {
                if let user = session.user {
                    EditProfileSheet(user: user, unitSystem: unitSystem, latestWeight: latestWeight)
                }
            }
            .sheet(isPresented: $showEditGoal) {
                if let goal = session.activeGoal, let user = session.user {
                    EditGoalSheet(goal: goal, user: user,
                                  currentWeightKg: latestWeight?.weightKg ?? goal.startingWeightKg,
                                  unitSystem: unitSystem)
                }
            }
            .sheet(isPresented: $showShare) {
                if let exportURL { ShareSheet(items: [exportURL]) }
            }
            .confirmationDialog("Delete your account?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
                Button("Delete everything", role: .destructive) {
                    Task { isDeleting = true; try? await session.deleteAccount(); isDeleting = false }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This permanently deletes your account and all your data. This can't be undone.")
            }
        }
    }

    private func loadLatestWeight() async {
        let range = Date.range(daysBack: 365)
        latestWeight = (try? await APIClient.shared.weight(from: range.from, to: range.to))?
            .max { $0.loggedAt < $1.loggedAt }
    }

    // MARK: Groups

    private var profileGroup: some View {
        SettingsGroup(title: "Profile") {
            if let user = session.user {
                SettingsRow(icon: "person.fill", tint: Theme.accent, title: "Name", value: user.name)
                divider
                SettingsRow(icon: "envelope.fill", tint: Theme.water, title: "Email", value: user.email)
                divider
                SettingsRow(icon: "ruler.fill", tint: Theme.fibre, title: "Height",
                            value: Units.heightLabel(user.heightCm, unitSystem))
                divider
                SettingsRow(icon: "scalemass.fill", tint: Theme.fat, title: "Weight",
                            value: latestWeight.map { Units.formattedWeight($0.weightKg, unitSystem) } ?? "Not set")
                divider
                Button { showEditProfile = true } label: {
                    SettingsRow(icon: "pencil", tint: .gray, title: "Edit profile", titleColor: Theme.accentDeep, showChevron: true)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var goalGroup: some View {
        SettingsGroup(title: "Goal & targets") {
            if let goal = session.activeGoal {
                SettingsRow(icon: "target", tint: Theme.accent, title: "Goal", value: goal.goalType.label)
                divider
                SettingsRow(icon: "flame.fill", tint: Theme.accentDeep, title: "Calories", value: "\(Int(goal.calorieTarget)) kcal")
                divider
                SettingsRow(icon: "chart.bar.fill", tint: Theme.protein, title: "Protein / Carbs / Fat",
                            value: "\(Int(goal.proteinTargetG)) / \(Int(goal.carbsTargetG)) / \(Int(goal.fatTargetG))")
                divider
                SettingsRow(icon: "drop.fill", tint: Theme.water, title: "Water", value: "\(Int(goal.waterTargetMl)) ml")
                divider
                Button { showEditGoal = true } label: {
                    SettingsRow(icon: "slider.horizontal.3", tint: .gray, title: "Edit goal & targets",
                                titleColor: Theme.accentDeep, showChevron: true)
                }
                .buttonStyle(.plain)
            } else {
                SettingsRow(icon: "target", tint: .gray, title: "No active goal")
            }
        }
    }

    private var preferencesGroup: some View {
        SettingsGroup(title: "Preferences") {
            Menu {
                Picker("Units", selection: $unitSystem) {
                    Text("Metric (kg, cm)").tag(UnitSystem.metric)
                    Text("Imperial (lb, in)").tag(UnitSystem.imperial)
                }
            } label: {
                SettingsRow(icon: "ruler", tint: Theme.fibre, title: "Units",
                            value: unitSystem == .metric ? "Metric" : "Imperial", showMenuChevron: true)
            }
            .onChange(of: unitSystem) { _, value in Task { await session.updateSettings(unitSystem: value) } }
            divider
            Menu {
                Picker("Appearance", selection: $theme) {
                    Text("System").tag(AppTheme.system)
                    Text("Light").tag(AppTheme.light)
                    Text("Dark").tag(AppTheme.dark)
                }
            } label: {
                SettingsRow(icon: "circle.lefthalf.filled", tint: .indigo, title: "Appearance",
                            value: theme.rawValue.capitalized, showMenuChevron: true)
            }
            .onChange(of: theme) { _, value in Task { await session.updateSettings(theme: value) } }
        }
    }

    private var dataGroup: some View {
        VStack(alignment: .leading, spacing: 8) {
            SettingsGroup {
                Button {
                    Task {
                        isExporting = true
                        if let data = try? await APIClient.shared.exportData() {
                            let url = FileManager.default.temporaryDirectory.appendingPathComponent("omnomnom-export.json")
                            try? data.write(to: url)
                            exportURL = url
                            showShare = true
                        }
                        isExporting = false
                    }
                } label: {
                    SettingsRow(icon: "square.and.arrow.up.fill", tint: Theme.mustard, title: "Export my data",
                                titleColor: Theme.accentDeep, trailing: isExporting ? AnyView(ProgressView()) : nil)
                }
                .buttonStyle(.plain)
            }
            Text("Your data syncs to your account automatically, so signing in on another device restores everything. Export is an extra personal backup.")
                .font(.caption).foregroundStyle(.secondary)
                .padding(.horizontal, 4)
        }
    }

    private var aboutGroup: some View {
        SettingsGroup(title: "About") {
            NavigationLink { PrivacyView() } label: {
                SettingsRow(icon: "hand.raised.fill", tint: Theme.fibre, title: "Privacy", showChevron: true)
            }.buttonStyle(.plain)
            divider
            NavigationLink { TermsView() } label: {
                SettingsRow(icon: "doc.text.fill", tint: Theme.water, title: "Terms of Use", showChevron: true)
            }.buttonStyle(.plain)
            divider
            NavigationLink { AboutView() } label: {
                SettingsRow(icon: "info.circle.fill", tint: .gray, title: "About OmNomNom", showChevron: true)
            }.buttonStyle(.plain)
        }
    }

    private var accountGroup: some View {
        SettingsGroup {
            Button { Task { await session.logout() } } label: {
                SettingsRow(icon: "rectangle.portrait.and.arrow.right", tint: .red, title: "Log out", titleColor: .red)
            }.buttonStyle(.plain)
            divider
            Button { showDeleteConfirm = true } label: {
                SettingsRow(icon: "trash.fill", tint: .red, title: "Delete account", titleColor: .red)
            }
            .buttonStyle(.plain)
            .disabled(isDeleting)
        }
    }

    private var divider: some View {
        Divider().padding(.leading, 56)
    }
}

// MARK: - Reusable settings components

private struct SettingsGroup<Content: View>: View {
    var title: String?
    @ViewBuilder var content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let title {
                Text(title.uppercased())
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.leading, 4)
            }
            VStack(spacing: 0) { content }
                .background(Theme.surface, in: .rect(cornerRadius: 18))
                .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(.black.opacity(0.05), lineWidth: 0.5))
        }
    }
}

private struct SettingsRow: View {
    let icon: String
    var tint: Color = .gray
    let title: String
    var value: String?
    var titleColor: Color = .primary
    var showChevron = false
    var showMenuChevron = false
    var trailing: AnyView?

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(tint, in: .rect(cornerRadius: 8))
            Text(title).foregroundStyle(titleColor)
            Spacer(minLength: 8)
            if let value {
                Text(value).foregroundStyle(.secondary).lineLimit(1).truncationMode(.tail)
            }
            if let trailing { trailing }
            if showChevron {
                Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
            }
            if showMenuChevron {
                Image(systemName: "chevron.up.chevron.down").font(.caption2).foregroundStyle(.tertiary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .contentShape(.rect)
    }
}

// MARK: - Edit profile

private struct EditProfileSheet: View {
    let user: PublicUser
    let unitSystem: UnitSystem
    let latestWeight: WeightLogRecord?

    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var dob: Date
    @State private var heightValue: Double
    @State private var weightValue: Double

    init(user: PublicUser, unitSystem: UnitSystem, latestWeight: WeightLogRecord?) {
        self.user = user
        self.unitSystem = unitSystem
        self.latestWeight = latestWeight
        _name = State(initialValue: user.name)
        _dob = State(initialValue: ISO8601.date(from: user.dateOfBirth) ?? .now)
        _heightValue = State(initialValue: unitSystem == .imperial ? (user.heightCm / 2.54).rounded() : user.heightCm.rounded())
        let startKg = latestWeight?.weightKg ?? 70
        _weightValue = State(initialValue: (Units.displayWeight(startKg, unitSystem) * 10).rounded() / 10)
    }

    private var heightUnit: String { unitSystem == .imperial ? "in" : "cm" }
    private var heightRange: ClosedRange<Double> { unitSystem == .imperial ? 48...96 : 120...240 }

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") { TextField("Name", text: $name).textContentType(.name) }
                Section {
                    DatePicker("Date of birth", selection: $dob, in: ...Date.now, displayedComponents: .date)
                    Stepper(value: $heightValue, in: heightRange, step: 1) {
                        HStack { Text("Height"); Spacer(); Text("\(Int(heightValue)) \(heightUnit)").foregroundStyle(.secondary) }
                    }
                    Stepper(value: $weightValue, in: 20...400, step: 0.1) {
                        HStack {
                            Text("Weight"); Spacer()
                            Text("\(weightValue, specifier: "%.1f") \(Units.weightUnit(unitSystem))").foregroundStyle(.secondary)
                        }
                    }
                } footer: {
                    Text("Updating weight adds a new weigh-in.")
                }
            }
            .navigationTitle("Edit profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.fontWeight(.semibold)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func save() {
        let cm = unitSystem == .imperial ? heightValue * 2.54 : heightValue
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let newKg = Units.kg(fromDisplay: weightValue, unitSystem)
        Task {
            await session.updateProfile(name: trimmedName, dateOfBirth: ISO8601.dateOnlyString(from: dob), heightCm: cm)
            if abs(newKg - (latestWeight?.weightKg ?? -1)) > 0.05 {
                _ = try? await APIClient.shared.logWeight(CreateWeightLogInput(
                    weightKg: newKg, loggedAt: ISO8601.string(from: .now), notes: nil, clientId: UUID().uuidString))
            }
            Haptics.success()
        }
        dismiss()
    }
}

// MARK: - Edit goal + targets

private struct EditGoalSheet: View {
    let goal: GoalRecord
    let user: PublicUser
    let currentWeightKg: Double
    let unitSystem: UnitSystem

    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var goalType: Goal
    @State private var activityLevel: ActivityLevel
    @State private var targetWeight: Double
    @State private var targetDuration: TargetDuration
    @State private var calories: Double
    @State private var protein: Double
    @State private var carbs: Double
    @State private var fat: Double
    @State private var fibre: Double
    @State private var water: Double

    init(goal: GoalRecord, user: PublicUser, currentWeightKg: Double, unitSystem: UnitSystem) {
        self.goal = goal
        self.user = user
        self.currentWeightKg = currentWeightKg
        self.unitSystem = unitSystem
        _goalType = State(initialValue: goal.goalType)
        _activityLevel = State(initialValue: goal.activityLevel)
        _targetWeight = State(initialValue: goal.targetWeightKg)
        _targetDuration = State(initialValue: goal.targetDuration)
        _calories = State(initialValue: goal.calorieTarget)
        _protein = State(initialValue: goal.proteinTargetG)
        _carbs = State(initialValue: goal.carbsTargetG)
        _fat = State(initialValue: goal.fatTargetG)
        _fibre = State(initialValue: goal.fibreTargetG)
        _water = State(initialValue: goal.waterTargetMl)
    }

    private func computedPlan() -> GoalPlan.Result {
        GoalPlan.calculate(
            dateOfBirth: user.dateOfBirth, sex: user.sex, heightCm: user.heightCm,
            currentWeightKg: currentWeightKg,
            targetWeightKg: goalType == .maintain ? currentWeightKg : targetWeight,
            goalType: goalType, activityLevel: activityLevel,
            targetDuration: targetDuration, customEndDate: nil)
    }

    private func recompute() {
        let p = computedPlan()
        calories = p.calorieTarget; protein = p.proteinTargetG; carbs = p.carbsTargetG
        fat = p.fatTargetG; fibre = p.fibreTargetG; water = p.waterTargetMl
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Goal") {
                    Picker("Goal", selection: $goalType) {
                        ForEach(Goal.allCases, id: \.self) { Text($0.label).tag($0) }
                    }
                    if goalType != .maintain {
                        Stepper(value: $targetWeight, in: 30...250, step: 1) {
                            HStack { Text("Target weight"); Spacer()
                                Text(Units.formattedWeight(targetWeight, unitSystem, decimals: 0)).foregroundStyle(.secondary) }
                        }
                        Picker("Timeframe", selection: $targetDuration) {
                            ForEach(TargetDuration.allCases.filter { $0 != .custom }, id: \.self) { Text($0.label).tag($0) }
                        }
                    }
                    Picker("Activity level", selection: $activityLevel) {
                        ForEach(ActivityLevel.allCases, id: \.self) { Text($0.label).tag($0) }
                    }
                }
                Section {
                    field("Calories", value: $calories, unit: "kcal")
                    field("Protein", value: $protein, unit: "g")
                    field("Carbs", value: $carbs, unit: "g")
                    field("Fat", value: $fat, unit: "g")
                    field("Fibre", value: $fibre, unit: "g")
                    field("Water", value: $water, unit: "ml")
                } header: {
                    Text("Daily targets")
                } footer: {
                    Text("Changing your goal recalculates these. Fine-tune any value by hand.")
                }
            }
            .navigationTitle("Edit goal")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: goalType) { recompute() }
            .onChange(of: activityLevel) { recompute() }
            .onChange(of: targetWeight) { recompute() }
            .onChange(of: targetDuration) { recompute() }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }.fontWeight(.semibold)
                }
            }
        }
    }

    private func field(_ label: String, value: Binding<Double>, unit: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField(label, value: value, format: .number)
                .keyboardType(.numberPad).multilineTextAlignment(.trailing).frame(maxWidth: 90)
            Text(unit).foregroundStyle(.secondary)
        }
    }

    private func save() {
        let p = computedPlan()
        let input = CreateGoalInput(
            goalType: goalType,
            startingWeightKg: currentWeightKg,
            targetWeightKg: goalType == .maintain ? currentWeightKg : targetWeight,
            targetDuration: targetDuration,
            customEndDate: nil,
            activityLevel: activityLevel,
            bmr: p.bmr, tdee: p.tdee,
            calorieTarget: calories, calorieTargetOverridden: calories != p.calorieTarget,
            proteinTargetG: protein, proteinTargetOverridden: protein != p.proteinTargetG,
            carbsTargetG: carbs, carbsTargetOverridden: carbs != p.carbsTargetG,
            fatTargetG: fat, fatTargetOverridden: fat != p.fatTargetG,
            fibreTargetG: fibre, fibreTargetOverridden: fibre != p.fibreTargetG,
            waterTargetMl: water, waterTargetOverridden: water != p.waterTargetMl)
        Task {
            await session.setGoal(input)
            Haptics.success()
        }
        dismiss()
    }
}

/// UIActivityViewController wrapper for exporting the data file.
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
