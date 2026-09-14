import WidgetKit
import SwiftUI

struct SummaryWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SummaryEntry

    var body: some View {
        if entry.missingToken {
            setupPrompt
        } else if let summary = entry.summary {
            switch family {
            case .systemMedium: MediumSummary(summary: summary)
            default: SmallSummary(summary: summary)
            }
        } else {
            unavailable
        }
    }

    private var setupPrompt: some View {
        VStack(spacing: 6) {
            Image("Mascot").resizable().scaledToFit().frame(height: 40)
            Text("Add a widget token in Settings")
                .font(.caption2).foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }

    private var unavailable: some View {
        VStack(spacing: 6) {
            Image(systemName: "wifi.slash").foregroundStyle(.secondary)
            Text("Couldn't load").font(.caption2).foregroundStyle(.secondary)
        }
    }
}

/// Mood → accent color (mirrors the web widget's MOOD_COLOR mapping).
func moodColor(_ mood: WidgetSummary.MascotMood) -> Color {
    switch mood {
    case .excited: Theme.accent
    case .happy: Theme.fibre
    case .neutral: Theme.mustard
    case .sad: Theme.protein
    }
}

private struct SmallSummary: View {
    let summary: WidgetSummary

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Image("Mascot").resizable().scaledToFit().frame(width: 34, height: 34)
                Spacer()
                Text("\(Int(summary.score))")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(moodColor(summary.mascotMood))
            }
            Text(summary.label.rawValue)
                .font(.caption.weight(.semibold))
                .frame(maxWidth: .infinity, alignment: .leading)
                .foregroundStyle(.secondary)
            Spacer(minLength: 0)
            MacroLine(label: "Cal", macro: summary.macros.calories, color: Theme.accent, unit: "")
            MacroLine(label: "Protein", macro: summary.macros.protein, color: Theme.protein, unit: "g")
        }
    }
}

private struct MediumSummary: View {
    let summary: WidgetSummary

    var body: some View {
        HStack(spacing: 16) {
            VStack(spacing: 4) {
                Image("Mascot").resizable().scaledToFit().frame(width: 54, height: 54)
                Text("\(Int(summary.score))")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(moodColor(summary.mascotMood))
                Text(summary.label.rawValue).font(.caption2.weight(.semibold)).foregroundStyle(.secondary)
            }
            .frame(width: 90)

            VStack(alignment: .leading, spacing: 8) {
                Text(summary.message).font(.caption.weight(.semibold)).foregroundStyle(.primary)
                MacroLine(label: "Calories", macro: summary.macros.calories, color: Theme.accent, unit: "")
                MacroLine(label: "Protein", macro: summary.macros.protein, color: Theme.protein, unit: "g")
                MacroLine(label: "Fat", macro: summary.macros.fat, color: Theme.fat, unit: "g")
            }
        }
    }
}

private struct MacroLine: View {
    let label: String
    let macro: WidgetMacro
    let color: Color
    let unit: String

    private var fraction: Double { macro.target > 0 ? min(macro.consumed / macro.target, 1) : 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(label).font(.caption2).foregroundStyle(.secondary)
                Spacer()
                Text("\(Int(macro.consumed))/\(Int(macro.target))\(unit)")
                    .font(.caption2.weight(.medium)).foregroundStyle(.secondary).monospacedDigit()
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(color.opacity(0.18))
                    Capsule().fill(color).frame(width: max(4, geo.size.width * fraction))
                }
            }
            .frame(height: 5)
        }
    }
}
