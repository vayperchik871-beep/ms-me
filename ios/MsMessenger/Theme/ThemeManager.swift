import SwiftUI

class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    enum ThemeMode: String, CaseIterable {
        case system
        case dark
        case light
    }

    @Published var themeMode: ThemeMode {
        didSet { UserDefaults.standard.set(themeMode.rawValue, forKey: "theme_mode") }
    }

    @Published var accentHex: String {
        didSet { UserDefaults.standard.set(accentHex, forKey: "accent_hex") }
    }

    var isDark: Bool {
        switch themeMode {
        case .system:
            return UITraitCollection.current.userInterfaceStyle == .dark
        case .dark: return true
        case .light: return false
        }
    }

    private init() {
        let raw = UserDefaults.standard.string(forKey: "theme_mode") ?? "dark"
        themeMode = ThemeMode(rawValue: raw) ?? .dark
        accentHex = UserDefaults.standard.string(forKey: "accent_hex") ?? ""
    }

    var accent: Color {
        if accentHex.isEmpty { return isDark ? .white : .black }
        return Color(hex: accentHex)
    }

    var bgColor: Color { isDark ? Color(hex: "#0d0d0d") : Color(hex: "#f2f2f7") }
    var backgroundColor: Color { bgColor }
    var surfaceColor: Color { isDark ? Color(hex: "#1c1c1e") : .white }
    var cardColor: Color { isDark ? Color(hex: "#2c2c2e") : .white }
    var textPrimary: Color { isDark ? .white : .black }
    var textSecondary: Color { isDark ? Color(hex: "#8e8e93") : Color(hex: "#636366") }
    var borderColor: Color { isDark ? Color(hex: "#38383a") : Color(hex: "#d1d1d6") }
    var success: Color { .green }
    var error: Color { .red }
    var terminalBg: Color { Color(hex: "#0d0d0d") }
    var terminalText: Color { Color(hex: "#e0e0e0") }
    var terminalGreen: Color { Color(hex: "#8aff80") }
    var terminalRed: Color { Color(hex: "#ff5555") }
    var chatBg: Color { isDark ? Color(hex: "#0d0d0d") : Color(hex: "#ffffff") }
    var bubbleOwn: Color { accent }
    var bubbleOwnText: Color {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0
        UIColor(accent).getRed(&r, green: &g, blue: &b, alpha: nil)
        let luminance = 0.299 * r + 0.587 * g + 0.114 * b
        return luminance > 0.5 ? .black : .white
    }
    var bubbleOther: Color { isDark ? Color.white.opacity(0.1) : Color(hex: "#e9e9eb") }
    var inputBg: Color { isDark ? Color.white.opacity(0.1) : Color(hex: "#e9e9eb") }
    var inputText: Color { isDark ? .white : .black }
}

extension Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: .alphanumerics.inverted)
        let s = h.count == 3 ? String(h.map { "\($0)\($0)" }.joined()) : h
        var int: UInt64 = 0
        Scanner(string: s).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch s.count {
        case 6: (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default: self = .black; return
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}
