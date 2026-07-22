import SwiftUI

struct AdminTerminalView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var command = ""
    @State private var history: [(type: String, text: String)] = []
    @State private var loading = false
    @ObservedObject private var theme = ThemeManager.shared
    @FocusState private var isInputFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 2) {
                        ForEach(history.indices, id: \.self) { i in
                            Text(history[i].text).font(.system(.caption, design: .monospaced)).foregroundColor(colorFor(history[i].type)).textSelection(.enabled)
                        }
                    }.padding(12)
                }.background(theme.terminalBg)
                HStack(spacing: 8) {
                    Text(">").font(.system(.body, design: .monospaced)).foregroundColor(theme.terminalGreen)
                    TextField("введите команду...", text: $command).font(.system(.body, design: .monospaced)).foregroundColor(theme.terminalText).autocapitalization(.none).disableAutocorrection(true).focused($isInputFocused).onSubmit(submit)
                    if loading { ProgressView().scaleEffect(0.7) }
                }.padding(12).background(Color(hex: "#1a1a1a"))
            }
            .navigationTitle("Терминал").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Закрыть") { dismiss() } } }
            .onAppear { history.append(("system", "Терминал администратора. Введите help для списка команд.")) }
        }
    }

    private func colorFor(_ type: String) -> Color {
        switch type { case "input": return theme.terminalGreen; case "error": return theme.terminalRed; case "system": return Color(hex: "#6272a4"); default: return theme.terminalText }
    }

    private func submit() {
        let cmd = command.trimmingCharacters(in: .whitespaces); guard !cmd.isEmpty else { return }
        history.append(("input", "> \(cmd)")); command = ""
        if cmd.lowercased() == "clear" { history.removeAll(); return }
        loading = true
        Task { do { let resp = try await APIClient.shared.adminCommand(cmd); history.append(("output", resp.output)) } catch { history.append(("error", "Ошибка: \(error.localizedDescription)")) }; loading = false }
    }
}
