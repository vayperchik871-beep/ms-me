import SwiftUI

struct OnboardingView: View {
    @State private var isLogin = true
    @State private var userId = ""
    @State private var name = ""
    @State private var password = ""
    @State private var verificationCode = ""
    @State private var needsVerification = false
    @State private var error: String?
    @State private var loading = false
    @FocusState private var focusedField: String?
    var onComplete: () -> Void

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 24) {
                    Spacer().frame(height: 60)
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                        .font(.system(size: 56))
                        .foregroundColor(.purple)
                    Text("MS Messenger")
                        .font(.largeTitle).bold()
                    VStack(spacing: 16) {
                        if needsVerification {
                            VStack(spacing: 12) {
                                Text("Код подтверждения отправлен в чат MS-Мессенджер").font(.caption).multilineTextAlignment(.center).foregroundColor(.secondary)
                                TextField("Код из чата", text: $verificationCode)
                                    .textFieldStyle(.roundedBorder)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .focused($focusedField, equals: "code")
                                    .id("code")
                                if let error { Text(error).foregroundColor(.red).font(.caption) }
                                Button(action: verifyCode) {
                                    Text("Подтвердить")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent).tint(.purple)
                                .disabled(loading || verificationCode.isEmpty)
                                Button("Назад") { needsVerification = false; error = nil; verificationCode = "" }
                                    .font(.caption)
                            }
                        } else {
                            Picker("", selection: $isLogin) {
                                Text("Вход").tag(true)
                                Text("Регистрация").tag(false)
                            }.pickerStyle(.segmented)
                            VStack(spacing: 12) {
                                TextField("ID", text: $userId)
                                    .textFieldStyle(.roundedBorder)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .focused($focusedField, equals: "id")
                                    .id("id")
                                if !isLogin {
                                    TextField("Имя", text: $name)
                                        .textFieldStyle(.roundedBorder)
                                        .focused($focusedField, equals: "name")
                                        .id("name")
                                }
                                SecureField("Пароль", text: $password)
                                    .textFieldStyle(.roundedBorder)
                                    .focused($focusedField, equals: "password")
                                    .id("password")
                            }
                            if let error { Text(error).foregroundColor(.red).font(.caption) }
                            Button(action: submit) {
                                Text(isLogin ? "Войти" : "Зарегистрироваться")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent).tint(.purple)
                            .disabled(loading || userId.isEmpty || password.isEmpty || (!isLogin && name.isEmpty))
                            Divider().frame(maxWidth: 200)
                            Button(action: googleSignIn) {
                                HStack { Image(systemName: "g.circle.fill"); Text("Google") }
                                    .frame(maxWidth: .infinity)
                            }.buttonStyle(.bordered)
                        }
                    }
                    .padding(.horizontal, 24)
                    Spacer(minLength: 40)
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .background(.ultraThinMaterial)
            .onChange(of: focusedField, initial: false) { _, field in
                if let field { DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { withAnimation { proxy.scrollTo(field, anchor: .center) } } }
            }
        }
    }

    private var deviceId: String {
        UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
    }

    private func submit() {
        focusedField = nil
        loading = true; error = nil
        Task {
            do {
                let api = APIClient.shared
                let resp = try await isLogin
                    ? api.login(userId: userId, password: password, deviceId: deviceId)
                    : api.register(userId: userId, name: name, password: password, deviceId: deviceId)
                if resp.needsVerification == true {
                    needsVerification = true; loading = false; return
                }
                api.token = resp.token
                onComplete()
            } catch { self.error = error.localizedDescription }
            loading = false
        }
    }

    private func verifyCode() {
        focusedField = nil
        loading = true; error = nil
        Task {
            do {
                let resp = try await APIClient.shared.verifyDevice(code: verificationCode, deviceId: deviceId)
                APIClient.shared.token = resp.token
                onComplete()
            } catch { self.error = error.localizedDescription }
            loading = false
        }
    }

    private func googleSignIn() {
        focusedField = nil
        loading = true; error = nil
        let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        Task {
            do {
                let idToken = try await GoogleSignInService.shared.signIn()
                let resp = try await APIClient.shared.googleAuth(token: idToken, deviceId: deviceId)
                APIClient.shared.token = resp.token
                onComplete()
            } catch { self.error = error.localizedDescription }
            loading = false
        }
    }
}
