import SwiftUI

@main
struct MsMessengerApp: App {
    @StateObject private var theme = ThemeManager.shared
    @State private var serverReady = false
    @State private var isAuthenticated = APIClient.shared.token != nil

    var body: some Scene {
        WindowGroup {
            ZStack {
                theme.bgColor
                    .ignoresSafeArea()

                if !serverReady {
                    ServerCheckView { serverReady = true }
                } else if isAuthenticated {
                    ContentView()
                        .onAppear { WebSocketService.shared.connect(token: APIClient.shared.token ?? "") }
                } else {
                    OnboardingView(onComplete: { isAuthenticated = true })
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .preferredColorScheme(theme.isDark ? .dark : .light)
        }
    }
}

struct ContentView: View {
    var body: some View { TabBarView() }
}
