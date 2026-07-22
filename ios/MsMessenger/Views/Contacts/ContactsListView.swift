import SwiftUI

struct ContactsListView: View {
    @State private var contacts: [User] = []
    @State private var search = ""
    @State private var searchResults: [User] = []
    @State private var loading = true
    @State private var navigateChat: Chat?
    @State private var showChat = false
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
            .searchable(text: $search, prompt: Text("Поиск").foregroundColor(theme.textSecondary))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Контакты")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                }
            }
            .toolbarBackground(Color.clear, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .onChange(of: search) { _ in
                guard !search.isEmpty else { searchResults = []; return }
                Task { do { searchResults = try await APIClient.shared.searchUsers(query: search).users } catch {} }
            }
            .onAppear {
                guard !search.isEmpty else { return }
                Task { do { searchResults = try await APIClient.shared.searchUsers(query: search).users } catch {} }
            }
            .task { await load() }
            .refreshable { await load() }
            .background(
                NavigationLink("", destination: ChatDetailView(chat: navigateChat ?? Chat(id: "", type: nil, name: nil, peer: nil, lastMessage: nil, lastTime: nil, unread: nil, lastMessageAt: nil)), isActive: $showChat).hidden()
            )
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
                showChat = true
            } catch { print(error) }
        }
    }
}

struct ContactRowView: View {
    let user: User
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(theme.cardColor)
                    .frame(width: 48, height: 48)
                Text(user.name.prefix(1).uppercased())
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Color(hex: "#6C63FF"))
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(user.name)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(theme.textPrimary)
                Text("@\(user.userId)")
                    .font(.system(size: 14))
                    .foregroundColor(theme.textSecondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundColor(theme.textSecondary.opacity(0.6))
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.04))
        )
    }
}
