import SwiftUI

struct BottomNavBar<T: RawRepresentable & CaseIterable & Hashable>: View where T.RawValue == String {
    @Binding var activeTab: T
    let tabs: [T]
    var onMenuAction: (String, String) -> Void

    @State private var showMenu = false
    @State private var menuTabId: String = ""
    @State private var menuPosition: CGPoint = .zero

    private let menuItems: [String: [(id: String, icon: String, labelKey: String)]] = [
        "chats": [("new-chat", "square.and.pencil", "Новый чат"), ("search-chats", "magnifyingglass", "Поиск чатов")],
        "contacts": [("add-contact", "person.badge.plus", "Добавить контакт"), ("search-contacts", "magnifyingglass", "Поиск контактов")],
        "profile": [("edit-profile", "pencil", "Редактировать"), ("share-profile", "square.and.arrow.up", "Поделиться профилем")],
        "settings": [("toggle-theme", "moon.fill", "Переключить тему"), ("switch-lang", "globe", "Сменить язык")],
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            if showMenu { menuOverlay }

            HStack(spacing: 0) {
                ForEach(Array(tabs.enumerated()), id: \.offset) { idx, tab in
                    let isActive = tab == activeTab
                    let raw = "\(tab.rawValue)"

                    Button(action: {
                        if isActive, let items = menuItems[raw] {
                            showMenu = true
                            menuTabId = raw
                        } else {
                            activeTab = tab
                        }
                    }) {
                        VStack(spacing: 2) {
                            Image(systemName: tab.icon)
                                .font(.system(size: 22, weight: isActive ? .semibold : .regular))
                                .scaleEffect(isActive ? 1.08 : 1)
                            Text(I18n.shared.t(tab.labelKey))
                                .font(.system(size: 10, weight: .medium))
                        }
                        .foregroundColor(isActive ? .primary : .secondary.opacity(0.65))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(.horizontal, 8)
            .frame(height: 72)
            .background(
                .ultraThinMaterial,
                in: RoundedRectangle(cornerRadius: 36)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 36)
                    .stroke(.white.opacity(0.06), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.3), radius: 40, y: 8)
            .shadow(color: .black.opacity(0.2), radius: 8, y: 2)
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.7), value: activeTab)
    }

    private var menuOverlay: some View {
        Color.clear
            .contentShape(Rectangle())
            .onTapGesture { showMenu = false }
            .overlay(alignment: .bottom) {
                if let items = menuItems[menuTabId] {
                    VStack(spacing: 4) {
                        ForEach(items, id: \.id) { item in
                            Button(action: {
                                onMenuAction(menuTabId, item.id)
                                showMenu = false
                            }) {
                                HStack(spacing: 12) {
                                    Image(systemName: item.icon)
                                        .font(.system(size: 16))
                                        .frame(width: 24)
                                    Text(I18n.shared.t(item.labelKey))
                                        .font(.subheadline)
                                    Spacer()
                                }
                                .foregroundColor(.primary)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 12)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(8)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(.white.opacity(0.06), lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.45), radius: 48, y: 12)
                    .shadow(color: .black.opacity(0.2), radius: 8, y: 2)
                    .padding(.horizontal, 20)
                    .offset(y: -100)
                    .transition(.opacity.combined(with: .scale(scale: 0.85, anchor: .bottom)))
                }
            }
    }
}
