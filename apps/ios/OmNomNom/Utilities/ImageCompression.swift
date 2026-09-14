import UIKit

/// Downscale + JPEG-compress before upload. Mirrors apps/web imageCompression.ts
/// (max dimension 1024, JPEG quality 0.8) — the biggest lever on Vision cost.
enum ImageCompression {
    static func encode(_ image: UIImage, maxDimension: CGFloat = 1024, quality: CGFloat = 0.8) -> AnalyzeImageInput? {
        let normalized = image.fixedOrientation()
        let size = normalized.size
        let longest = max(size.width, size.height)
        let scale = longest > maxDimension ? maxDimension / longest : 1
        let target = CGSize(width: (size.width * scale).rounded(), height: (size.height * scale).rounded())

        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: target, format: format)
        let resized = renderer.image { _ in
            normalized.draw(in: CGRect(origin: .zero, size: target))
        }
        guard let data = resized.jpegData(compressionQuality: quality) else { return nil }
        return AnalyzeImageInput(imageBase64: data.base64EncodedString(), mimeType: "image/jpeg")
    }
}

private extension UIImage {
    /// Bake in EXIF orientation so the uploaded pixels are upright.
    func fixedOrientation() -> UIImage {
        guard imageOrientation != .up else { return self }
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in draw(in: CGRect(origin: .zero, size: size)) }
    }
}
