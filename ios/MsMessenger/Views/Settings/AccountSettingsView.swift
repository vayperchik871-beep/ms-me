import SwiftUI

struct AccountSettingsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var accounts: [StoredAccount] = []
    @State private var showCreate = false
    @State private var currentUserId: String?

    var body: some View {
        List {
            Section("Мои аккаунты") {
                ForEach(accounts) { account in
                    Button(action: { switchTo(account) }) {
                        HStack {
                            ZStack {
                                Circle().fill(theme.accent.opacity(0.2)).frame(width: 40, height: 40)
                                Text(account.name.prefix(1).uppercased()).font(.headline).foregroundColor(theme.accent)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(account.name).font(.body).foregroundColor(theme.textPrimary)
                                Text("@\(account.userId)").font(.caption).foregroundColor(theme.textSecondary)
                            }
                            Spacer()
                            if account.userId == currentUserId {
                                Image(systemName: "checkmark.circle.fill").foregroundColor(theme.accent)
                            }
                        }
                    }
                }
                if accounts.count < 5 {
                    Button(action: { showCreate = true }) {
                        Label("Создать аккаунт", systemImage: "plus.circle").foregroundColor(theme.accent)
                    }
                }
            }
            Section {
                Button(action: logoutCurrent) {
                    Label("Выйти из аккаунта", systemImage: "arrow.right.square")
                        .foregroundColor(theme.error)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(theme.backgroundColor)
        .navigationTitle("Аккаунт")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task { loadAccounts() }
        .sheet(isPresented: $showCreate) { CreateAccountView { loadAccounts() } }
    }

    private func loadAccounts() {
        if let data = UserDefaults.standard.data(forKey: "stored_accounts"),
           let saved = try? JSONDecoder().decode([StoredAccount].self, from: data) {
            accounts = saved
        }
        currentUserId = UserDefaults.standard.string(forKey: "user_id")
    }

    private func switchTo(_ account: StoredAccount) {
        APIClient.shared.token = account.token
        currentUserId = account.userId
        UserDefaults.standard.set(account.userId, forKey: "user_id")
        WebSocketService.shared.connect(token: account.token)
    }

    private func logoutCurrent() {
        APIClient.shared.token = nil
        WebSocketService.shared.disconnect()
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = scene.windows.first {
            window.rootViewController = UIHostingController(rootView: OnboardingView(onComplete: {}))
        }
    }
}

struct StoredAccount: Codable, Identifiable {
    let userId: String
    let name: String
    let token: String
    var id: String { userId }
}

struct CreateAccountView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var theme = ThemeManager.shared
    @State private var userId = ""
    @State private var password = ""
    @State private var error: String?
    @State private var loading = false
    var onCreated: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Text("Создать дополнительный аккаунт")
                    .font(.title2).bold()
                    .foregroundColor(theme.textPrimary)
                VStack(spacing: 16) {
                    TextField("ID", text: $userId)
                        .textFieldStyle(.plain)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .padding()
                        .background(theme.surfaceColor)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                    SecureField("Пароль", text: $password)
                        .textFieldStyle(.plain)
                        .padding()
                        .background(theme.surfaceColor)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
                .padding(.horizontal, 40)
                if let error { Text(error).font(.caption).foregroundColor(theme.error) }
                Button(action: login) {
                    if loading { ProgressView().tint(.white) }
                    else { Text("Войти").font(.headline).bold() }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background((!userId.isEmpty && !password.isEmpty) ? theme.accent : theme.borderColor)
                .foregroundColor((!userId.isEmpty && !password.isEmpty) ? .white : theme.textSecondary)
                .cornerRadius(14)
                .disabled(userId.isEmpty || password.isEmpty || loading)
                .padding(.horizontal, 40)
                Spacer()
            }
            .padding(.top, 40)
            .background(theme.backgroundColor)
            .navigationTitle("Новый аккаунт")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Отмена") { dismiss() } } }
        }
        .preferredColorScheme(theme.isDark ? .dark : .light)
    }

    private func login() {
        loading = true; error = nil
        Task {
            do {
                let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
                let resp = try await APIClient.shared.login(userId: userId, password: password, deviceId: deviceId)
                APIClient.shared.token = resp.token
                var accounts = (try? JSONDecoder().decode([StoredAccount].self, from: UserDefaults.standard.data(forKey: "stored_accounts") ?? Data())) ?? []
                if !accounts.contains(where: { $0.userId == resp.user?.userId }) {
                    accounts.append(StoredAccount(userId: resp.user?.userId ?? userId, name: resp.user?.name ?? userId, token: resp.token ?? ""))
                    if let data = try? JSONEncoder().encode(accounts) {
                        UserDefaults.standard.set(data, forKey: "stored_accounts")
                    }
                }
                onCreated()
                dismiss()
            } catch { self.error = error.localizedDescription }
            loading = false
        }
    }
}
