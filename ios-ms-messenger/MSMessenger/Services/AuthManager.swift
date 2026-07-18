import Foundation

@MainActor
final class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var user: User?
    @Published var isLoggedIn = false
    @Published var isLoading = true
    @Published var adminMode = false

    private let api = APIClient.shared
    private let ws = WebSocketManager.shared

    private init() {
        adminMode = UserDefaults.standard.bool(forKey: "admin_mode")
    }

    func checkSession() async {
        if let t = UserDefaults.standard.string(forKey: "ms_token") {
            await api.setToken(t)
            do {
                let resp = try await api.me()
                user = resp.user
                isLoggedIn = true
                connectWebSocket()
            } catch {
                logout()
            }
        }
        isLoading = false
    }

    func login(userId: String, password: String) async throws -> AuthResponse {
        let deviceId = api.generateDeviceId()
        let resp = try await api.login(userId: userId, password: password, deviceId: deviceId, adminMode: adminMode)
        if let t = resp.token {
            UserDefaults.standard.set(t, forKey: "ms_token")
            await api.setToken(t)
            user = resp.user
            isLoggedIn = true
            connectWebSocket()
        }
        return resp
    }

    func register(name: String, userId: String, password: String) async throws -> AuthResponse {
        let deviceId = api.generateDeviceId()
        let resp = try await api.register(name: name, userId: userId, password: password, deviceId: deviceId, adminMode: adminMode)
        if let t = resp.token {
            UserDefaults.standard.set(t, forKey: "ms_token")
            await api.setToken(t)
            user = resp.user
            isLoggedIn = true
            connectWebSocket()
        }
        return resp
    }

    func verifyDevice(userId: String, code: String) async throws -> Bool {
        let deviceId = api.generateDeviceId()
        let resp = try await api.verifyDevice(userId: userId, code: code, deviceId: deviceId)
        if let t = resp.token {
            UserDefaults.standard.set(t, forKey: "ms_token")
            await api.setToken(t)
            user = resp.user
            isLoggedIn = true
            connectWebSocket()
            return true
        }
        return false
    }

    func refreshUser() async {
        guard UserDefaults.standard.string(forKey: "ms_token") != nil else { return }
        do {
            let resp = try await api.me()
            user = resp.user
        } catch {
            if case APIError.unauthorized = error { logout() }
        }
    }

    func logout() {
        UserDefaults.standard.removeObject(forKey: "ms_token")
        UserDefaults.standard.removeObject(forKey: "ms_device_id")
        ws.disconnect()
        user = nil
        isLoggedIn = false
    }

    private func connectWebSocket() {
        guard let t = UserDefaults.standard.string(forKey: "ms_token") else { return }
        ws.connect(token: t) { [weak self] msg in
            NotificationCenter.default.post(name: .wsMessage, object: msg)
        }
    }

    func googleLogin(idToken: String) async throws {
        let deviceId = api.generateDeviceId()
        let resp = try await api.googleAuth(idToken: idToken, deviceId: deviceId)
        if let t = resp.token {
            UserDefaults.standard.set(t, forKey: "ms_token")
            await api.setToken(t)
            user = resp.user
            isLoggedIn = true
            connectWebSocket()
        }
    }
}

extension Notification.Name {
    static let wsMessage = Notification.Name("wsMessage")
}
