import SwiftUI
import PhotosUI

struct ProfileView: View {
    let user: User
    var isOwnProfile: Bool = false
    @Environment(\.dismiss) private var dismiss
    @State private var showEdit = false
    @State private var selectedGift: Gift?
    @State private var showGiftDetail = false
    @ObservedObject private var theme = ThemeManager.shared
    @State private var activeTab = 0
    @State private var refreshedUser: User?

    private var displayUser: User { refreshedUser ?? user }

    private var receivedGifts: [Gift] {
        let ids = UserDefaults.standard.array(forKey: "received_gift_ids_\(displayUser.userId)") as? [String] ?? []
        return allGifts.filter { ids.contains($0.id) }
    }

    var body: some View {
        ZStack {
            theme.bgColor.ignoresSafeArea()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 0) {
                    bannerSection
                    actionButtonsSection
                    musicCapsule
                    if isOwnProfile { infoCard }
                    tabsSection
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
                    GiftDetailView(gift: gift, ownerName: displayUser.name, receivedDate: Date())
                }
                .tint(theme.accent)
            }
        }
        .sheet(isPresented: $showEdit) {
            EditProfileSheet(user: displayUser) { updated in
                refreshedUser = updated
            }
        }
        .task {
            if isOwnProfile {
                do {
                    let resp = try await APIClient.shared.me()
                    await MainActor.run { refreshedUser = resp.user }
                } catch {}
            }
        }
    }

    // MARK: - Banner

    private var bannerSection: some View {
        ZStack(alignment: .bottom) {
            if let banner = displayUser.profileBanner, let url = URL(string: banner) {
                AsyncImage(url: url) { img in
                    img.resizable().scaledToFill()
                } placeholder: {
                    LinearGradient(
                        colors: [Color(hex: displayUser.profileColor ?? theme.accentHex.isEmpty ? "#ffffff" : theme.accentHex), Color(hex: displayUser.profileColor ?? theme.accentHex.isEmpty ? "#ffffff" : theme.accentHex).opacity(0.6)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                }
                .frame(height: 400)
                .clipped()
            } else if let avatar = displayUser.avatar, let url = URL(string: avatar) {
                AsyncImage(url: url) { img in
                    img.resizable().scaledToFill()
                } placeholder: {
                    LinearGradient(
                        colors: [Color(hex: displayUser.profileColor ?? theme.accentHex.isEmpty ? "#ffffff" : theme.accentHex), Color(hex: displayUser.profileColor ?? theme.accentHex.isEmpty ? "#ffffff" : theme.accentHex).opacity(0.6)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                }
                .frame(height: 400)
                .clipped()
            } else {
                LinearGradient(
                    colors: [Color(hex: displayUser.profileColor ?? theme.accentHex.isEmpty ? "#ffffff" : theme.accentHex), Color(hex: displayUser.profileColor ?? theme.accentHex.isEmpty ? "#ffffff" : theme.accentHex).opacity(0.6)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
                .frame(height: 400)
                .overlay {
                    Text(displayUser.name.prefix(1).uppercased())
                        .font(.system(size: 80, weight: .bold))
                        .foregroundColor(.white.opacity(0.6))
                }
            }

            LinearGradient(
                colors: [.clear, .black.opacity(0.7)],
                startPoint: .center, endPoint: .bottom
            )
            .frame(height: 160)

            VStack(alignment: .center, spacing: 4) {
                HStack {
                    Spacer()
                    HStack(spacing: 4) {
                        Text(displayUser.name)
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        if displayUser.isVerified == true {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundColor(.white)
                                .font(.system(size: 18))
                        }
                    }
                    Spacer()
                }
                HStack(spacing: 6) {
                    Circle()
                        .fill(displayUser.isOnline == true ? Color.green : Color.gray.opacity(0.6))
                        .frame(width: 8, height: 8)
                    Text(displayUser.isOnline == true ? "online" : "@\(displayUser.userId)")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.bottom, 16)
        }
        .frame(height: 400)
        .ignoresSafeArea(edges: .top)
    }

    // MARK: - Action Buttons (4 round, icon only)

    private var actionButtonsSection: some View {
        HStack(spacing: 20) {
            actionCircle(icon: "phone.fill") { }
            actionCircle(icon: "bell.fill") { }
            actionCircle(icon: "magnifyingglass") { }
            actionCircle(icon: "ellipsis") { }
        }
        .padding(.top, 20)
    }

    private func actionCircle(icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 56, height: 56)
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(.white)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Music Capsule

    private var musicCapsule: some View {
        Group {
            if let music = displayUser.music, !music.isEmpty {
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

    // MARK: - Info Card (own profile only)

    private var infoCard: some View {
        VStack(spacing: 0) {
            if let phone = displayUser.phone, !phone.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    Text("phone")
                        .font(.system(size: 12))
                        .foregroundColor(theme.textSecondary)
                    Text(phone)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(theme.textPrimary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.vertical, 14)

                Divider()
                    .background(Color.white.opacity(0.08))
                    .padding(.leading, 20)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("username")
                    .font(.system(size: 12))
                    .foregroundColor(theme.textSecondary)
                Text("@\(displayUser.userId)")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(theme.textPrimary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
        }
        .background(Color.white.opacity(0.06))
        .cornerRadius(16)
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }

    // MARK: - Tabs (Posts / Media / Files / Music)

    private var tabsSection: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                tabButton(title: "Posts", index: 0)
                tabButton(title: "Media", index: 1)
                tabButton(title: "Files", index: 2)
                tabButton(title: "Music", index: 3)
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
                    .font(.system(size: 14, weight: activeTab == index ? .semibold : .regular))
                    .foregroundColor(activeTab == index ? Color(hex: displayUser.profileColor ?? theme.accentHex.isEmpty ? "#ffffff" : theme.accentHex) : theme.textSecondary)
                Rectangle()
                    .fill(activeTab == index ? Color(hex: displayUser.profileColor ?? theme.accentHex.isEmpty ? "#ffffff" : theme.accentHex) : Color.clear)
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
            Text("Посты появятся здесь")
                .font(.system(size: 14))
                .foregroundColor(theme.textSecondary)
                .frame(maxWidth: .infinity, minHeight: 120)
        case 1:
            Text("Медиа появится здесь")
                .font(.system(size: 14))
                .foregroundColor(theme.textSecondary)
                .frame(maxWidth: .infinity, minHeight: 120)
        case 2:
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
                    Text("Edit")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
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
                    ProgressView().tint(theme.accent)
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

struct EditProfileSheet: View {
    let user: User
    var onSaved: (User) -> Void
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var theme = ThemeManager.shared
    @State private var name: String
    @State private var bio: String
    @State private var avatarData: Data?
    @State private var avatarItem: PhotosPickerItem?
    @State private var saving = false
    @State private var errorText: String?

    init(user: User, onSaved: @escaping (User) -> Void) {
        self.user = user
        self.onSaved = onSaved
        _name = State(initialValue: user.name)
        _bio = State(initialValue: user.bio ?? "")
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    avatarPicker
                    inputField("Имя", text: $name)
                    inputField("О себе", text: $bio)
                    if let errorText {
                        Text(errorText).font(.system(size: 13)).foregroundColor(.red)
                    }
                }
                .padding(20)
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationTitle("Редактировать")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Отмена") { dismiss() }.foregroundColor(theme.accent)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: save) {
                        if saving { ProgressView().tint(.white) }
                        else { Text("Готово").fontWeight(.semibold) }
                    }
                    .disabled(saving || name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .tint(theme.accent)
        .onChange(of: avatarItem) { item in
            Task { if let data = try? await item?.loadTransferable(type: Data.self) { avatarData = data } }
        }
    }

    private var avatarPicker: some View {
        PhotosPicker(selection: $avatarItem, matching: .images) {
            ZStack {
                if let avatarData, let ui = UIImage(data: avatarData) {
                    Image(uiImage: ui).resizable().scaledToFill()
                } else if let avatar = user.avatar, let url = URL(string: avatar) {
                    AsyncImage(url: url) { img in
                        img.resizable().scaledToFill()
                    } placeholder: {
                        Text(user.name.prefix(1).uppercased())
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                    }
                } else {
                    Text(user.name.prefix(1).uppercased())
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .frame(width: 80, height: 80)
            .clipShape(Circle())
            .overlay(Circle().strokeBorder(theme.accent, lineWidth: 2))
            .overlay(alignment: .bottomTrailing) {
                Image(systemName: "camera.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.white)
                    .padding(4)
                    .background(Circle().fill(theme.accent))
                    .offset(x: 2, y: 2)
            }
        }
        .buttonStyle(.plain)
        .padding(.top, 12)
    }

    private func inputField(_ label: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.system(size: 12)).foregroundColor(theme.textSecondary)
            TextField("", text: text)
                .font(.system(size: 16))
                .foregroundColor(theme.inputText)
                .padding(12)
                .background(Color.white.opacity(0.06))
                .cornerRadius(10)
        }
    }

    private func save() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        saving = true
        Task {
            do {
                var body: [String: String] = ["name": trimmed]
                if !bio.trimmingCharacters(in: .whitespaces).isEmpty {
                    body["bio"] = bio.trimmingCharacters(in: .whitespaces)
                }
                var resp = try await APIClient.shared.updateProfile(body)
                if let avatarData {
                    let avatarUrl = try await APIClient.shared.uploadAvatar(avatarData)
                    _ = try await APIClient.shared.updateProfile(["avatar": avatarUrl])
                    resp = try await APIClient.shared.me()
                }
                await MainActor.run {
                    onSaved(resp.user)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    saving = false
                    errorText = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
            }
        }
    }
}
