import SwiftUI

struct CallsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var number = "+777"
    @State private var searchResult: User?
    @State private var error: String?
    @State private var loading = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                Text("Введите номер пользователя")
                    .font(.title2).bold()
                    .foregroundColor(theme.textPrimary)
                Text("Начните вводить +777...")
                    .font(.subheadline)
                    .foregroundColor(theme.textSecondary)

                TextField("+777XXXXXXXX", text: $number)
                    .font(.title)
                    .keyboardType(.phonePad)
                    .multilineTextAlignment(.center)
                    .padding()
                    .background(theme.surfaceColor)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                    .padding(.horizontal, 40)
                    .onChange(of: number) { _, _ in search() }

                if loading {
                    ProgressView()
                } else if let user = searchResult {
                    VStack(spacing: 16) {
                        ZStack {
                            Circle().fill(theme.accent.opacity(0.2)).frame(width: 72, height: 72)
                            Text(user.name.prefix(1).uppercased()).font(.largeTitle).foregroundColor(theme.accent)
                        }
                        Text(user.name).font(.title3).bold().foregroundColor(theme.textPrimary)
                        Text("@\(user.userId)").font(.subheadline).foregroundColor(theme.textSecondary)
                        HStack(spacing: 24) {
                            Button(action: call) {
                                VStack(spacing: 8) {
                                    ZStack {
                                        Circle().fill(.green).frame(width: 56, height: 56)
                                        Image(systemName: "phone.fill").font(.title2).foregroundColor(.white)
                                    }
                                    Text("Позвонить").font(.caption).foregroundColor(theme.textSecondary)
                                }
                            }
                            Button(action: addContact) {
                                VStack(spacing: 8) {
                                    ZStack {
                                        Circle().fill(theme.accent).frame(width: 56, height: 56)
                                        Image(systemName: "person.crop.circle.badge.plus").font(.title2).foregroundColor(.white)
                                    }
                                    Text("В контакты").font(.caption).foregroundColor(theme.textSecondary)
                                }
                            }
                        }
                    }
                } else if let error {
                    Text(error).font(.caption).foregroundColor(theme.error)
                }

                Spacer()
            }
            .background(theme.backgroundColor)
            .navigationTitle("Звонки")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    private func search() {
        guard number.count >= 10 else { searchResult = nil; error = nil; return }
        loading = true; error = nil
        Task {
            do {
                let resp = try await APIClient.shared.searchUsers(query: number)
                searchResult = resp.users.first
                if searchResult == nil { error = "Пользователь не найден" }
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }

    private func call() {
        guard let user = searchResult else { return }
        print("Calling \(user.userId)...")
    }

    private func addContact() {
        guard let user = searchResult else { return }
        Task {
            do {
                _ = try await APIClient.shared.addContact(userId: user.userId)
            } catch { self.error = error.localizedDescription }
        }
    }
}
