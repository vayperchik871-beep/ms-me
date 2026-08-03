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
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.hidden)
            }
        }
    }

    // MARK: - Purchase / SBP

    private func planGradient(_ key: String) -> [Color] {
        if key == "premium" {
            return [Color(hex: "F5C311"), Color(hex: "FF7A00"), Color(hex: "FF3D6E")]
        }
        if key == "plus" {
            return [Color(hex: "12C2E9"), Color(hex: "4776E6")]
        }
        return [theme.accent, theme.accent.opacity(0.8)]
    }

    private func daysLabel(_ key: String, days: Int) -> String {
        key == "premium" ? "Целый год бонусов" : "\(days) дней бонусов"
    }

    private func perDayLabel(_ key: String, price: Int, days: Int) -> String {
        guard days > 0 else { return "за период" }
        let perMonth = price / max(1, Int(round(Double(days) / 30.0)))
        return "~\(perMonth) ₽/мес"
    }

    private func planIcon(_ key: String) -> String {
        key == "premium" ? "crown.fill" : "sparkles"
    }

    private func planBadge(_ key: String) -> String? {
        if key == "premium" { return "Лучший выбор" }
        return nil
    }

    private var purchaseCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Подписка")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(theme.textPrimary)
                Text(plans?.demoMode == true ? "Демо-режим: подписка активируется сразу" : "Оплата по СБП-переводу")
                    .font(.system(size: 14))
                    .foregroundColor(theme.textSecondary)
            }
            .padding(.bottom, 6)

            ForEach(plans?.plans ?? [], id: \.key) { plan in
                let key = plan.key ?? ""
                let grad = planGradient(key)
                let isPremium = key == "premium"
                HStack(spacing: 14) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(LinearGradient(colors: grad, startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 52, height: 52)
                        Image(systemName: planIcon(key))
                            .font(.system(size: 24, weight: .semibold))
                            .foregroundColor(.white)
                    }

                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 6) {
                            Text(plan.name ?? "—")
                                .font(.system(size: 17, weight: .bold))
                                .foregroundColor(theme.textPrimary)
                            if let badge = planBadge(key) {
                                Text(badge)
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 7)
                                    .padding(.vertical, 3)
                                    .background(LinearGradient(colors: grad, startPoint: .leading, endPoint: .trailing))
                                    .cornerRadius(6)
                            }
                        }
                        Text(daysLabel(key, days: plan.durationDays ?? 0))
                            .font(.system(size: 13))
                            .foregroundColor(theme.textSecondary)
                    }
                    Spacer()

                    VStack(alignment: .trailing, spacing: 3) {
                        Text("\(plan.priceRub ?? 0) ₽")
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundColor(theme.accent)
                        Text(perDayLabel(key, price: plan.priceRub ?? 0, days: plan.durationDays ?? 0))
                            .font(.system(size: 11))
                            .foregroundColor(theme.textSecondary)
                    }
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isPremium ? grad[0].opacity(0.14) : Color.white.opacity(0.05))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(
                                    LinearGradient(colors: grad, startPoint: .topLeading, endPoint: .bottomTrailing),
                                    lineWidth: isPremium ? 2 : 1.2
                                )
                        )
                )
                .shadow(color: isPremium ? grad[0].opacity(0.18) : .clear, radius: 10, x: 0, y: 4)
                .contentShape(RoundedRectangle(cornerRadius: 16))
                .onTapGesture { start(key) }

                Button(action: { start(key) }) {
                    Group {
                        if paying == key {
                            ProgressView().tint(.white)
                        } else {
                            HStack(spacing: 8) {
                                Text("Купить за \(plan.priceRub ?? 0) ₽")
                                    .font(.system(size: 16, weight: .bold))
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .foregroundColor(.white)
                    .background(LinearGradient(colors: grad, startPoint: .leading, endPoint: .trailing))
                    .cornerRadius(14)
                    .shadow(color: grad[0].opacity(0.35), radius: 10, x: 0, y: 4)
                }
                .buttonStyle(.plain)
                .disabled(paying != nil)
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(theme.cardColor)
        )
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
            Capsule()
                .fill(Color.white.opacity(0.2))
                .frame(width: 40, height: 5)
                .padding(.top, 10)

            VStack(spacing: 8) {
                Text("Оплата подписки")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(theme.textPrimary)
                if let planName = order.planName {
                    Text(planName)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(theme.accent)
                }
                Text("\(order.amountRub ?? 0) ₽")
                    .font(.system(size: 34, weight: .heavy))
                    .foregroundColor(theme.accent)
                    .padding(.top, 2)
            }

            VStack(spacing: 8) {
                if let url = order.qrImageUrl, !url.isEmpty {
                    AsyncImage(url: URL(string: url)) { image in
                        image.resizable().interpolation(.none)
                    } placeholder: {
                        ProgressView()
                    }
                    .frame(width: 190, height: 190)
                } else {
                    sbpQRCode(order: order)
                }
            }
            .padding(14)
            .background(Color.white)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.15), radius: 14, x: 0, y: 6)

            VStack(spacing: 6) {
                Text("1. Отсканируйте QR в приложении банка")
                Text("2. Переведите \(order.amountRub ?? 0) ₽ на указанный номер")
                Text("3. Вернитесь и нажмите «Я оплатил»")
            }
            .font(.system(size: 13))
            .multilineTextAlignment(.center)
            .foregroundColor(theme.textSecondary)
            .padding(.horizontal, 24)

            if let phone = order.phone {
                Text("Получатель: \(phone)")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(theme.textPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(10)
            }

            Button {
                confirm(order)
            } label: {
                Group {
                    if confirming {
                        ProgressView().tint(theme.accentText)
                    } else {
                        Text("Я оплатил")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(theme.accentText)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
            }
            .background(theme.accent)
            .cornerRadius(14)
            .disabled(confirming)

            Button("Отмена") {
                showPaymentSheet = false
            }
            .font(.system(size: 15))
            .foregroundColor(theme.textSecondary)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 24)
        .frame(maxWidth: .infinity)
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
        let active = status?.active == true
        let grad: [Color] = status?.plan == "premium"
            ? [Color(hex: "F5C311"), Color(hex: "FF7A00"), Color(hex: "FF3D6E")]
            : [Color(hex: "12C2E9"), Color(hex: "4776E6")]
        return VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: active ? grad : [Color.white.opacity(0.08)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 46, height: 46)
                    Image(systemName: active ? "crown.fill" : "crown")
                        .font(.system(size: 20))
                        .foregroundColor(active ? .white : theme.textSecondary)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(status == nil ? "Загрузка..." : (active ? "Premium активен" : "Нет подписки"))
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                    if let s = status, s.active == true {
                        Text("\(s.planName ?? s.plan ?? "Подписка") · до \(formatDate(s.until))")
                            .font(.system(size: 13))
                            .foregroundColor(theme.textSecondary)
                        if let d = s.daysLeft {
                            Text("Осталось дней: \(d)")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(theme.accent)
                        }
                    } else if let s = status {
                        Text("Купите подписку, чтобы получить все бонусы")
                            .font(.system(size: 13))
                            .foregroundColor(theme.textSecondary)
                    } else {
                        Text("Проверяем статус...")
                            .font(.system(size: 13))
                            .foregroundColor(theme.textSecondary)
                    }
                }
                Spacer()
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(theme.cardColor)
            )
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