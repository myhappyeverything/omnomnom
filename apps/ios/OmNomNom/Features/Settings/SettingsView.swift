import SwiftUI

struct SettingsView: View {
    @Environment(Session.self) private var session

    @State private var name = ""
    @State private var theme: AppTheme = .system
    @State private var unitSystem: UnitSystem = .metric
    @State private var latestWeight: WeightLogRecord?
    @State private var showBodyDetails = false
    @State private var showEditGoal = false
    @State private var showWeighIn = false
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var exportURL: URL?
    @State private var showShare = false
    @State private var isExporting = false

    private var nameChanged: Bool {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        return !trimmed.isEmpty && trimmed != session.user?.name
    }

    private var dobLabel: String {
        guard let dob = session.user?.dateOfBirth, let date = ISO8601.date(from: dob) else { return "Not set" }
        return date.formatted(.dateTime.day().month(.abbreviated).year())
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    Text("Settings")
                        .font(.largeTitle.weight(.bold))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, Theme.Spacing.xs)

                    profileCard
                    goalCard
                    preferencesCard
                    notificationsCard
                    dataCard
                    aboutCard
                    signOutButton
                    deleteCard
                }
                .padding(Theme.Spacing.md)
            }
            .background(Theme.background.ignoresSafeArea())
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 52) }
            .toolbar(.hidden, for: .navigationBar)
            .tint(Theme.accent)
            .task {
                name = session.user?.name ?? ""
                theme = session.settings?.theme ?? .system
                unitSystem = session.settings?.unitSystem ?? .metric
                await loadLatestWeight()
            }
            .sheet(isPresented: $showBodyDetails) {
                if let user = session.user { BodyDetailsSheet(user: user, unitSystem: unitSystem) }
            }
            .sheet(isPresented: $showEditGoal) {
                if let goal = session.activeGoal, let user = session.user {
                    EditGoalSheet(goal: goal, user: user,
                                  currentWeightKg: latestWeight?.weightKg ?? goal.startingWeightKg,
                                  unitSystem: unitSystem)
                }
            }
            .sheet(isPresented: $showWeighIn) {
                WeighInSheet(unitSystem: unitSystem, current: latestWeight?.weightKg) { value in
                    Task {
                        latestWeight = try? await APIClient.shared.logWeight(CreateWeightLogInput(
                            weightKg: Units.kg(fromDisplay: value, unitSystem),
                            loggedAt: ISO8601.string(from: .now), notes: nil, clientId: UUID().uuidString))
                        Haptics.success()
                    }
                }
                .presentationDetents([.height(300)])
            }
            .sheet(isPresented: $showShare) { if let exportURL { ShareSheet(items: [exportURL]) } }
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

    // MARK: Cards

    private var profileCard: some View {
        SettingsCard(title: "Profile") {
            HStack(spacing: Theme.Spacing.md) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 44)).foregroundStyle(.secondary)
                Text(session.user?.email ?? "")
                    .font(.subheadline).foregroundStyle(.secondary)
                Spacer(minLength: 0)
            }
            Divider()
            VStack(alignment: .leading, spacing: 6) {
                Text("Display name").font(.caption).foregroundStyle(.secondary)
                HStack(spacing: Theme.Spacing.sm) {
                    TextField("Name", text: $name)
                        .textContentType(.name)
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(Theme.background, in: .rect(cornerRadius: Theme.Radius.control))
                    Button("Save") {
                        Task { await session.updateProfile(name: name.trimmingCharacters(in: .whitespaces)); Haptics.success() }
                    }
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, Theme.Spacing.md).padding(.vertical, 10)
                    .background(nameChanged ? Theme.accent : Color.gray.opacity(0.2), in: .rect(cornerRadius: Theme.Radius.control))
                    .foregroundStyle(nameChanged ? .white : .secondary)
                    .disabled(!nameChanged)
                }
            }
            Divider()
            tapRow("Height", value: session.user.map { Units.heightLabel($0.heightCm, unitSystem) }) { showBodyDetails = true }
            Divider()
            tapRow("Date of birth", value: dobLabel) { showBodyDetails = true }
            Divider()
            tapRow("Weight", value: latestWeight.map { Units.formattedWeight($0.weightKg, unitSystem) } ?? "Add") { showWeighIn = true }
        }
    }

    private var goalCard: some View {
        SettingsCard(title: "Goal & targets") {
            if let goal = session.activeGoal {
                infoRow("Goal", goal.goalType.label)
                Divider()
                infoRow("Calories", "\(Int(goal.calorieTarget)) kcal")
                Divider()
                infoRow("Protein / Carbs / Fat", "\(Int(goal.proteinTargetG)) / \(Int(goal.carbsTargetG)) / \(Int(goal.fatTargetG)) g")
                Divider()
                infoRow("Water", "\(Int(goal.waterTargetMl)) ml")
                Divider()
                tapRow("Edit goal & targets", accent: true) { showEditGoal = true }
            } else {
                Text("No active goal").foregroundStyle(.secondary)
            }
        }
    }

    private var preferencesCard: some View {
        SettingsCard(title: "Appearance") {
            Picker("Appearance", selection: $theme) {
                Text("System").tag(AppTheme.system)
                Text("Light").tag(AppTheme.light)
                Text("Dark").tag(AppTheme.dark)
            }
            .pickerStyle(.segmented)
            .onChange(of: theme) { _, value in Task { await session.updateSettings(theme: value) } }

            Text("Units").font(.subheadline.weight(.medium)).frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, Theme.Spacing.xs)
            Picker("Units", selection: $unitSystem) {
                Text("Metric").tag(UnitSystem.metric)
                Text("Imperial").tag(UnitSystem.imperial)
            }
            .pickerStyle(.segmented)
            .onChange(of: unitSystem) { _, value in Task { await session.updateSettings(unitSystem: value) } }
        }
    }

    private var notificationsCard: some View {
        SettingsCard {
            NavigationLink { NotificationsView() } label: {
                rowLabel("Notifications", chevron: true)
            }
            .buttonStyle(.plain)
        }
    }

    private var dataCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            SettingsCard {
                Button {
                    Task {
                        isExporting = true
                        if let data = try? await APIClient.shared.exportData() {
                            let url = FileManager.default.temporaryDirectory.appendingPathComponent("omnomnom-export.json")
                            try? data.write(to: url); exportURL = url; showShare = true
                        }
                        isExporting = false
                    }
                } label: {
                    HStack {
                        Text("Export my data").foregroundStyle(Theme.accentDeep)
                        Spacer()
                        if isExporting { ProgressView() }
                    }
                }
                .buttonStyle(.plain)
            }
            Text("Your data syncs to your account automatically, so signing in on another device restores everything. Export is an extra personal backup.")
                .font(.caption).foregroundStyle(.secondary).padding(.horizontal, 4)
        }
    }

    private var aboutCard: some View {
        SettingsCard(title: "About") {
            NavigationLink { PrivacyView() } label: { rowLabel("Privacy", chevron: true) }.buttonStyle(.plain)
            Divider()
            NavigationLink { TermsView() } label: { rowLabel("Terms of Use", chevron: true) }.buttonStyle(.plain)
            Divider()
            NavigationLink { AboutView() } label: { rowLabel("About OmNomNom", chevron: true) }.buttonStyle(.plain)
        }
    }

    private var signOutButton: some View {
        Button { Task { await session.logout() } } label: {
            Text("Sign out")
                .font(.headline)
                .foregroundStyle(.red)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(Color.red.opacity(0.12), in: .rect(cornerRadius: Theme.Radius.card))
        }
    }

    private var deleteCard: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text("Delete account").font(.title3.weight(.bold)).foregroundStyle(.red)
            Text("Permanently deletes your account and all your meals, water, weight, goals and custom foods. This cannot be undone.")
                .font(.subheadline).foregroundStyle(.secondary)
            Button { showDeleteConfirm = true } label: {
                Text("Delete account")
                    .font(.subheadline.weight(.semibold)).foregroundStyle(.red)
                    .frame(maxWidth: .infinity).padding(.vertical, 12)
                    .background(Color.red.opacity(0.12), in: .rect(cornerRadius: Theme.Radius.control))
            }
            .disabled(isDeleting)
        }
        .padding(Theme.Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(.red.opacity(0.35), lineWidth: 1))
    }

    // MARK: Row builders

    private func infoRow(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(value).foregroundStyle(.secondary).multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 2)
    }

    private func rowLabel(_ title: String, value: String? = nil, chevron: Bool = false, accent: Bool = false) -> some View {
        HStack {
            Text(title).foregroundStyle(accent ? Theme.accentDeep : .primary)
            Spacer()
            if let value { Text(value).foregroundStyle(.secondary) }
            if chevron { Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary) }
        }
        .padding(.vertical, 2)
        .contentShape(.rect)
    }

    private func tapRow(_ title: String, value: String? = nil, accent: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) { rowLabel(title, value: value, chevron: true, accent: accent) }
            .buttonStyle(.plain)
    }
}

