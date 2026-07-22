import SwiftUI

struct CreateGroupChannelView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var theme = ThemeManager.shared
    @State private var isChannel = false
    @State private var name = ""
    @State private var about = ""
    @State private var error: String?
    @State private var loading = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                VStack(spacing: 8) {
                    Text(isChannel ? "Создать канал" : "Создать группу")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                    Text(isChannel ? "Канал для публикаций" : "Группа для общения")
                        .font(.system(size: 15))
                        .foregroundColor(.white.opacity(0.4))
                }

                HStack(spacing: 4) {
                    Button(action: { withAnimation { isChannel = false } }) {
                        Text("Группа")
                            .font(.system(size: 15, weight: isChannel ? .regular : .semibold))
                            .foregroundColor(isChannel ? .white.opacity(0.4) : .white)
                            .padding(.vertical, 10)
                            .padding(.horizontal, 24)
                            .background(!isChannel ? Color.white.opacity(0.1) : Color.clear)
                            .cornerRadius(20)
                    }.buttonStyle(.plain)

                    Button(action: { withAnimation { isChannel = true } }) {
                        Text("Канал")
                            .font(.system(size: 15, weight: isChannel ? .semibold : .regular))
                            .foregroundColor(isChannel ? .white : .white.opacity(0.4))
                            .padding(.vertical, 10)
                            .padding(.horizontal, 24)
                            .background(isChannel ? Color.white.opacity(0.1) : Color.clear)
                            .cornerRadius(20)
                    }.buttonStyle(.plain)
                }

                VStack(spacing: 16) {
                    HStack(spacing: 12) {
                        Image(systemName: "textformat")
                            .font(.system(size: 16))
                            .foregroundColor(Color(hex: "#6C63FF"))
                            .frame(width: 24)
                        TextField("Название", text: $name)
                            .font(.system(size: 16))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(12)

                    HStack(spacing: 12) {
                        Image(systemName: "text.word.spacing")
                            .font(.system(size: 16))
                            .foregroundColor(Color(hex: "#6C63FF"))
                            .frame(width: 24)
                        TextField("Описание (необязательно)", text: $about)
                            .font(.system(size: 16))
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(12)
                }
                .padding(.horizontal, 40)

                if let error {
                    Text(error)
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#FF453A"))
                }

                Button(action: create) {
                    if loading { ProgressView().tint(.white) }
                    else {
                        Text("Создать")
                            .font(.system(size: 17, weight: .semibold))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(name.isEmpty ? Color.white.opacity(0.15) : Color(hex: "#6C63FF"))
                .foregroundColor(name.isEmpty ? .white.opacity(0.3) : .white)
                .cornerRadius(14)
                .disabled(name.isEmpty || loading)
                .padding(.horizontal, 40)

                Spacer(minLength: 40)
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }
        }
        .preferredColorScheme(theme.isDark ? .dark : .light)
    }

    private func create() {
        loading = true; error = nil
        Task {
            do {
                let _: EmptyResponse = try await APIClient.shared.request(
                    isChannel ? "/channels" : "/groups",
                    method: "POST",
                    body: try JSONEncoder().encode(["name": name, "about": about.isEmpty ? nil : about])
                )
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }
}
