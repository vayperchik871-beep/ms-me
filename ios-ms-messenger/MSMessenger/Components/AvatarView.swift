import SwiftUI

struct AvatarView: View {
    let name: String
    let avatarURL: String?
    let size: CGFloat
    var color: String?
    var online: Bool?

    private var initial: String {
        String(name.uppercased().first ?? "?")
    }

    private var bgColor: Color {
        if let c = color, let uiColor = hexColor(c) { return Color(uiColor) }
        return Color(.systemGray4)
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Group {
                if let url = avatarURL.flatMap({ APIClient.shared.resolveMediaURL($0) }) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let img):
                            img.resizable().scaledToFill()
                        default:
                            fallbackView
                        }
                    }
                } else {
                    fallbackView
                }
            }
            .frame(width: size, height: size)
            .clipShape(Circle())

            if let online = online, online {
                Circle()
                    .fill(.green)
                    .frame(width: size * 0.3, height: size * 0.3)
                    .overlay(Circle().stroke(Color(.systemBackground), lineWidth: 2))
            }
        }
    }

    private var fallbackView: some View {
        ZStack {
            Circle().fill(bgColor)
            Text(initial)
                .font(.system(size: size * 0.4, weight: .semibold))
                .foregroundColor(.white)
        }
    }

    private func hexColor(_ hex: String) -> UIColor? {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let val = Int(s, radix: 16) else { return nil }
        return UIColor(red: CGFloat((val >> 16) & 0xFF) / 255,
                       green: CGFloat((val >> 8) & 0xFF) / 255,
                       blue: CGFloat(val & 0xFF) / 255, alpha: 1)
    }
}
