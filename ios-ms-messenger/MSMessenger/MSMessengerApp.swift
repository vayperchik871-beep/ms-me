import SwiftUI

@main
struct MSMessengerApp: App {
    @StateObject private var auth = AuthManager.shared
    @StateObject private var theme = ThemeManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(auth)
                .environmentObject(theme)
                .task { await auth.checkSession() }
        }
    }
}
