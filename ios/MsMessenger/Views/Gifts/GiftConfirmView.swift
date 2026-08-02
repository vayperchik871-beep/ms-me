import SwiftUI

struct GiftConfirmView: View {
    let gift: Gift
    let recipientName: String
    let onSend: (String, Bool) -> Void
    let onCancel: () -> Void
    @ObservedObject private var theme = ThemeManager.shared
    @State private var message = ""
    @State private var anonymous = false

    private var rarityColor: Color {
        Color(hex: rarityColors[gift.rarity] ?? "#8e8e93")
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(spacing: 20) {
                        ZStack {
                            Circle()
                                .fill(rarityColor.opacity(0.2))
                                .frame(width: 80, height: 80)
                            Text(gift.icon)
                                .font(.system(size: 44))
                        }
                        .padding(.top, 20)

                        Text(gift.name)
                            .font(.system(size: 22, weight: .bold))
                            .foregroundColor(theme.textPrimary)

                        Text(rarityLabels[gift.rarity] ?? "")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 5)
                            .background(rarityColor)
                            .cornerRadius(10)

                        Text("🪙 \(gift.price)")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(theme.textPrimary)

                        HStack(spacing: 6) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 14))
                                .foregroundColor(theme.textSecondary)
                            Text("Кому: \(recipientName)")
                                .font(.system(size: 16))
                                .foregroundColor(theme.textSecondary)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            TextField("Добавить сообщение (необязательно)", text: $message, axis: .vertical)
                                .font(.system(size: 16))
                                .foregroundColor(theme.inputText)
                                .lineLimit(3, reservesSpace: true)
                                .padding(14)
                                .background(theme.inputBg)
                                .cornerRadius(12)
                                .onChange(of: message) { new in
                                    if new.count > 200 { message = String(new.prefix(200)) }
                                }

                            Button(action: { anonymous.toggle() }) {
                                HStack {
                                    Text("Отправить анонимно")
                                        .font(.system(size: 15))
                                        .foregroundColor(theme.textPrimary)
                                    Spacer()
                                    Image(systemName: anonymous ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 20))
                                        .foregroundColor(anonymous ? theme.accent : theme.textSecondary)
                                }
                                .padding(14)
                                .background(theme.inputBg)
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 24)
                    }
                }

                Button(action: { onSend(message, anonymous) }) {
                    Text("Отправить подарок 🎁")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(rarityColor)
                        .cornerRadius(14)
                        .padding(.horizontal, 24)
                }
                .buttonStyle(.plain)
                .padding(.bottom, 20)
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationTitle("Подтверждение")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Отмена", action: onCancel)
                        .foregroundColor(theme.accent)
                }
            }
            .toolbarBackground(Color.clear, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
        .tint(theme.accent)
    }
}
