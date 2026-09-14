import SwiftUI
import PhotosUI

struct ScanLabelView: View {
    var onLogged: (MealRecord) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var model = ScanLabelViewModel()
    @State private var showCamera = false
    @State private var pickerItem: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            Group {
                switch model.stage {
                case .capture: captureStage
                case .analyzing: analyzingStage
                case .form: formStage
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                if model.stage == .form {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") { save() }.fontWeight(.semibold)
                            .disabled(!model.canSave || model.isSaving)
                    }
                }
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraPicker { image in Task { await model.analyze(image) } }.ignoresSafeArea()
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
        case .capture: "Scan a label"
        case .analyzing: "Reading label"
        case .form: "Confirm details"
        }
    }

    private var captureStage: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Spacer()
            Image(systemName: "text.viewfinder")
                .font(.system(size: 72)).foregroundStyle(Theme.accent)
            VStack(spacing: 6) {
                Text("Scan a nutrition label").font(.title2.weight(.bold))
                Text("Point at the Nutrition Facts panel and we'll fill in the details.")
                    .foregroundStyle(.secondary).multilineTextAlignment(.center)
            }
            Spacer()
            VStack(spacing: Theme.Spacing.md) {
                if UIImagePickerController.isSourceTypeAvailable(.camera) {
                    Button { showCamera = true } label: { Label("Take photo", systemImage: "camera.fill") }
                        .buttonStyle(.primary)
                }
                PhotosPicker(selection: $pickerItem, matching: .images, photoLibrary: .shared()) {
                    Label("Choose from library", systemImage: "photo.on.rectangle")
                        .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 15)
                        .glassEffect(.regular.interactive(), in: .capsule)
                        .foregroundStyle(Theme.accent)
                }
            }
            .padding(.horizontal, Theme.Spacing.lg).padding(.bottom, Theme.Spacing.lg)
            if let error = model.errorMessage {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.subheadline).foregroundStyle(.red).padding(.bottom, Theme.Spacing.md)
            }
        }
    }

    private var analyzingStage: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Spacer()
            if let image = model.previewImage {
                BitesPhotoView(image: image).frame(width: 240, height: 240)
            }
            HStack(spacing: 10) {
                ProgressView()
                Text("Reading the label…").font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(Theme.Spacing.lg)
    }

    private var formStage: some View {
        Form {
            Section("Food") {
                TextField("Name", text: $model.name)
                TextField("Brand (optional)", text: $model.brand)
            }
            Section("Serving") {
                nutrientRow("Serving size", value: $model.servingSize, unit: model.servingUnit)
                TextField("Unit", text: $model.servingUnit)
            }
            Section("Per serving") {
                nutrientRow("Calories", value: $model.calories, unit: "kcal")
                nutrientRow("Protein", value: $model.proteinG, unit: "g")
                nutrientRow("Carbs", value: $model.carbsG, unit: "g")
                nutrientRow("Fat", value: $model.fatG, unit: "g")
                nutrientRow("Fibre", value: $model.fibreG, unit: "g")
            }
            Section("Log to") {
                Picker("Meal", selection: $model.mealType) {
                    ForEach(MealType.allCases) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented)
            }
            if let error = model.errorMessage {
                Section { Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red) }
            }
        }
    }

    private func nutrientRow(_ label: String, value: Binding<Double>, unit: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField(label, value: value, format: .number)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 90)
            Text(unit).foregroundStyle(.secondary)
        }
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
