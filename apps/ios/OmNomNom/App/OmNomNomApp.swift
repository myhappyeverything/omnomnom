import SwiftUI

@main
struct OmNomNomApp: App {
    @State private var session = Session()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
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
