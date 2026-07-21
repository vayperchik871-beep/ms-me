import SwiftUI

struct ChatsListView: View {
    @State private var chats: [Chat] = []
    @State private var loading = true

    var body: some View {
        NavigationStack {
            Group {
                if loading { ProgressView() }
                else if chats.isEmpty { VStack(spacing: 8) { Image(systemName: "message.slash").font(.largeTitle).foregroundColor(.secondary); Text("Нет чатов").foregroundColor(.secondary) } }
                else { List(chats) { chat in NavigationLink(destination: ChatDetailView(chat: chat)) { ChatRowView(chat: chat) } } }
            }.navigationTitle("Чаты").refreshable { await load() }.task { await load() }
        }
    }

    private func load() async {
        loading = true
        do { chats = try await APIClient.shared.getChats().chats } catch { print(error) }
        loading = false
    }
}

struct ChatRowView: View {
    let chat: Chat
    var body: some View {
        HStack(spacing: 12) {
            ZStack { Circle().fill(ThemeManager.shared.accent.opacity(0.2)).frame(width: 48, height: 48); Text(chat.name?.prefix(1).uppercased() ?? "?").font(.title3).bold().foregroundColor(ThemeManager.shared.accent) }
            VStack(alignment: .leading, spacing: 4) {
                Text(chat.name ?? "Чат").font(.body).fontWeight(.medium)
                if let last = chat.lastMessage { Text(last.text ?? "Вложение").font(.caption).foregroundColor(ThemeManager.shared.textSecondary).lineLimit(1) }
            }
            Spacer()
            if let unread = chat.unreadCount, unread > 0 { Text("\(unread)").font(.caption2).bold().foregroundColor(.white).padding(6).background(ThemeManager.shared.accent).clipShape(Circle()) }
        }.padding(.vertical, 4)
    }
}
