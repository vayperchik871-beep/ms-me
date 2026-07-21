import Foundation

class WebSocketService: ObservableObject {
    static let shared = WebSocketService()
    @Published var newMessage: Message?
    @Published var isConnected = false
    private var webSocketTask: URLSessionWebSocketTask?

    func connect(token: String) {
        guard let url = URL(string: "wss://ms-messenger-server.onrender.com/ws?token=\(token)") else { return }
        disconnect()
        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()
        isConnected = true
        receive()
    }

    func disconnect() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        isConnected = false
    }

    private func receive() {
        webSocketTask?.receive { [weak self] result in
            guard let self else { return }
            if case .success(let msg) = result, case .string(let text) = msg,
               let data = text.data(using: .utf8),
               let ws = try? JSONDecoder().decode(WSMessage.self, from: data),
               ws.type == "new_message", let message = ws.message {
                DispatchQueue.main.async { self.newMessage = message }
            }
            self.receive()
        }
    }

    func sendTyping(chatId: String, isTyping: Bool) {
        let body = ["type": "typing", "chatId": chatId, "isTyping": isTyping] as [String: Any]
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        webSocketTask?.send(.string(String(data: data, encoding: .utf8)!)) { _ in }
    }
}
