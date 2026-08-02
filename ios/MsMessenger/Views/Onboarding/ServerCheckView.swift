import SwiftUI

struct ServerCheckView: View {
    @State private var status = "Подключение к серверу..."
    @State private var elapsed = 0
    @State private var timer: Timer?
    var onReady: () -> Void

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 24) {
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 56))
                    .foregroundColor(Color(hex: "#6C63FF"))

                Text("MS Messenger")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)

                VStack(spacing: 12) {
                    ProgressView()
                        .tint(Color(hex: "#6C63FF"))
                        .scaleEffect(1.2)

                    Text(status)
                        .font(.system(size: 15))
                        .foregroundColor(.white.opacity(0.7))

                    if elapsed > 5 {
                        Text("Сервер запускается, это может занять до 30 секунд...")
                            .font(.system(size: 13))
                            .foregroundColor(.white.opacity(0.5))
                            .multilineTextAlignment(.center)
                    }
                }
            }
        }
        .onAppear { startCheck() }
        .onDisappear { timer?.invalidate() }
    }

    private func startCheck() {
        elapsed = 0
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            elapsed += 1
        }
        Task { await pingServer() }
    }

    private func pingServer() async {
        let url = URL(string: "https://ms-messenger-server.onrender.com/health")!
        var request = URLRequest(url: url)
        request.timeoutInterval = 60

        while true {
            do {
                let (_, response) = try await URLSession.shared.data(for: request)
                if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                    timer?.invalidate()
                    status = "Готово!"
                    try? await Task.sleep(nanoseconds: 300_000_000)
                    onReady()
                    return
                }
            } catch {
                status = "Сервер не отвечает, повтор..."
            }
            try? await Task.sleep(nanoseconds: 2_000_000_000)
        }
    }
}
