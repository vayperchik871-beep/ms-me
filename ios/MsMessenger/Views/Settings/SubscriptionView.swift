import SwiftUI

struct SubscriptionView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var status: APIClient.SubscriptionStatus?
    @State private var code = ""
    @State private var loading = false
    @State private var errorText: String?
    @State private var successText: String?

    private let features: [(icon: String, title: String, value: String)] = [
        ("person.2.fill", "Больше контактов", "До 500 вместо 100"),
        ("person.3.fill", "Больше групп", "До 50 вместо 10"),
        ("doc.fill", "Больше файлы", "До 50 МБ вместо 15"),
        ("text.bubble.fill", "Длинная био", "До 300 символов"),
        ("sparkles", "AI Pro", "Более точные ответы ассистента"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                statusCard
                activateCard
                perksCard
            }
            .padding(16)
        }
        .background(theme.bgColor.ignoresSafeArea())
        .navigationTitle("Подписка")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Подписка")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(theme.textPrimary)
            }
        }
        .toolbarBackground(Color.clear, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task { await load() }
    }

    // MARK: - Status

    private var statusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: status?.active == true ? "crown.fill" : "crown")
                    .font(.system(size: 26))
                    .foregroundColor(.yellow)
                VStack(alignment: .leading, spacing: 3) {
                    Text(status == nil ? "Загрузка..." : (status?.active == true ? "Premium активен" : "Нет подписки"))
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                    if let s = status, s.active == true {
                        Text("План: \(s.planName ?? s.plan ?? "—") · до \(formatDate(s.until))")
                            .font(.system(size: 13))
                            .foregroundColor(theme.textSecondary)
                        if let d = s.daysLeft {
                            Text("Осталось дней: \(d)")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(theme.accent)
                        }
                    } else if let s = status {
                        Text("Активируйте код или купите подписку, чтобы получить бонусы")
                            .font(.system(size: 13))
                            .foregroundColor(theme.textSecondary)
                    }
                }
                Spacer()
            }
            .padding(14)
            .background(Color.white.opacity(0.06))
            .cornerRadius(14)
        }
    }

    // MARK: - Activate

    private var activateCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Активировать код")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(theme.textPrimary)
            HStack(spacing: 10) {
                TextField("Код подписки", text: $code)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .font(.system(size: 16))
                    .foregroundColor(theme.inputText)
                    .padding(12)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(10)
                Button(action: activate) {
                    if loading {
                        ProgressView().tint(theme.accentText)
                    } else {
                        Text("ОК")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(theme.accentText)
                    }
                }
                .frame(width: 56)
                .padding(.vertical, 12)
                .background(theme.accent)
                .cornerRadius(10)
                .disabled(loading || code.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            if let errorText {
                Text(errorText).font(.system(size: 13)).foregroundColor(.red)
            }
            if let successText {
                Text(successText).font(.system(size: 13)).foregroundColor(.green)
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.06))
        .cornerRadius(14)
    }

    // MARK: - Perks

    private var perksCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Что даёт подписка")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(theme.textPrimary)
                .padding(.bottom, 4)
            ForEach(features, id: \.title) { p in
                HStack(spacing: 12) {
                    Image(systemName: p.icon)
                        .font(.system(size: 16))
                        .foregroundColor(theme.accent)
                        .frame(width: 26)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(p.title).font(.system(size: 15)).foregroundColor(theme.textPrimary)
                        Text(p.value).font(.system(size: 12)).foregroundColor(theme.textSecondary)
                    }
                    Spacer()
                }
                .padding(.vertical, 8)
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.06))
        .cornerRadius(14)
    }

    // MARK: - Helpers

    private func formatDate(_ ms: Int?) -> String {
        guard let ms else { return "—" }
        let d = Date(timeIntervalSince1970: TimeInterval(ms) / 1000)
        return DateFormatter.localizedString(from: d, dateStyle: .medium, timeStyle: .none)
    }

    private func load() async {
        do {
            let s = try await APIClient.shared.subscriptionStatus()
            await MainActor.run { status = s }
        } catch { print(error) }
    }

    private func activate() {
        let trimmed = code.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        loading = true
        errorText = nil
        successText = nil
        Task {
            do {
                let s = try await APIClient.shared.activateSubscription(code: trimmed)
                await MainActor.run {
                    loading = false
                    code = ""
                    status = s
                    successText = s.active == true ? "Подписка активирована!" : "Код принят"
                }
            } catch {
                await MainActor.run {
                    loading = false
                    errorText = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
            }
        }
    }
}