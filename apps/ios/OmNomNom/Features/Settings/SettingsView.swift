import SwiftUI
import WidgetKit

struct SettingsView: View {
    @Environment(Session.self) private var session

    @State private var theme: AppTheme = .system
    @State private var unitSystem: UnitSystem = .metric
    @State private var tokens: [PublicWidgetToken] = []
    @State private var mintedToken: IssuedWidgetToken?
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
                    NavigationLink {
                        NotificationsView()
                    } label: {
                        Label("Notifications", systemImage: "bell.badge.fill")
                    }
                }

                widgetSection
                dataSection
                accountSection

                Section {
                    Text("OmNomNom \(appVersion)")
                        .font(.footnote).foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
                .listRowBackground(Color.clear)
            }
            .navigationTitle("Settings")
            .tint(Theme.accent)
            .task {
                theme = session.settings?.theme ?? .system
                unitSystem = session.settings?.unitSystem ?? .metric
                tokens = (try? await APIClient.shared.widgetTokens()) ?? []
            }
            .sheet(isPresented: $showShare) {
                if let exportURL { ShareSheet(items: [exportURL]) }
            }
            .alert("Widget token created", isPresented: Binding(
                get: { mintedToken != nil }, set: { if !$0 { mintedToken = nil } })) {
                Button("Done", role: .cancel) {}
            } message: {
                Text("Your widget is connected. Add the OmNomNom widget to your Home Screen to see today's score and macros.")
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

    // MARK: Sections

    private var profileSection: some View {
        Section("Profile") {
            if let user = session.user {
                LabeledContent("Name", value: user.name)
                LabeledContent("Email", value: user.email)
                LabeledContent("Height", value: Units.heightLabel(user.heightCm, unitSystem))
            }
        }
    }

    private var goalSection: some View {
        Section("Goal") {
            if let goal = session.activeGoal {
                LabeledContent("Goal", value: goal.goalType.label)
                LabeledContent("Daily calories", value: "\(Int(goal.calorieTarget)) kcal")
                LabeledContent("Protein / Carbs / Fat",
                               value: "\(Int(goal.proteinTargetG)) / \(Int(goal.carbsTargetG)) / \(Int(goal.fatTargetG)) g")
                LabeledContent("Water", value: "\(Int(goal.waterTargetMl)) ml")
            } else {
                Text("No active goal").foregroundStyle(.secondary)
            }
        }
    }

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

    private var widgetSection: some View {
        Section("Home screen widget") {
            ForEach(tokens) { token in
                VStack(alignment: .leading, spacing: 2) {
                    Text(token.label).font(.body)
                    Text("Added \(shortDate(token.createdAt))").font(.caption).foregroundStyle(.secondary)
                }
            }
            .onDelete { indexSet in
                let toRevoke = indexSet.map { tokens[$0] }
                Task {
                    for t in toRevoke {
                        try? await APIClient.shared.revokeWidgetToken(id: t.id)
                        tokens.removeAll { $0.id == t.id }
                    }
                }
            }
            Button {
                Task {
                    if let issued = try? await APIClient.shared.issueWidgetToken(label: "iPhone widget") {
                        // Store for the widget extension and refresh it immediately.
                        AppGroup.widgetToken = issued.token
                        WidgetCenter.shared.reloadAllTimelines()
                        mintedToken = issued
                        tokens.append(PublicWidgetToken(id: issued.id, label: issued.label,
                                                        lastUsedAt: issued.lastUsedAt, createdAt: issued.createdAt))
                    }
                }
            } label: {
                Label("Create widget token", systemImage: "square.grid.2x2.fill")
            }
            .tint(Theme.accent)
        }
    }

    private var dataSection: some View {
        Section("Data") {
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
        }
    }

    private var accountSection: some View {
        Section {
            Button(role: .destructive) {
                Task { await session.logout() }
            } label: {
                Label("Log out", systemImage: "rectangle.portrait.and.arrow.right")
            }
            Button(role: .destructive) {
                showDeleteConfirm = true
            } label: {
                Label("Delete account", systemImage: "trash")
            }
            .disabled(isDeleting)
        }
    }

    private var appVersion: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        return "v\(v)"
    }

    private func shortDate(_ iso: String) -> String {
        guard let date = ISO8601.date(from: iso) else { return "" }
        return date.formatted(.dateTime.month(.abbreviated).day().year())
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
