import SwiftUI

/// One food search/list row. Mirrors apps/web FoodListItem: name, brand · serving
/// · kcal, then P/C/F, with a favourite toggle and a "saved locally" star badge.
struct FoodListItem: View {
    let food: FoodRecord
    var onTap: () -> Void
    var onToggleFavourite: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: Theme.Spacing.md) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(food.name)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                        if food.isLocal {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.caption2)
                                .foregroundStyle(Theme.mustard)
                        }
                    }
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                    HStack(spacing: 10) {
                        macro("P", food.proteinG, Theme.protein)
                        macro("C", food.carbsG, Theme.carbs)
                        macro("F", food.fatG, Theme.fat)
                    }
                }
                Spacer(minLength: 8)
                Button(action: onToggleFavourite) {
                    Image(systemName: (food.isFavourite ?? false) ? "star.fill" : "star")
                        .font(.body)
                        .foregroundStyle((food.isFavourite ?? false) ? Theme.mustard : .secondary)
                }
                .buttonStyle(.plain)
                .contentShape(.rect)
            }
            .padding(.vertical, 10)
            .padding(.horizontal, Theme.Spacing.md)
            .background(Theme.surface, in: .rect(cornerRadius: Theme.Radius.control))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.control)
                    .strokeBorder(.black.opacity(0.05), lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
    }

    private var subtitle: String {
        var parts: [String] = []
        if let brand = food.brand, !brand.isEmpty { parts.append(brand) }
        parts.append("\(Int(food.servingSize)) \(food.servingUnit)")
        parts.append("\(Int(food.calories)) kcal")
        return parts.joined(separator: " · ")
    }

    private func macro(_ label: String, _ value: Double, _ color: Color) -> some View {
        Text("\(label) \(Int(value))g")
            .font(.caption2.weight(.medium))
            .foregroundStyle(color)
    }
}
