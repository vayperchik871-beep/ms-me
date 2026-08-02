import SwiftUI

struct ProfileTabView: View {
    @State private var user: User?
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        NavigationStack {
            Group {
                if let user {
                    ProfileView(user: user, isOwnProfile: true)
                } else {
                    VStack {
                        ProgressView()
                            .tint(theme.accent)
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
        .tint(theme.accent)
        .task { await loadUser() }
    }

    private func loadUser() async {
        do {
            let resp = try await APIClient.shared.me()
            user = resp.user
        } catch { print(error) }
    }
}
