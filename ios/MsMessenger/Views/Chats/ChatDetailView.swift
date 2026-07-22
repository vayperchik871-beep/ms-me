import SwiftUI

struct ChatDetailView: View {
    let chat: Chat
    @State private var messages: [Message] = []
    @State private var text = ""
    @ObservedObject private var ws = WebSocketService.shared
    @ObservedObject private var theme = ThemeManager.shared
    @FocusState private var isInputFocused: Bool
    @Environment(\.dismiss) private var dismiss

    private let ownUUID = UserDefaults.standard.string(forKey: "user_uuid") ?? ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(messages) { msg in
                            MessageBubbleView(message: msg, isOwn: msg.senderId == ownUUID).id(msg.id)
                        }
                    }.padding(.horizontal, 12).padding(.top, 8)
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: messages.count, initial: false) { _, _ in
                    if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                }
            }

            messageInput
        }
        .background(theme.chatBg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Color.clear, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                }
            }
            ToolbarItem(placement: .principal) {
                HStack(spacing: 10) {
                    if let avatar = chat.avatar, let url = URL(string: avatar) {
                        AsyncImage(url: url) { img in
                            img.resizable().scaledToFill()
                        } placeholder: {
                            Image(systemName: chat.isGroup == true ? "person.2.fill" : "person.fill")
                                .foregroundColor(theme.textPrimary)
                        }
                        .frame(width: 32, height: 32)
                        .clipShape(Circle())
                    } else {
                        Image(systemName: chat.isGroup == true ? "person.2.fill" : "person.fill")
                            .font(.system(size: 14))
                            .foregroundColor(theme.textPrimary)
                            .frame(width: 32, height: 32)
                            .background(theme.inputBg)
                            .clipShape(Circle())
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(chat.name ?? "Чат")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(theme.textPrimary)
                            .lineLimit(1)
                        Text(ws.isConnected ? "online" : "offline")
                            .font(.system(size: 11))
                            .foregroundColor(ws.isConnected ? theme.success : theme.textSecondary)
                    }
                }
            }
        }
        .task { await load() }
        .onReceive(ws.$newMessage) { msg in
            guard let msg, msg.chatId == chat.id else { return }
            if !messages.contains(where: { $0.id == msg.id }) { messages.append(msg) }
        }
    }

    // MARK: - Message Input

    private var messageInput: some View {
        HStack(spacing: 10) {
            Button(action: {}) {
                Image(systemName: "paperclip")
                    .font(.system(size: 20))
                    .foregroundColor(theme.textSecondary)
            }

            HStack(spacing: 0) {
                TextField("", text: $text)
                    .focused($isInputFocused)
                    .foregroundColor(theme.inputText)
                    .tint(theme.accent)
                    .placeholder(when: text.isEmpty && !isInputFocused) {
                        Text("Message")
                            .foregroundColor(theme.textSecondary)
                            .allowsHitTesting(false)
                    }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(theme.inputBg)
            .cornerRadius(20)

            Button(action: {}) {
                Image(systemName: "face.smiling")
                    .font(.system(size: 20))
                    .foregroundColor(theme.textSecondary)
            }

            if text.trimmingCharacters(in: .whitespaces).isEmpty {
                Button(action: {}) {
                    Image(systemName: "mic.fill")
                        .font(.system(size: 20))
                        .foregroundColor(theme.textSecondary)
                }
            } else {
                Button(action: send) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 30))
                        .foregroundColor(theme.accent)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(theme.surfaceColor)
    }

    // MARK: - Helpers

    private func load() async {
        do {
            messages = try await APIClient.shared.getMessages(chatId: chat.id).messages
            _ = try await APIClient.shared.readChat(chatId: chat.id)
        } catch { print(error) }
    }

    private func send() {
        let t = text.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return }
        text = ""
        Task {
            do {
                if let msg = try await APIClient.shared.sendMessage(chatId: chat.id, text: t).message {
                    messages.append(msg)
                }
            } catch { print(error) }
        }
    }
}

// MARK: - Message Bubble

struct MessageBubbleView: View {
    let message: Message
    let isOwn: Bool
    @ObservedObject private var theme = ThemeManager.shared

    var body: some View {
        HStack {
            if isOwn { Spacer(minLength: 40) }
            VStack(alignment: isOwn ? .trailing : .leading, spacing: 2) {
                if let reply = message.replyTo {
                    Text((reply.senderName ?? "") + ": ").font(.caption2).bold() + Text(reply.text ?? "").font(.caption2).foregroundColor(theme.textSecondary)
                }
                Text(message.text ?? "")
                    .font(.system(size: 16))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isOwn ? theme.bubbleOwn : theme.bubbleOther)
                    .foregroundColor(isOwn ? .white : theme.textPrimary)
                    .cornerRadius(18)
                    .fixedSize(horizontal: false, vertical: true)
                if let reactions = message.reactions, !reactions.isEmpty {
                    HStack(spacing: 2) {
                        ForEach(reactions, id: \.userId) { r in
                            Text(r.emoji).font(.caption2)
                        }
                    }
                }
            }
            if !isOwn { Spacer(minLength: 40) }
        }.padding(.horizontal, 8)
    }
}

// MARK: - TextField Placeholder

extension View {
    func placeholder<Content: View>(when condition: Bool, @ViewBuilder content: () -> Content) -> some View {
        ZStack(alignment: .leading) {
            if condition { content() }
            self
        }
    }
}
