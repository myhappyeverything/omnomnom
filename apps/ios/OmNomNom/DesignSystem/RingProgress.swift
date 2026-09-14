import SwiftUI

/// A circular progress ring with a value in the middle. Used for the calorie
/// budget and the nutrition score.
struct RingProgress<Center: View>: View {
    var progress: Double            // 0...(>1 allowed; clamped for the arc)
    var lineWidth: CGFloat = 12
    var gradient: [Color]
    var track: Color = Color.primary.opacity(0.08)
    @ViewBuilder var center: Center

    private var clamped: Double { min(max(progress, 0), 1) }

    var body: some View {
        ZStack {
            Circle().stroke(track, style: .init(lineWidth: lineWidth, lineCap: .round))
            Circle()
                .trim(from: 0, to: clamped)
                .stroke(
                    AngularGradient(colors: gradient, center: .center),
                    style: .init(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(duration: 0.6), value: clamped)
            center
        }
    }
}

/// A thin labelled macro progress bar.
struct MacroBar: View {
    let label: String
    let consumed: Double
    let target: Double
    let unit: String
    let color: Color

    private var fraction: Double { target > 0 ? min(consumed / target, 1) : 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label).font(.subheadline.weight(.semibold))
                Spacer()
                Text("\(Int(consumed)) / \(Int(target)) \(unit)")
                    .font(.caption).foregroundStyle(.secondary).monospacedDigit()
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(color.opacity(0.15))
                    Capsule().fill(color)
                        .frame(width: max(6, geo.size.width * fraction))
                        .animation(.spring(duration: 0.5), value: fraction)
                }
            }
            .frame(height: 8)
        }
    }
}
