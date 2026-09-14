import SwiftUI

struct DashboardView: View {
    @Environment(Session.self) private var session
    @Environment(AppState.self) private var appState
    @State private var model = DashboardViewModel()
    @State private var bounceToken = 0
    @State private var showPhotoLog = false

    private var goal: GoalRecord? { session.activeGoal }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.md) {
                    greetingHeader
                    calorieCard
                    HStack(spacing: Theme.Spacing.md) {
                        scoreCard
                        weightCard
                    }
                    macrosCard
                    waterCard
                    mealsSection
                }
                .padding(Theme.Spacing.md)
            }
            .background(Theme.background.ignoresSafeArea())
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 52) }
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await model.load() }
            .overlay { if model.isLoading && model.meals.isEmpty { ProgressView() } }
            .fullScreenCover(isPresented: $showPhotoLog) {
                PhotoLogView { _ in
                    bounceToken += 1
                    Task { await model.load() }
                }
            }
        }
        .task { await model.load() }
        .onChange(of: appState.dataVersion) {
            bounceToken += 1
            Task { await model.load() }
        }
    }

    // MARK: Greeting

    private var greetingHeader: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(greetingPrefix)
                .font(.title3.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(firstName)
                .font(.largeTitle.weight(.bold))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, Theme.Spacing.xs)
    }

    private var firstName: String {
        session.user?.name.split(separator: " ").first.map(String.init) ?? "there"
    }

    private var greetingPrefix: String {
        switch Calendar.current.component(.hour, from: .now) {
        case ..<12: "Good morning,"
        case ..<17: "Good afternoon,"
        default: "Good evening,"
        }
    }

    // MARK: Calorie card

    private var calorieCard: some View {
        Card {
            HStack(spacing: Theme.Spacing.lg) {
                let target = goal?.calorieTarget ?? 0
                let remaining = max(0, target - model.consumedCalories)
                RingProgress(
                    progress: target > 0 ? model.consumedCalories / target : 0,
                    lineWidth: 14,
                    gradient: [Theme.accent, Theme.accentDeep, Theme.mustard]
                ) {
                    Mascot(size: 76, bounceToken: bounceToken)
                }
                .frame(width: 130, height: 130)

                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("\(Int(remaining))")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundStyle(Theme.accent)
                            .monospacedDigit()
                            .contentTransition(.numericText())
                        Text("kcal left").font(.caption).foregroundStyle(.secondary)
                    }
                    calorieStat("Eaten", model.consumedCalories, .primary)
                    calorieStat("Target", goal?.calorieTarget ?? 0, .secondary)
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func calorieStat(_ label: String, _ value: Double, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text("\(Int(value))").font(.title3.weight(.bold)).foregroundStyle(color).monospacedDigit()
        }
    }

    // MARK: Score

    private var scoreCard: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("Today's score").font(.caption).foregroundStyle(.secondary)
                if let score = model.score {
                    Text("\(Int(score.score))")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(Theme.accent)
                        .contentTransition(.numericText())
                    Text(score.label.rawValue).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                } else {
                    Text("-").font(.system(size: 34, weight: .bold, design: .rounded)).foregroundStyle(.secondary)
                    Text("Log to see").font(.caption).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var weightCard: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("Weight").font(.caption).foregroundStyle(.secondary)
                if let weight = model.latestWeight {
                    Text(String(format: "%.1f", weight.weightKg))
                        .font(.system(size: 34, weight: .bold, design: .rounded)).monospacedDigit()
                    Text("kg").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                } else {
                    Text("-").font(.system(size: 34, weight: .bold, design: .rounded)).foregroundStyle(.secondary)
                    Text("Not logged").font(.caption).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: Macros

    private var macrosCard: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                Text("Macros").font(.headline)
                MacroBar(label: "Protein", consumed: model.consumedProtein,
                         target: goal?.proteinTargetG ?? 0, unit: "g", color: Theme.protein)
                MacroBar(label: "Carbs", consumed: model.consumedCarbs,
                         target: goal?.carbsTargetG ?? 0, unit: "g", color: Theme.carbs)
                MacroBar(label: "Fat", consumed: model.consumedFat,
                         target: goal?.fatTargetG ?? 0, unit: "g", color: Theme.fat)
                MacroBar(label: "Fibre", consumed: model.consumedFibre,
                         target: goal?.fibreTargetG ?? 0, unit: "g", color: Theme.fibre)
            }
        }
    }

    // MARK: Water

    private var waterCard: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                HStack {
                    Label("Water", systemImage: "drop.fill").font(.headline).foregroundStyle(Theme.water)
                    Spacer()
                    Text("\(Int(model.consumedWaterMl)) / \(Int(goal?.waterTargetMl ?? 2000)) ml")
                        .font(.caption).foregroundStyle(.secondary).monospacedDigit()
                }
                GeometryReader { geo in
                    let target = goal?.waterTargetMl ?? 2000
                    let fraction = target > 0 ? min(model.consumedWaterMl / target, 1) : 0
                    ZStack(alignment: .leading) {
                        Capsule().fill(Theme.water.opacity(0.15))
                        Capsule().fill(Theme.water)
                            .frame(width: max(6, geo.size.width * fraction))
                            .animation(.spring(duration: 0.5), value: fraction)
                    }
                }
                .frame(height: 8)
                HStack(spacing: Theme.Spacing.sm) {
                    ForEach(AppConstants.waterQuickAddMl, id: \.self) { ml in
                        Button {
                            Haptics.tap()
                            Task {
                                await model.addWater(ml: ml)
                                bounceToken += 1
                            }
                        } label: {
                            Text("+\(ml)")
                                .font(.subheadline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                        }
                        .glassEffect(.regular.tint(Theme.water.opacity(0.25)).interactive(),
                                     in: .rect(cornerRadius: Theme.Radius.control))
                        .foregroundStyle(Theme.water)
                    }
                }
            }
        }
    }

    // MARK: Meals

    private var mealsSection: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                Text("Today's meals").font(.headline)
                if model.meals.isEmpty {
                    VStack(spacing: Theme.Spacing.sm) {
                        Image(systemName: "sparkles").font(.title2).foregroundStyle(Theme.accent)
                        Text("Nothing logged yet").font(.subheadline).foregroundStyle(.secondary)
                        Button {
                            showPhotoLog = true
                        } label: {
                            Label("Snap a photo", systemImage: "camera.fill")
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, Theme.Spacing.md).padding(.vertical, 10)
                                .glassEffect(.regular.tint(Theme.accent.opacity(0.25)).interactive(), in: .capsule)
                                .foregroundStyle(Theme.accent)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.md)
                } else {
                    ForEach(model.mealsByType(), id: \.type) { group in
                        if !group.meals.isEmpty {
                            mealRow(group.type, group.meals)
                        }
                    }
                }
            }
        }
    }

    private func mealRow(_ type: MealType, _ meals: [MealRecord]) -> some View {
        let kcal = meals.reduce(0) { $0 + $1.totalCalories }
        let itemCount = meals.reduce(0) { $0 + $1.items.count }
        return HStack(spacing: Theme.Spacing.md) {
            Image(systemName: type.symbol)
                .font(.headline).foregroundStyle(Theme.accent)
                .frame(width: 40, height: 40)
                .background(Theme.accent.opacity(0.12), in: .circle)
            VStack(alignment: .leading, spacing: 2) {
                Text(type.label).font(.subheadline.weight(.semibold))
                Text("\(itemCount) item\(itemCount == 1 ? "" : "s")").font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(Int(kcal)) kcal").font(.subheadline.weight(.semibold)).monospacedDigit()
        }
        .padding(.vertical, 4)
    }
}
