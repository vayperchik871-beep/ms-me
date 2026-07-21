import Foundation
import Combine

@MainActor
final class WebSocketService: ObservableObject {
    static let shared = WebSocketService()

    @Published var isConnected = false
    @Published var newMessage: Message?

    private var webSocketTask: URLSessionWebSocketTask?
    private var pingTimer: Timer?

    private init() {}

    func connect(token: String) {
        guard let url = URL(string: "wss://ms-messenger-server.onrender.com/ws?token=\(token)") else { return }
        disconnect()

        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        receiveMessage()
        startPing()
        isConnected = true
    }

    func disconnect() {
        pingTimer?.invalidate()
        pingTimer = nil
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        isConnected = false
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    if let data = text.data(using: .utf8),
                       let wsMsg = try? JSONDecoder().decode(WSMessage.self, from: data) {
                        Task { @MainActor in
                            if wsMsg.type == "new_message", let msg = wsMsg.message {
                                self.newMessage = msg
                            }
                        }
                    }
                default: break
                }
                self.receiveMessage()
            case .failure:
                Task { @MainActor in
                    self.isConnected = false
                }
            }
        }
    }

    func sendTyping(chatId: String, isTyping: Bool) {
        let msg = ["type": "typing", "chatId": chatId, "isTyping": isTyping]
        guard let data = try? JSONSerialization.data(withJSONObject: msg) else { return }
        webSocketTask?.send(.string(String(data: data, encoding: .utf8)!)) { _ in }
    }

    private func startPing() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.webSocketTask?.sendPing { _ in }
        }
    }
}
