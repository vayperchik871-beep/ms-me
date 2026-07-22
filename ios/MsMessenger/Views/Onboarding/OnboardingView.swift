import SwiftUI
import PhotosUI

struct OnboardingView: View {
    var onComplete: () -> Void
    @State private var step = 0
    @State private var phonePrefix = ""
    @State private var phoneLast = ""
    @State private var userId = ""
    @State private var password = ""
    @State private var name = ""
    @State private var bio = ""
    @State private var avatarData: Data?
    @State private var error: String?
    @State private var loading = false
    @State private var avatarItem: PhotosPickerItem?
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        ZStack {
            theme.bgColor.ignoresSafeArea()

            VStack(spacing: 0) {
                header
                Spacer()
                if step == 0 { welcomeStep }
                else if step == 1 { phoneStep }
                else if step == 2 { credentialsStep }
                else if step == 3 { profileStep }
                Spacer(minLength: 20)
            }
        }
        .preferredColorScheme(theme.isDark ? .dark : .light)
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            if step > 0 {
                Button(action: { step -= 1; error = nil }) {
                    HStack(spacing: 6) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 17, weight: .semibold))
                        Text("Назад")
                            .font(.system(size: 17))
                    }
                    .foregroundColor(Color(hex: "#6C63FF"))
                }
            }
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 60)
    }

    // MARK: - Step 0: Welcome

    private var welcomeStep: some View {
        VStack(spacing: 36) {
            Spacer()
            Image("Logo")
                .resizable()
                .scaledToFit()
                .frame(width: 140, height: 140)
                .cornerRadius(32)
                .shadow(color: .black.opacity(0.4), radius: 16, x: 0, y: 8)

            VStack(spacing: 10) {
                Text("MS Messenger")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(theme.textPrimary)
                Text("Безопасный и быстрый мессенджер")
                    .font(.system(size: 17))
                    .foregroundColor(theme.textSecondary)
            }

            Spacer()

            Button(action: { step = 1 }) {
                Text("Начать")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color(hex: "#6C63FF"))
                    .foregroundColor(.white)
                    .cornerRadius(14)
            }
            .padding(.horizontal, 40)
            .padding(.bottom, 60)
        }
    }

    // MARK: - Step 1: Phone

    private var phoneStep: some View {
        VStack(spacing: 28) {
            VStack(spacing: 8) {
                Text("Придумайте номер")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(theme.textPrimary)
                Text("Номер начинается на +777 и будет\nпривязан к вашему аккаунту навсегда")
                    .font(.system(size: 15))
                    .multilineTextAlignment(.center)
                    .foregroundColor(theme.textSecondary)
            }

            phoneInput

            if let error {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#FF453A"))
            }

            Button(action: { error = nil; step = 2 }) {
                Text("Готово")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(phoneValid ? Color(hex: "#6C63FF") : Color.white.opacity(0.15))
                    .foregroundColor(phoneValid ? .white : .white.opacity(0.3))
                    .cornerRadius(14)
            }
            .disabled(!phoneValid)
            .padding(.horizontal, 40)
        }
    }

    private var phoneInput: some View {
        HStack(spacing: 6) {
            Text("+777")
                .font(.system(size: 22, weight: .semibold, design: .monospaced))
                .foregroundColor(Color(hex: "#6C63FF"))
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .background(theme.inputBg)
                .cornerRadius(12)

            TextField("XXXX", text: $phonePrefix)
                .font(.system(size: 22, weight: .medium, design: .monospaced))
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .foregroundColor(theme.inputText)
                .tint(Color(hex: "#6C63FF"))
                .padding(.vertical, 14)
                .frame(width: 80)
                .background(theme.inputBg)
                .cornerRadius(12)
                .onChange(of: phonePrefix) { new in
                    let filtered = new.filter(\.isNumber)
                    phonePrefix = String(filtered.prefix(4))
                }

            Text(" ")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.white.opacity(0.3))

            TextField("XXXX", text: $phoneLast)
                .font(.system(size: 22, weight: .medium, design: .monospaced))
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .foregroundColor(theme.inputText)
                .tint(Color(hex: "#6C63FF"))
                .padding(.vertical, 14)
                .frame(width: 80)
                .background(theme.inputBg)
                .cornerRadius(12)
                .onChange(of: phoneLast) { new in
                    let filtered = new.filter(\.isNumber)
                    phoneLast = String(filtered.prefix(4))
                }
        }
        .padding(.horizontal, 40)
    }

    private var fullPhone: String { "+777\(phonePrefix)\(phoneLast)" }
    private var phoneValid: Bool { phonePrefix.count == 4 && phoneLast.count == 4 }

    // MARK: - Step 2: Credentials

    private var credentialsStep: some View {
        VStack(spacing: 28) {
            VStack(spacing: 8) {
                Text("Создайте ID и пароль")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(theme.textPrimary)
                Text("Уникальный ID для входа в приложение")
                    .font(.system(size: 15))
                    .foregroundColor(theme.textSecondary)
            }

            VStack(spacing: 16) {
                simpleField(placeholder: "Уникальный ID", text: $userId, isSecure: false)
                simpleField(placeholder: "Пароль (минимум 6 символов)", text: $password, isSecure: true)
            }
            .padding(.horizontal, 40)

            if let error {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#FF453A"))
            }

            Button(action: { step = 3 }) {
                Text("Далее")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background((!userId.isEmpty && password.count >= 6) ? Color(hex: "#6C63FF") : Color.white.opacity(0.15))
                    .foregroundColor((!userId.isEmpty && password.count >= 6) ? .white : .white.opacity(0.3))
                    .cornerRadius(14)
            }
            .disabled(userId.isEmpty || password.count < 6)
            .padding(.horizontal, 40)
        }
    }

    // MARK: - Step 3: Profile

    private var profileStep: some View {
        VStack(spacing: 28) {
            VStack(spacing: 8) {
                Text("Заполните профиль")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(theme.textPrimary)
                Text("Расскажите о себе")
                    .font(.system(size: 15))
                    .foregroundColor(theme.textSecondary)
            }

            PhotosPicker(selection: $avatarItem, matching: .images) {
                ZStack {
                    if let data = avatarData, let ui = UIImage(data: data) {
                        Image(uiImage: ui)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 96, height: 96)
                            .clipShape(Circle())
                    } else {
                        Circle()
                            .fill(Color.white.opacity(0.08))
                            .frame(width: 96, height: 96)
                        Image(systemName: "camera.fill")
                            .font(.system(size: 28))
                            .foregroundColor(Color(hex: "#6C63FF"))
                    }
                }
            }
            .onChange(of: avatarItem) { _ in
                Task { if let data = try? await avatarItem?.loadTransferable(type: Data.self) { avatarData = data } }
            }

            VStack(spacing: 16) {
                simpleField(placeholder: "Как вас зовут?", text: $name, isSecure: false)
                simpleField(placeholder: "О себе (необязательно)", text: $bio, isSecure: false)
            }
            .padding(.horizontal, 40)

            if let error {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#FF453A"))
            }

            Button(action: register) {
                if loading { ProgressView().tint(.white) }
                else {
                    Text("Зарегистрироваться")
                        .font(.system(size: 17, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(name.isEmpty ? Color.white.opacity(0.15) : Color(hex: "#6C63FF"))
            .foregroundColor(name.isEmpty ? .white.opacity(0.3) : .white)
            .cornerRadius(14)
            .disabled(name.isEmpty || loading)
            .padding(.horizontal, 40)
        }
    }

    // MARK: - Shared Components

    private func simpleField(placeholder: String, text: Binding<String>, isSecure: Bool) -> some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: text)
                    .font(.system(size: 16))
                    .foregroundColor(theme.inputText)
            } else {
                TextField(placeholder, text: text)
                    .font(.system(size: 16))
                    .foregroundColor(theme.inputText)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(theme.inputBg)
        .cornerRadius(12)
    }

    // MARK: - Register

    private func register() {
        loading = true; error = nil
        Task {
            do {
                let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
                let resp = try await APIClient.shared.register(
                    userId: userId, name: name, password: password, deviceId: deviceId,
                    phone: fullPhone, bio: bio.isEmpty ? nil : bio, avatarData: avatarData
                )
                APIClient.shared.token = resp.token
                if let user = resp.user {
                    UserDefaults.standard.set(user.userId, forKey: "user_id")
                    UserDefaults.standard.set(user.id, forKey: "user_uuid")
                }
                onComplete()
            } catch { self.error = error.localizedDescription }
            loading = false
        }
    }
}
