import SwiftUI

struct ProfileTabView: View {
    @State private var user: User?
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        NavigationStack {
            Group {
                if let user {
                    ProfileView(user: user)
                } else {
                    VStack {
                        ProgressView()
                            .tint(Color(hex: "#6C63FF"))
                        Text("Загрузка...")
                            .font(.system(size: 15))
                            .foregroundColor(theme.textSecondary)
                            .padding(.top, 8)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .background(theme.bgColor.ignoresSafeArea())
        }
        .tint(Color(hex: "#6C63FF"))
        .task { await loadUser() }
    }

    private func loadUser() async {
        do {
            let resp = try await APIClient.shared.me()
            user = resp.user
        } catch { print(error) }
    }
}
