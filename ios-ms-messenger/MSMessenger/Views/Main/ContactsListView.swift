import SwiftUI

struct ContactsListView: View {
    let onStartChat: (String?, String?) -> Void
    @StateObject private var i18n = I18n.shared

    @State private var contacts: [User] = []
    @State private var searchText = ""
    @State private var showSearch = false
    @State private var showAdd = false
    @State private var isLoading = true

    private var filtered: [User] {
        if searchText.isEmpty { return contacts }
        return contacts.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.userId.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            headerView

            if filtered.isEmpty && !isLoading {
                emptyView
            } else {
                List {
                    ForEach(filtered) { contact in
                        contactRow(contact)
                            .listRowInsets(EdgeInsets())
                            .listRowSeparator(.hidden)
                            .onTapGesture { onStartChat(nil, contact.userId) }
                    }
                }
                .listStyle(.plain)
                .refreshable { await loadContacts() }
            }
        }
        .task { await loadContacts() }
    }

    private var headerView: some View {
        HStack {
            if showSearch {
                HStack {
                    Image(systemName: "magnifyingglass").foregroundColor(.secondary)
                    TextField(i18n.t("Поиск"), text: $searchText).textFieldStyle(.plain)
                    if !searchText.isEmpty {
                        Button { searchText = "" } label: {
                            Image(systemName: "xmark.circle.fill").foregroundColor(.secondary)
                        }
                    }
                    Button(i18n.t("Отмена")) {
                        withAnimation { showSearch = false; searchText = "" }
                    }
                    .foregroundColor(.msGreen)
                }
                .padding(10)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            } else {
                HStack {
                    Text(i18n.t("Контакты"))
                        .font(.headline)
                    Spacer()
                    Button { withAnimation { showSearch = true } } label: {
                        Image(systemName: "magnifyingglass").font(.system(size: 18, weight: .semibold))
                    }
                    .foregroundColor(.msGreen)
                    Button { showAdd = true } label: {
                        Image(systemName: "person.badge.plus").font(.system(size: 18, weight: .semibold))
                    }
                    .foregroundColor(.msGreen)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            }
        }
        .padding(.top, 4)
    }

    private func contactRow(_ contact: User) -> some View {
        HStack(spacing: 12) {
            AvatarView(name: contact.name, avatarURL: contact.avatar, size: 48,
                       color: contact.profileColor, online: contact.online)
            VStack(alignment: .leading, spacing: 2) {
                Text(contact.name)
                    .font(.system(size: 15, weight: .medium))
                Text("@\(contact.userId)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
    }

    private var emptyView: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "person.2").font(.system(size: 48)).foregroundColor(.secondary.opacity(0.5))
            Text(i18n.t("Нет контактов")).font(.headline).foregroundColor(.secondary)
            Button(i18n.t("Добавить")) { showAdd = true }
                .font(.subheadline.weight(.semibold))
                .foregroundColor(.msGreen)
            Spacer()
        }
    }

    private func loadContacts() async {
        isLoading = true
        do {
            let resp = try await APIClient.shared.getContacts()
            contacts = resp.contacts
        } catch {}
        isLoading = false
    }
}
