import SwiftUI

struct ChatDetailView: View {
    let chat: Chat
    @State private var messages: [Message] = []
    @State private var text = ""
    @ObservedObject private var ws = WebSocketService.shared
    @ObservedObject private var theme = ThemeManager.shared
    @FocusState private var isInputFocused: Bool
    @Environment(\.dismiss) private var dismiss
    @State private var replyTo: Message?

    private let ownUUID = UserDefaults.standard.string(forKey: "user_uuid") ?? ""

    var body: some View {
        VStack(spacing: 0) {
            chatHeader

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(messages) { msg in
                            MessageBubbleView(message: msg, isOwn: msg.senderId == ownUUID).id(msg.id)
                        }
                    }.padding(.horizontal, 12).padding(.top, 8)
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: messages.count) { _ in
                    if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                }
                .onAppear {
                    if let last = messages.last { proxy.scrollTo(last.id, anchor: .bottom) }
                }
            }

            if replyTo != nil { replyBar }
            messageInput
        }
        .background(theme.chatBg.ignoresSafeArea())
        .task { await load() }
        .onReceive(ws.$newMessage) { msg in
            guard let msg, msg.chatId == chat.id else { return }
            if !messages.contains(where: { $0.id == msg.id }) { messages.append(msg) }
        }
    }

    // MARK: - Reply Bar

    private var replyBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Ответ \(replyTo?.senderName ?? "")")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(theme.accent)
                Text(replyTo?.text ?? "")
                    .font(.system(size: 13))
                    .foregroundColor(theme.textSecondary)
                    .lineLimit(2)
            }
            Spacer()
            Button(action: { replyTo = nil }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundColor(theme.textSecondary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(theme.surfaceColor)
        .overlay(alignment: .top) { Divider().background(theme.borderColor) }
    }

    // MARK: - Telegram-Style Header

    private var chatHeader: some View {
        let peer = chat.peer
        let isOnline = peer?.online ?? false

        return HStack(spacing: 0) {
            // Back button + unread badge
            Button(action: { dismiss() }) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(theme.accent)
                        .frame(width: 40, height: 40)

                    if let unread = chat.unreadCount, unread > 0 {
                        Text("\(unread)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(hex: "#6C63FF"))
                            .clipShape(Capsule())
                            .offset(x: 4, y: -2)
                    }
                }
            }

            // Name + status capsule
            Button(action: {}) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(chat.name ?? "Чат")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                        .lineLimit(1)

                    HStack(spacing: 4) {
                        if isOnline {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 6, height: 6)
                        }
                        Text(statusText)
                            .font(.system(size: 12))
                            .foregroundColor(isOnline ? .green : theme.textSecondary)
                    }
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(theme.isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.04))
                )
            }

            Spacer()

            // Avatar
            Button(action: {}) {
                ZStack {
                    Circle()
                        .fill(peer?.profileColor.map { Color(hex: $0) } ?? theme.cardColor)
                        .frame(width: 40, height: 40)

                    if let avatar = peer?.avatar, let url = URL(string: avatar) {
                        AsyncImage(url: url) { img in
                            img.resizable().scaledToFill()
                        } placeholder: {
                    Text(peer?.name.prefix(1).uppercased() ?? "?")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)
                        }
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())
                    } else {
                        Text(peer?.name?.prefix(1).uppercased() ?? "?")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 8)
        .background(theme.surfaceColor)
        .overlay(alignment: .bottom) { Divider().background(theme.borderColor) }
    }

    private var statusText: String {
        let peer = chat.peer
        if peer?.online == true { return "в сети" }
        if let ts = peer?.lastSeen {
            let diff = Date().timeIntervalSince1970 - Double(ts) / 1000
            let mins = Int(diff / 60)
            if mins < 1 { return "только что" }
            if mins < 60 { return "\(mins) мин. назад" }
            let hours = mins / 60
            if hours < 24 { return "\(hours) ч. назад" }
            let days = hours / 24
            return "\(days) дн. назад"
        }
        return ""
    }

    // MARK: - Glass Input Bar

    private var messageInput: some View {
        HStack(spacing: 10) {
            // Paperclip — dark circle
            Button(action: {}) {
                Image(systemName: "paperclip")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(
                        Circle()
                            .fill(theme.isDark ? Color.white.opacity(0.12) : Color.black.opacity(0.08))
                    )
            }

            // Glass text field with emoji
            HStack(spacing: 6) {
                TextField("", text: $text)
                    .focused($isInputFocused)
                    .foregroundColor(theme.inputText)
                    .tint(theme.accent)
                    .placeholder(when: text.isEmpty && !isInputFocused) {
                        Text("Сообщение")
                            .foregroundColor(theme.textSecondary)
                            .allowsHitTesting(false)
                    }

                if !text.trimmingCharacters(in: .whitespaces).isEmpty {
                    Button(action: {}) {
                        Image(systemName: "face.smiling")
                            .font(.system(size: 20))
                            .foregroundColor(theme.textSecondary)
                    }
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 22)
                    .fill(theme.isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05))
                    .overlay(
                        RoundedRectangle(cornerRadius: 22)
                            .stroke(theme.isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08), lineWidth: 0.5)
                    )
            )

            // Mic / Send
            if text.trimmingCharacters(in: .whitespaces).isEmpty {
                Button(action: {}) {
                    Image(systemName: "mic.fill")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(
                            Circle()
                                .fill(theme.isDark ? Color.white.opacity(0.12) : Color.black.opacity(0.08))
                        )
                }
            } else {
                Button(action: send) {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(
                            Circle()
                                .fill(theme.accent)
                        )
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(theme.surfaceColor)
        .overlay(alignment: .top) { Divider().background(theme.borderColor) }
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
                    .foregroundColor(isOwn ? theme.bubbleOwnText : theme.textPrimary)
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
