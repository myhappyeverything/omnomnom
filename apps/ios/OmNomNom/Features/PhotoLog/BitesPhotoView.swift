import SwiftUI

/// The meal photo being "eaten" while the AI analyses it. Scalloped bites of
/// random size and angle appear one at a time, working in from the edges toward
/// the center. Bites are laid out on a jittered grid so their union covers the
/// whole photo (no floating unbitten islands, nothing left behind if it runs to
/// completion). A native port of the web analyzing animation. Respects Reduce
/// Motion by showing the plain photo.
struct BitesPhotoView: View {
    let image: UIImage
    var cornerRadius: CGFloat = Theme.Radius.card

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var start = Date()
    @State private var bites = BitesPhotoView.makeBites()

    private let step = 0.55       // seconds between bites
    private let chomp = 0.28      // seconds for one bite to open

    private struct Bite {
        var center: CGPoint       // normalized 0...1
        var radius: CGFloat       // fraction of the min side
        var rotation: Double      // radians, for the tooth ring
        var teeth: Int
    }

    var body: some View {
        Group {
            if reduceMotion {
                photo
            } else {
                TimelineView(.animation) { timeline in
                    let elapsed = timeline.date.timeIntervalSince(start)
                    photo.mask(mask(elapsed: elapsed))
                }
            }
        }
        .clipShape(.rect(cornerRadius: cornerRadius))
    }

    private var photo: some View {
        Image(uiImage: image).resizable().scaledToFill()
    }

    private func mask(elapsed: TimeInterval) -> some View {
        Canvas { context, size in
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(.white))
            context.blendMode = .destinationOut
            let unit = min(size.width, size.height)

            for (i, bite) in bites.enumerated() {
                let startTime = Double(i) * step
                guard elapsed >= startTime else { continue }
                let progress = min(1, (elapsed - startTime) / chomp)
                let eased = 1 - pow(1 - progress, 3)   // easeOutCubic
                let r = bite.radius * unit * eased
                let cx = bite.center.x * size.width
                let cy = bite.center.y * size.height

                punch(&context, x: cx, y: cy, radius: r)
                let toothR = r * 0.32
                for t in 0..<bite.teeth {
                    let angle = bite.rotation + Double(t) / Double(bite.teeth) * 2 * .pi
                    punch(&context, x: cx + cos(angle) * r, y: cy + sin(angle) * r, radius: toothR)
                }
            }
        }
    }

    private func punch(_ context: inout GraphicsContext, x: CGFloat, y: CGFloat, radius: CGFloat) {
        guard radius > 0 else { return }
        let rect = CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2)
        context.fill(Path(ellipseIn: rect), with: .color(.black))
    }

    /// A jittered 3x4 grid of bites, each big enough to cover its cell (so the
    /// union leaves no gaps), ordered from the outer edges inward.
    private static func makeBites() -> [Bite] {
        let cols = 4, rows = 5
        var rng = SystemRandomNumberGenerator()
        var bites: [Bite] = []
        for r in 0..<rows {
            for c in 0..<cols {
                let baseX = (Double(c) + 0.5) / Double(cols)
                let baseY = (Double(r) + 0.5) / Double(rows)
                let jitterX = Double.random(in: -0.03...0.03, using: &rng)
                let jitterY = Double.random(in: -0.03...0.03, using: &rng)
                bites.append(Bite(
                    center: CGPoint(x: baseX + jitterX, y: baseY + jitterY),
                    radius: CGFloat.random(in: 0.20...0.25, using: &rng),
                    rotation: Double.random(in: 0..<(2 * .pi), using: &rng),
                    teeth: Int.random(in: 6...9, using: &rng)))
            }
        }
        // Eat from the edges toward the middle: farthest-from-center first.
        return bites.sorted {
            hypot($0.center.x - 0.5, $0.center.y - 0.5) > hypot($1.center.x - 0.5, $1.center.y - 0.5)
        }
    }
}
