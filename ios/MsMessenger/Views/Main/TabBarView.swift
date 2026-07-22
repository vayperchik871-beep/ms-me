import SwiftUI

struct TabBarView: View {
    @AppStorage("nav_chats") private var navChats = true
    @AppStorage("nav_contacts") private var navContacts = true
    @AppStorage("nav_music") private var navMusic = true
    @AppStorage("nav_calls") private var navCalls = true

    var body: some View {
        TabView {
            if navChats { ChatsListView().tabItem { Label("Чаты", systemImage: "message.fill") } }
            if navContacts { ContactsListView().tabItem { Label("Контакты", systemImage: "person.2.fill") } }
            if navMusic { MusicView().tabItem { Label("Музыка", systemImage: "music.note.list") } }
            if navCalls { CallsView().tabItem { Label("Звонки", systemImage: "phone.fill") } }
            SettingsView().tabItem { Label("Настройки", systemImage: "gearshape.fill") }
        }
        .tint(ThemeManager.shared.accent)
        .background(.ultraThinMaterial)
        .toolbarBackground(.ultraThinMaterial, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
    }
}
