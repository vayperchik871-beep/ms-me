import Foundation

class WebSocketService: ObservableObject {
    static let shared = WebSocketService()
    @Published var newMessage: Message?
    @Published var isConnected = false
    private var webSocketTask: URLSessionWebSocketTask?
    private var currentToken = ""
    private var reconnectAttempts = 0
    private var reconnectTimer: Timer?
    private let maxReconnectDelay = 30.0

    func connect(token: String) {
        guard let url = URL(string: "wss://5uuk9t0100hk-production-z7gr0677.us-central1.suga.run/ws?token=\(token)") else { return }
        currentToken = token
        reconnectAttempts = 0
        open(url: url)
    }

    private func open(url: URL) {
        disconnect()
        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()
        isConnected = true
        reconnectTimer?.invalidate()
        receive()
    }

    func disconnect() {
        reconnectTimer?.invalidate()
        reconnectTimer = nil
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        isConnected = false
    }

    private func scheduleReconnect() {
        guard !currentToken.isEmpty else { return }
        guard webSocketTask == nil else { return }
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.isConnected = false
            self.reconnectTimer?.invalidate()
            let delay = min(1.0 * pow(2, Double(self.reconnectAttempts)), self.maxReconnectDelay)
            self.reconnectAttempts += 1
            self.reconnectTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
                guard let self, !self.currentToken.isEmpty else { return }
                self.open(url: URL(string: "wss://5uuk9t0100hk-production-z7gr0677.us-central1.suga.run/ws?token=\(self.currentToken)")!)
            }
        }
    }

    private func receive() {
        webSocketTask?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let msg):
                if case .string(let text) = msg,
                   let data = text.data(using: .utf8),
                   let ws = try? JSONDecoder().decode(WSMessage.self, from: data),
                   ws.type == "new_message", let message = ws.message {
                    DispatchQueue.main.async { self.newMessage = message }
                    self.reconnectAttempts = 0
                }
                self.receive()
            case .failure:
                self.webSocketTask = nil
                self.scheduleReconnect()
            }
        }
    }

    func sendTyping(chatId: String, isTyping: Bool) {
        let body = ["type": "typing", "chatId": chatId, "isTyping": isTyping] as [String: Any]
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        webSocketTask?.send(.string(String(data: data, encoding: .utf8)!)) { _ in }
    }
}