import SwiftUI

struct ContactsListView: View {
    @State private var contacts: [User] = []
    @State private var search = ""
    @State private var searchResults: [User] = []
    @State private var loading = true
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        NavigationStack {
            List {
                if !search.isEmpty {
                    ForEach(searchResults) { user in
                        ContactRowView(user: user)
                    }
                } else {
                    ForEach(contacts) { contact in
                        ContactRowView(user: contact)
                    }
                }
            }
            .navigationTitle("Контакты")
            .searchable(text: $search)
            .onChange(of: search) { _ in searchUsers() }
            .task { await loadContacts() }
            .refreshable { await loadContacts() }
            .overlay {
                if loading { ProgressView() }
            }
        }
    }

    private func loadContacts() async {
        loading = true
        do {
            let resp = try await APIClient.shared.getContacts()
            contacts = resp.users
        } catch { print("Contacts error: \(error)") }
        loading = false
    }

    private func searchUsers() {
        guard !search.isEmpty else {
            searchResults = []
            return
        }
        Task {
            do {
                let resp = try await APIClient.shared.searchUsers(query: search)
                searchResults = resp.users
            } catch { print("Search error: \(error)") }
        }
    }
}

struct ContactRowView: View {
    let user: User
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(theme.accent.opacity(0.2)).frame(width: 44, height: 44)
                Text(user.name.prefix(1).uppercased())
                    .font(.headline).foregroundColor(theme.accent)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(user.name).font(.body).fontWeight(.medium)
                Text("@\(user.userId)").font(.caption).foregroundColor(theme.textSecondary)
            }
        }
        .padding(.vertical, 4)
    }
}
