import SwiftUI

struct SettingsView: View {
    let onLogout: () -> Void
    let onAddAccount: () -> Void

    @EnvironmentObject var auth: AuthManager
    @EnvironmentObject var theme: ThemeManager
    @StateObject private var i18n = I18n.shared

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        AvatarView(name: auth.user?.name ?? "?", avatarURL: auth.user?.avatar,
                                   size: 56, color: auth.user?.profileColor)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(auth.user?.name ?? "").font(.headline)
                            Text("@\(auth.user?.userId ?? "")").font(.caption).foregroundColor(.secondary)
                        }
                        .padding(.leading, 8)
                    }
                    .padding(.vertical, 4)
                }

                Section(i18n.t("Настройки")) {
                    Button(action: { theme.toggle() }) {
                        HStack {
                            Image(systemName: theme.theme == .dark ? "moon.fill" : "sun.max.fill")
                                .foregroundColor(.msGreen)
                                .frame(width: 24)
                            Text(i18n.t("Тема"))
                            Spacer()
                            Text(theme.theme == .dark ? i18n.t("Темная") : i18n.t("Светлая"))
                                .foregroundColor(.secondary)
                        }
                    }

                    Button(action: {
                        let next: Language = i18n.current == .ru ? .en : .ru
                        i18n.setLanguage(next)
                    }) {
                        HStack {
                            Image(systemName: "globe")
                                .foregroundColor(.msGreen)
                                .frame(width: 24)
                            Text(i18n.t("Язык"))
                            Spacer()
                            Text(i18n.current.name)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Section(i18n.t("Аккаунты на устройстве")) {
                    Button(action: onAddAccount) {
                        HStack {
                            Image(systemName: "person.badge.plus")
                                .foregroundColor(.msGreen)
                                .frame(width: 24)
                            Text(i18n.t("Добавить аккаунт"))
                        }
                    }

                    Button(role: .destructive, action: onLogout) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .frame(width: 24)
                            Text(i18n.t("Выйти"))
                        }
                    }
                }
            }
            .navigationTitle(i18n.t("Настройки"))
        }
    }
}
