import SwiftUI

struct AppearanceSettingsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @AppStorage("nav_chats") private var navChats = true
    @AppStorage("nav_contacts") private var navContacts = true
    @AppStorage("nav_music") private var navMusic = true
    @AppStorage("nav_calls") private var navCalls = true

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                themeSection
                navigationSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
        }
        .background(theme.bgColor.ignoresSafeArea())
        .navigationTitle("Оформление")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Оформление")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.white)
            }
        }
        .toolbarBackground(Color.clear, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    // MARK: - Theme

    private var themeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Тема")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.white.opacity(0.4))
                .padding(.leading, 4)

            VStack(spacing: 2) {
                themeOption(
                    icon: "gearshape",
                    iconColor: .gray,
                    label: "Системная",
                    isSelected: theme.themeMode == .system
                ) { theme.themeMode = .system }

                Divider().background(Color.white.opacity(0.08)).padding(.leading, 52)

                themeOption(
                    icon: "moon.fill",
                    iconColor: .yellow,
                    label: "Тёмная",
                    isSelected: theme.themeMode == .dark
                ) { theme.themeMode = .dark }

                Divider().background(Color.white.opacity(0.08)).padding(.leading, 52)

                themeOption(
                    icon: "sun.max.fill",
                    iconColor: .orange,
                    label: "Светлая",
                    isSelected: theme.themeMode == .light
                ) { theme.themeMode = .light }
            }
            .background(Color.white.opacity(0.06))
            .cornerRadius(12)
        }
    }

    private func themeOption(icon: String, iconColor: Color, label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(iconColor)
                    .frame(width: 28)
                Text(label)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }
            .padding(14)
            .contentShape(Rectangle())
        }.buttonStyle(.plain)
    }

    // MARK: - Navigation

    private var navigationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Вкладки навигации")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.white.opacity(0.4))
                .padding(.leading, 4)

            VStack(spacing: 2) {
                navToggle(icon: "message.fill", label: "Чаты", isOn: $navChats)
                Divider().background(Color.white.opacity(0.08)).padding(.leading, 52)
                navToggle(icon: "person.2.fill", label: "Контакты", isOn: $navContacts)
                Divider().background(Color.white.opacity(0.08)).padding(.leading, 52)
                navToggle(icon: "music.note.list", label: "Музыка", isOn: $navMusic)
                Divider().background(Color.white.opacity(0.08)).padding(.leading, 52)
                navToggle(icon: "phone.fill", label: "Звонки", isOn: $navCalls)
            }
            .background(Color.white.opacity(0.06))
            .cornerRadius(12)
        }
    }

    private func navToggle(icon: String, label: String, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(Color(hex: "#6C63FF"))
                    .frame(width: 28)
                Text(label)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
            }
        }
        .tint(Color(hex: "#6C63FF"))
        .padding(14)
    }
}
