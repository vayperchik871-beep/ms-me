import SwiftUI

struct ProfileView: View {
    let user: User
    @State private var newName = ""
    @State private var saving = false
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        Form {
            Section("Профиль") {
                HStack {
                    Spacer()
                    ZStack {
                        Circle().fill(theme.accent.opacity(0.2)).frame(width: 80, height: 80)
                        Text(user.name.prefix(1).uppercased())
                            .font(.largeTitle).foregroundColor(theme.accent)
                    }
                    Spacer()
                }

                HStack {
                    Text("ID")
                    Spacer()
                    Text("@\(user.userId)").foregroundColor(theme.textSecondary)
                }

                HStack {
                    Text("Имя")
                    Spacer()
                    TextField("Имя", text: $newName)
                        .multilineTextAlignment(.trailing)
                        .onAppear { newName = user.name }
                }

                Button("Сохранить") {
                    saving = true
                    Task {
                        do {
                            _ = try await APIClient.shared.updateProfile(["name": newName])
                        } catch { print("Update error: \(error)") }
                        saving = false
                    }
                }
                .disabled(saving || newName.isEmpty)
            }

            if let mcoins = user.mcoins {
                Section("Монеты") {
                    HStack {
                        Image(systemName: "bitcoinsign.circle.fill")
                            .foregroundColor(.yellow)
                        Text("\(mcoins) MCoins")
                    }
                }
            }
        }
        .navigationTitle("Профиль")
    }
}
