import SwiftUI

struct ProfileView: View {
    let user: User
    @State private var newName = ""
    @State private var saving = false

    var body: some View {
        Form {
            Section("Профиль") {
                HStack { Spacer(); ZStack { Circle().fill(ThemeManager.shared.accent.opacity(0.2)).frame(width: 72, height: 72); Text(user.name.prefix(1).uppercased()).font(.largeTitle).foregroundColor(ThemeManager.shared.accent) }; Spacer() }
                HStack { Text("ID"); Spacer(); Text("@\(user.userId)").foregroundColor(ThemeManager.shared.textSecondary) }
                HStack { Text("Имя"); Spacer(); TextField("Имя", text: $newName).multilineTextAlignment(.trailing).onAppear { newName = user.name } }
                Button("Сохранить") { saving = true; Task { do { _ = try await APIClient.shared.updateProfile(["name": newName]) } catch { print(error) }; saving = false } }.disabled(saving || newName.isEmpty)
            }
            if let mcoins = user.mcoins { Section("Монеты") { HStack { Image(systemName: "bitcoinsign.circle.fill").foregroundColor(.yellow); Text("\(mcoins) MCoins") } } }
        }
        .navigationTitle("Профиль")
        .toolbarBackground(ThemeManager.shared.isDark ? Color.black : Color(.systemGroupedBackground), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }
}
