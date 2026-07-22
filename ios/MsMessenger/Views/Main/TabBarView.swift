import SwiftUI

struct TabBarView: View {
    var body: some View {
        TabView {
            ChatsListView().tabItem { Label("Чаты", systemImage: "message.fill") }
            ContactsListView().tabItem { Label("Контакты", systemImage: "person.2.fill") }
            SettingsView().tabItem { Label("Настройки", systemImage: "gearshape.fill") }
        }
        .tint(ThemeManager.shared.accent)
        .toolbarBackground(.ultraThinMaterial, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
    }
}
