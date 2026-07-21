import SwiftUI

struct OnboardingView: View {
    @State private var isLogin = true
    @State private var userId = ""
    @State private var name = ""
    @State private var password = ""
    @State private var error: String?
    @State private var loading = false
    var onComplete: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer(minLength: 40)
                Image(systemName: "bubble.left.and.bubble.right.fill").font(.system(size: 56)).foregroundColor(.purple)
                Text("MS Messenger").font(.largeTitle).bold()
                VStack(spacing: 16) {
                    Picker("", selection: $isLogin) { Text("Вход").tag(true); Text("Регистрация").tag(false) }.pickerStyle(.segmented)
                    VStack(spacing: 12) {
                        TextField("ID", text: $userId).textFieldStyle(.roundedBorder).autocapitalization(.none).disableAutocorrection(true)
                        if !isLogin { TextField("Имя", text: $name).textFieldStyle(.roundedBorder) }
                        SecureField("Пароль", text: $password).textFieldStyle(.roundedBorder)
                    }
                    if let error { Text(error).foregroundColor(.red).font(.caption) }
                    Button(action: submit) { Text(isLogin ? "Войти" : "Зарегистрироваться").frame(maxWidth: .infinity) }
                        .buttonStyle(.borderedProminent).tint(.purple)
                        .disabled(loading || userId.isEmpty || password.isEmpty || (!isLogin && name.isEmpty))
                    Divider().frame(maxWidth: 200)
                    Button(action: googleSignIn) { HStack { Image(systemName: "g.circle.fill"); Text("Google") }.frame(maxWidth: .infinity) }.buttonStyle(.bordered)
                }.padding(.horizontal, 16)
                Spacer()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.green)
    }

    private func submit() {
        loading = true; error = nil
        let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        Task {
            do {
                let api = APIClient.shared
                let resp = try await isLogin
                    ? api.login(userId: userId, password: password, deviceId: deviceId)
                    : api.register(userId: userId, name: name, password: password, deviceId: deviceId)
                api.token = resp.token
                onComplete()
            } catch { self.error = error.localizedDescription }
            loading = false
        }
    }

    private func googleSignIn() {
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
