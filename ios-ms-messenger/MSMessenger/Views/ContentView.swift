import SwiftUI

struct ContentView: View {
    @EnvironmentObject var auth: AuthManager
    @EnvironmentObject var theme: ThemeManager
    @StateObject private var i18n = I18n.shared

    @State private var activeTab: Tab = .chats
    @State private var activeChatId: String?
    @State private var showOnboarding = false

    enum Tab: String, CaseIterable {
        case chats, contacts, profile, settings

        var icon: String {
            switch self {
            case .chats: return "message.fill"
            case .contacts: return "person.2.fill"
            case .profile: return "person.crop.circle.fill"
            case .settings: return "gearshape.fill"
            }
        }

        var labelKey: String {
            switch self {
            case .chats: return "Чаты"
            case .contacts: return "Контакты"
            case .profile: return "Профиль"
            case .settings: return "Настройки"
            }
        }
    }

    var body: some View {
        Group {
            if auth.isLoading {
                loadingView
            } else if !auth.isLoggedIn || showOnboarding {
                OnboardingView(onComplete: { showOnboarding = false })
            } else if let chatId = activeChatId {
                ChatWindowView(chatId: chatId, onBack: { activeChatId = nil })
            } else {
                mainView
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.9), value: activeChatId)
        .animation(.spring(response: 0.35, dampingFraction: 0.9), value: auth.isLoggedIn)
        .environmentObject(auth)
        .environmentObject(theme)
    }

    private var loadingView: some View {
        VStack {
            Image(systemName: "bubble.left.and.bubble.right.fill")
                .font(.system(size: 64))
                .foregroundColor(.msGreen)
                .symbolEffect(.pulse)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }

    private var mainView: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                switch activeTab {
                case .chats:
                    ChatsListView(onSelectChat: { activeChatId = $0 })
                        .transition(.opacity)
                case .contacts:
                    ContactsListView(onStartChat: { chatId, _ in
                        if let cid = chatId { activeChatId = cid }
                    })
                    .transition(.opacity)
                case .profile:
                    ProfileView()
                        .transition(.opacity)
                case .settings:
                    SettingsView(onLogout: {
                        auth.logout()
                    }, onAddAccount: {
                        showOnboarding = true
                    })
                    .transition(.opacity)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            BottomNavBar(
                activeTab: $activeTab,
                tabs: Tab.allCases,
                onMenuAction: handleMenuAction
            )
        }
    }

    private func handleMenuAction(tabId: String, actionId: String) {
        switch actionId {
        case "toggle-theme": theme.toggle()
        case "switch-lang":
            let next: Language = i18n.current == .ru ? .en : .ru
            i18n.setLanguage(next)
        case "new-chat", "search-chats": activeTab = .chats
        case "add-contact", "search-contacts": activeTab = .contacts
        case "edit-profile", "share-profile": activeTab = .profile
        default: break
        }
    }
}
