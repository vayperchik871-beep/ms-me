import SwiftUI

struct LoginView: View {
    @EnvironmentObject var auth: AuthManager
    @StateObject private var i18n = I18n.shared

    @State private var userId = ""
    @State private var password = ""
    @State private var error = ""
    @State private var loading = false
    @State private var needsVerify = false

    var onComplete: () -> Void
    var onSwitchRegister: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Spacer().frame(height: 40)

                Text("👋")
                    .font(.system(size: 48))

                Text(i18n.t("Вход"))
                    .font(.title.bold())

                Text(i18n.t("Введите ваш ID и пароль"))
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                if !error.isEmpty {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.msRed)
                        .padding(10)
                        .background(.msRed.opacity(0.15), in: RoundedRectangle(cornerRadius: 10))
                }

                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(i18n.t("ID"))
                            .font(.caption.weight(.medium))
                            .foregroundColor(.secondary)

                        HStack(spacing: 4) {
                            Text("@")
                                .foregroundColor(.secondary)
                                .font(.body)
                            TextField(i18n.t("username"), text: $userId)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text(i18n.t("Пароль"))
                            .font(.caption.weight(.medium))
                            .foregroundColor(.secondary)

                        SecureField(i18n.t("Пароль"), text: $password)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal)

                Button(action: login) {
                    if loading {
                        ProgressView()
                            .tint(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                    } else {
                        Text(i18n.t("Войти"))
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                    }
                }
                .background(LinearGradient(colors: [.msGreen, .msGreenDark], startPoint: .leading, endPoint: .trailing))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .disabled(loading || userId.isEmpty || password.isEmpty)
                .padding(.horizontal)

                HStack {
                    Text(i18n.t("Нет аккаунта?"))
                        .foregroundColor(.secondary)
                    Button(i18n.t("Создать")) { onSwitchRegister() }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.msGreen)
                }
                .font(.subheadline)

                if needsVerify { verifyView }
            }
            .padding(.bottom, 40)
        }
    }

    private var verifyView: some View {
        VStack(spacing: 16) {
            Text("Введите код из чата с MS-Мессенджер")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)

            TextField("Код", text: .init(get: { "" }, set: { v in
                guard v.count <= 6 else { return }
                // handle code input
            }))
            .font(.title2.monospaced())
            .multilineTextAlignment(.center)
            .padding()
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
        }
    }

    private func login() {
        loading = true
        error = ""
        Task {
            do {
                let resp = try await auth.login(userId: userId.lowercased(), password: password)
                if resp.needsVerification == true {
                    needsVerify = true
                } else {
                    onComplete()
                }
            } catch {
                error = error.localizedDescription
            }
            loading = false
        }
    }
}
