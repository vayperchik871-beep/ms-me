import Foundation

final class WebSocketManager: NSObject, ObservableObject {
    static let shared = WebSocketManager()

    @Published var isConnected = false
    private var task: URLSessionWebSocketTask?
    private var pingTimer: Timer?
    private var onMessage: ((WSMessage) -> Void)?
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func connect(token: String, onMessage handler: @escaping (WSMessage) -> Void) {
        disconnect()
        onMessage = handler

        let urlStr = "wss://ms-messenger-server.onrender.com/ws?token=\(token)"
        guard let url = URL(string: urlStr) else { return }

        let session = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue())
        task = session.webSocketTask(with: url)
        task?.resume()
        receive()
        startPing()
    }

    func disconnect() {
        pingTimer?.invalidate()
        pingTimer = nil
        task?.cancel(with: .normalClosure, reason: nil)
        task = nil
        DispatchQueue.main.async { self.isConnected = false }
    }

    func sendTyping(chatId: String, isTyping: Bool) {
        let msg = TypingMessage(type: "typing", chatId: chatId, isTyping: isTyping)
        send(msg)
    }

    private func send<T: Encodable>(_ data: T) {
        guard let d = try? encoder.encode(data),
              let str = String(data: d, encoding: .utf8) else { return }
        task?.send(.string(str)) { _ in }
    }

    private func receive() {
        task?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let msg):
                switch msg {
                case .string(let str):
                    if let data = str.data(using: .utf8),
                       let ws = try? self.decoder.decode(WSMessage.self, from: data) {
                        if ws.type == "connected" {
                            DispatchQueue.main.async { self.isConnected = true }
                        }
                        DispatchQueue.main.async { self.onMessage?(ws) }
                    }
                default: break
                }
                self.receive()
            case .failure:
                DispatchQueue.main.async { self.isConnected = false }
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
                    guard let s = self, let t = UserDefaults.standard.string(forKey: "ms_token") else { return }
                    s.connect(token: t, onMessage: s.onMessage ?? { _ in })
                }
            }
        }
    }

    private func startPing() {
        pingTimer?.invalidate()
        pingTimer = Timer.scheduledTimer(withTimeInterval: 25, repeats: true) { [weak self] _ in
            self?.task?.sendPing { _ in }
        }
    }
}

extension WebSocketManager: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        DispatchQueue.main.async { self.isConnected = true }
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        DispatchQueue.main.async { self.isConnected = false }
    }
}
