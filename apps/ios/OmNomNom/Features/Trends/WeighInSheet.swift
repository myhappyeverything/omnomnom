import SwiftUI

/// Sheet for logging a weigh-in in the user's unit. Shared by Trends and Settings.
struct WeighInSheet: View {
    let unitSystem: UnitSystem
    let current: Double?
    var onSave: (Double) -> Void

    @Environment(\.dismiss) private var dismiss
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
                Text("\(value, specifier: "%.1f") \(Units.weightUnit(unitSystem))")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .contentTransition(.numericText())
                Stepper(value: $value, in: 20...400, step: 0.1) {
                    Text("Adjust weight")
                }
                .labelsHidden()
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
            }
        }
    }
}
