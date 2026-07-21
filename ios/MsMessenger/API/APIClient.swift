import Foundation

enum APIError: LocalizedError {
    case unauthorized
    case serverError(String)
    case decodingFailed
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .unauthorized: return "Не авторизован"
        case .serverError(let msg): return msg
        case .decodingFailed: return "Ошибка обработки данных"
        case .networkError(let err): return err.localizedDescription
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    private let baseURL = URL(string: "https://ms-messenger-server.onrender.com/api")!
    private let session: URLSession
    private let decoder = JSONDecoder()

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        session = URLSession(configuration: config)
    }

    var token: String? {
        get { UserDefaults.standard.string(forKey: "auth_token") }
        set { UserDefaults.standard.set(newValue, forKey: "auth_token") }
    }

    // MARK: - Request

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Data? = nil,
        query: [String: String]? = nil
    ) async throws -> T {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if let query {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        var urlRequest = URLRequest(url: components.url!)
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        urlRequest.httpBody = body

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError("Invalid response")
        }

        if httpResponse.statusCode == 401 { throw APIError.unauthorized }

        if httpResponse.statusCode >= 400 {
            if let errorResp = try? decoder.decode(ErrorResponse.self, from: data) {
                throw APIError.serverError(errorResp.error)
            }
            throw APIError.serverError("Ошибка \(httpResponse.statusCode)")
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingFailed
        }
    }

    private func multipartUpload<T: Decodable>(_ path: String, field: String, data: Data, fileName: String, mimeType: String) async throws -> T {
        let boundary = UUID().uuidString
        var urlRequest = URLRequest(url: baseURL.appendingPathComponent(path))
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token { urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(field)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        urlRequest.httpBody = body

        let (data, response) = try await session.data(for: urlRequest)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 400 else {
            throw APIError.serverError("Upload failed")
        }
        return try decoder.decode(T.self, from: data)
    }

    // MARK: - Auth

    func register(userId: String, name: String, password: String, deviceId: String) async throws -> AuthResponse {
        let body = ["userId": userId, "name": name, "password": password, "deviceId": deviceId]
        return try await request("/auth/register", method: "POST", body: try JSONEncoder().encode(body))
    }

    func login(userId: String, password: String, deviceId: String) async throws -> AuthResponse {
        let body = ["userId": userId, "password": password, "deviceId": deviceId]
        return try await request("/auth/login", method: "POST", body: try JSONEncoder().encode(body))
    }

    func me() async throws -> UserResponse {
        try await request("/auth/me")
    }

    func verifyDevice(code: String, deviceId: String) async throws -> AuthResponse {
        let body = ["code": code, "deviceId": deviceId]
        return try await request("/auth/verify-device", method: "POST", body: try JSONEncoder().encode(body))
    }

    func googleAuth(token idToken: String, deviceId: String) async throws -> AuthResponse {
        let body = ["idToken": idToken, "deviceId": deviceId]
        return try await request("/auth/google", method: "POST", body: try JSONEncoder().encode(body))
    }

    // MARK: - Chats

    func getChats() async throws -> ChatListResponse {
        try await request("/chats")
    }

    func getMessages(chatId: String) async throws -> MessagesResponse {
        try await request("/chats/\(chatId)/messages")
    }

    func sendMessage(chatId: String, text: String, replyTo: String? = nil) async throws -> SendMessageResponse {
        var body: [String: Any] = ["text": text]
        if let replyTo { body["replyTo"] = replyTo }
        return try await request("/chats/\(chatId)/messages", method: "POST", body: try JSONSerialization.data(withJSONObject: body))
    }

    func editMessage(id: String, text: String) async throws -> EmptyResponse {
        try await request("/messages/\(id)", method: "PATCH", body: try JSONEncoder().encode(["text": text]))
    }

    func deleteMessage(id: String) async throws -> EmptyResponse {
        try await request("/messages/\(id)", method: "DELETE")
    }

    func reactMessage(id: String, emoji: String) async throws -> EmptyResponse {
        try await request("/messages/\(id)/react", method: "POST", body: try JSONEncoder().encode(["emoji": emoji]))
    }

    func readChat(chatId: String) async throws -> EmptyResponse {
        try await request("/chats/\(chatId)/read", method: "POST")
    }

    // MARK: - Contacts

    func getContacts() async throws -> UsersResponse {
        try await request("/contacts")
    }

    func addContact(userId: String) async throws -> EmptyResponse {
        try await request("/contacts", method: "POST", body: try JSONEncoder().encode(["userId": userId]))
    }

    func searchUsers(query: String) async throws -> UsersResponse {
        try await request("/users/search", query: ["q": query])
    }

    // MARK: - Profile

    func updateProfile(_ body: [String: String]) async throws -> UserResponse {
        try await request("/user/profile", method: "PATCH", body: try JSONEncoder().encode(body))
    }

    func uploadAvatar(data: Data) async throws -> UploadResponse {
        try await multipartUpload("/upload/avatar", field: "avatar", data: data, fileName: "avatar.jpg", mimeType: "image/jpeg")
    }

    // MARK: - Admin

    func adminCommand(_ command: String) async throws -> AdminCommandResponse {
        try await request("/admin/command", method: "POST", body: try JSONEncoder().encode(["command": command]))
    }

    func adminStats() async throws -> AdminCommandResponse {
        try await adminCommand("stats")
    }

    func adminUsers() async throws -> AdminCommandResponse {
        try await adminCommand("users")
    }
}

struct EmptyResponse: Codable {}
struct UsersResponse: Codable { let users: [User] }
struct UploadResponse: Codable { let url: String }
