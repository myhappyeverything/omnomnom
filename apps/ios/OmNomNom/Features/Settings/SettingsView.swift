import SwiftUI

struct SettingsView: View {
    @Environment(Session.self) private var session

    @State private var theme: AppTheme = .system
    @State private var unitSystem: UnitSystem = .metric
    @State private var latestWeight: WeightLogRecord?
    @State private var showEditProfile = false
    @State private var showEditGoal = false
    @State private var showWeighIn = false
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var exportURL: URL?
    @State private var showShare = false
    @State private var isExporting = false

    var body: some View {
        NavigationStack {
            Form {
                profileSection
                goalSection
                preferencesSection

                Section {
                    NavigationLink { NotificationsView() } label: {
                        Label("Notifications", systemImage: "bell.badge.fill")
                    }
                }

                dataSection
                legalSection
                accountSection
            }
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 52) }
            .navigationTitle("Settings")
            .tint(Theme.accent)
            .task {
                theme = session.settings?.theme ?? .system
                unitSystem = session.settings?.unitSystem ?? .metric
                let range = Date.range(daysBack: 365)
                latestWeight = (try? await APIClient.shared.weight(from: range.from, to: range.to))?
                    .max { $0.loggedAt < $1.loggedAt }
            }
            .sheet(isPresented: $showEditProfile) {
                if let user = session.user {
                    EditProfileSheet(user: user, unitSystem: unitSystem)
                }
            }
            .sheet(isPresented: $showEditGoal) {
                if let goal = session.activeGoal { EditGoalSheet(goal: goal) }
            }
            .sheet(isPresented: $showWeighIn) {
                WeighInSheet(unitSystem: unitSystem, current: latestWeight?.weightKg) { value in
                    Task {
                        let kg = Units.kg(fromDisplay: value, unitSystem)
                        latestWeight = try? await APIClient.shared.logWeight(CreateWeightLogInput(
                            weightKg: kg, loggedAt: ISO8601.string(from: .now), notes: nil,
                            clientId: UUID().uuidString))
                        Haptics.success()
                    }
                }
                .presentationDetents([.height(280)])
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

    // MARK: Profile

    private var profileSection: some View {
        Section("Profile") {
            if let user = session.user {
                LabeledContent("Name", value: user.name)
                LabeledContent("Email", value: user.email)
                LabeledContent("Height", value: Units.heightLabel(user.heightCm, unitSystem))
                Button { showEditProfile = true } label: {
                    Label("Edit profile", systemImage: "pencil")
                }
                .tint(Theme.accent)
            }
            Button { showWeighIn = true } label: {
                HStack {
                    Label("Current weight", systemImage: "scalemass")
                    Spacer()
                    Text(latestWeight.map { Units.formattedWeight($0.weightKg, unitSystem) } ?? "Log")
                        .foregroundStyle(.secondary)
                }
            }
            .tint(.primary)
        }
    }

    // MARK: Goal

    private var goalSection: some View {
        Section("Daily targets") {
            if let goal = session.activeGoal {
                LabeledContent("Goal", value: goal.goalType.label)
                LabeledContent("Calories", value: "\(Int(goal.calorieTarget)) kcal")
                LabeledContent("Protein / Carbs / Fat",
                               value: "\(Int(goal.proteinTargetG)) / \(Int(goal.carbsTargetG)) / \(Int(goal.fatTargetG)) g")
                LabeledContent("Fibre", value: "\(Int(goal.fibreTargetG)) g")
                LabeledContent("Water", value: "\(Int(goal.waterTargetMl)) ml")
                Button { showEditGoal = true } label: {
                    Label("Edit targets", systemImage: "slider.horizontal.3")
                }
                .tint(Theme.accent)
            } else {
                Text("No active goal").foregroundStyle(.secondary)
            }
        }
    }

    // MARK: Preferences

    private var preferencesSection: some View {
        Section("Preferences") {
            Picker("Units", selection: $unitSystem) {
                Text("Metric (kg, cm)").tag(UnitSystem.metric)
                Text("Imperial (lb, in)").tag(UnitSystem.imperial)
            }
            .onChange(of: unitSystem) { _, value in
                Task { await session.updateSettings(unitSystem: value) }
            }
            Picker("Appearance", selection: $theme) {
                Text("System").tag(AppTheme.system)
                Text("Light").tag(AppTheme.light)
                Text("Dark").tag(AppTheme.dark)
            }
            .onChange(of: theme) { _, value in
                Task { await session.updateSettings(theme: value) }
            }
        }
    }

    // MARK: Data

    private var dataSection: some View {
        Section {
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
                HStack {
                    Label("Export my data", systemImage: "square.and.arrow.up")
                    if isExporting { Spacer(); ProgressView() }
                }
            }
            .tint(Theme.accent)
        } header: {
            Text("Data")
        } footer: {
            Text("Your data syncs to your account automatically, so signing in on another device restores everything. Export is an extra personal backup.")
        }
    }

