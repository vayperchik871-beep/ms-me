import SwiftUI

struct ServerCheckView: View {
    @State private var status = "Подключение к серверу..."
    @State private var attempts = 0
    @State private var timer: Timer?
    var onReady: () -> Void

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.black, Color(red: 0.06, green: 0.06, blue: 0.09)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: 40)

                Image("Logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 128, height: 128)
                    .cornerRadius(30)
                    .shadow(color: .black.opacity(0.5), radius: 20, x: 0, y: 10)
                    .padding(.bottom, 28)

                Text("MS Messenger")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)

                Text("Безопасный и быстрый мессенджер")
                    .font(.system(size: 16))
                    .foregroundColor(.white.opacity(0.6))
                    .padding(.top, 6)

                Spacer(minLength: 40)

                VStack(spacing: 14) {
                    ProgressView()
                        .tint(ThemeManager.shared.accent)
                        .scaleEffect(1.3)

                    Text(status)
                        .font(.system(size: 15))
                        .foregroundColor(.white.opacity(0.75))

                    if attempts > 3 {
                        Text("Если ничего не меняется — проверьте интернет.\nПочти готово...")
                            .font(.system(size: 13))
                            .foregroundColor(.white.opacity(0.45))
                            .multilineTextAlignment(.center)
                    }
                }

                Spacer(minLength: 30)

                Text("Версия 1.0.2")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.35))
                    .padding(.bottom, 24)
            }
            .frame(maxWidth: .infinity)
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
        let url = URL(string: "https://5uuk9t0100hk-production-z7gr0677.us-central1.suga.run/health")!
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
