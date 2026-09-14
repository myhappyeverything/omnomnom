import SwiftUI

struct FoodsView: View {
    @State private var model = FoodsViewModel()
    @State private var selectedFood: FoodRecord?
    @State private var toast: String?
    @FocusState private var searchFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: Theme.Spacing.md) {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    Text("Foods")
                        .font(.largeTitle.weight(.bold))
                        .frame(maxWidth: .infinity, alignment: .leading)
                    searchField
                    Picker("View", selection: $model.tab) {
                        ForEach(FoodsViewModel.Tab.allCases) { tab in
                            Text(tab.rawValue).tag(tab)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.top, Theme.Spacing.md + Theme.Spacing.xs)

                content
            }
            .background(Theme.background.ignoresSafeArea())
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 52) }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(item: $selectedFood) { food in
                LogFoodSheet(food: food) { meal in
                    toast = "Added to \(meal.mealType.label)"
                }
                .presentationDetents([.large])
            }
            .overlay(alignment: .bottom) {
                if let toast {
                    Label(toast, systemImage: "checkmark.circle.fill")
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, Theme.Spacing.md).padding(.vertical, 10)
                        .glassEffect(.regular.tint(Theme.fibre.opacity(0.3)), in: .capsule)
                        .padding(.bottom, 90)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .task {
                            try? await Task.sleep(for: .seconds(2))
                            withAnimation { self.toast = nil }
                        }
                }
            }
            .animation(.snappy, value: toast)
        }
        .task { if model.tab != .search { await model.loadTab() } }
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Search foods", text: $model.query)
                .focused($searchFocused)
                .autocorrectionDisabled()
                .submitLabel(.search)
            if !model.query.isEmpty {
                Button {
                    model.query = ""
                } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(Theme.surface, in: .capsule)
        .overlay(Capsule().strokeBorder(.black.opacity(0.06), lineWidth: 0.5))
        .onChange(of: model.tab) { _, tab in
            if tab == .search { searchFocused = true }
        }
    }

    @ViewBuilder
    private var content: some View {
        if model.isLoading && model.results.isEmpty {
            Spacer(); ProgressView(); Spacer()
        } else if model.results.isEmpty {
            emptyState
        } else {
            ScrollView {
                LazyVStack(spacing: Theme.Spacing.sm) {
                    ForEach(model.results) { food in
                        FoodListItem(food: food) {
                            selectedFood = food
                        } onToggleFavourite: {
                            Task { await model.toggleFavourite(food) }
                        }
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.bottom, Theme.Spacing.xl)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Spacer()
            Image(systemName: model.tab.symbol)
                .font(.system(size: 40)).foregroundStyle(Theme.accent.opacity(0.6))
            Text(emptyTitle).font(.headline)
            Text(emptySubtitle).font(.subheadline).foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Spacer(); Spacer()
        }
        .padding(Theme.Spacing.xl)
    }

    private var emptyTitle: String {
        switch model.tab {
        case .search: model.query.count > 1 ? "No matches" : "Search any food"
        case .recent: "Nothing recent"
        case .favourites: "No favourites yet"
        case .frequent: "Nothing frequent yet"
        }
    }

    private var emptySubtitle: String {
        switch model.tab {
        case .search: "Type a food name to search OpenFoodFacts and USDA."
        case .recent: "Foods you log will show up here."
        case .favourites: "Tap the star on any food to save it here."
        case .frequent: "Your most-logged foods will appear here."
        }
    }
}
