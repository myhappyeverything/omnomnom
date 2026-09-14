import SwiftUI
import Charts

struct TrendsView: View {
    @Environment(Session.self) private var session
    @State private var model = TrendsViewModel()
    @State private var showLogWeight = false
    @State private var selectedDay: DaySelection?

    struct DaySelection: Identifiable {
        let date: Date
        var id: TimeInterval { date.timeIntervalSince1970 }
    }

    private var unitSystem: UnitSystem { session.settings?.unitSystem ?? .metric }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.md) {
                    Text("Trends")
                        .font(.largeTitle.weight(.bold))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, Theme.Spacing.xs)

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
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 52) }
            .toolbar(.hidden, for: .navigationBar)
            .overlay { if model.isLoading { ProgressView() } }
            .sheet(isPresented: $showLogWeight) {
                WeighInSheet(unitSystem: unitSystem,
                               current: model.latestWeight?.weightKg) { value in
                    Task {
                        await model.logWeight(displayValue: value, system: unitSystem)
                        Haptics.success()
                    }
                }
                .presentationDetents([.height(280)])
            }
            .sheet(item: $selectedDay) { sel in
                DayDetailSheet(date: sel.date, unitSystem: unitSystem)
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
                            Text(model.averageScore.map { "\(Int($0))" } ?? "-")
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

            Card {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    Text("History").font(.headline)
                    NutritionCalendar(scores: model.calendarScores) { date in
                        selectedDay = DaySelection(date: date)
                    }
                    Text("Tap a day to see what you logged.")
                        .font(.caption).foregroundStyle(.secondary)
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
                        Text(model.latestWeight.map { Units.formattedWeight($0.weightKg, unitSystem) } ?? "-")
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
        guard let kg else { return "-" }
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

/// Score band color shared by the chart and the calendar.
func scoreBandColor(_ score: Double) -> Color {
    switch score {
    case 85...: Theme.fibre
    case 70..<85: Theme.accent
    case 50..<70: Theme.carbs
    default: Theme.protein
    }
}

/// A month grid where each day is tinted by its nutrition score; tapping a day
/// opens that day's detail.
private struct NutritionCalendar: View {
    let scores: [DailyScoreSummary]
    var onSelect: (Date) -> Void

    @State private var month: Date = Calendar.current.date(
        from: Calendar.current.dateComponents([.year, .month], from: .now)) ?? .now

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 7)
    private let weekdays = ["S", "M", "T", "W", "T", "F", "S"]

    private var scoreByKey: [String: Double] {
        Dictionary(scores.map { ($0.dateKey, $0.score) }, uniquingKeysWith: { a, _ in a })
    }

    private var canGoForward: Bool {
        let cal = Calendar.current
        let thisMonth = cal.date(from: cal.dateComponents([.year, .month], from: .now)) ?? .now
        return month < thisMonth
    }

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Button { shiftMonth(-1) } label: { Image(systemName: "chevron.left") }
                    .buttonStyle(.plain).foregroundStyle(Theme.accent)
                Spacer()
                Text(monthTitle).font(.subheadline.weight(.semibold))
                Spacer()
                Button { shiftMonth(1) } label: { Image(systemName: "chevron.right") }
                    .buttonStyle(.plain)
                    .foregroundStyle(canGoForward ? Theme.accent : .secondary.opacity(0.4))
                    .disabled(!canGoForward)
            }
            LazyVGrid(columns: columns, spacing: 6) {
                ForEach(0..<7, id: \.self) { i in
                    Text(weekdays[i]).font(.caption2).foregroundStyle(.secondary)
                }
                ForEach(Array(days.enumerated()), id: \.offset) { _, day in
                    if let day { dayCell(day) } else { Color.clear.frame(height: 38) }
                }
            }
        }
    }

    private func shiftMonth(_ delta: Int) {
        if delta > 0 && !canGoForward { return }
        if let next = Calendar.current.date(byAdding: .month, value: delta, to: month) {
            withAnimation(.snappy) { month = next }
        }
    }

    private func dayCell(_ date: Date) -> some View {
        let key = Self.localKey(date)
        let score = scoreByKey[key]
        let isFuture = Calendar.current.startOfDay(for: date) > Calendar.current.startOfDay(for: .now)
        let day = Calendar.current.component(.day, from: date)
        return Button {
            if !isFuture { onSelect(date) }
        } label: {
            Text("\(day)")
                .font(.footnote.weight(.medium))
                .frame(maxWidth: .infinity, minHeight: 38)
                .background(score.map { scoreBandColor($0).opacity(0.22) } ?? Color.gray.opacity(0.08),
                            in: .rect(cornerRadius: 8))
                .overlay(alignment: .bottom) {
                    // A dot marks days with something logged.
                    if let score { Circle().fill(scoreBandColor(score)).frame(width: 6, height: 6).padding(.bottom, 4) }
                }
                .foregroundStyle(isFuture ? Color.secondary.opacity(0.4) : .primary)
        }
        .buttonStyle(.plain)
        .disabled(isFuture)
    }

    private var monthTitle: String {
        month.formatted(.dateTime.month(.wide).year())
    }

    // The selected month's days with leading blanks for weekday alignment.
    private var days: [Date?] {
        let cal = Calendar.current
        guard let range = cal.range(of: .day, in: .month, for: month) else { return [] }
        let leading = cal.component(.weekday, from: month) - 1
        var result: [Date?] = Array(repeating: nil, count: leading)
        for d in range {
            result.append(cal.date(byAdding: .day, value: d - 1, to: month))
        }
        return result
    }

    static func localKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}

/// A sheet showing the meals logged on a given day.
private struct DayDetailSheet: View {
    let date: Date
    let unitSystem: UnitSystem

    @Environment(\.dismiss) private var dismiss
    @State private var meals: [MealRecord] = []
    @State private var isLoading = true

    private var totalCalories: Double { meals.reduce(0) { $0 + $1.totalCalories } }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                } else if meals.isEmpty {
                    ContentUnavailableView("Nothing logged", systemImage: "fork.knife",
                                           description: Text("No meals were logged on this day."))
                } else {
                    List {
                        Section {
                            LabeledContent("Total", value: "\(Int(totalCalories)) kcal")
                        }
                        ForEach(meals) { meal in
                            Section(meal.mealType.label) {
                                ForEach(meal.items) { item in
                                    HStack {
                                        Text(item.food?.name ?? "Item")
                                        Spacer()
                                        Text("\(Int(item.calories)) kcal").foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle(date.formatted(.dateTime.weekday(.wide).month().day()))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
            .task {
                let cal = Calendar.current
                let start = cal.startOfDay(for: date)
                let end = cal.date(byAdding: .day, value: 1, to: start) ?? date
                meals = (try? await APIClient.shared.meals(from: ISO8601.string(from: start),
                                                           to: ISO8601.string(from: end))) ?? []
                isLoading = false
            }
        }
    }
}
