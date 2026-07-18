import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var auth: AuthManager
    @StateObject private var i18n = I18n.shared

    @State private var step = 0
    @State private var name = ""
    @State private var userId = ""
    @State private var password = ""
    @State private var confirm = ""
    @State private var error = ""
    @State private var loading = false
    @State private var avatarData: Data?

    var onComplete: () -> Void
    var onSwitchLogin: () -> Void

    private var cleanId: String {
        userId.lowercased().filter { $0.isLetter || $0.isNumber || $0 == "_" }
    }

    private var initial: String {
        String(name.uppercased().first ?? "?")
    }

    var body: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 20)

            HStack(spacing: 8) {
                ForEach(0..<3) { i in
                    Circle()
                        .fill(i <= step ? Color.msGreen : Color(.systemGray4))
                        .frame(width: 8, height: 8)
                }
            }

            if step == 0 { nameStep }
            else if step == 1 { idStep }
            else if step == 2 { passwordStep }

            Spacer()

            if step == 0 {
                Button(i18n.t("Продолжить")) { next() }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(LinearGradient(colors: [.msGreen, .msGreenDark], startPoint: .leading, endPoint: .trailing))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .disabled(name.isEmpty)
                    .padding(.horizontal)
            }

            HStack {
                Text(i18n.t("Уже есть аккаунт?"))
                    .foregroundColor(.secondary)
                Button(i18n.t("Войти")) { onSwitchLogin() }
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.msGreen)
            }
            .font(.subheadline)
            .padding(.bottom, 30)
        }
    }

    private var nameStep: some View {
        VStack(spacing: 20) {
            Button(action: pickPhoto) {
                ZStack {
                    if let d = avatarData, let ui = UIImage(data: d) {
                        Image(uiImage: ui)
                            .resizable().scaledToFill()
                            .frame(width: 80, height: 80)
                            .clipShape(Circle())
                    } else {
                        Circle()
                            .fill(LinearGradient(colors: [.msGreen, .msGreenDark], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 80, height: 80)
                        Text(initial)
                            .font(.title.bold())
                            .foregroundColor(.white)
                    }
                    ZStack {
                        Circle().fill(Color(.systemBackground)).frame(width: 28, height: 28)
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.msGreen)
                    }
                    .offset(x: 30, y: 30)
                }
            }
            .buttonStyle(.plain)

            Text(i18n.t("Как вас зовут?"))
                .font(.title2.bold())

            TextField(i18n.t("Ваше имя"), text: $name)
                .multilineTextAlignment(.center)
                .font(.title3)
                .padding()
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)
        }
        .padding(.horizontal)
    }

    private var idStep: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                AvatarView(name: name, avatarURL: nil, size: 60, color: nil)
                Text(name).font(.headline)
                Text("@\(cleanId)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(i18n.t("Придумайте ID"))
                .font(.title2.bold())

            HStack(spacing: 4) {
                Text("@")
                    .foregroundColor(.secondary)
                TextField(i18n.t("username"), text: $userId)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .onChange(of: userId) { _ in userId = cleanId }
            }
            .padding()
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)

            Text("Latin, digits, _ · 3-20 chars")
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(spacing: 12) {
                Button(i18n.t("Назад")) { step = 0 }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))

                Button(i18n.t("Продолжить")) { next() }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(LinearGradient(colors: [.msGreen, .msGreenDark], startPoint: .leading, endPoint: .trailing))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .disabled(cleanId.count < 3)
            }
            .padding(.horizontal)
        }
    }

    private var passwordStep: some View {
        VStack(spacing: 20) {
            Image(systemName: "lock.shield")
                .font(.system(size: 48))
                .foregroundColor(.msGreen)

            Text(i18n.t("Защитите аккаунт"))
                .font(.title2.bold())

            Text("Создаём @\(cleanId) для \(name)")
                .font(.subheadline)
                .foregroundColor(.secondary)

            SecureField(i18n.t("Минимум 6 символов"), text: $password)
                .padding()
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)

            SecureField(i18n.t("Повторите пароль"), text: $confirm)
                .padding()
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)

            if !error.isEmpty {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.msRed)
            }

            HStack(spacing: 12) {
                Button(i18n.t("Назад")) { step = 1 }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))

                Button(action: register) {
                    if loading {
                        ProgressView().tint(.white)
                    } else {
                        Text(i18n.t("Создать аккаунт"))
                            .font(.headline)
                    }
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(LinearGradient(colors: [.msGreen, .msGreenDark], startPoint: .leading, endPoint: .trailing))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .disabled(loading || password.count < 6 || password != confirm)
            }
            .padding(.horizontal)
        }
    }

    private func next() {
        withAnimation { step += 1 }
    }

    private func register() {
        loading = true
        error = ""
        Task {
            do {
                try await auth.register(name: name, userId: cleanId, password: password)
                if let d = avatarData {
                    _ = try? await APIClient.shared.uploadAvatar(imageData: d)
                }
                onComplete()
            } catch {
                error = error.localizedDescription
            }
            loading = false
        }
    }

    private func pickPhoto() {
        // Would use PHPickerViewController; placeholder
    }
}
