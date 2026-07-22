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
                        .foregroundColor(.white)
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
                    .foregroundColor(.white)
                Text("@\(user?.userId ?? "")")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.4))
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
            settingsSection(title: "Оформление", items: [
                SettingsItem(icon: "paintbrush.fill", label: "Навигация и тема") { AppearanceSettingsView() }
            ])
            settingsSection(title: "Конфиденциальность", items: [
                SettingsItem(icon: "hand.raised.fill", label: "Политика конфиденциальности") { PrivacyPolicyView() }
            ])
            settingsSection(title: "Аккаунт", items: [
                SettingsItem(icon: "person.2.fill", label: "Мои аккаунты") { AccountSettingsView() },
                SettingsItem(icon: "person.circle", label: "Профиль") { ProfileView(user: user!) }
            ], extras: {
                Button(action: logout) {
                    HStack {
                        Image(systemName: "arrow.right.square")
                        Text("Выйти из аккаунта")
                    }
                    .foregroundColor(Color(hex: "#FF453A"))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(12)
                }.buttonStyle(.plain)
            })

            if let user, user.isAdmin == true {
                settingsSection(title: "Администрирование", items: [
                    SettingsItem(icon: "shield.fill", label: "Админ-панель") { AdminTerminalView() }
                ])
            }
        }
    }

    private func settingsSection<Extra: View>(
        title: String,
        items: [SettingsItem],
        @ViewBuilder extras: () -> Extra = { EmptyView() }
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.white.opacity(0.4))
                .padding(.leading, 4)

            VStack(spacing: 1) {
                ForEach(Array(items.enumerated()), id: \.offset) { idx, item in
                    NavigationLink(destination: item.destination) {
                        HStack(spacing: 12) {
                            Image(systemName: item.icon)
                                .font(.system(size: 16))
                                .foregroundColor(Color(hex: "#6C63FF"))
                                .frame(width: 24)
                            Text(item.label)
                                .font(.system(size: 16))
                                .foregroundColor(.white)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 13))
                                .foregroundColor(.white.opacity(0.2))
                        }
                        .padding(14)
                        .background(Color.white.opacity(0.06))
                    }.buttonStyle(.plain)
                }
                extras()
            }
            .cornerRadius(12)
        }
    }

    private func loadUser() async {
        do {
            let resp = try await APIClient.shared.me()
            user = resp.user
            UserDefaults.standard.set(resp.user.userId, forKey: "user_id")
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

struct SettingsItem {
    let icon: String
    let label: String
    @ViewBuilder let destination: () -> any View
}
