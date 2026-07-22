import SwiftUI

struct ContactsListView: View {
    @State private var contacts: [User] = []
    @State private var search = ""
    @State private var searchResults: [User] = []
    @State private var loading = true
    @State private var navigateChat: Chat?
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView().tint(Color(hex: "#6C63FF"))
                } else {
                    ScrollView {
                        LazyVStack(spacing: 2) {
                            if !search.isEmpty {
                                ForEach(searchResults) { user in
                                    Button(action: { openChat(user: user) }) {
                                        ContactRowView(user: user)
                                    }.buttonStyle(.plain)
                                }
                            } else {
                                ForEach(contacts) { c in
                                    Button(action: { openChat(user: c) }) {
                                        ContactRowView(user: c)
                                    }.buttonStyle(.plain)
                                }
                            }
                        }.padding(.horizontal, 12)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(theme.bgColor.ignoresSafeArea())
            .searchable(text: $search, prompt: Text("Поиск").foregroundColor(.white.opacity(0.4)))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Контакты")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                }
            }
            .toolbarBackground(Color.clear, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .onChange(of: search, initial: false) { _, _ in
                guard !search.isEmpty else { searchResults = []; return }
                Task { do { searchResults = try await APIClient.shared.searchUsers(query: search).users } catch {} }
            }
            .task { await load() }
            .refreshable { await load() }
            .navigationDestination(item: $navigateChat) { ChatDetailView(chat: $0) }
        }
        .tint(Color(hex: "#6C63FF"))
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
                navigateChat = Chat(id: resp.chatId, type: "direct", name: resp.contact.name, peer: Peer(id: resp.contact.id, userId: resp.contact.userId, name: resp.contact.name, isSystem: nil, avatar: nil, profileColor: nil, online: nil, lastSeen: nil), lastMessage: nil, lastTime: nil, unread: nil, lastMessageAt: nil)
            } catch { print(error) }
        }
    }
}

struct ContactRowView: View {
    let user: User

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 48, height: 48)
                Text(user.name.prefix(1).uppercased())
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Color(hex: "#6C63FF"))
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(user.name)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
                Text("@\(user.userId)")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.4))
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.2))
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.04))
        )
    }
}
