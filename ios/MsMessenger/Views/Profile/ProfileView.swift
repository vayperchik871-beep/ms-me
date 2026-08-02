import SwiftUI

struct ProfileView: View {
    let user: User
    var isOwnProfile: Bool = false
    @Environment(\.dismiss) private var dismiss
    @State private var newName = ""
    @State private var showEdit = false
    @State private var selectedGift: Gift?
    @State private var showGiftDetail = false
    @ObservedObject private var theme = ThemeManager.shared
    @State private var activeTab = 0

    private var receivedGifts: [Gift] {
        let ids = UserDefaults.standard.array(forKey: "received_gift_ids_\(user.userId)") as? [String] ?? []
        return allGifts.filter { ids.contains($0.id) }
    }

    var body: some View {
        ZStack {
            theme.bgColor.ignoresSafeArea()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 0) {
                    bannerSection
                    infoSection
                    actionButtonsSection
                    musicCapsule
                    infoCard
                    if !isOwnProfile { tabsSection }
                    receivedGiftsSection
                    Spacer(minLength: 40)
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .toolbarBackground(.hidden, for: .navigationBar)
        .overlay(alignment: .top) { topBar }
        .fullScreenCover(isPresented: $showGiftDetail) {
            if let gift = selectedGift {
                NavigationStack {
                    GiftDetailView(gift: gift, ownerName: user.name, receivedDate: Date())
                }
                .tint(Color(hex: "#6C63FF"))
            }
        }
    }

    // MARK: - Banner

    private var bannerSection: some View {
        ZStack(alignment: .bottom) {
            if let banner = user.profileBanner, let url = URL(string: banner) {
                AsyncImage(url: url) { img in
                    img.resizable().scaledToFill()
                } placeholder: {
                    LinearGradient(
                        colors: [Color(hex: user.profileColor ?? "#6C63FF"), Color(hex: user.profileColor ?? "#6C63FF").opacity(0.6)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                }
                .frame(height: 400)
                .clipped()
            } else if let avatar = user.avatar, let url = URL(string: avatar) {
                AsyncImage(url: url) { img in
                    img.resizable().scaledToFill()
                } placeholder: {
                    LinearGradient(
                        colors: [Color(hex: user.profileColor ?? "#6C63FF"), Color(hex: user.profileColor ?? "#6C63FF").opacity(0.6)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                }
                .frame(height: 400)
                .clipped()
            } else {
                LinearGradient(
                    colors: [Color(hex: user.profileColor ?? "#6C63FF"), Color(hex: user.profileColor ?? "#6C63FF").opacity(0.6)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
                .frame(height: 400)
                .overlay {
                    Text(user.name.prefix(1).uppercased())
                        .font(.system(size: 80, weight: .bold))
                        .foregroundColor(.white.opacity(0.6))
                }
            }

            LinearGradient(
                colors: [.clear, .black.opacity(0.7)],
                startPoint: .center, endPoint: .bottom
            )
            .frame(height: 160)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(user.name)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                    if user.isVerified == true {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(.white)
                            .font(.system(size: 18))
                    }
                }
                HStack(spacing: 6) {
                    Circle()
                        .fill(user.isOnline == true ? Color.green : Color.gray.opacity(0.6))
                        .frame(width: 8, height: 8)
                    Text(user.isOnline == true ? "В сети" : "@\(user.userId)")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
        }
        .frame(height: 400)
        .ignoresSafeArea(edges: .top)
    }

    // MARK: - Info (bio / birthday)

    private var infoSection: some View {
        VStack(spacing: 12) {
            if let bio = user.bio, !bio.isEmpty {
                HStack {
                    Image(systemName: "text.quote")
                        .foregroundColor(.white.opacity(0.5))
                        .frame(width: 20)
                    Text(bio)
                        .font(.system(size: 15))
                        .foregroundColor(theme.textPrimary)
                    Spacer()
                }
                .padding(.horizontal, 20)
            }

            if let birthday = user.birthday, !birthday.isEmpty {
                HStack {
                    Image(systemName: "cake")
                        .foregroundColor(.white.opacity(0.5))
                        .frame(width: 20)
                    Text(birthday)
                        .font(.system(size: 15))
                        .foregroundColor(theme.textPrimary)
                    Spacer()
                }
                .padding(.horizontal, 20)
            }
        }
        .padding(.top, 16)
    }

    // MARK: - Action Buttons (4 round)

    private var actionButtonsSection: some View {
        HStack(spacing: 20) {
            actionButton(icon: "phone.fill", label: "Звонок") { }
            actionButton(icon: "bell.fill", label: "Уведомления") { }
            actionButton(icon: "magnifyingglass", label: "Поиск") { }
            actionButton(icon: "ellipsis", label: "Ещё") { }
        }
        .padding(.top, 20)
    }

    private func actionButton(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 56, height: 56)
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                }
                Text(label)
                    .font(.system(size: 11))
                    .foregroundColor(theme.textSecondary)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Music Capsule

    private var musicCapsule: some View {
        Group {
            if let music = user.music, !music.isEmpty {
                HStack(spacing: 10) {
                    Image(systemName: "music.note")
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                    Text(music)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Spacer()
                    Image(systemName: "forward.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.6))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    Capsule()
                        .fill(Color.white.opacity(0.15))
                )
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
        }
    }

    // MARK: - Info Card (phone + username)

    private var infoCard: some View {
        VStack(spacing: 0) {
            if let phone = user.phone, !phone.isEmpty {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(phone)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(theme.textPrimary)
                        Text("Телефон")
                            .font(.system(size: 12))
                            .foregroundColor(theme.textSecondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14))
                        .foregroundColor(theme.textSecondary)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 14)

                Divider()
                    .background(Color.white.opacity(0.08))
                    .padding(.leading, 56)
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("@\(user.userId)")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(theme.textPrimary)
                    Text("Имя пользователя")
                        .font(.system(size: 12))
                        .foregroundColor(theme.textSecondary)
                }
                Spacer()

                if isOwnProfile {
                    Button(action: { }) {
                        Image(systemName: "qrcode")
                            .font(.system(size: 20))
                            .foregroundColor(Color(hex: user.profileColor ?? "#6C63FF"))
                    }
                    .buttonStyle(.plain)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14))
                        .foregroundColor(theme.textSecondary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
        }
        .background(Color.white.opacity(0.06))
        .cornerRadius(16)
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }

    // MARK: - Tabs (Media / Files / Music)

    private var tabsSection: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                tabButton(title: "Медиа", index: 0)
                tabButton(title: "Файлы", index: 1)
                tabButton(title: "Музыка", index: 2)
            }
            .padding(.top, 20)

            Divider()
                .background(Color.white.opacity(0.08))

           tabContent
                .padding(.top, 16)
                .padding(.horizontal, 20)
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }

    private func tabButton(title: String, index: Int) -> some View {
        Button(action: { withAnimation { activeTab = index } }) {
            VStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 15, weight: activeTab == index ? .semibold : .regular))
                    .foregroundColor(activeTab == index ? Color(hex: user.profileColor ?? "#6C63FF") : theme.textSecondary)
                Rectangle()
                    .fill(activeTab == index ? Color(hex: user.profileColor ?? "#6C63FF") : Color.clear)
                    .frame(height: 2)
            }
        }
        .frame(maxWidth: .infinity)
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var tabContent: some View {
        switch activeTab {
        case 0:
            Text("Медиа появится здесь")
                .font(.system(size: 14))
                .foregroundColor(theme.textSecondary)
                .frame(maxWidth: .infinity, minHeight: 120)
        case 1:
            Text("Файлы появятся здесь")
                .font(.system(size: 14))
                .foregroundColor(theme.textSecondary)
                .frame(maxWidth: .infinity, minHeight: 120)
        default:
            Text("Музыка появится здесь")
                .font(.system(size: 14))
                .foregroundColor(theme.textSecondary)
                .frame(maxWidth: .infinity, minHeight: 120)
        }
    }

    // MARK: - Received Gifts

    private var receivedGiftsSection: some View {
        Group {
            if !receivedGifts.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Полученные подарки")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                        .padding(.horizontal, 20)
                        .padding(.top, 24)

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
                        .padding(.horizontal, 20)
                    }
                }
            }
        }
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            Button(action: { dismiss() }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 40, height: 40)
            }
            .buttonStyle(.plain)

            Spacer()

            if isOwnProfile {
                Button(action: { showEdit = true }) {
                    Text("Изменить")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                }
                .buttonStyle(.plain)
            } else {
                Button(action: { }) {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 8)
    }
}

struct ProfileByIdView: View {
    let userId: String
    @State private var user: User?
    @State private var loading = true
    @State private var errorText: String?
    @ObservedObject private var theme = ThemeManager.shared
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Group {
            if let user {
                ProfileView(user: user)
            } else if loading {
                VStack {
                    Spacer()
                    ProgressView().tint(Color(hex: "#6C63FF"))
                    Text("Загрузка…").font(.system(size: 14)).foregroundColor(theme.textSecondary).padding(.top, 8)
                    Spacer()
                }
            } else if let errorText {
                VStack {
                    Spacer()
                    Text(errorText).font(.system(size: 14)).foregroundColor(theme.textSecondary)
                    Button("Закрыть") { dismiss() }.padding(.top, 12)
                    Spacer()
                }
            }
        }
        .background(theme.bgColor.ignoresSafeArea())
        .task {
            do {
                let resp = try await APIClient.shared.getUser(userId: userId)
                await MainActor.run { user = resp.user; loading = false }
            } catch {
                await MainActor.run { errorText = "Не удалось загрузить профиль"; loading = false }
            }
        }
    }
}
