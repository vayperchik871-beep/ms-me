import SwiftUI

struct ContactDetailView: View {
    let user: User
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab = 0
    @State private var isOnline = true
    @State private var showChat = false
    @State private var navigateChat: Chat?

    private let tabs = ["Posts", "Media", "Files", "Music"]

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            GeometryReader { geo in
                let imgH = geo.size.height * 0.52

                // MARK: - Background photo
                if let avatar = user.avatar, let url = URL(string: avatar) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let img):
                            img.resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: imgH)
                                .clipped()
                                .grayscale(1)
                        default:
                            placeholderImage
                                .frame(width: geo.size.width, height: imgH)
                        }
                    }
                    .frame(width: geo.size.width, height: imgH)
                } else {
                    placeholderImage
                        .frame(width: geo.size.width, height: imgH)
                }

                // Gradient overlay
                LinearGradient(
                    stops: [
                        .init(color: .clear, location: 0.3),
                        .init(color: .black.opacity(0.5), location: 0.7),
                        .init(color: .black, location: 1.0)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(width: geo.size.width, height: imgH)
                .ignoresSafeArea()

                // Bottom dark fill behind content
                Rectangle()
                    .fill(Color.black)
                    .frame(width: geo.size.width, height: geo.size.height - imgH + 40)
                    .position(x: geo.size.width / 2, y: imgH + (geo.size.height - imgH + 40) / 2 - 40)
            }

            // MARK: - Content
            VStack(spacing: 0) {
                Spacer(minLength: 0)

                // Name + online
                VStack(spacing: 4) {
                    Text(user.name)
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    Text(isOnline ? "online" : "offline")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                }
                .padding(.bottom, 22)

                // Action buttons
                HStack(spacing: 16) {
                    actionButton(icon: "phone.fill", size: 56) { openChat() }
                    actionButton(icon: "bell.fill", size: 56) {}
                    actionButton(icon: "magnifyingglass", size: 56) {}
                    actionButton(icon: "ellipsis", size: 56) {}
                }
                .padding(.bottom, 16)

                // Music track
                musicTrack
                    .padding(.bottom, 20)

                // Info card
                infoCard
                    .padding(.horizontal, 24)
                    .padding(.bottom, 16)

                // Tab bar
                tabBar
                    .padding(.horizontal, 20)
                    .padding(.bottom, 16)
            }

            // MARK: - Navigation buttons
            HStack {
                navButton(icon: "chevron.left") {
                    dismiss()
                }
                Spacer()
                navButton(text: "Edit") {
                    // edit action
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
        }
        .navigationBarHidden(true)
        .statusBarHidden(false)
        .background(
            NavigationLink("", destination: ChatDetailView(chat: navigateChat ?? Chat(id: "", type: nil, name: nil, peer: nil, lastMessage: nil, lastTime: nil, unread: nil, lastMessageAt: nil)), isActive: $showChat).hidden()
        )
    }

    // MARK: - Placeholder
    private var placeholderImage: some View {
        ZStack {
            Color(hex: "#1a1a1a")
            LinearGradient(
                colors: [Color.white.opacity(0.05), Color.white.opacity(0.02)],
                startPoint: .top,
                endPoint: .bottom
            )
            Image(systemName: "person.fill")
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.15))
        }
    }

    // MARK: - Nav button
    private func navButton(icon: String? = nil, text: String? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 40, height: 40)
            } else if let text = text {
                Text(text)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 52, height: 40)
            }
        }
        .background(.ultraThinMaterial)
        .clipShape(Circle())
    }

    // MARK: - Action button
    private func actionButton(icon: String, size: CGFloat, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(.white)
                .frame(width: size, height: size)
        }
        .background(.ultraThinMaterial)
        .clipShape(Circle())
    }

    private func openChat() {
        Task {
            do {
                let resp = try await APIClient.shared.addContact(userId: user.userId)
                navigateChat = Chat(id: resp.chatId, type: "direct", name: resp.contact.name, peer: Peer(id: resp.contact.id, userId: resp.contact.userId, name: resp.contact.name, isSystem: nil, avatar: nil, profileColor: nil, online: nil, lastSeen: nil), lastMessage: nil, lastTime: nil, unread: nil, lastMessageAt: nil)
                showChat = true
            } catch { print(error) }
        }
    }

    // MARK: - Music track
    private var musicTrack: some View {
        Button(action: {}) {
            HStack(spacing: 6) {
                Image(systemName: "music.note")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
                Text("I Put A Spell On You - Nina Simone")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
                    .lineLimit(1)
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white.opacity(0.5))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
        }
    }

    // MARK: - Info card
    private var infoCard: some View {
        VStack(spacing: 0) {
            // Phone
            VStack(alignment: .leading, spacing: 2) {
                Text("phone")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.white.opacity(0.45))
                Text(user.phone ?? "+888 1234 5678")
                    .font(.system(size: 17, weight: .regular))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            Divider()
                .background(Color.white.opacity(0.1))
                .padding(.horizontal, 20)

            // Username + QR
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("username")
                        .font(.system(size: 13, weight: .regular))
                        .foregroundColor(.white.opacity(0.45))
                    Text("@\(user.userId)")
                        .font(.system(size: 17, weight: .regular))
                        .foregroundColor(.white)
                }
                Spacer()
                Image(systemName: "qrcode")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
        }
        .background(.ultraThinMaterial.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    // MARK: - Tab bar
    private var tabBar: some View {
        HStack(spacing: 0) {
            ForEach(Array(tabs.enumerated()), id: \.offset) { index, title in
                Button(action: { withAnimation(.easeInOut(duration: 0.2)) { selectedTab = index } }) {
                    Text(title)
                        .font(.system(size: 14, weight: selectedTab == index ? .semibold : .regular))
                        .foregroundColor(selectedTab == index ? .white : .white.opacity(0.5))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            selectedTab == index
                                ? AnyShapeStyle(.ultraThinMaterial)
                                : AnyShapeStyle(.clear)
                        )
                        .clipShape(Capsule())
                }
            }
        }
        .background(.ultraThinMaterial.opacity(0.4))
        .clipShape(Capsule())
    }
}
