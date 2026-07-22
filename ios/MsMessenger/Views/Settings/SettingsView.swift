import SwiftUI

struct SettingsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var showAdmin = false
    @State private var user: User?

    var body: some View {
        NavigationStack {
            Form {
                Section("Внешний вид") { Toggle("Тёмная тема", isOn: $theme.isDark) }
                if let user, user.isAdmin == true { Section("Администрирование") { Button(action: { showAdmin = true }) { Label("Админ-панель", systemImage: "shield.fill").foregroundColor(theme.accent) } } }
                Section("Аккаунт") {
                    if let user { NavigationLink(destination: ProfileView(user: user)) { Label("Профиль", systemImage: "person.circle") } }
                    Button(action: logout) { Label("Выйти", systemImage: "arrow.right.square").foregroundColor(theme.error) }
                }
                Section("О приложении") { HStack { Text("Версия"); Spacer(); Text("1.0.2").foregroundColor(theme.textSecondary) } }
            }.navigationTitle("Настройки").sheet(isPresented: $showAdmin) { AdminTerminalView() }.task { await loadUser() }
            .scrollContentBackground(.hidden)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    private func loadUser() async {
        do { let resp = try await APIClient.shared.me(); user = resp.user; UserDefaults.standard.set(resp.user.userId, forKey: "user_id") } catch { print(error) }
    }

    private func logout() {
        APIClient.shared.token = nil; WebSocketService.shared.disconnect()
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene, let window = scene.windows.first {
            window.rootViewController = UIHostingController(rootView: OnboardingView(onComplete: {}))
        }
    }
}
