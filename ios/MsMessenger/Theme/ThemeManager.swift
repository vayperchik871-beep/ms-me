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

    var isDark: Bool {
        switch themeMode {
        case .system:
            return UIScreen.main.traitCollection.userInterfaceStyle == .dark
        case .dark: return true
        case .light: return false
        }
    }

    private init() {
        let raw = UserDefaults.standard.string(forKey: "theme_mode") ?? "dark"
        themeMode = ThemeMode(rawValue: raw) ?? .dark
    }

    var bgColor: Color { isDark ? Color(hex: "#0d0d0d")! : Color(hex: "#f2f2f7")! }
    var backgroundColor: Color { bgColor }
    var surfaceColor: Color { isDark ? Color(hex: "#1c1c1e")! : .white }
    var cardColor: Color { isDark ? Color(hex: "#2c2c2e")! : .white }
    var textPrimary: Color { isDark ? .white : .black }
    var textSecondary: Color { isDark ? Color(hex: "#8e8e93")! : Color(hex: "#636366")! }
    var accent: Color { Color(hex: "#6C63FF")! }
    var borderColor: Color { isDark ? Color(hex: "#38383a")! : Color(hex: "#d1d1d6")! }
    var success: Color { .green }
    var error: Color { .red }
    var terminalBg: Color { Color(hex: "#0d0d0d")! }
    var terminalText: Color { Color(hex: "#e0e0e0")! }
    var terminalGreen: Color { Color(hex: "#8aff80")! }
    var terminalRed: Color { Color(hex: "#ff5555")! }
}

extension Color {
    init?(hex: String) {
        var hex = hex.trimmingCharacters(in: .alphanumerics.inverted)
        if hex.count == 3 { hex = String(hex.map { "\($0)\($0)" }.joined()) }
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default: return nil
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}
