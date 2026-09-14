import SwiftUI

/// The nutrition-score breakdown, shown when the score card is tapped.
struct ScoreBreakdownSheet: View {
    let score: NutritionScoreBreakdown?

    @Environment(\.dismiss) private var dismiss

    private struct Row: Identifiable {
        let id = UUID()
        let name: String
        let points: Double
        let maxPoints: Double
    }

    private var total: Double { score?.score ?? 0 }

    private var rows: [Row] {
        let c = score?.components
        return [
            Row(name: "Calories", points: c?.calories.points ?? 0, maxPoints: c?.calories.maxPoints ?? 30),
            Row(name: "Protein", points: c?.protein.points ?? 0, maxPoints: c?.protein.maxPoints ?? 25),
            Row(name: "Fibre", points: c?.fibre.points ?? 0, maxPoints: c?.fibre.maxPoints ?? 15),
            Row(name: "Food quality", points: c?.foodQuality.points ?? 0, maxPoints: c?.foodQuality.maxPoints ?? 10),
            Row(name: "Healthy consistency", points: c?.consistency.points ?? 0, maxPoints: c?.consistency.maxPoints ?? 10),
            Row(name: "Water", points: c?.water.points ?? 0, maxPoints: c?.water.maxPoints ?? 5),
            Row(name: "Logging completeness", points: c?.loggingCompleteness.points ?? 0, maxPoints: c?.loggingCompleteness.maxPoints ?? 5),
        ]
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    VStack(spacing: 4) {
                        Text("\(Int(total)) / 100 points")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                        Text("Here's where your points came from today.")
                            .font(.subheadline).foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, Theme.Spacing.sm)

                    VStack(spacing: Theme.Spacing.lg) {
                        ForEach(rows) { row in
                            componentRow(row)
                        }
                    }
                }
                .padding(Theme.Spacing.lg)
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Today's Nutrition Score")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
        }
    }

    private func componentRow(_ row: Row) -> some View {
        let fraction = row.maxPoints > 0 ? min(row.points / row.maxPoints, 1) : 0
        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(row.name).font(.headline)
                Spacer()
                Text("\(Int(row.points)) / \(Int(row.maxPoints)) pts")
                    .font(.subheadline).foregroundStyle(.secondary).monospacedDigit()
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.accent.opacity(0.15))
                    Capsule().fill(Theme.accent)
                        .frame(width: max(row.points > 0 ? 8 : 0, geo.size.width * fraction))
                }
            }
            .frame(height: 8)
        }
    }
}
