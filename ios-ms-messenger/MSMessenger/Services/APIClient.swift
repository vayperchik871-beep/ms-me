import Foundation

actor APIClient {
    static let shared = APIClient()

    private let baseURL = "https://ms-messenger-server.onrender.com"
    private let session: URLSession
    private var token: String?

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        session = URLSession(configuration: config)
    }

    func setToken(_ t: String?) { token = t }

    private func request<T: Decodable>(
        _ method: String,
        _ path: String,
        body: Encodable? = nil,
        query: String? = nil
    ) async throws -> T {
        var urlStr = "\(baseURL)/api\(path)"
        if let q = query { urlStr += "?\(q)" }
        guard let url = URL(string: urlStr) else { throw APIError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let t = token { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }

        if let b = body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(b))
        }

        let (data, resp) = try await session.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw APIError.networkError }

        if http.statusCode == 401 { throw APIError.unauthorized }
        if http.statusCode == 403 { throw APIError.forbidden }
        if http.statusCode == 404 { throw APIError.notFound }
        if http.statusCode >= 400 {
            let msg = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError(msg)
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    private func upload<T: Decodable>(
        _ path: String,
        field: String,
        data: Data,
        fileName: String,
        mimeType: String,
        extra: [String: String]? = nil
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)/api\(path)") else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        if let t = token { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }

        let boundary = UUID().uuidString
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var bodyData = Data()
        if let extra = extra {
            for (k, v) in extra {
                bodyData.append("--\(boundary)\r\n".data(using: .utf8)!)
                bodyData.append("Content-Disposition: form-data; name=\"\(k)\"\r\n\r\n".data(using: .utf8)!)
                bodyData.append("\(v)\r\n".data(using: .utf8)!)
            }
        }
        bodyData.append("--\(boundary)\r\n".data(using: .utf8)!)
        bodyData.append("Content-Disposition: form-data; name=\"\(field)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        bodyData.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        bodyData.append(data)
        bodyData.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = bodyData

        let (data, resp) = try await session.data(for: req)
        guard let http = resp as? HTTPURLResponse, http.statusCode == 200 else {
            throw APIError.uploadFailed
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Auth
    func register(name: String, userId: String, password: String, deviceId: String, adminMode: Bool = false) async throws -> AuthResponse {
        var headers: [String: String] = [:]
        if adminMode { headers["X-Admin-App"] = "true" }
        return try await requestWithHeaders("POST", "/auth/register", body: ["name": name, "userId": userId, "password": password, "deviceId": deviceId], headers: headers)
    }

    func login(userId: String, password: String, deviceId: String, adminMode: Bool = false) async throws -> AuthResponse {
        var headers: [String: String] = [:]
        if adminMode { headers["X-Admin-App"] = "true" }
        return try await requestWithHeaders("POST", "/auth/login", body: ["userId": userId, "password": password, "deviceId": deviceId], headers: headers)
    }

    func verifyDevice(userId: String, code: String, deviceId: String) async throws -> VerifyResponse {
        try await request("POST", "/auth/verify-device", body: ["userId": userId, "code": code, "deviceId": deviceId])
    }

    func me() async throws -> MeResponse {
        try await request("GET", "/auth/me")
    }

    // MARK: - Users
    func searchUsers(query: String) async throws -> SearchResult {
        try await request("GET", "/users/search", query: "q=\(query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query)")
    }

    func getUser(userId: String) async throws -> UserProfile {
        try await request("GET", "/users/\(userId)")
    }

    // MARK: - Contacts
    func getContacts() async throws -> ContactsResponse {
        try await request("GET", "/contacts")
    }

    func addContact(userId: String) async throws -> AddContactResponse {
        try await request("POST", "/contacts", body: ["userId": userId])
    }

    // MARK: - Chats
    func getChats() async throws -> ChatsResponse {
        try await request("GET", "/chats")
    }

    func getMessages(chatId: String) async throws -> MessagesResponse {
        try await request("GET", "/chats/\(chatId)/messages")
    }

    func sendMessage(chatId: String, text: String? = nil, replyTo: String? = nil, attachment: Attachment? = nil) async throws -> SendMessageResponse {
        try await request("POST", "/chats/\(chatId)/messages", body: SendMessageBody(text: text, replyTo: replyTo, attachment: attachment))
    }

    func editMessage(id: String, text: String) async throws -> SendMessageResponse {
        try await request("PATCH", "/messages/\(id)", body: EditMessageBody(text: text))
    }

    func deleteMessage(id: String) async throws -> ReadResponse {
        try await request("DELETE", "/messages/\(id)")
    }

    func pinMessage(id: String) async throws -> PinResponse {
        try await request("POST", "/messages/\(id)/pin")
    }

    func reactMessage(id: String, emoji: String) async throws -> ReactResponse {
        try await request("POST", "/messages/\(id)/react", body: ReactBody(emoji: emoji))
    }

    func favoriteMessage(id: String) async throws -> ReadResponse {
        try await request("POST", "/messages/\(id)/favorite")
    }

    func readChat(chatId: String) async throws -> ReadResponse {
        try await request("POST", "/chats/\(chatId)/read")
    }

    // MARK: - Upload
    func uploadAvatar(imageData: Data, fileName: String = "avatar.jpg") async throws -> AvatarResponse {
        try await upload("/upload/avatar", field: "avatar", data: imageData, fileName: fileName, mimeType: "image/jpeg")
    }

    func uploadAttachment(fileData: Data, fileName: String, mimeType: String, duration: Int? = nil) async throws -> Attachment {
        var extra: [String: String]? = nil
        if let d = duration { extra = ["duration": "\(d)"] }
        return try await upload("/upload/attachment", field: "file", data: fileData, fileName: fileName, mimeType: mimeType, extra: extra)
    }

    // MARK: - Profile
    func updateProfile(birthday: String? = nil, gender: String? = nil, profileColor: String? = nil) async throws -> UpdateProfileResponse {
        try await request("PATCH", "/user/profile", body: UpdateProfileBody(birthday: birthday, gender: gender, profileColor: profileColor))
    }

    // MARK: - Google Auth
    func googleAuth(idToken: String, deviceId: String) async throws -> AuthResponse {
        try await request("POST", "/auth/google", body: ["idToken": idToken, "deviceId": deviceId])
    }

    // MARK: - Admin
    func adminStats() async throws -> AdminStatsResponse {
        try await request("GET", "/admin/stats")
    }

    func adminUsers() async throws -> AdminUsersResponse {
        try await request("GET", "/admin/users")
    }

    func adminBan(userId: String, value: Bool) async throws -> AdminActionResponse {
        try await request("POST", "/admin/ban", body: ["userId": userId, "value": value])
    }

    func adminScam(userId: String, value: Bool) async throws -> AdminScamResponse {
        try await request("POST", "/admin/scam", body: ["userId": userId, "value": value])
    }

    func adminCommand(command: String) async throws -> AdminCommandResponse {
        try await request("POST", "/admin/command", body: ["command": command])
    }

    // MARK: - Helper with custom headers
    private func requestWithHeaders<T: Decodable>(_ method: String, _ path: String, body: Encodable?, headers: [String: String]) async throws -> T {
        var urlStr = "\(baseURL)/api\(path)"
        guard let url = URL(string: urlStr) else { throw APIError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let t = token { req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        for (k, v) in headers { req.setValue(v, forHTTPHeaderField: k) }

        if let b = body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(b))
        }

        let (data, resp) = try await session.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw APIError.networkError }
        if http.statusCode >= 400 {
            let msg = String(data: data, encoding: .utf8) ?? "Error"
            throw APIError.serverError(msg)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Utility
    func resolveMediaURL(_ url: String?) -> URL? {
        guard let u = url, !u.isEmpty else { return nil }
        if u.hasPrefix("http://") || u.hasPrefix("https://") {
            return URL(string: u.replacingOccurrences(of: "http://", with: "https://"))
        }
        return URL(string: "\(baseURL)\(u)")
    }

    func generateDeviceId() -> String {
        if let stored = UserDefaults.standard.string(forKey: "ms_device_id") {
            return stored
        }
        let id = UUID().uuidString
        UserDefaults.standard.set(id, forKey: "ms_device_id")
        return id
    }
}

// MARK: - Admin models
struct AdminStatsResponse: Codable {
    let totalUsers: Int?
    let onlineUsers: Int?
    let bannedUsers: Int?
    let totalChats: Int?
    let totalMessages: Int?
}

struct AdminUsersResponse: Codable {
    let users: [AdminUser]
}

struct AdminUser: Codable, Identifiable {
    let id: String
    let userId: String
    let name: String
    let isAdmin: Bool?
    let banned: Bool?
    let scam: Bool?
    let createdAt: Int?
}

struct AdminActionResponse: Codable {
    let ok: Bool?
    let userId: String?
    let banned: Bool?
}

struct AdminScamResponse: Codable {
    let ok: Bool?
    let userId: String?
    let scam: Bool?
    let name: String?
}

struct AdminCommandResponse: Codable {
    let output: String
}

// MARK: - Errors
enum APIError: Error, LocalizedError {
    case invalidURL, networkError, unauthorized, forbidden, notFound, serverError(String), uploadFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .networkError: return "Network error"
        case .unauthorized: return "Unauthorized"
        case .forbidden: return "Forbidden"
        case .notFound: return "Not found"
        case .serverError(let m): return m
        case .uploadFailed: return "Upload failed"
        }
    }
}

// MARK: - AnyEncodable helper
struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void
    init(_ wrapped: Encodable) { _encode = { try wrapped.encode(to: $0) } }
    func encode(to encoder: Encoder) throws { try _encode(encoder) }
}
