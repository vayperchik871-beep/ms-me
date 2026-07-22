import SwiftUI
import PhotosUI

struct OnboardingView: View {
    var onComplete: () -> Void
    @State private var step = 0
    @State private var phone = "+777"
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
        VStack {
            header
            Spacer()
            if step == 0 { welcomeStep }
            else if step == 1 { phoneStep }
            else if step == 2 { credentialsStep }
            else if step == 3 { profileStep }
            Spacer()
        }
        .background(theme.backgroundColor.ignoresSafeArea())
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack {
            if step > 0 {
                Button(action: { step -= 1 }) {
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
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 60)
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
                Text("MS Messenger").font(.largeTitle).bold().foregroundColor(theme.textPrimary)
                Text("Безопасный и быстрый мессенджер").font(.subheadline).foregroundColor(theme.textSecondary)
            }
            Spacer()
            Button(action: { step = 1 }) {
                Text("Начать").font(.headline).bold().frame(maxWidth: .infinity).padding(.vertical, 16)
                    .background(theme.accent).foregroundColor(.white).cornerRadius(14)
            }
            .padding(.horizontal, 40).padding(.bottom, 60)
        }
    }

    private var phoneStep: some View {
        VStack(spacing: 24) {
            Text("Придумайте уникальный номер").font(.title2).bold().foregroundColor(theme.textPrimary)
            Text("Номер начинается на +777 и будет\nпривязан к вашему аккаунту навсегда")
                .font(.subheadline).multilineTextAlignment(.center).foregroundColor(theme.textSecondary)
            TextField("+777XXXXXXXX", text: $phone)
                .font(.title2).keyboardType(.phonePad).multilineTextAlignment(.center)
                .padding().background(theme.surfaceColor).cornerRadius(12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                .padding(.horizontal, 40)
            if let error { Text(error).font(.caption).foregroundColor(theme.error) }
            Button(action: { error = nil; step = 2 }) {
                Text("Готово").font(.headline).bold().frame(maxWidth: .infinity).padding(.vertical, 16)
                    .background(phoneValid ? theme.accent : theme.borderColor)
                    .foregroundColor(phoneValid ? .white : theme.textSecondary).cornerRadius(14)
            }
            .disabled(!phoneValid).padding(.horizontal, 40)
        }
    }

    private var credentialsStep: some View {
        VStack(spacing: 24) {
            Text("Создайте ID и пароль").font(.title2).bold().foregroundColor(theme.textPrimary)
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Уникальный ID").font(.caption).foregroundColor(theme.textSecondary).padding(.leading, 4)
                    TextField("your_id", text: $userId)
                        .autocapitalization(.none).disableAutocorrection(true)
                        .padding().background(theme.surfaceColor).cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Пароль").font(.caption).foregroundColor(theme.textSecondary).padding(.leading, 4)
                    SecureField("минимум 6 символов", text: $password)
                        .padding().background(theme.surfaceColor).cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
            }
            .padding(.horizontal, 40)
            if let error { Text(error).font(.caption).foregroundColor(theme.error) }
            Button(action: { step = 3 }) {
                Text("Готово").font(.headline).bold().frame(maxWidth: .infinity).padding(.vertical, 16)
                    .background((!userId.isEmpty && password.count >= 6) ? theme.accent : theme.borderColor)
                    .foregroundColor((!userId.isEmpty && password.count >= 6) ? .white : theme.textSecondary).cornerRadius(14)
            }
            .disabled(userId.isEmpty || password.count < 6).padding(.horizontal, 40)
        }
    }

    private var profileStep: some View {
        VStack(spacing: 24) {
            Text("Заполните профиль").font(.title2).bold().foregroundColor(theme.textPrimary)
            PhotosPicker(selection: $avatarItem, matching: .image) {
                ZStack {
                    if let data = avatarData, let ui = UIImage(data: data) {
                        Image(uiImage: ui).resizable().scaledToFill().frame(width: 88, height: 88).clipShape(Circle())
                    } else {
                        Circle().fill(theme.accent.opacity(0.2)).frame(width: 88, height: 88)
                        Image(systemName: "camera.fill").font(.title2).foregroundColor(theme.accent)
                    }
                }
            }
            .onChange(of: avatarItem) { _, _ in
                Task { if let data = try? await avatarItem?.loadTransferable(type: Data.self) { avatarData = data } }
            }
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Имя").font(.caption).foregroundColor(theme.textSecondary).padding(.leading, 4)
                    TextField("Как вас зовут?", text: $name)
                        .padding().background(theme.surfaceColor).cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("О себе").font(.caption).foregroundColor(theme.textSecondary).padding(.leading, 4)
                    TextField("Расскажите о себе (необязательно)", text: $bio)
                        .padding().background(theme.surfaceColor).cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                }
            }
            .padding(.horizontal, 40)
            if let error { Text(error).font(.caption).foregroundColor(theme.error) }
            Button(action: register) {
                if loading { ProgressView().tint(.white) }
                else { Text("Зарегистрироваться").font(.headline).bold() }
            }
            .frame(maxWidth: .infinity).padding(.vertical, 16)
            .background(name.isEmpty ? theme.borderColor : theme.accent)
            .foregroundColor(name.isEmpty ? theme.textSecondary : .white).cornerRadius(14)
            .disabled(name.isEmpty || loading).padding(.horizontal, 40)
        }
    }

    private var phoneValid: Bool { phone.count >= 11 && phone.hasPrefix("+777") }

    private func register() {
        loading = true; error = nil
        Task {
            do {
                let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
                let resp = try await APIClient.shared.register(
                    userId: userId, name: name, password: password, deviceId: deviceId,
                    phone: phone, bio: bio.isEmpty ? nil : bio, avatarData: avatarData
                )
                APIClient.shared.token = resp.token; onComplete()
            } catch { self.error = error.localizedDescription }
            loading = false
        }
    }
}
