import SwiftUI

/// A rounded content card. Uses a subtle surface fill so it reads as a grouped
/// container; Liquid Glass is reserved for floating/interactive chrome.
struct Card<Content: View>: View {
    var padding: CGFloat = Theme.Spacing.md
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.surface, in: .rect(cornerRadius: Theme.Radius.card))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.card)
                    .strokeBorder(.black.opacity(0.05), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.04), radius: 12, y: 4)
    }
}

/// Primary call-to-action styled as a prominent glass capsule.
struct PrimaryButtonStyle: ButtonStyle {
    var loading: Bool = false
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(
                LinearGradient(colors: [Theme.accent, Theme.accentDeep],
                               startPoint: .topLeading, endPoint: .bottomTrailing),
                in: .capsule
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .overlay { if loading { ProgressView().tint(.white) } }
            .animation(.spring(duration: 0.25), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary: PrimaryButtonStyle { PrimaryButtonStyle() }
    static func primary(loading: Bool) -> PrimaryButtonStyle { PrimaryButtonStyle(loading: loading) }
}

/// A labeled section header used across screens.
struct SectionHeader: View {
    let title: String
    var action: (() -> Void)?
    var actionLabel: String?

    var body: some View {
        HStack {
            Text(title)
                .font(.title3.weight(.bold))
            Spacer()
            if let action, let actionLabel {
                Button(actionLabel, action: action)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.accent)
            }
        }
    }
}

/// Rounded text field with a consistent look for forms.
struct FormField: View {
    let title: String
    var systemImage: String?
    @Binding var text: String
    var keyboard: UIKeyboardType = .default
    var secure: Bool = false
    var textContentType: UITextContentType?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            HStack(spacing: 10) {
                if let systemImage {
                    Image(systemName: systemImage).foregroundStyle(Theme.accent)
                }
                Group {
                    if secure {
                        SecureField(title, text: $text)
                    } else {
                        TextField(title, text: $text)
                    }
                }
                .keyboardType(keyboard)
                .textContentType(textContentType)
                .autocorrectionDisabled(keyboard == .emailAddress)
                .textInputAutocapitalization(keyboard == .emailAddress ? .never : .sentences)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Theme.surface, in: .rect(cornerRadius: Theme.Radius.control))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.control)
                    .strokeBorder(.black.opacity(0.08), lineWidth: 0.5)
            )
        }
    }
}
