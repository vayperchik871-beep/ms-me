import SwiftUI

struct ChatHeaderView: View {
    let peer: ChatPeer?
    let typingUserId: String?
    let otherUnread: Int
    let onBack: () -> Void
    let onTapCenter: () -> Void
    let onTapAvatar: () -> Void

    @StateObject private var i18n = I18n.shared

    private var statusText: String {
        if typingUserId != nil { return i18n.t("печатает...") }
        if peer?.online == true { return i18n.t("в сети") }
        if let ls = peer?.lastSeen { return formatLastSeen(ls) }
        return ""
    }

    var body: some View {
        HStack(spacing: 8) {
            backButton
            centerButton
            avatarButton
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(minHeight: 58)
        .background(Color(.systemBackground))
    }

    private var backButton: some View {
        Button(action: onBack) {
            HStack(spacing: 6) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                if otherUnread > 0 {
                    Text("\(otherUnread)")
                        .font(.caption.weight(.bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .frame(height: 28)
                        .background(.white.opacity(0.15), in: Capsule())
                }
            }
            .padding(.horizontal, 10)
            .frame(height: 40)
        }
        .capsuleGlass(radius: 20)
        .pressAnimation()
    }

    private var centerButton: some View {
        Button(action: onTapCenter) {
            VStack(spacing: 1) {
                Text(peer?.name ?? "")
                    .font(.system(size: 16, weight: .semibold))
                    .lineLimit(1)
                HStack(spacing: 4) {
                    if peer?.online == true {
                        Circle().fill(.green).frame(width: 6, height: 6)
                    }
                    Text(statusText)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 16)
            .frame(height: 44)
        }
        .capsuleGlass(radius: 22)
        .pressAnimation()
    }

    private var avatarButton: some View {
        Button(action: onTapAvatar) {
            AvatarView(name: peer?.name ?? "?", avatarURL: peer?.avatar,
                       size: 38, color: peer?.profileColor)
                .padding(3)
                .frame(width: 44, height: 44)
        }
        .background(
            .ultraThinMaterial,
            in: Circle()
        )
        .overlay(
            Circle()
                .stroke(.white.opacity(0.06), lineWidth: 1)
        )
        .pressAnimation()
    }

    private func formatLastSeen(_ ts: Int) -> String {
        let diff = Int(Date().timeIntervalSince1970 * 1000) - ts
        if diff < 60000 { return i18n.t("был(а) только что") }
        let mins = diff / 60000
        if mins < 60 { return "\(mins) м" }
        let hours = mins / 60
        if hours < 24 { return "\(hours) ч" }
        return "\(hours / 24) д"
    }
}
