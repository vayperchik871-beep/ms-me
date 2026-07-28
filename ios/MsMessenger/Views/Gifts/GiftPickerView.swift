import SwiftUI

struct GiftPickerView: View {
    let onSend: (Gift) -> Void
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var theme = ThemeManager.shared
    @State private var activeCategory = "all"

    private var filtered: [Gift] {
        activeCategory == "all" ? allGifts : allGifts.filter { $0.category == activeCategory }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(categories, id: \.self) { cat in
                            Button(action: { activeCategory = cat }) {
                                Text(categoryLabels[cat] ?? cat)
                                    .font(.system(size: 14, weight: activeCategory == cat ? .semibold : .regular))
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(activeCategory == cat ? Color(hex: "#6C63FF") : Color.white.opacity(0.1))
                                    .foregroundColor(activeCategory == cat ? .white : theme.textPrimary)
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }

                ScrollView {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 3), spacing: 12) {
                        ForEach(filtered) { gift in
                            GiftCardView(gift: gift, onTap: { onSend(gift) })
                        }
                    }
                    .padding(16)
                }
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationTitle("Подарки")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Отмена") { dismiss() }
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }
            .toolbarBackground(Color.clear, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
        .tint(Color(hex: "#6C63FF"))
    }
}

struct GiftCardView: View {
    let gift: Gift
    let onTap: () -> Void
    @ObservedObject private var theme = ThemeManager.shared

    private var rarityColor: Color {
        Color(hex: rarityColors[gift.rarity] ?? "#8e8e93")
    }

    private var remaining: Int? {
        gift.limited && gift.totalSupply != nil ? gift.totalSupply! - (gift.sold ?? 0) : nil
    }

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(rarityColor.opacity(0.2))
                        .frame(width: 56, height: 56)
                    Text(gift.icon)
                        .font(.system(size: 28))
                }

                Text(gift.name)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(theme.textPrimary)
                    .lineLimit(1)

                Text("🪙 \(gift.price)")
                    .font(.system(size: 11))
                    .foregroundColor(theme.textSecondary)

                Text(rarityLabels[gift.rarity] ?? "")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(rarityColor)
                    .cornerRadius(8)

                if let rem = remaining {
                    Text("Осталось \(rem)")
                        .font(.system(size: 9))
                        .foregroundColor(theme.textSecondary)
                }
            }
            .padding(8)
            .frame(maxWidth: .infinity)
            .background(Color.white.opacity(0.06))
            .cornerRadius(14)
        }
        .buttonStyle(.plain)
    }
}
