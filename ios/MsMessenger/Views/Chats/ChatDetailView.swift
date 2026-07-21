import SwiftUI

struct ChatDetailView: View {
    let chat: Chat
    @State private var messages: [Message] = []
    @State private var text = ""
    @ObservedObject private var ws = WebSocketService.shared
    @ObservedObject private var theme = ThemeManager.shared
    @FocusState private var isInputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(messages) { msg in
                            MessageBubbleView(message: msg, isOwn: msg.senderId == UserDefaults.standard.string(forKey: "user_id")).id(msg.id)
                        }
                    }.padding(.horizontal, 12)
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                }
            }
            HStack(spacing: 8) {
                TextField("Сообщение...", text: $text).textFieldStyle(.roundedBorder).focused($isInputFocused)
                Button(action: send) { Image(systemName: "arrow.up.circle.fill").font(.title2) }.disabled(text.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(theme.surfaceColor)
            .safeAreaInset(edge: .bottom) { Color.clear.frame(height: 0) }
        }
        .navigationTitle(chat.name ?? "Чат")
        .toolbarBackground(ThemeManager.shared.isDark ? Color.black : Color(.systemGroupedBackground), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task { await load() }
        .onReceive(ws.$newMessage) { msg in guard let msg, msg.chatId == chat.id else { return }; if !messages.contains(where: { $0.id == msg.id }) { messages.append(msg) } }
    }

    private func load() async {
        do { messages = try await APIClient.shared.getMessages(chatId: chat.id).messages; _ = try await APIClient.shared.readChat(chatId: chat.id) } catch { print(error) }
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
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        HStack {
            if isOwn { Spacer(minLength: 40) }
            VStack(alignment: isOwn ? .trailing : .leading, spacing: 2) {
                if let reply = message.replyTo { Text((reply.senderName ?? "") + ": ").font(.caption2).bold() + Text(reply.text ?? "").font(.caption2).foregroundColor(theme.textSecondary) }
                Text(message.text ?? "").padding(.horizontal, 12).padding(.vertical, 8).background(isOwn ? theme.accent : theme.cardColor).foregroundColor(isOwn ? .white : theme.textPrimary).cornerRadius(16).fixedSize(horizontal: false, vertical: true)
                if let reactions = message.reactions, !reactions.isEmpty { HStack(spacing: 2) { ForEach(reactions, id: \.userId) { r in Text(r.emoji).font(.caption2) } } }
            }
            if !isOwn { Spacer(minLength: 40) }
        }.padding(.horizontal, 8)
    }
}
