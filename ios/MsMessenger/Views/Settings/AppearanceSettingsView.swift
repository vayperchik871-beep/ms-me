import SwiftUI

struct AppearanceSettingsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var tab = "nav"
    @AppStorage("nav_chats") private var navChats = true
    @AppStorage("nav_contacts") private var navContacts = true
    @AppStorage("nav_music") private var navMusic = true
    @AppStorage("nav_calls") private var navCalls = true

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $tab) {
                Text("Навигация").tag("nav")
                Text("Тема").tag("theme")
            }
            .pickerStyle(.segmented)
            .padding()

            if tab == "nav" {
                navigationTab
            } else {
                themeTab
            }
        }
        .background(theme.backgroundColor)
        .navigationTitle("Оформление")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    private var navigationTab: some View {
        List {
            Toggle(isOn: $navChats) { Label("Чаты", systemImage: "message.fill") }
            Toggle(isOn: $navContacts) { Label("Контакты", systemImage: "person.2.fill") }
            Toggle(isOn: $navMusic) { Label("Музыка", systemImage: "music.note.list") }
            Toggle(isOn: $navCalls) { Label("Звонки", systemImage: "phone.fill") }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
    }

    private var themeTab: some View {
        VStack(spacing: 16) {
            Spacer()
            VStack(spacing: 24) {
                Button(action: { theme.isDark = true }) {
                    HStack {
                        Image(systemName: "moon.fill")
                            .font(.title2)
                            .foregroundColor(.yellow)
                        Text("Тёмная тема")
                            .font(.headline)
                            .foregroundColor(theme.textPrimary)
                        Spacer()
                        if theme.isDark {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(theme.accent)
                        }
                    }
                    .padding()
                    .background(theme.surfaceColor)
                    .cornerRadius(12)
                }
                Button(action: { theme.isDark = false }) {
                    HStack {
                        Image(systemName: "sun.max.fill")
                            .font(.title2)
                            .foregroundColor(.orange)
                        Text("Светлая тема")
                            .font(.headline)
                            .foregroundColor(theme.textPrimary)
                        Spacer()
                        if !theme.isDark {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(theme.accent)
                        }
                    }
                    .padding()
                    .background(theme.surfaceColor)
                    .cornerRadius(12)
                }
            }
            .padding(.horizontal, 40)
            Spacer()
        }
    }
}
