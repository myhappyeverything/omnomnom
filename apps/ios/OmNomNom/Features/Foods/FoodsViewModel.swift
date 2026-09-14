import SwiftUI
import Observation

@MainActor
@Observable
final class FoodsViewModel {
    enum Tab: String, CaseIterable, Identifiable {
        case search = "Search"
        case recent = "Recent"
        case favourites = "Favourites"
        case frequent = "Frequent"
        var id: String { rawValue }
        var symbol: String {
            switch self {
            case .search: "magnifyingglass"
            case .recent: "clock"
            case .favourites: "star"
            case .frequent: "flame"
            }
        }
    }

    var tab: Tab = .search { didSet { if tab != .search { Task { await loadTab() } } } }
    var query = "" { didSet { scheduleSearch() } }
    var results: [FoodRecord] = []
    var isLoading = false
    var errorMessage: String?

    private let api = APIClient.shared
    private var searchTask: Task<Void, Never>?

    private func scheduleSearch() {
        searchTask?.cancel()
        let text = query.trimmingCharacters(in: .whitespaces)
        guard tab == .search else { return }
        guard text.count > 1 else { results = []; isLoading = false; return }
        isLoading = true
        searchTask = Task {
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled else { return }
            await runSearch(text)
        }
    }

    private func runSearch(_ text: String) async {
        do {
            let foods = try await api.searchFoods(query: text)
            guard !Task.isCancelled else { return }
            results = foods
        } catch is CancellationError {
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
        isLoading = false
    }

    func loadTab() async {
        guard tab != .search else { return }
        isLoading = true
        errorMessage = nil
        do {
            switch tab {
            case .recent: results = try await api.recentFoods()
            case .favourites: results = try await api.favouriteFoods()
            case .frequent: results = try await api.frequentFoods()
            case .search: break
            }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
        isLoading = false
    }

    func toggleFavourite(_ food: FoodRecord) async {
        do {
            let id = try await api.resolveFoodId(food)
            let newValue = !(food.isFavourite ?? false)
            try await api.setFavourite(foodId: id, newValue)
            if let index = results.firstIndex(where: { $0.id == food.id }) {
                results[index].isFavourite = newValue
                if tab == .favourites && !newValue {
                    results.remove(at: index)
                }
            }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription
        }
    }
}
