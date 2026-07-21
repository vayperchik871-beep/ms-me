import SwiftUI

struct ChatsListView: View {
    @State private var chats: [Chat] = []
    @State private var loading = true

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView()
                } else if chats.isEmpty {
                    ContentUnavailableView("Нет чатов", systemImage: "message.slash")
                } else {
                    List(chats) { chat in
                        NavigationLink(destination: ChatDetailView(chat: chat)) {
                            ChatRowView(chat: chat)
                        }
                    }
                }
            }
            .navigationTitle("Чаты")
            .refreshable { await loadChats() }
            .task { await loadChats() }
        }
    }

    private func loadChats() async {
        loading = true
        do {
            let resp = try await APIClient.shared.getChats()
            chats = resp.chats
        } catch { print("Chats error: \(error)") }
        loading = false
    }
}

struct ChatRowView: View {
    let chat: Chat
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(theme.accent.opacity(0.2))
                    .frame(width: 48, height: 48)
                Text(chat.name?.prefix(1).uppercased() ?? "?")
                    .font(.title3).bold()
                    .foregroundColor(theme.accent)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(chat.name ?? "Чат")
                    .font(.body).fontWeight(.medium)
                if let last = chat.lastMessage {
                    Text(last.text ?? "Вложение")
                        .font(.caption)
                        .foregroundColor(theme.textSecondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            if let unread = chat.unreadCount, unread > 0 {
                Text("\(unread)")
                    .font(.caption2).bold()
                    .foregroundColor(.white)
                    .padding(6)
                    .background(theme.accent)
                    .clipShape(Circle())
            }
        }
        .padding(.vertical, 4)
    }
}
