import SwiftUI

@MainActor
final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    @Published var isDark: Bool {
        didSet { UserDefaults.standard.set(isDark, forKey: "dark_mode") }
    }

    private init() {
        isDark = UserDefaults.standard.object(forKey: "dark_mode") as? Bool ?? true
    }

    var backgroundColor: Color { isDark ? Color(hex: "#0d0d0d")! : .white }
    var surfaceColor: Color { isDark ? Color(hex: "#1a1d23")! : Color(hex: "#f5f5f5")! }
    var cardColor: Color { isDark ? Color(hex: "#22252b")! : .white }
    var textPrimary: Color { isDark .white : .black }
    var textSecondary: Color { isDark ? Color(hex: "#a0a0a0")! : .gray }
    var accent: Color { Color(hex: "#7c3aed")! }
    var borderColor: Color { isDark ? Color(hex: "#333")! : Color(hex: "#e0e0e0")! }
    var success: Color { .green }
    var error: Color { .red }
    var terminalBg: Color { Color(hex: "#0d0d0d")! }
    var terminalText: Color { Color(hex: "#e0e0e0")! }
    var terminalGreen: Color { Color(hex: "#8aff80")! }
    var terminalRed: Color { Color(hex: "#ff5555")! }
}

extension Color {
    init?(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default: return nil
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
