import SwiftUI

struct TabBarView: View {
    @AppStorage("nav_chats") private var navChats = true
    @AppStorage("nav_contacts") private var navContacts = true
    @AppStorage("nav_music") private var navMusic = true
    @AppStorage("nav_profile") private var navProfile = true
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        TabView {
            if navChats {
                ChatsListView()
                    .tabItem {
                        Image(systemName: "message.fill")
                        Text("Чаты")
                    }
            }
            if navContacts {
                ContactsListView()
                    .tabItem {
                        Image(systemName: "person.2.fill")
                        Text("Контакты")
                    }
            }
            if navMusic {
                MusicView()
                    .tabItem {
                        Image(systemName: "music.note.list")
                        Text("Музыка")
                    }
            }
            if navProfile {
                ProfileTabView()
                    .tabItem {
                        Image(systemName: "person.circle.fill")
                        Text("Профиль")
                    }
            }
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape.fill")
                    Text("Настройки")
                }
        }
        .tint(theme.accent)
        .background(theme.bgColor.ignoresSafeArea())
    }
}
