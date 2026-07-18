import SwiftUI

enum AppTheme: String {
    case dark, light

    var interfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .dark: return .dark
        case .light: return .light
        }
    }
}

@MainActor
final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    @Published var theme: AppTheme {
        didSet {
            UserDefaults.standard.set(theme.rawValue, forKey: "theme")
            applyTheme()
        }
    }

    private init() {
        let saved = UserDefaults.standard.string(forKey: "theme") ?? "dark"
        theme = AppTheme(rawValue: saved) ?? .dark
        applyTheme()
    }

    func toggle() {
        theme = theme == .dark ? .light : .dark
    }

    private func applyTheme() {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
        scene.windows.forEach { $0.overrideUserInterfaceStyle = theme.interfaceStyle }
    }
}

// MARK: - Liquid Glass View Modifier

struct LiquidGlassModifier: ViewModifier {
    let radius: CGFloat
    let blur: CGFloat

    func body(content: Content) -> some View {
        content
            .background(
                .ultraThinMaterial,
                in: RoundedRectangle(cornerRadius: radius)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .stroke(.white.opacity(0.06), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.25), radius: 12, x: 0, y: 2)
            .shadow(color: .black.opacity(0.15), radius: 2, x: 0, y: 1)
    }
}

struct LiquidGlassNavModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                .ultraThinMaterial,
                in: RoundedRectangle(cornerRadius: 36)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 36)
                    .stroke(.white.opacity(0.06), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.3), radius: 40, x: 0, y: 8)
            .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 2)
    }
}

struct CapsuleGlassModifier: ViewModifier {
    let radius: CGFloat

    func body(content: Content) -> some View {
        content
            .background(
                .ultraThinMaterial,
                in: RoundedRectangle(cornerRadius: radius)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .stroke(.white.opacity(0.06), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.25), radius: 12, x: 0, y: 2)
    }
}

extension View {
    func liquidGlass(radius: CGFloat = 14, blur: CGFloat = 28) -> some View {
        modifier(LiquidGlassModifier(radius: radius, blur: blur))
    }

    func liquidGlassNav() -> some View {
        modifier(LiquidGlassNavModifier())
    }

    func capsuleGlass(radius: CGFloat = 20) -> some View {
        modifier(CapsuleGlassModifier(radius: radius))
    }

    func pressAnimation() -> some View {
        self.buttonStyle(GlassButtonStyle())
    }
}

struct GlassButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.93 : 1)
            .animation(.spring(response: 0.2, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Theme Colors

extension Color {
    static let msGreen = Color(red: 0.322, green: 0.584, blue: 1.0)
    static let msGreenDark = Color(red: 0, green: 0.337, blue: 0.702)
    static let msRed = Color(red: 1.0, green: 0.271, blue: 0.227)
    static let msOrange = Color(red: 1.0, green: 0.584, blue: 0.0)
    static let msYellow = Color(red: 1.0, green: 0.8, blue: 0.0)
    static let msGold = Color(red: 1.0, green: 0.843, blue: 0.0)
    static let msOnline = Color.green

    static let textPrimary = Color.primary
    static let textSecondary = Color.secondary
    static let textMuted = Color.gray.opacity(0.6)

    static let bgPrimary = Color(.systemBackground)
    static let bgSecondary = Color(.secondarySystemBackground)
    static let bgTertiary = Color(.tertiarySystemBackground)
    static let bgChat = Color(.systemBackground)

    static let bubbleMine = Color(.systemGray5)
    static let bubbleTheirs = Color(.systemGray6)

    static let borderColor = Color(.separator).opacity(0.3)
}