    // MARK: Legal

    private var legalSection: some View {
        Section("About") {
            NavigationLink { PrivacyView() } label: { Label("Privacy", systemImage: "hand.raised.fill") }
            NavigationLink { TermsView() } label: { Label("Terms of Use", systemImage: "doc.text.fill") }
            NavigationLink { AboutView() } label: { Label("About OmNomNom", systemImage: "info.circle.fill") }
        }
    }

    // MARK: Account

    private var accountSection: some View {
        Section {
            Button { Task { await session.logout() } } label: {
                Label("Log out", systemImage: "rectangle.portrait.and.arrow.right")
                    .foregroundStyle(.red)
            }
            Button {
                showDeleteConfirm = true
            } label: {
                Label("Delete account", systemImage: "trash")
                    .foregroundStyle(.red)
            }
            .disabled(isDeleting)
        }
    }
}

// MARK: - Edit profile

private struct EditProfileSheet: View {
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
        _heightValue = State(initialValue: unitSystem == .imperial
                             ? (user.heightCm / 2.54).rounded() : user.heightCm.rounded())
    }

    private var heightUnit: String { unitSystem == .imperial ? "in" : "cm" }
    private var heightRange: ClosedRange<Double> { unitSystem == .imperial ? 48...96 : 120...240 }

    var body: some View {
        NavigationStack {
            Form {
                DatePicker("Date of birth", selection: $dob, in: ...Date.now, displayedComponents: .date)
                Stepper(value: $heightValue, in: heightRange, step: 1) {
                    HStack {
                        Text("Height")
                        Spacer()
                        Text("\(Int(heightValue)) \(heightUnit)").foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Edit profile")
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

// MARK: - Edit goal targets

private struct EditGoalSheet: View {
    let goal: GoalRecord

    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var calories: Double
    @State private var protein: Double
    @State private var carbs: Double
    @State private var fat: Double
    @State private var fibre: Double
    @State private var water: Double

    init(goal: GoalRecord) {
        self.goal = goal
        _calories = State(initialValue: goal.calorieTarget)
        _protein = State(initialValue: goal.proteinTargetG)
        _carbs = State(initialValue: goal.carbsTargetG)
        _fat = State(initialValue: goal.fatTargetG)
        _fibre = State(initialValue: goal.fibreTargetG)
        _water = State(initialValue: goal.waterTargetMl)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Per day") {
                    field("Calories", value: $calories, unit: "kcal")
                    field("Protein", value: $protein, unit: "g")
                    field("Carbs", value: $carbs, unit: "g")
                    field("Fat", value: $fat, unit: "g")
                    field("Fibre", value: $fibre, unit: "g")
                    field("Water", value: $water, unit: "ml")
                }
            }
            .navigationTitle("Edit targets")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await session.updateGoal(UpdateGoalOverridesInput(
                                calorieTarget: calories, proteinTargetG: protein, carbsTargetG: carbs,
                                fatTargetG: fat, fibreTargetG: fibre, waterTargetMl: water))
                            Haptics.success()
                        }
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func field(_ label: String, value: Binding<Double>, unit: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField(label, value: value, format: .number)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 90)
            Text(unit).foregroundStyle(.secondary)
        }
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
