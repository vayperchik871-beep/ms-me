import SwiftUI

@main
struct MsMessengerApp: App {
    @StateObject private var theme = ThemeManager.shared
    @State private var isAuthenticated = APIClient.shared.token != nil

    var body: some Scene {
        WindowGroup {
            Group {
                if isAuthenticated {
                    ContentView().onAppear { WebSocketService.shared.connect(token: APIClient.shared.token ?? "") }
                } else {
                    OnboardingView(onComplete: { isAuthenticated = true })
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.red)
            .preferredColorScheme(theme.isDark ? .dark : .light)
            .ignoresSafeArea()
        }
    }
}

struct ContentView: View {
    var body: some View { TabBarView() }
}
