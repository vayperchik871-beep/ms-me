import SwiftUI

struct ContactsListView: View {
    @State private var contacts: [User] = []
    @State private var search = ""
    @State private var searchResults: [User] = []
    @State private var loading = true
    @State private var navigateChat: Chat?

    var body: some View {
        NavigationStack {
            List {
                if !search.isEmpty {
                    ForEach(searchResults) { user in
                        Button(action: { openChat(user: user) }) { ContactRowView(user: user) }
                    }
                } else {
                    ForEach(contacts) { c in
                        Button(action: { openChat(user: c) }) { ContactRowView(user: c) }
                    }
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .navigationTitle("Контакты").searchable(text: $search)
            .onChange(of: search, initial: false) { _, _ in guard !search.isEmpty else { searchResults = []; return }; Task { do { searchResults = try await APIClient.shared.searchUsers(query: search).users } catch {} } }
            .task { await load() }.refreshable { await load() }
            .overlay { if loading { ProgressView() } }
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .navigationDestination(item: $navigateChat) { ChatDetailView(chat: $0) }
        }
    }

    private func load() async {
        loading = true
        do { contacts = try await APIClient.shared.getContacts().users } catch { print(error) }
        loading = false
    }

    private func openChat(user: User) {
        Task {
            do {
                let resp = try await APIClient.shared.addContact(userId: user.userId)
                navigateChat = Chat(id: resp.chatId, type: "direct", name: resp.contact.name, peer: Peer(id: resp.contact.id, userId: resp.contact.userId, name: resp.contact.name, isSystem: nil, avatar: nil, profileColor: nil, online: nil, lastSeen: nil), lastMessage: nil, lastTime: nil, unread: nil)
            } catch { print(error) }
        }
    }
}

struct ContactRowView: View {
    let user: User
    var body: some View {
        HStack(spacing: 12) {
            ZStack { Circle().fill(ThemeManager.shared.accent.opacity(0.2)).frame(width: 44, height: 44); Text(user.name.prefix(1).uppercased()).font(.headline).foregroundColor(ThemeManager.shared.accent) }
            VStack(alignment: .leading, spacing: 2) { Text(user.name).font(.body).fontWeight(.medium); Text("@\(user.userId)").font(.caption).foregroundColor(ThemeManager.shared.textSecondary) }
        }.padding(.vertical, 4)
    }
}
