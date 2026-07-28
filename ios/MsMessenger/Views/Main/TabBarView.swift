import SwiftUI

struct TabBarView: View {
    @AppStorage("nav_chats") private var navChats = true
    @AppStorage("nav_contacts") private var navContacts = true
    @AppStorage("nav_music") private var navMusic = true
    @AppStorage("nav_profile") private var navProfile = true
    @ObservedObject private var theme = ThemeManager.shared
    @State private var selected = "chats"

    private let items: [(id: String, icon: String, label: String)] = [
        ("chats", "message.fill", "Чаты"),
        ("contacts", "person.2.fill", "Контакты"),
        ("music", "music.note.list", "Музыка"),
        ("profile", "person.circle.fill", "Профиль"),
        ("settings", "gearshape.fill", "Настройки"),
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch selected {
                case "chats": ChatsListView()
                case "contacts": ContactsListView()
                case "music": MusicView()
                case "profile": ProfileTabView()
                case "settings": SettingsView()
                default: ChatsListView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            customTabBar
        }
        .ignoresSafeArea(.keyboard)
    }

    private var customTabBar: some View {
        HStack(spacing: 0) {
            ForEach(items, id: \.id) { item in
                if visible(item.id) {
                    Spacer()
                    tabButton(id: item.id, icon: item.icon, label: item.label)
                    Spacer()
                }
            }
        }
        .padding(.horizontal, 4)
        .padding(.top, 8)
        .padding(.bottom, 24)
        .background(
            VisualEffectView(effect: UIBlurEffect(style: theme.isDark ? .dark : .light))
                .overlay(alignment: .top) {
                    Divider().background(theme.borderColor)
                }
        )
    }

    @ViewBuilder
    private func tabButton(id: String, icon: String, label: String) -> some View {
        let active = selected == id
        Button(action: { selected = id }) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: active ? .semibold : .regular))
                    .foregroundColor(active ? Color(hex: "#6C63FF") : theme.textSecondary)
                Text(label)
                    .font(.system(size: 10, weight: active ? .semibold : .regular))
                    .foregroundColor(active ? Color(hex: "#6C63FF") : theme.textSecondary)
            }
        }
        .buttonStyle(.plain)
    }

    private func visible(_ id: String) -> Bool {
        switch id {
        case "chats": return navChats
        case "contacts": return navContacts
        case "music": return navMusic
        case "profile": return navProfile
        default: return true
        }
    }
}

struct VisualEffectView: UIViewRepresentable {
    let effect: UIVisualEffect

    func makeUIView(context: Context) -> UIVisualEffectView { UIVisualEffectView(effect: effect) }
    func updateUIView(_ uiView: UIVisualEffectView, context: Context) { uiView.effect = effect }
}
