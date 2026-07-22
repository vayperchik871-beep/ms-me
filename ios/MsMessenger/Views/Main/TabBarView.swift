import SwiftUI

struct TabBarView: View {
    @AppStorage("nav_chats") private var navChats = true
    @AppStorage("nav_contacts") private var navContacts = true
    @AppStorage("nav_music") private var navMusic = true
    @AppStorage("nav_calls") private var navCalls = true
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
            if navCalls {
                CallsView()
                    .tabItem {
                        Image(systemName: "phone.fill")
                        Text("Звонки")
                    }
            }
            SettingsView()
                .tabItem {
                    Image(systemName: "gearshape.fill")
                    Text("Настройки")
                }
        }
        .tint(Color(hex: "#6C63FF"))
        .background(theme.bgColor.ignoresSafeArea())
    }
}
