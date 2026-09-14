import SwiftUI
import Charts

struct TrendsView: View {
    @Environment(Session.self) private var session
    @State private var model = TrendsViewModel()
    @State private var showLogWeight = false

    private var unitSystem: UnitSystem { session.settings?.unitSystem ?? .metric }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.md) {
                    Picker("Section", selection: $model.section) {
                        ForEach(TrendsViewModel.Section.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    rangePicker

                    switch model.section {
                    case .nutrition: nutritionSection
                    case .weight: weightSection
                    case .water: waterSection
                    }
                }
                .padding(Theme.Spacing.md)
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Trends")
            .overlay { if model.isLoading { ProgressView() } }
            .sheet(isPresented: $showLogWeight) {
                LogWeightSheet(unitSystem: unitSystem,
                               current: model.latestWeight?.weightKg) { value in
                    Task {
                        await model.logWeight(displayValue: value, system: unitSystem)
                        Haptics.success()
                    }
                }
                .presentationDetents([.height(280)])
            }
        }
        .task { await model.load() }
    }

    private var rangePicker: some View {
        Picker("Range", selection: $model.range) {
            ForEach(TrendsViewModel.Range.allCases) { Text($0.rawValue).tag($0) }
        }
        .pickerStyle(.segmented)
    }

    // MARK: Nutrition

    private var nutritionSection: some View {
        VStack(spacing: Theme.Spacing.md) {
            Card {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Average score").font(.subheadline).foregroundStyle(.secondary)
                            Text(model.averageScore.map { "\(Int($0))" } ?? "—")
                                .font(.system(size: 34, weight: .bold, design: .rounded))
                                .foregroundStyle(Theme.accent)
                        }
                        Spacer()
                        if let avg = model.averageScore {
                            Text(NutritionScoreLabel.from(score: avg).rawValue)
                                .font(.caption.weight(.semibold))
                                .padding(.horizontal, 10).padding(.vertical, 5)
                                .background(Theme.accent.opacity(0.15), in: .capsule)
                                .foregroundStyle(Theme.accentDeep)
                        }
                    }
                    if model.scores.isEmpty {
                        emptyChart("No scores yet", "Log meals to build your trend.")
                    } else {
                        Chart(model.scores) { day in
                            BarMark(
                                x: .value("Day", ISO8601.dateOnly.date(from: day.dateKey) ?? .now, unit: .day),
                                y: .value("Score", day.score)
                            )
                            .foregroundStyle(bandColor(day.score))
                            .cornerRadius(4)
                        }
                        .chartYScale(domain: 0...100)
                        .frame(height: 200)
                    }
                }
            }
        }
    }

    private func bandColor(_ score: Double) -> Color {
        switch score {
        case 85...: Theme.fibre
        case 70..<85: Theme.accent
        case 50..<70: Theme.carbs
        default: Theme.protein
        }
    }

    // MARK: Weight

    private var weightSection: some View {
        VStack(spacing: Theme.Spacing.md) {
            Card {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Current").font(.subheadline).foregroundStyle(.secondary)
                        Text(model.latestWeight.map { Units.formattedWeight($0.weightKg, unitSystem) } ?? "—")
                            .font(.system(size: 32, weight: .bold, design: .rounded)).monospacedDigit()
                    }
                    Spacer()
                    Button {
                        showLogWeight = true
                    } label: {
                        Label("Log", systemImage: "plus")
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, Theme.Spacing.md).padding(.vertical, 10)
                            .glassEffect(.regular.tint(Theme.accent.opacity(0.25)).interactive(), in: .capsule)
                            .foregroundStyle(Theme.accentDeep)
                    }
                }
            }

            Card {
                if model.weightsInRange().isEmpty {
                    emptyChart("No weigh-ins", "Tap Log to add your weight.")
                } else {
                    weightChart
                }
            }

            HStack(spacing: Theme.Spacing.md) {
                statTile("Change", changeText(model.weightChange))
                statTile("Per week", changeText(model.weeklyChange))
            }

            weightHistory
        }
    }

    private var weightChart: some View {
        let logs = model.weightsInRange()
        let target = session.activeGoal?.targetWeightKg
        return Chart {
            ForEach(logs) { log in
                if let date = ISO8601.date(from: log.loggedAt) {
                    LineMark(x: .value("Date", date),
                             y: .value("Weight", Units.displayWeight(log.weightKg, unitSystem)))
                    .interpolationMethod(.catmullRom)
                    .foregroundStyle(Theme.accent)
                    PointMark(x: .value("Date", date),
                              y: .value("Weight", Units.displayWeight(log.weightKg, unitSystem)))
                    .foregroundStyle(Theme.accent)
                }
            }
            if let target {
                RuleMark(y: .value("Target", Units.displayWeight(target, unitSystem)))
                    .foregroundStyle(Theme.fibre)
                    .lineStyle(.init(lineWidth: 1.5, dash: [6, 4]))
                    .annotation(position: .top, alignment: .leading) {
                        Text("Target").font(.caption2).foregroundStyle(Theme.fibre)
                    }
            }
        }
        .chartYScale(domain: .automatic(includesZero: false))
        .frame(height: 200)
    }

    private var weightHistory: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("History").font(.headline)
                let logs = model.weightsInRange().reversed()
                if logs.isEmpty {
                    Text("No entries in this range.").font(.subheadline).foregroundStyle(.secondary)
                } else {
                    ForEach(Array(logs)) { log in
                        HStack {
                            Text(Units.formattedWeight(log.weightKg, unitSystem))
                                .font(.subheadline.weight(.semibold)).monospacedDigit()
                            Spacer()
                            Text(dateLabel(log.loggedAt)).font(.caption).foregroundStyle(.secondary)
                            Button {
                                Task { await model.deleteWeight(log) }
                            } label: {
                                Image(systemName: "trash").font(.caption).foregroundStyle(.secondary)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.vertical, 4)
                        Divider()
                    }
                }
            }
        }
    }

    // MARK: Water

    private var waterSection: some View {
        let byDay = model.waterByDay()
        let target = session.activeGoal?.waterTargetMl ?? 2000
        return Card {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                Text("Daily water").font(.headline)
                if byDay.isEmpty {
                    emptyChart("No water logged", "Add water from the Home tab.")
                } else {
                    Chart {
                        ForEach(byDay, id: \.date) { entry in
                            BarMark(x: .value("Day", entry.date, unit: .day),
                                    y: .value("ml", entry.ml))
                            .foregroundStyle(Theme.water)
                            .cornerRadius(4)
                        }
                        RuleMark(y: .value("Target", target))
                            .foregroundStyle(Theme.water.opacity(0.6))
                            .lineStyle(.init(lineWidth: 1.5, dash: [6, 4]))
                    }
                    .frame(height: 200)
                }
            }
        }
    }

    // MARK: Bits

    private func statTile(_ label: String, _ value: String) -> some View {
        Card {
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Text(value).font(.title3.weight(.bold)).monospacedDigit()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func changeText(_ kg: Double?) -> String {
        guard let kg else { return "—" }
        let display = Units.displayWeight(abs(kg), unitSystem)
        let sign = kg > 0 ? "+" : kg < 0 ? "−" : ""
        return String(format: "%@%.1f %@", sign, display, Units.weightUnit(unitSystem))
    }

    private func emptyChart(_ title: String, _ subtitle: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: "chart.xyaxis.line").font(.title).foregroundStyle(.secondary)
            Text(title).font(.subheadline.weight(.semibold))
            Text(subtitle).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).frame(height: 180)
    }

    private func dateLabel(_ iso: String) -> String {
        guard let date = ISO8601.date(from: iso) else { return "" }
        return date.formatted(.dateTime.month(.abbreviated).day())
    }
}

/// Sheet for logging a weigh-in in the user's unit.
private struct LogWeightSheet: View {
    let unitSystem: UnitSystem
    let current: Double?
    var onSave: (Double) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var value: Double

    init(unitSystem: UnitSystem, current: Double?, onSave: @escaping (Double) -> Void) {
        self.unitSystem = unitSystem
        self.current = current
        self.onSave = onSave
        let start = current.map { Units.displayWeight($0, unitSystem) } ?? (unitSystem == .imperial ? 154 : 70)
        _value = State(initialValue: (start * 10).rounded() / 10)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: Theme.Spacing.lg) {
                Text("\(value, specifier: "%.1f") \(Units.weightUnit(unitSystem))")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .contentTransition(.numericText())
                Stepper(value: $value, in: 20...400, step: 0.1) {
                    Text("Adjust weight")
                }
                .labelsHidden()
                Button {
                    onSave(value)
                    dismiss()
                } label: { Text("Save weigh-in") }
                    .buttonStyle(.primary)
            }
            .padding(Theme.Spacing.lg)
            .navigationTitle("Log weight")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            }
        }
    }
}
