import SwiftUI
import CoreImage.CIFilterBuiltins

struct SubscriptionView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var status: APIClient.SubscriptionStatus?
    @State private var plans: APIClient.PaymentPlansResponse?
    @State private var code = ""
    @State private var loading = false
    @State private var errorText: String?
    @State private var successText: String?
    @State private var paying: String?
    @State private var currentOrder: APIClient.PurchaseOrder?
    @State private var confirming = false
    @State private var showPaymentSheet = false

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
                purchaseCard
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
        .sheet(isPresented: $showPaymentSheet) {
            if let order = currentOrder {
                paymentSheet(order)
            }
        }
    }

    // MARK: - Purchase / SBP

    private var purchaseCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: "creditcard.fill")
                    .font(.system(size: 24))
                    .foregroundColor(theme.accent)
                VStack(alignment: .leading, spacing: 3) {
                    Text("Оплатить подписку")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                    Text(plans?.demoMode == true ? "Демо-режим: активация без оплаты" : "Оплата по СБП-переводу")
                        .font(.system(size: 13))
                        .foregroundColor(theme.textSecondary)
                }
                Spacer()
            }
            .padding(.bottom, 4)

            ForEach(plans?.plans ?? [], id: \.key) { plan in
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(plan.name ?? "—")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(theme.textPrimary)
                        Text("\(plan.durationDays ?? 0) дней")
                            .font(.system(size: 13))
                            .foregroundColor(theme.textSecondary)
                    }
                    Spacer()
                    Text("\(plan.priceRub ?? 0) ₽")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(theme.accent)
                    Button(action: { start(plan.key ?? "") }) {
                        if paying == plan.key {
                            ProgressView().tint(theme.accentText)
                        } else {
                            Text("Оплатить")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(theme.accentText)
                        }
                    }
                    .frame(width: 92)
                    .padding(.vertical, 10)
                    .background(theme.accent)
                    .cornerRadius(10)
                    .disabled(paying != nil)
                }
                .padding(12)
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.06))
        .cornerRadius(14)
    }

    private func start(_ plan: String) {
        errorText = nil
        paying = plan
        Task {
            do {
                let order = try await APIClient.shared.purchaseSubscription(plan: plan)
                await MainActor.run {
                    paying = nil
                    currentOrder = order
                    if order.demo == true {
                        status = APIClient.SubscriptionStatus(
                            plan: order.plan,
                            planName: order.planName,
                            active: order.active,
                            until: order.until,
                            daysLeft: nil
                        )
                        successText = "Подписка активирована!"
                    } else {
                        showPaymentSheet = true
                    }
                }
            } catch {
                await MainActor.run {
                    paying = nil
                    errorText = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
            }
        }
    }

    private func paymentSheet(_ order: APIClient.PurchaseOrder) -> some View {
        VStack(spacing: 20) {
            VStack(spacing: 6) {
                Text("Переведите \(order.amountRub ?? 0) ₽ через СБП")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(theme.textPrimary)
                if let bank = order.bank {
                    Text("Банк: \(bank)")
                        .font(.system(size: 14))
                        .foregroundColor(theme.textSecondary)
                }
                if let phone = order.phone {
                    Text("Телефон: \(phone)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(theme.textSecondary)
                }
            }

            if let url = order.qrImageUrl, !url.isEmpty {
                AsyncImage(url: URL(string: url)) { image in
                    image.resizable().interpolation(.none)
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 200, height: 200)
                .cornerRadius(12)
            } else {
                sbpQRCode(order: order)
            }

            Text("Отсканируйте QR в приложении банка, переведите сумму и вернитесь сюда")
                .font(.system(size: 13))
                .multilineTextAlignment(.center)
                .foregroundColor(theme.textSecondary)
                .padding(.horizontal, 20)

            Button {
                confirm(order)
            } label: {
                if confirming {
                    ProgressView().tint(theme.accentText)
                } else {
                    Text("Я оплатил")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(theme.accentText)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(theme.accent)
            .cornerRadius(12)
            .disabled(confirming)

            Button("Отмена") {
                showPaymentSheet = false
            }
            .font(.system(size: 15))
            .foregroundColor(theme.textSecondary)
        }
        .padding(24)
        .background(theme.bgColor.ignoresSafeArea())
    }

    private func sbpQRCode(order: APIClient.PurchaseOrder) -> some View {
        let phone = order.phone ?? ""
        let payload = "СТ111118\(phone.hashValue % 100000);\(order.amountRub ?? 0).00"
        let data = Data(payload.utf8)
        let filter = CIFilter.qrCodeGenerator()
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")
        if let output = filter.outputImage {
            let transformed = output.transformed(by: CGAffineTransform(scaleX: 12, y: 12))
            return Image(uiImage: UIImage(ciImage: transformed))
                .interpolation(.none)
                .resizable()
                .scaledToFit()
                .frame(width: 200, height: 200)
                .padding(8)
                .background(Color.white)
                .cornerRadius(12)
                .id(identity)
        }
        return Image(systemName: "qrcode")
            .font(.system(size: 100))
            .foregroundColor(theme.textSecondary)
    }

    private var identity: Int { currentOrder?.purchaseId?.hashValue ?? 0 }

    private func confirm(_ order: APIClient.PurchaseOrder) {
        confirming = true
        errorText = nil
        Task {
            do {
                let s = try await APIClient.shared.confirmPurchase(purchaseId: order.purchaseId ?? "")
                await MainActor.run {
                    confirming = false
                    showPaymentSheet = false
                    status = s
                    successText = "Оплата подтверждена! Подписка активна"
                }
            } catch {
                await MainActor.run {
                    confirming = false
                    errorText = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    showPaymentSheet = false
                }
            }
        }
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
            let p = try await APIClient.shared.paymentPlans()
            await MainActor.run {
                status = s
                plans = p
            }
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