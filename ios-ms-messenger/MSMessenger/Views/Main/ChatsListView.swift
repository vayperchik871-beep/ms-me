import SwiftUI

struct ChatsListView: View {
    let onSelectChat: (String) -> Void
    @StateObject private var i18n = I18n.shared

    @State private var chats: [Chat] = []
    @State private var searchText = ""
    @State private var showSearch = false
    @State private var isLoading = true

    private var filtered: [Chat] {
        if searchText.isEmpty { return chats }
        return chats.filter { $0.peer?.name.localizedCaseInsensitiveContains(searchText) == true }
    }

    var body: some View {
        VStack(spacing: 0) {
            headerView

            if filtered.isEmpty && !isLoading {
                emptyView
            } else {
                List {
                    ForEach(filtered) { chat in
                        chatRow(chat)
                            .listRowInsets(EdgeInsets())
                            .listRowSeparator(.hidden)
                            .onTapGesture { onSelectChat(chat.id) }
                    }
                }
                .listStyle(.plain)
                .refreshable { await loadChats() }
            }
        }
        .task { await loadChats() }
    }

    private var headerView: some View {
        HStack {
            if showSearch {
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField(i18n.t("Поиск"), text: $searchText)
                        .textFieldStyle(.plain)
                    if !searchText.isEmpty {
                        Button { searchText = "" } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                    Button(i18n.t("Отмена")) {
                        withAnimation { showSearch = false; searchText = "" }
                    }
                    .font(.subheadline)
                    .foregroundColor(.msGreen)
                }
                .padding(10)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            } else {
                HStack {
                    if let u = AuthManager.shared.user {
                        AvatarView(name: u.name, avatarURL: u.avatar, size: 36, color: u.profileColor)
                    }
                    Text("MS Messenger")
                        .font(.headline)
                    Spacer()
                    Button { withAnimation { showSearch = true } } label: {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 18, weight: .semibold))
                    }
                    .foregroundColor(.msGreen)
                    Button(action: {}) {
                        Image(systemName: "square.and.pencil")
                            .font(.system(size: 18, weight: .semibold))
                    }
                    .foregroundColor(.msGreen)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            }
        }
        .padding(.top, 4)
    }

    private func chatRow(_ chat: Chat) -> some View {
        HStack(spacing: 12) {
            ZStack {
                AvatarView(
                    name: chat.peer?.name ?? "?",
                    avatarURL: chat.peer?.avatar,
                    size: 48,
                    color: chat.peer?.profileColor,
                    online: chat.peer?.online
                )
            }

            VStack(spacing: 2) {
                HStack {
                    Text(chat.peer?.name ?? "?")
                        .font(.system(size: 15, weight: chat.unread > 0 ? .semibold : .regular))
                        .lineLimit(1)
                    Spacer()
                    Text(chat.lastTime ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text(chat.lastMessage ?? "")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                    Spacer()
                    if chat.unread > 0 {
                        Text("\(chat.unread)")
                            .font(.caption.weight(.bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.msGreen, in: Capsule())
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
    }

    private var emptyView: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "message")
                .font(.system(size: 48))
                .foregroundColor(.secondary.opacity(0.5))
            Text(i18n.t("Нет чатов"))
                .font(.headline)
                .foregroundColor(.secondary)
            Spacer()
        }
    }

    private func loadChats() async {
        isLoading = true
        do {
            let resp = try await APIClient.shared.getChats()
            chats = resp.chats
        } catch {}
        isLoading = false
    }
}
