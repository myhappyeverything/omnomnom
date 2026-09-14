import SwiftUI

struct DashboardView: View {
    @Environment(Session.self) private var session
    @Environment(AppState.self) private var appState
    @State private var model = DashboardViewModel()
    @State private var bounceToken = 0
    @State private var showPhotoLog = false
    @State private var showScore = false

    private var goal: GoalRecord? { session.activeGoal }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    header
                    calorieCard
                    scoreCard
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
                PhotoLogView { _ in appState.didLog("Nice one") }
            }
            .sheet(isPresented: $showScore) {
                ScoreBreakdownSheet(score: model.score)
                    .presentationDetents([.medium, .large])
            }
        }
        .task { await model.load() }
        .onChange(of: appState.dataVersion) {
            bounceToken += 1
            Task { await model.load() }
        }
    }

    // MARK: Header

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text("OmNomNom").font(.largeTitle.weight(.bold))
                Text(greeting).font(.subheadline).foregroundStyle(.secondary)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            Spacer(minLength: Theme.Spacing.sm)
            Button { appState.selectedTab = 1 } label: {
                Image(systemName: "magnifyingglass")
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .frame(width: 40, height: 40)
                    .background(Theme.surface, in: .circle)
                    .overlay(Circle().strokeBorder(.black.opacity(0.06), lineWidth: 0.5))
            }
            .accessibilityLabel("Search foods")
        }
        .padding(.top, Theme.Spacing.xs)
    }

    private var greeting: String {
        let name = session.user?.name.split(separator: " ").first.map(String.init) ?? "there"
        let part = switch Calendar.current.component(.hour, from: .now) {
        case ..<12: "Good morning"
        case ..<17: "Good afternoon"
        default: "Good evening"
        }
        return "\(part), \(name)"
    }

    // MARK: Calories

    private var calorieCard: some View {
        let target = goal?.calorieTarget ?? 0
        let remaining = max(0, target - model.consumedCalories)
        return Card {
            HStack(spacing: Theme.Spacing.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("CALORIES LEFT")
                        .font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                        .tracking(0.5)
                    Text("\(Int(remaining))")
                        .font(.system(size: 52, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)
                        .monospacedDigit()
                        .contentTransition(.numericText())
                        .lineLimit(1).minimumScaleFactor(0.6)
                    Text("of \(Int(target)) kcal").font(.subheadline).foregroundStyle(.secondary)
                    Text(motivational).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.accent)
                        .padding(.top, 2)
                }
                Spacer(minLength: 0)
                RingProgress(
                    progress: target > 0 ? model.consumedCalories / target : 0,
                    lineWidth: 12,
                    gradient: [Theme.accent, Theme.accentDeep, Theme.mustard]
                ) {
                    Mascot(size: 66, bounceToken: bounceToken)
                }
                .frame(width: 118, height: 118)
            }
        }
    }

    private var motivational: String {
        let target = goal?.calorieTarget ?? 0
        if target > 0 && model.consumedCalories > target { return "Tomorrow's a fresh start" }
        return "You've got this"
    }

    // MARK: Nutrition score (prominent, tappable)

    private var scoreCard: some View {
        let score = model.score?.score ?? 0
        let label = model.score?.label ?? NutritionScoreLabel.from(score: 0)
        return Button { showScore = true } label: {
            Card {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("TODAY'S NUTRITION SCORE")
                            .font(.caption.weight(.semibold)).foregroundStyle(.secondary).tracking(0.5)
                        Text(label.rawValue)
                            .font(.title2.weight(.bold))
                            .foregroundStyle(scoreColor(score))
                    }
                    Spacer(minLength: Theme.Spacing.sm)
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Image(systemName: "questionmark.circle")
                            .font(.subheadline).foregroundStyle(.secondary)
                            .padding(.trailing, 4)
                        Text("\(Int(score))")
                            .font(.system(size: 36, weight: .bold, design: .rounded)).monospacedDigit()
                            .contentTransition(.numericText())
                        Text("/100").font(.subheadline).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func scoreColor(_ score: Double) -> Color {
        switch score {
        case 85...: Theme.fibre
        case 70..<85: Theme.accent
        case 50..<70: Theme.carbs
        default: Theme.protein
        }
    }

    // MARK: Macros (2 columns, no header)

    private var macrosCard: some View {
        let columns = [GridItem(.flexible(), spacing: Theme.Spacing.lg),
                       GridItem(.flexible(), spacing: Theme.Spacing.lg)]
        return Card {
            LazyVGrid(columns: columns, spacing: Theme.Spacing.md) {
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
                                appState.celebrate("Hydrate")
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
