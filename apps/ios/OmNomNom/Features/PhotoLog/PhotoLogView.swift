import SwiftUI
import PhotosUI

struct PhotoLogView: View {
    var onLogged: (MealRecord) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var model = PhotoLogViewModel()
    @State private var showCamera = false
    @State private var pickerItem: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            Group {
                switch model.stage {
                case .capture: captureStage
                case .analyzing: analyzingStage
                case .review: reviewStage
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraPicker { image in
                    Task { await model.analyze(image) }
                }
                .ignoresSafeArea()
            }
            .onChange(of: pickerItem) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        await model.analyze(image)
                    }
                    pickerItem = nil
                }
            }
        }
    }

    private var title: String {
        switch model.stage {
        case .capture: "Log with a photo"
        case .analyzing: "Analyzing"
        case .review: "Review"
        }
    }

    // MARK: Capture

    private var captureStage: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Spacer()
            Mascot(size: 120)
            VStack(spacing: 6) {
                Text("Snap your plate").font(.title2.weight(.bold))
                Text("We'll identify the food and estimate portions.")
                    .foregroundStyle(.secondary).multilineTextAlignment(.center)
            }
            Spacer()
            VStack(spacing: Theme.Spacing.md) {
                if UIImagePickerController.isSourceTypeAvailable(.camera) {
                    Button {
                        showCamera = true
                    } label: {
                        Label("Take photo", systemImage: "camera.fill")
                    }
                    .buttonStyle(.primary)
                }
                PhotosPicker(selection: $pickerItem, matching: .images, photoLibrary: .shared()) {
                    Label("Choose from library", systemImage: "photo.on.rectangle")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .glassEffect(.regular.interactive(), in: .capsule)
                        .foregroundStyle(Theme.accent)
                }
            }
            .padding(.horizontal, Theme.Spacing.lg)
            .padding(.bottom, Theme.Spacing.lg)

            if let errorMessage = model.errorMessage {
                Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                    .font(.subheadline).foregroundStyle(.red)
                    .padding(.bottom, Theme.Spacing.md)
            }
        }
    }

    // MARK: Analyzing

    private var analyzingStage: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Spacer()
            if let image = model.previewImage {
                BitesPhotoView(image: image)
                    .frame(width: 240, height: 240)
            }
            HStack(spacing: 10) {
                ProgressView()
                Text("Identifying what's on the plate…")
                    .font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(Theme.Spacing.lg)
    }

    // MARK: Review

    private var reviewStage: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    Picker("Meal", selection: $model.mealType) {
                        ForEach(MealType.allCases) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    if model.items.isEmpty {
                        emptyReview
                    } else {
                        ForEach($model.items) { $item in
                            ReviewRow(item: $item)
                        }
                    }

                    if let errorMessage = model.errorMessage {
                        Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                            .font(.subheadline).foregroundStyle(.red)
                    }
                }
                .padding(Theme.Spacing.md)
            }

            Button(action: save) {
                Text(model.isSaving ? "" :
                        "Add \(model.confirmedCount) item\(model.confirmedCount == 1 ? "" : "s") to \(model.mealType.label)")
            }
            .buttonStyle(.primary(loading: model.isSaving))
            .disabled(model.confirmedCount == 0 || model.isSaving)
            .padding(Theme.Spacing.md)
            .background(.ultraThinMaterial)
        }
    }

    private var emptyReview: some View {
        VStack(spacing: 8) {
            Image(systemName: "questionmark.circle").font(.largeTitle).foregroundStyle(.secondary)
            Text("No foods identified").font(.headline)
            Text("Try another photo, or search manually.")
                .font(.subheadline).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, Theme.Spacing.xl)
    }

    private func save() {
        Task {
            if let meal = await model.save() {
                Haptics.success()
                onLogged(meal)
                dismiss()
            }
        }
    }
}

/// One recognized-food row in the review list.
private struct ReviewRow: View {
    @Binding var item: PhotoLogViewModel.DraftItem

    var body: some View {
        Card {
            HStack(alignment: .top, spacing: Theme.Spacing.md) {
                if item.matchedFood != nil {
                    Button {
                        item.include.toggle()
                    } label: {
                        Image(systemName: item.include ? "checkmark.circle.fill" : "circle")
                            .font(.title2)
                            .foregroundStyle(item.include ? Theme.accent : .secondary)
                    }
                    .buttonStyle(.plain)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(item.recognized.name.capitalized)
                        .font(.headline)
                    if let food = item.matchedFood {
                        Text(matchSubtitle(food))
                            .font(.caption).foregroundStyle(.secondary)
                        confidenceBadge
                        if item.include {
                            HStack {
                                Text("Amount (\(food.servingUnit))").font(.subheadline)
                                Spacer()
                                Text("\(Int(item.quantity))").font(.subheadline.weight(.semibold)).monospacedDigit()
                                Stepper("", value: $item.quantity, in: 1...5000,
                                        step: food.servingUnit == "g" ? 10 : 1).labelsHidden()
                            }
                            .padding(.top, 4)
                        }
                    } else {
                        Text("No match found - skipped")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
                Spacer(minLength: 0)
            }
        }
        .opacity(item.matchedFood == nil ? 0.6 : 1)
    }

    private func matchSubtitle(_ food: FoodRecord) -> String {
        var parts: [String] = []
        if let brand = food.brand, !brand.isEmpty { parts.append(brand) }
        parts.append("\(Int(food.calories)) kcal / \(Int(food.servingSize)) \(food.servingUnit)")
        return parts.joined(separator: " · ")
    }

    private var confidenceBadge: some View {
        let pct = Int((item.recognized.confidence * 100).rounded())
        let color: Color = item.recognized.confidence >= 0.75 ? Theme.fibre
            : item.recognized.confidence >= 0.5 ? Theme.carbs : Theme.protein
        return Text("\(pct)% match")
            .font(.caption2.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(color.opacity(0.15), in: .capsule)
    }
}
