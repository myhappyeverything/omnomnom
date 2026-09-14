import SwiftUI
import VisionKit

struct BarcodeLogView: View {
    var onLogged: (MealRecord) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var stage: Stage = .scanning
    @State private var food: FoodRecord?
    @State private var showLog = false
    @State private var lastCode: String?

    private enum Stage { case scanning, looking, notFound }

    var body: some View {
        NavigationStack {
            Group {
                if !BarcodeScanner.isAvailable {
                    unavailable
                } else {
                    switch stage {
                    case .scanning: scanning
                    case .looking: looking
                    case .notFound: notFound
                    }
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Scan barcode")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            }
            .sheet(isPresented: $showLog, onDismiss: { if stage != .notFound { stage = .scanning } }) {
                if let food {
                    LogFoodSheet(food: food) { meal in
                        onLogged(meal)
                        dismiss()
                    }
                    .presentationDetents([.large])
                }
            }
        }
    }

    private var scanning: some View {
        BarcodeScanner { code in
            lastCode = code
            Task { await lookup(code) }
        }
        .ignoresSafeArea(edges: .bottom)
        .overlay(alignment: .bottom) {
            Text("Point at a product barcode")
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, Theme.Spacing.md).padding(.vertical, 10)
                .glassEffect(.regular, in: .capsule)
                .padding(.bottom, Theme.Spacing.xl)
        }
    }

    private var looking: some View {
        VStack(spacing: Theme.Spacing.md) {
            ProgressView()
            Text("Looking up \(lastCode ?? "")…").font(.subheadline).foregroundStyle(.secondary)
        }
    }

    private var notFound: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: "barcode.viewfinder").font(.system(size: 44)).foregroundStyle(.secondary)
            Text("No match for that barcode").font(.headline)
            Text("It might not be in OpenFoodFacts. Try scanning the label instead, or search by name.")
                .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            Button("Scan again") { stage = .scanning }
                .buttonStyle(.primary)
                .padding(.top, Theme.Spacing.sm)
        }
        .padding(Theme.Spacing.xl)
    }

    private var unavailable: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: "camera.metering.unknown").font(.system(size: 44)).foregroundStyle(.secondary)
            Text("Barcode scanning needs a device").font(.headline)
            Text("Open OmNomNom on your iPhone to scan product barcodes.")
                .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .padding(Theme.Spacing.xl)
    }

    private func lookup(_ code: String) async {
        stage = .looking
        do {
            if let result = try await APIClient.shared.lookupBarcode(code) {
                food = result
                Haptics.success()
                showLog = true
            } else {
                Haptics.warning()
                stage = .notFound
            }
        } catch {
            Haptics.warning()
            stage = .notFound
        }
    }
}
