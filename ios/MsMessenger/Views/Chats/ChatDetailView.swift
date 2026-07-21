import SwiftUI

struct ChatDetailView: View {
    let chat: Chat
    @State private var messages: [Message] = []
    @State private var text = ""
    @ObservedObject private var ws = WebSocketService.shared
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(messages) { msg in
                        MessageBubbleView(message: msg, isOwn: msg.senderId == UserDefaults.standard.string(forKey: "user_id")).id(msg.id)
                    }
                }.padding(.horizontal)
            }
            HStack(spacing: 8) {
                TextField("Сообщение...", text: $text).textFieldStyle(.roundedBorder)
                Button(action: send) { Image(systemName: "arrow.up.circle.fill").font(.title2) }.disabled(text.trimmingCharacters(in: .whitespaces).isEmpty)
            }.padding().background(theme.surfaceColor)
        }.navigationTitle(chat.name ?? "Чат").task { await load() }
            .onReceive(ws.$newMessage) { msg in guard let msg, msg.chatId == chat.id else { return }; if !messages.contains(where: { $0.id == msg.id }) { messages.append(msg) } }
    }

    private func load() async {
        do { messages = try await APIClient.shared.getMessages(chatId: chat.id).messages; try await APIClient.shared.readChat(chatId: chat.id) } catch { print(error) }
    }

    private func send() {
        let t = text.trimmingCharacters(in: .whitespaces); guard !t.isEmpty else { return }; text = ""
        Task { do { if let msg = try await APIClient.shared.sendMessage(chatId: chat.id, text: t).message { messages.append(msg) } } catch { print(error) } }
    }
}

struct MessageBubbleView: View {
    let message: Message
    let isOwn: Bool
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        HStack {
            if isOwn { Spacer() }
            VStack(alignment: isOwn ? .trailing : .leading, spacing: 2) {
                if let reply = message.replyTo { Text((reply.senderName ?? "") + ": ").font(.caption2).bold() + Text(reply.text ?? "").font(.caption2).foregroundColor(theme.textSecondary) }
                Text(message.text ?? "").padding(10).background(isOwn ? theme.accent : theme.cardColor).foregroundColor(isOwn ? .white : theme.textPrimary).cornerRadius(14)
                if let reactions = message.reactions, !reactions.isEmpty { HStack(spacing: 2) { ForEach(reactions, id: \.userId) { r in Text(r.emoji).font(.caption2) } } }
            }
            if !isOwn { Spacer() }
        }.padding(.vertical, 2)
    }
}
