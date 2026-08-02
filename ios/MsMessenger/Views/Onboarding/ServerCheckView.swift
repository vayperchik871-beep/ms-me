import SwiftUI

struct ServerCheckView: View {
    @State private var status = "Подключение к серверу..."
    @State private var attempts = 0
    @State private var timer: Timer?
    var onReady: () -> Void

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 24) {
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 56))
                    .foregroundColor(ThemeManager.shared.accent)

                Text("MS Messenger")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)

                VStack(spacing: 12) {
                    ProgressView()
                        .tint(ThemeManager.shared.accent)
                        .scaleEffect(1.2)

                    Text(status)
                        .font(.system(size: 15))
                        .foregroundColor(.white.opacity(0.7))

                    if attempts > 3 {
                        Text("Если ничего не меняется — проверьте интернет.\nПочти готово...")
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
        attempts = 0
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            attempts += 1
        }
        Task { await pingServer() }
    }

    // Всегда проходим дальше максимум через ~10 секунд.
    // Если сервер холодный (20-30с) — экраны приложения сами покажут
    // «Сервер запускается» при реальном запросе, а не зависнут здесь.
    private func pingServer() async {
        let url = URL(string: "https://ms-messenger-server.onrender.com/health")!
        var request = URLRequest(url: url)
        request.timeoutInterval = 8

        for _ in 0..<2 {
            if attempts >= 5 { break }
            do {
                let (_, response) = try await URLSession.shared.data(for: request)
                if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                    timer?.invalidate()
                    status = "Готово!"
                    try? await Task.sleep(nanoseconds: 200_000_000)
                    onReady()
                    return
                }
            } catch {
                // network error — пробуем ещё раз
            }
            try? await Task.sleep(nanoseconds: 1_000_000_000)
        }

        // Даже если сервер не ответил — пускаем в приложение.
        // Приложение покажет списки сообщений и само попробует снова.
        timer?.invalidate()
        onReady()
    }
}