import SwiftUI

/// Sheet for logging a weigh-in in the user's unit. Shared by Trends and Settings.
struct WeighInSheet: View {
    let unitSystem: UnitSystem
    let current: Double?
    var onSave: (Double) -> Void

    @Environment(\.dismiss) private var dismiss
    @FocusState private var editing: Bool
    @State private var value: Double

    init(unitSystem: UnitSystem, current: Double?, onSave: @escaping (Double) -> Void) {
        self.unitSystem = unitSystem
        self.current = current
        self.onSave = onSave
        let start = current.map { Units.displayWeight($0, unitSystem) } ?? (unitSystem == .imperial ? 154 : 70)
        _value = State(initialValue: (start * 10).rounded() / 10)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: Theme.Spacing.lg) {
                // Tap the number to type it directly, or use the +/- buttons.
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    TextField("0", value: $value, format: .number.precision(.fractionLength(0...1)))
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .focused($editing)
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .fixedSize()
                    Text(Units.weightUnit(unitSystem))
                        .font(.title2.weight(.semibold)).foregroundStyle(.secondary)
                }

                HStack(spacing: Theme.Spacing.lg) {
                    stepButton("minus") { value = max(20, (value - 0.1) * 10 / 10).rounded(toPlaces: 1) }
                    stepButton("plus") { value = min(400, value + 0.1).rounded(toPlaces: 1) }
                }

                Button {
                    onSave(value)
                    dismiss()
                } label: { Text("Save weigh-in") }
                    .buttonStyle(.primary)
            }
            .padding(Theme.Spacing.lg)
            .navigationTitle("Log weight")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .keyboard) {
                    Button("Done") { editing = false }.frame(maxWidth: .infinity, alignment: .trailing)
                }
            }
        }
    }

    private func stepButton(_ symbol: String, action: @escaping () -> Void) -> some View {
        Button {
            editing = false
            action()
        } label: {
            Image(systemName: symbol)
                .font(.title2.weight(.semibold))
                .frame(width: 56, height: 44)
                .glassEffect(.regular.interactive(), in: .capsule)
        }
        .foregroundStyle(Theme.accent)
    }
}
