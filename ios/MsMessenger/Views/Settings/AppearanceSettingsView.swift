import SwiftUI

struct AppearanceSettingsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var tab = 0

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $tab) {
                Text("Навигация").tag(0)
                Text("Тема").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            if tab == 0 { navigationTab }
            else { themeTab }
        }
        .background(theme.bgColor.ignoresSafeArea())
        .navigationTitle("Оформление")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Оформление")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(theme.textPrimary)
            }
        }
        .toolbarBackground(Color.clear, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    // MARK: - Navigation Tab

    private var navigationTab: some View {
        Form {
            Section {
                navRow(icon: "message.fill", label: "Чаты", key: "nav_chats")
                navRow(icon: "person.2.fill", label: "Контакты", key: "nav_contacts")
                navRow(icon: "music.note.list", label: "Музыка", key: "nav_music")
                navRow(icon: "phone.fill", label: "Звонки", key: "nav_calls")
            } header: {
                Text("Вкладки навигации")
            } footer: {
                Text("Отключите вкладки, которые не хотите видеть в панели навигации")
            }
        }
        .scrollContentBackground(.hidden)
    }

    private func navRow(icon: String, label: String, key: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(theme.accent)
                .frame(width: 24)
            Text(label)
                .foregroundColor(theme.textPrimary)
            Spacer()
            Toggle("", isOn: Binding(
                get: { UserDefaults.standard.object(forKey: key) as? Bool ?? true },
                set: { UserDefaults.standard.set($0, forKey: key) }
            )).tint(theme.accent)
        }
    }

    // MARK: - Theme Tab

    private var themeTab: some View {
        Form {
            Section {
                themeRow(icon: "gearshape", label: "Системная", mode: .system)
                themeRow(icon: "moon.fill", label: "Тёмная", mode: .dark)
                themeRow(icon: "sun.max.fill", label: "Светлая", mode: .light)
            } header: {
                Text("Режим")
            }

            Section {
                accentColorGrid
            } header: {
                Text("Акцентный цвет")
            } footer: {
                Text("Цвет ваших сообщений в чате. По умолчанию: белый в тёмной теме, чёрный в светлой.")
            }
        }
        .scrollContentBackground(.hidden)
    }

    private func themeRow(icon: String, label: String, mode: ThemeManager.ThemeMode) -> some View {
        Button(action: { theme.themeMode = mode }) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(
                        mode == .dark ? .yellow :
                        mode == .light ? .orange : .gray
                    )
                    .frame(width: 24)
                Text(label)
                    .foregroundColor(theme.textPrimary)
                Spacer()
                if theme.themeMode == mode {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(theme.accent)
                }
            }
        }
    }

    private let colors: [(name: String, hex: String)] = [
        ("Белый", ""),
        ("Чёрный", "#000000"),
        ("Фиолетовый", "#6C63FF"),
        ("Синий", "#007AFF"),
        ("Зелёный", "#34C759"),
        ("Красный", "#FF3B30"),
        ("Оранжевый", "#FF9500"),
        ("Розовый", "#FF2D55"),
    ]

    private var accentColorGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
            ForEach(colors, id: \.hex) { c in
                Button(action: { theme.accentHex = c.hex }) {
                    VStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .fill(c.hex.isEmpty ? (theme.isDark ? Color.white : Color.black) : Color(hex: c.hex))
                                .frame(width: 44, height: 44)
                            if theme.accentHex == c.hex {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(c.hex == "" ? (theme.isDark ? .black : .white) : .white)
                            }
                        }
                        Text(c.name).font(.system(size: 11)).foregroundColor(theme.textSecondary)
                    }
                }.buttonStyle(.plain)
            }
        }
        .padding(.vertical, 8)
    }
}
