import SwiftUI

@main
struct OmNomNomApp: App {
    @State private var session = Session()
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .environment(appState)
                .tint(Theme.accent)
                .preferredColorScheme(colorScheme)
        }
    }

    private var colorScheme: ColorScheme? {
        switch session.settings?.theme {
        case .light: .light
        case .dark: .dark
        default: nil
        }
    }
}
