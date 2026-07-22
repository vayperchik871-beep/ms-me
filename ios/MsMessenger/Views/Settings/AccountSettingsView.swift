import SwiftUI

struct AccountSettingsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var accounts: [StoredAccount] = []
    @State private var showCreate = false
    @State private var currentUserId: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                ForEach(accounts) { account in
                    Button(action: { switchTo(account) }) {
                        HStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(Color.white.opacity(0.1))
                                    .frame(width: 48, height: 48)
                                Text(account.name.prefix(1).uppercased())
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(Color(hex: "#6C63FF"))
                            }

                            VStack(alignment: .leading, spacing: 3) {
                                Text(account.name)
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(theme.textPrimary)
                                Text("@\(account.userId)")
                                    .font(.system(size: 14))
                                    .foregroundColor(theme.textSecondary)
                            }

                            Spacer()

                            if account.userId == currentUserId {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(Color(hex: "#6C63FF"))
                            } else {
                                Image(systemName: "arrow.right")
                                    .font(.system(size: 14))
                                    .foregroundColor(theme.textSecondary.opacity(0.6))
                            }
                        }
                        .padding(14)
                        .background(Color.white.opacity(0.06))
                        .cornerRadius(12)
                    }.buttonStyle(.plain)
                }

                if accounts.count < 5 {
                    Button(action: { showCreate = true }) {
                        HStack {
                            Image(systemName: "plus.circle")
                                .font(.system(size: 18))
                            Text("Создать аккаунт")
                                .font(.system(size: 16, weight: .medium))
                        }
                        .foregroundColor(Color(hex: "#6C63FF"))
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(Color.white.opacity(0.06))
                        .cornerRadius(12)
                    }.buttonStyle(.plain)
                }

                Button(action: logoutCurrent) {
                    HStack {
                        Image(systemName: "arrow.right.square")
                            .font(.system(size: 18))
                        Text("Выйти из аккаунта")
                            .font(.system(size: 16, weight: .medium))
                    }
                    .foregroundColor(Color(hex: "#FF453A"))
                    .frame(maxWidth: .infinity)
                    .padding(14)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(12)
                }.buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
        }
        .background(theme.bgColor.ignoresSafeArea())
        .navigationTitle("Аккаунт")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Аккаунт")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(theme.textPrimary)
            }
        }
        .toolbarBackground(Color.clear, for: .navigationBar)
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
        UserDefaults.standard.set(account.userUUID ?? "", forKey: "user_uuid")
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
    var userUUID: String?
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
            VStack(spacing: 28) {
                Spacer()
                VStack(spacing: 8) {
                    Text("Создать аккаунт")
                        .font(.system(size: 22, weight: .bold))
                    .foregroundColor(theme.textPrimary)
                Text("Войдите с другим ID")
                    .font(.system(size: 15))
                    .foregroundColor(theme.textSecondary)
                }

                VStack(spacing: 16) {
                    HStack(spacing: 12) {
                        Image(systemName: "at")
                            .font(.system(size: 16))
                            .foregroundColor(Color(hex: "#6C63FF"))
                            .frame(width: 24)
                        TextField("ID", text: $userId)
                            .font(.system(size: 16))
                            .foregroundColor(theme.inputText)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(theme.inputBg)
                    .cornerRadius(12)

                    HStack(spacing: 12) {
                        Image(systemName: "lock")
                            .font(.system(size: 16))
                            .foregroundColor(Color(hex: "#6C63FF"))
                            .frame(width: 24)
                        SecureField("Пароль", text: $password)
                            .font(.system(size: 16))
                            .foregroundColor(theme.inputText)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(12)
                }
                .padding(.horizontal, 40)

                if let error {
                    Text(error)
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#FF453A"))
                }

                Button(action: login) {
                    if loading { ProgressView().tint(.white) }
                    else { Text("Войти").font(.system(size: 17, weight: .semibold)) }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background((!userId.isEmpty && !password.isEmpty) ? Color(hex: "#6C63FF") : Color.white.opacity(0.15))
                .foregroundColor((!userId.isEmpty && !password.isEmpty) ? .white : .white.opacity(0.3))
                .cornerRadius(14)
                .disabled(userId.isEmpty || password.isEmpty || loading)
                .padding(.horizontal, 40)

                Spacer(minLength: 40)
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }
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
                    accounts.append(StoredAccount(userId: resp.user?.userId ?? userId, name: resp.user?.name ?? userId, token: resp.token ?? "", userUUID: resp.user?.id))
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
