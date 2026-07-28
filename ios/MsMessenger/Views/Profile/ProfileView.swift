import SwiftUI

struct ProfileView: View {
    let user: User
    @State private var newName = ""
    @State private var saving = false
    @ObservedObject private var theme = ThemeManager.shared
    @State private var selectedGift: Gift?
    @State private var showGiftDetail = false

    private var receivedGifts: [Gift] {
        let ids = UserDefaults.standard.array(forKey: "received_gift_ids_\(user.userId)") as? [String] ?? []
        return allGifts.filter { ids.contains($0.id) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 88, height: 88)
                    if let avatar = user.avatar, let url = URL(string: avatar) {
                        AsyncImage(url: url) { img in
                            img.resizable().scaledToFill()
                        } placeholder: {
                            Text(user.name.prefix(1).uppercased())
                                .font(.system(size: 32, weight: .semibold))
                                .foregroundColor(Color(hex: "#6C63FF"))
                        }
                        .frame(width: 88, height: 88)
                        .clipShape(Circle())
                    } else {
                        Text(user.name.prefix(1).uppercased())
                            .font(.system(size: 32, weight: .semibold))
                            .foregroundColor(Color(hex: "#6C63FF"))
                    }
                }

                VStack(spacing: 4) {
                    Text(user.name)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                    Text("@\(user.userId)")
                        .font(.system(size: 15))
                        .foregroundColor(theme.textSecondary)
                }

                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        Image(systemName: "person")
                            .font(.system(size: 16))
                            .foregroundColor(Color(hex: "#6C63FF"))
                            .frame(width: 24)
                        TextField("Имя", text: $newName)
                            .font(.system(size: 16))
                            .foregroundColor(theme.inputText)
                            .onAppear { newName = user.name }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(theme.inputBg)
                    .cornerRadius(12)

                    Button(action: save) {
                        if saving { ProgressView().tint(.white) }
                        else {
                            Text("Сохранить")
                                .font(.system(size: 17, weight: .semibold))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background((newName.isEmpty || newName == user.name) ? Color.white.opacity(0.15) : Color(hex: "#6C63FF"))
                    .foregroundColor((newName.isEmpty || newName == user.name) ? .white.opacity(0.3) : .white)
                    .cornerRadius(14)
                    .disabled(saving || newName.isEmpty || newName == user.name)
                }
                .padding(.horizontal, 40)

                if let mcoins = user.mcoins {
                    HStack {
                        Image(systemName: "bitcoinsign.circle.fill")
                            .foregroundColor(.yellow)
                            .font(.system(size: 20))
                        Text("\(mcoins) MCoins")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(theme.textPrimary)
                        Spacer()
                    }
                    .padding(16)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(12)
                    .padding(.horizontal, 40)
                }

                // MARK: - Received Gifts
                if !receivedGifts.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Полученные подарки")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(theme.textPrimary)
                            .padding(.horizontal, 40)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(receivedGifts) { gift in
                                    Button(action: {
                                        selectedGift = gift
                                        showGiftDetail = true
                                    }) {
                                        VStack(spacing: 4) {
                                            Text(gift.icon)
                                                .font(.system(size: 32))
                                            Text(gift.name)
                                                .font(.system(size: 11))
                                                .foregroundColor(theme.textPrimary)
                                                .lineLimit(1)
                                        }
                                        .padding(10)
                                        .background(Color.white.opacity(0.06))
                                        .cornerRadius(12)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, 40)
                        }
                    }
                }
            }
            .padding(.top, 20)
        }
        .background(theme.bgColor.ignoresSafeArea())
        .navigationTitle("Профиль")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("Профиль")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(theme.textPrimary)
            }
        }
        .toolbarBackground(Color.clear, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .sheet(isPresented: $showGiftDetail) {
            if let gift = selectedGift {
                NavigationStack {
                    GiftDetailView(gift: gift, ownerName: user.name, receivedDate: Date())
                }
                .tint(Color(hex: "#6C63FF"))
            }
        }
    }

    private func save() {
        saving = true
        Task {
            do { _ = try await APIClient.shared.updateProfile(["name": newName]) }
            catch { print(error) }
            saving = false
        }
    }
}