// MARK: - Reusable card

private struct SettingsCard<Content: View>: View {
    var title: String?
    @ViewBuilder var content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            if let title { Text(title).font(.title3.weight(.bold)) }
            content
        }
        .padding(Theme.Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface, in: .rect(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(.black.opacity(0.05), lineWidth: 0.5))
    }
}

// MARK: - Edit body details (height + date of birth)

private struct BodyDetailsSheet: View {
    let user: PublicUser
    let unitSystem: UnitSystem

    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var dob: Date
    @State private var heightValue: Double

    init(user: PublicUser, unitSystem: UnitSystem) {
        self.user = user
        self.unitSystem = unitSystem
        _dob = State(initialValue: ISO8601.date(from: user.dateOfBirth) ?? .now)
        _heightValue = State(initialValue: unitSystem == .imperial ? (user.heightCm / 2.54).rounded() : user.heightCm.rounded())
    }

    private var heightUnit: String { unitSystem == .imperial ? "in" : "cm" }
    private var heightRange: ClosedRange<Double> { unitSystem == .imperial ? 48...96 : 120...240 }

    var body: some View {
        NavigationStack {
            Form {
                DatePicker("Date of birth", selection: $dob, in: ...Date.now, displayedComponents: .date)
                Stepper(value: $heightValue, in: heightRange, step: 1) {
                    HStack { Text("Height"); Spacer(); Text("\(Int(heightValue)) \(heightUnit)").foregroundStyle(.secondary) }
                }
            }
            .navigationTitle("Body details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let cm = unitSystem == .imperial ? heightValue * 2.54 : heightValue
                        Task {
                            await session.updateProfile(dateOfBirth: ISO8601.dateOnlyString(from: dob), heightCm: cm)
                            Haptics.success()
                        }
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
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
