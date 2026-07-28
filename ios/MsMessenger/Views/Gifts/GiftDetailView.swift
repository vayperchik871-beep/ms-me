import SwiftUI

struct GiftDetailView: View {
    let gift: Gift
    let ownerName: String?
    let receivedDate: Date?
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var theme = ThemeManager.shared

    private var rarityColor: Color {
        Color(hex: rarityColors[gift.rarity] ?? "#8e8e93")
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(rarityColor.opacity(0.2))
                        .frame(width: 120, height: 120)
                    Text(gift.icon)
                        .font(.system(size: 70))
                }
                .padding(.top, 20)

                Text(gift.name)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(theme.textPrimary)

                Text(rarityLabels[gift.rarity] ?? "")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(rarityColor)
                    .cornerRadius(12)

                Text(gift.description)
                    .font(.system(size: 16))
                    .foregroundColor(theme.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                VStack(spacing: 12) {
                    if let owner = ownerName {
                        detailRow(label: "Владелец", value: owner)
                    }
                    if let date = receivedDate {
                        detailRow(label: "Получен", value: dateFormatter.string(from: date))
                    }
                    detailRow(label: "Цена", value: "🪙 \(gift.price)")
                    if gift.limited, let total = gift.totalSupply, let sold = gift.sold {
                        detailRow(label: "Серийный номер", value: "#\(sold) / \(total)")
                    }
                }
                .padding(16)
                .background(Color.white.opacity(0.06))
                .cornerRadius(14)
                .padding(.horizontal, 24)

                if gift.limited, let total = gift.totalSupply, let sold = gift.sold {
                    VStack(spacing: 8) {
                        ProgressView(value: Double(sold), total: Double(total))
                            .tint(rarityColor)
                        Text("Лимитированная серия · Осталось \(total - sold)")
                            .font(.system(size: 13))
                            .foregroundColor(theme.textSecondary)
                    }
                    .padding(.horizontal, 24)
                }

                Spacer(minLength: 40)
            }
            .frame(maxWidth: .infinity, minHeight: UIScreen.main.bounds.height - 100)
        }
        .background(theme.bgColor.ignoresSafeArea())
        .navigationTitle("Подарок")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }
        }
        .toolbarBackground(Color.clear, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(theme.textSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(theme.textPrimary)
        }
    }

    private var dateFormatter: DateFormatter {
        let fmt = DateFormatter()
        fmt.dateStyle = .medium
        fmt.locale = Locale(identifier: "ru")
        return fmt
    }
}
