import SwiftUI

/// The meal photo being "eaten" while the AI analyses it. A scalloped bite is
/// chomped from an edge roughly once a second, marching across and accumulating
/// (no loop) — a native port of the web analyzing animation. Respects Reduce
/// Motion by showing the plain photo.
struct BitesPhotoView: View {
    let image: UIImage
    var cornerRadius: CGFloat = Theme.Radius.card

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var start = Date()

    // Normalized bite centres tracing a zig-zag sweep from the top-left edge.
    private static let centers: [CGPoint] = {
        let rows: [CGFloat] = [0.08, 0.36, 0.64, 0.92]
        let xs: [CGFloat] = [-0.06, 0.20, 0.46, 0.72, 0.98]
        return rows.enumerated().flatMap { index, y in
            (index % 2 == 0 ? xs : xs.reversed()).map { CGPoint(x: $0, y: y) }
        }
    }()
    private let step = 0.9          // seconds between chomps
    private let chomp = 0.32        // seconds for a chomp to open
    private let teeth = 7
    private let biteRadius: CGFloat = 0.17  // fraction of the min side
    private let toothRatio: CGFloat = 0.34

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
        Image(uiImage: image)
            .resizable()
            .scaledToFill()
    }

    private func mask(elapsed: TimeInterval) -> some View {
        Canvas { context, size in
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(.white))
            context.blendMode = .destinationOut
            let unit = min(size.width, size.height)
            let r = biteRadius * unit
            let toothR = r * toothRatio

            for (i, center) in Self.centers.enumerated() {
                let startTime = Double(i) * step
                guard elapsed >= startTime else { continue }
                let progress = min(1, (elapsed - startTime) / chomp)
                let eased = 1 - pow(1 - progress, 3)   // easeOutCubic
                let radius = r * eased
                let cx = center.x * size.width
                let cy = center.y * size.height

                punch(&context, x: cx, y: cy, radius: radius)
                for t in 0..<teeth {
                    let angle = Double(t) / Double(teeth) * 2 * .pi
                    punch(&context,
                          x: cx + cos(angle) * radius,
                          y: cy + sin(angle) * radius,
                          radius: toothR * eased)
                }
            }
        }
    }

    private func punch(_ context: inout GraphicsContext, x: CGFloat, y: CGFloat, radius: CGFloat) {
        guard radius > 0 else { return }
        let rect = CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2)
        context.fill(Path(ellipseIn: rect), with: .color(.black))
    }
}
