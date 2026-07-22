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
        session = URLSession(configuration: config)
    }

    var token: String? {
        get { UserDefaults.standard.string(forKey: "auth_token") }
        set { UserDefaults.standard.set(newValue, forKey: "auth_token") }
    }

    private func request<T: Decodable>(_ path: String, method: String = "GET", body: Data? = nil, query: [String: String]? = nil) async throws -> T {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if let query { components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) } }
        var urlRequest = URLRequest(url: components.url!)
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        urlRequest.httpBody = body

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch { throw APIError.networkError(error) }

        guard let http = response as? HTTPURLResponse else { throw APIError.serverError("Invalid response") }
        if http.statusCode == 401 { throw APIError.unauthorized }
        if http.statusCode >= 400 {
            if let err = try? decoder.decode(ErrorResponse.self, from: data) { throw APIError.serverError(err.error) }
            throw APIError.serverError("Ошибка \(http.statusCode)")
        }

        do { return try decoder.decode(T.self, from: data) }
        catch { throw APIError.decodingFailed }
    }

    func register(userId: String, name: String, password: String, deviceId: String) async throws -> AuthResponse {
        try await request("/auth/register", method: "POST", body: try JSONEncoder().encode(["userId": userId, "name": name, "password": password, "deviceId": deviceId]))
    }

    func login(userId: String, password: String, deviceId: String) async throws -> AuthResponse {
        try await request("/auth/login", method: "POST", body: try JSONEncoder().encode(["userId": userId, "password": password, "deviceId": deviceId]))
    }

    func me() async throws -> UserResponse { try await request("/auth/me") }

    func verifyDevice(code: String, deviceId: String) async throws -> AuthResponse {
        try await request("/auth/verify-device", method: "POST", body: try JSONEncoder().encode(["code": code, "deviceId": deviceId]))
    }

    func googleAuth(token idToken: String, deviceId: String) async throws -> AuthResponse {
        try await request("/auth/google", method: "POST", body: try JSONEncoder().encode(["idToken": idToken, "deviceId": deviceId]))
    }

    func getChats() async throws -> ChatListResponse { try await request("/chats") }

    func getMessages(chatId: String) async throws -> MessagesResponse { try await request("/chats/\(chatId)/messages") }

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

    func readChat(chatId: String) async throws -> EmptyResponse { try await request("/chats/\(chatId)/read", method: "POST") }

    func getContacts() async throws -> UsersResponse { try await request("/contacts") }

    func addContact(userId: String) async throws -> AddContactResponse {
        try await request("/contacts", method: "POST", body: try JSONEncoder().encode(["userId": userId]))
    }

    func searchUsers(query: String) async throws -> UsersResponse {
        try await request("/users/search", query: ["q": query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query])
    }

    func updateProfile(_ body: [String: String]) async throws -> UserResponse {
        try await request("/user/profile", method: "PATCH", body: try JSONEncoder().encode(body))
    }

    func adminCommand(_ command: String) async throws -> AdminCommandResponse {
        try await request("/admin/command", method: "POST", body: try JSONEncoder().encode(["command": command]))
    }
}
