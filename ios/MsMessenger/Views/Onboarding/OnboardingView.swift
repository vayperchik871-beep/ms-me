import SwiftUI
import PhotosUI

struct OnboardingView: View {
    var onComplete: () -> Void

    var body: some View {
        OnboardingFlow(onComplete: onComplete)
            .preferredColorScheme(.dark)
    }
}

struct OnboardingFlow: View {
    @State private var step = 0
    @State private var phone = "+777"
    @State private var userId = ""
    @State private var password = ""
    @State private var name = ""
    @State private var bio = ""
    @State private var avatarData: Data?
    @State private var error: String?
    @State private var loading = false
    @State private var showDarkToggle = true
    @ObservedObject private var theme = ThemeManager.shared
    var onComplete: () -> Void

    var body: some View {
        VStack {
            header
            Spacer()
            stepContent
            Spacer()
        }
        .background(theme.backgroundColor)
    }

    private var header: some View {
        HStack {
            if step > 0 {
                Button(action: { withAnimation { step -= 1 } }) {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left").font(.body)
                        Text("Назад").font(.subheadline)
                    }
                    .foregroundColor(theme.accent)
                }
            }
            Spacer()
            Button(action: { theme.isDark.toggle() }) {
                Image(systemName: theme.isDark ? "moon.fill" : "sun.max.fill")
                    .foregroundColor(theme.isDark ? .yellow : .orange)
                    .font(.body)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 60)
    }

    @ViewBuilder
    private var stepContent: some View {
        switch step {
        case 0: welcomeStep
        case 1: phoneStep
        case 2: credentialsStep
        case 3: profileStep
        default: Color.clear
        }
    }

    private var welcomeStep: some View {
        VStack(spacing: 32) {
            Spacer()
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [theme.accent, .purple, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 120, height: 120)
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 52))
                    .foregroundColor(.white)
            }
            VStack(spacing: 8) {
                Text("MS Messenger")
                    .font(.largeTitle).bold()
                    .foregroundColor(theme.textPrimary)
                Text("Безопасный и быстрый мессенджер")
                    .font(.subheadline)
                    .foregroundColor(theme.textSecondary)
            }
            Spacer()
            Button(action: { withAnimation { step = 1 } }) {
                Text("Начать")
                    .font(.headline).bold()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(theme.accent)
                    .foregroundColor(.white)
                    .cornerRadius(14)
            }
            .padding(.horizontal, 40)
            .padding(.bottom, 60)
        }
    }

    private var phoneStep: some View {
        VStack(spacing: 24) {
            Text("Придумайте уникальный номер")
                .font(.title2).bold()
                .foregroundColor(theme.textPrimary)
            Text("Номер начинается на +777 и будет\nпривязан к вашему аккаунту навсегда")
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundColor(theme.textSecondary)
            TextField("+777XXXXXXXX", text: $phone)
                .font(.title2)
                .keyboardType(.phonePad)
                .multilineTextAlignment(.center)
                .padding()
                .background(theme.surfaceColor)
                .cornerRadius(12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                .padding(.horizontal, 40)
            if let error {
                Text(error).font(.caption).foregroundColor(theme.error)
            }
            Button(action: { validatePhone() }) {
                Text("Готово")
                    .font(.headline).bold()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(phoneValid ? theme.accent : theme.borderColor)
                    .foregroundColor(phoneValid ? .white : theme.textSecondary)
                    .cornerRadius(14)
            }
            .disabled(!phoneValid || loading)
            .padding(.horizontal, 40)
        }
    }

    private var credentialsStep: some View {
        VStack(spacing: 24) {
            Text("Создайте ID и пароль")
                .font(.title2).bold()
                .foregroundColor(theme.textPrimary)
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Уникальный ID").font(.caption).foregroundColor(theme.textSecondary).padding(.leading, 4)
                    TextField("your_id", text: $userId)
                        .textFieldStyle(.plain)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .padding()
                        .background(theme.surfaceColor)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Пароль").font(.caption).foregroundColor(theme.textSecondary).padding(.leading, 4)
                    SecureField("минимум 6 символов", text: $password)
                        .textFieldStyle(.plain)
                        .padding()
                        .background(theme.surfaceColor)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
            }
            .padding(.horizontal, 40)
            if let error {
                Text(error).font(.caption).foregroundColor(theme.error)
            }
            Button(action: { withAnimation { step = 3 } }) {
                Text("Готово")
                    .font(.headline).bold()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background((!userId.isEmpty && password.count >= 6) ? theme.accent : theme.borderColor)
                    .foregroundColor((!userId.isEmpty && password.count >= 6) ? .white : theme.textSecondary)
                    .cornerRadius(14)
            }
            .disabled(userId.isEmpty || password.count < 6)
            .padding(.horizontal, 40)
        }
    }

    private var profileStep: some View {
        VStack(spacing: 24) {
            Text("Заполните профиль")
                .font(.title2).bold()
                .foregroundColor(theme.textPrimary)
            avatarPicker
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Имя").font(.caption).foregroundColor(theme.textSecondary).padding(.leading, 4)
                    TextField("Как вас зовут?", text: $name)
                        .textFieldStyle(.plain)
                        .padding()
                        .background(theme.surfaceColor)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("О себе").font(.caption).foregroundColor(theme.textSecondary).padding(.leading, 4)
                    TextField("Расскажите о себе (необязательно)", text: $bio)
                        .textFieldStyle(.plain)
                        .padding()
                        .background(theme.surfaceColor)
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
            }
            .padding(.horizontal, 40)
            if let error {
                Text(error).font(.caption).foregroundColor(theme.error)
            }
            Button(action: register) {
                if loading {
                    ProgressView().tint(.white)
                } else {
                    Text("Зарегистрироваться")
                        .font(.headline).bold()
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(name.isEmpty ? theme.borderColor : theme.accent)
            .foregroundColor(name.isEmpty ? theme.textSecondary : .white)
            .cornerRadius(14)
            .disabled(name.isEmpty || loading)
            .padding(.horizontal, 40)
        }
    }

    private var avatarPicker: some View {
        PhotosPicker(selection: .constant(nil), matching: .images) {
            ZStack {
                if let data = avatarData, let ui = UIImage(data: data) {
                    Image(uiImage: ui)
                        .resizable().scaledToFill()
                        .frame(width: 88, height: 88)
                        .clipShape(Circle())
                } else {
                    Circle()
                        .fill(theme.accent.opacity(0.2))
                        .frame(width: 88, height: 88)
                    Image(systemName: "camera.fill")
                        .font(.title2)
                        .foregroundColor(theme.accent)
                }
            }
        }
    }

    private var phoneValid: Bool {
        phone.count >= 11 && phone.hasPrefix("+777")
    }

    private func validatePhone() {
        guard phoneValid else { error = "Номер должен начинаться на +777 (минимум 11 цифр)"; return }
        error = nil
        withAnimation { step = 2 }
    }

    private func register() {
        loading = true; error = nil
        Task {
            do {
                let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
                let resp = try await APIClient.shared.register(
                    userId: userId,
                    name: name,
                    password: password,
                    deviceId: deviceId,
                    phone: phone,
                    bio: bio.isEmpty ? nil : bio,
                    avatarData: avatarData
                )
                APIClient.shared.token = resp.token
                onComplete()
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }
}
