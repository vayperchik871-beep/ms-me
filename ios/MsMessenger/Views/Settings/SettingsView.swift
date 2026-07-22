import SwiftUI

struct SettingsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var showAdmin = false
    @State private var user: User?
    @AppStorage("nav_chats") private var navChats = true
    @AppStorage("nav_contacts") private var navContacts = true
    @AppStorage("nav_music") private var navMusic = true
    @AppStorage("nav_calls") private var navCalls = true

    var body: some View {
        NavigationStack {
            Form {
                Section("Оформление") {
                    NavigationLink(destination: AppearanceSettingsView()) {
                        Label("Навигация и тема", systemImage: "paintbrush.fill")
                    }
                }
                Section("Конфиденциальность") {
                    NavigationLink(destination: PrivacyPolicyView()) {
                        Label("Политика конфиденциальности", systemImage: "hand.raised.fill")
                    }
                }
                Section("Аккаунт") {
                    NavigationLink(destination: AccountSettingsView()) {
                        Label("Мои аккаунты", systemImage: "person.2.fill")
                    }
                    if let user {
                        NavigationLink(destination: ProfileView(user: user)) {
                            Label("Профиль", systemImage: "person.circle")
                        }
                    }
                    Button(action: logout) {
                        Label("Выйти из аккаунта", systemImage: "arrow.right.square")
                            .foregroundColor(theme.error)
                    }
                }
                if let user, user.isAdmin == true {
                    Section("Администрирование") {
                        Button(action: { showAdmin = true }) {
                            Label("Админ-панель", systemImage: "shield.fill").foregroundColor(theme.accent)
                        }
                    }
                }
            }
            .navigationTitle("Настройки")
            .sheet(isPresented: $showAdmin) { AdminTerminalView() }
            .task { await loadUser() }
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
