import SwiftUI

struct ChatsListView: View {
    @State private var chats: [Chat] = []
    @State private var loading = true
    @State private var showCreateGroup = false
    @State private var searchText = ""
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView().tint(Color(hex: "#6C63FF"))
                }
                else if chats.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "message.slash")
                            .font(.system(size: 48))
                            .foregroundColor(theme.textSecondary.opacity(0.5))
                        Text("Нет чатов")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundColor(theme.textSecondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                else {
                    ScrollView {
                        LazyVStack(spacing: 4) {
                            ForEach(filteredChats) { chat in
                                NavigationLink(destination: ChatDetailView(chat: chat)) {
                                    ChatRowView(chat: chat)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 12)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(theme.bgColor.ignoresSafeArea())
            .searchable(text: $searchText, prompt: Text("Поиск").foregroundColor(theme.textSecondary))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Чаты")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                }
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showCreateGroup = true }) {
                        Image(systemName: "plus")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundColor(Color(hex: "#6C63FF"))
                    }
                }
            }
            .toolbarBackground(Color.clear, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .refreshable { await load() }
            .task { await load() }
            .sheet(isPresented: $showCreateGroup) { CreateGroupChannelView() }
        }
        .tint(Color(hex: "#6C63FF"))
    }

    private var filteredChats: [Chat] {
        guard !searchText.isEmpty else { return chats }
        return chats.filter { ($0.name ?? "").localizedCaseInsensitiveContains(searchText) }
    }

    private func load() async {
        loading = true
        do { chats = try await APIClient.shared.getChats().chats } catch { print(error) }
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
                    .fill(theme.cardColor)
                    .frame(width: 52, height: 52)
                if let avatar = chat.avatar, let url = URL(string: avatar) {
                    AsyncImage(url: url) { img in
                        img.resizable().scaledToFill()
                    } placeholder: {
                        Image(systemName: chat.isGroup == true ? "person.2.fill" : "person.fill")
                            .foregroundColor(theme.textSecondary)
                    }
                    .frame(width: 52, height: 52)
                    .clipShape(Circle())
                } else {
                    Text(chat.name?.prefix(1).uppercased() ?? "?")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                    Text(chat.name ?? "Чат")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(theme.textPrimary)
                if let last = chat.lastMessage, !last.isEmpty {
                    Text(last)
                        .font(.system(size: 14))
                        .foregroundColor(theme.textSecondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                Text(chatTime(chat.lastMessageAt))
                    .font(.system(size: 12))
                    .foregroundColor(theme.textSecondary)
                if let unread = chat.unreadCount, unread > 0 {
                    Text("\(unread)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(Color(hex: "#6C63FF"))
                        .clipShape(Capsule())
                }
            }
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.04))
        )
    }

    private func chatTime(_ ts: TimeInterval?) -> String {
        guard let ts else { return "" }
        let d = Date(timeIntervalSince1970: ts / 1000)
        let f = DateFormatter()
        let cal = Calendar.current
        if cal.isDateInToday(d) { f.dateFormat = "HH:mm" }
        else if cal.isDateInYesterday(d) { return "Вчера" }
        else { f.dateFormat = "dd.MM" }
        return f.string(from: d)
    }
}
