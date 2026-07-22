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
            VStack(spacing: 24) {
                Picker("Тип", selection: $isChannel) {
                    Text("Группа").tag(false)
                    Text("Канал").tag(true)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Название").font(.caption).foregroundColor(theme.textSecondary)
                        TextField("Название \(isChannel ? "канала" : "группы")", text: $name)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(theme.surfaceColor)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Описание").font(.caption).foregroundColor(theme.textSecondary)
                        TextField("Описание (необязательно)", text: $about)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(theme.surfaceColor)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderColor, lineWidth: 1))
                    }
                }
                .padding(.horizontal)

                if let error { Text(error).font(.caption).foregroundColor(theme.error) }

                Button(action: create) {
                    if loading { ProgressView().tint(.white) }
                    else { Text("Создать \(isChannel ? "канал" : "группу")").font(.headline).bold() }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(name.isEmpty ? theme.borderColor : theme.accent)
                .foregroundColor(name.isEmpty ? theme.textSecondary : .white)
                .cornerRadius(14)
                .disabled(name.isEmpty || loading)
                .padding(.horizontal)

                Spacer()
            }
            .padding(.top, 24)
            .background(theme.backgroundColor)
            .navigationTitle(isChannel ? "Создать канал" : "Создать группу")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Отмена") { dismiss() } } }
        }
    }

    private func create() {
        loading = true; error = nil
        Task {
            do {
                let resp: EmptyResponse = try await APIClient.shared.request(
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
