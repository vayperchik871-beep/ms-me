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
            ScrollView {
                VStack(spacing: 16) {
                    profileHeader
                    sections
                }.padding(.horizontal, 16).padding(.top, 12)
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Настройки")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                }
            }
            .toolbarBackground(Color.clear, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .sheet(isPresented: $showAdmin) { AdminTerminalView() }
            .task { await loadUser() }
        }
        .tint(Color(hex: "#6C63FF"))
    }

    // MARK: - Profile Header

    private var profileHeader: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 60, height: 60)
                if let avatar = user?.avatar, let url = URL(string: avatar) {
                    AsyncImage(url: url) { img in
                        img.resizable().scaledToFill()
                    } placeholder: {
                    Text(user?.name.prefix(1).uppercased() ?? "?")
                             .font(.system(size: 24, weight: .semibold))
                             .foregroundColor(Color(hex: "#6C63FF"))
                    }
                    .frame(width: 60, height: 60)
                    .clipShape(Circle())
                } else {
                    Text(user?.name.prefix(1).uppercased() ?? "?")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(user?.name ?? "...")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(theme.textPrimary)
                Text("@\(user?.userId ?? "")")
                    .font(.system(size: 14))
                    .foregroundColor(theme.textSecondary)
            }

            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.06))
        )
    }

    // MARK: - Sections

    private var sections: some View {
        VStack(spacing: 12) {
            settingsSection(title: "Оформление") {
                NavigationLink { AppearanceSettingsView() } label: {
                    settingsRow(icon: "paintbrush.fill", label: "Навигация и тема")
                }
            }
            settingsSection(title: "Конфиденциальность") {
                NavigationLink { PrivacyPolicyView() } label: {
                    settingsRow(icon: "hand.raised.fill", label: "Политика конфиденциальности")
                }
            }
            settingsSection(title: "Аккаунт") {
                if let user {
                    NavigationLink { ProfileView(user: user) } label: {
                        settingsRow(icon: "person.circle", label: "Профиль")
                    }
                }
                NavigationLink { AccountSettingsView() } label: {
                    settingsRow(icon: "person.2.fill", label: "Мои аккаунты")
                }
                Button(action: logout) {
                    settingsRow(icon: "arrow.right.square", label: "Выйти из аккаунта", tint: Color(hex: "#FF453A"))
                }
            }

            if let user, user.isAdmin == true {
                settingsSection(title: "Администрирование") {
                    Button(action: { showAdmin = true }) {
                        settingsRow(icon: "shield.fill", label: "Админ-панель")
                    }
                }
            }
        }
    }

    private func settingsSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(theme.textSecondary)
                .padding(.leading, 4)
            VStack(spacing: 1) { content() }
                .background(Color.white.opacity(0.06))
                .cornerRadius(12)
        }
    }

    private func settingsRow(icon: String, label: String, tint: Color? = nil) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(tint ?? Color(hex: "#6C63FF"))
                .frame(width: 24)
            Text(label)
                .font(.system(size: 16))
                .foregroundColor(theme.textPrimary)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13))
                .foregroundColor(theme.textSecondary.opacity(0.6))
        }
        .padding(14)
    }

    private func loadUser() async {
        do {
            let resp = try await APIClient.shared.me()
            user = resp.user
            UserDefaults.standard.set(resp.user.userId, forKey: "user_id")
            UserDefaults.standard.set(resp.user.id, forKey: "user_uuid")
        } catch { print(error) }
    }

    private func logout() {
        APIClient.shared.token = nil
        WebSocketService.shared.disconnect()
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = scene.windows.first {
            window.rootViewController = UIHostingController(rootView: OnboardingView(onComplete: {}))
        }
    }
}
