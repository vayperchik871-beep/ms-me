import SwiftUI

struct ChatDetailView: View {
    let chat: Chat
    @State private var messages: [Message] = []
    @State private var text = ""
    @ObservedObject private var ws = WebSocketService.shared
    @ObservedObject private var theme = ThemeManager.shared
    @FocusState private var isInputFocused: Bool
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider().background(Color.white.opacity(0.08))

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(messages) { msg in
                            MessageBubbleView(message: msg, isOwn: msg.senderId == UserDefaults.standard.string(forKey: "user_id")).id(msg.id)
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
        .background(theme.bgColor.ignoresSafeArea())
        .navigationBarHidden(true)
        .task { await load() }
        .onReceive(ws.$newMessage) { msg in
            guard let msg, msg.chatId == chat.id else { return }
            if !messages.contains(where: { $0.id == msg.id }) { messages.append(msg) }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 12) {
            Button { dismiss() } label: {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left").font(.system(size: 17, weight: .semibold))
                    if messages.count > 0 {
                        Text("\(messages.count)")
                            .font(.system(size: 14, weight: .medium))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.12))
                            .cornerRadius(12)
                    }
                }.foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(chat.name ?? "Чат")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.white)
                Text(ws.isConnected ? "в сети" : "не в сети")
                    .font(.system(size: 13))
                    .foregroundColor(ws.isConnected ? Color.green : Color.gray)
            }

            Spacer()

            if let avatar = chat.avatar, let url = URL(string: avatar) {
                AsyncImage(url: url) { img in
                    img.resizable().scaledToFill()
                } placeholder: {
                    Image(systemName: chat.isGroup == true ? "person.2.fill" : "person.fill")
                        .foregroundColor(.white)
                }
                .frame(width: 36, height: 36)
                .clipShape(Circle())
            } else {
                Image(systemName: chat.isGroup == true ? "person.2.fill" : "person.fill")
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(Color.white.opacity(0.15))
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.06))
                .padding(.horizontal, 8)
        )
        .padding(.horizontal, 4)
        .padding(.top, 8)
    }

    // MARK: - Message Input

    private var messageInput: some View {
        HStack(spacing: 10) {
            Button(action: {}) {
                Image(systemName: "paperclip")
                    .font(.system(size: 22))
                    .foregroundColor(.white.opacity(0.6))
            }

            HStack {
                TextField("", text: $text)
                    .focused($isInputFocused)
                    .foregroundColor(.white)
                    .tint(Color(hex: "#6C63FF"))
                if text.isEmpty && !isInputFocused {
                    Text("Сообщение")
                        .foregroundColor(.white.opacity(0.3))
                        .allowsHitTesting(false)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.white.opacity(0.1))
            .cornerRadius(22)

            Button(action: {}) {
                Image(systemName: "face.smiling")
                    .font(.system(size: 22))
                    .foregroundColor(.white.opacity(0.6))
            }

            if text.trimmingCharacters(in: .whitespaces).isEmpty {
                Button(action: {}) {
                    Image(systemName: "mic.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.white.opacity(0.6))
                }
            } else {
                Button(action: send) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.06))
                .padding(.horizontal, 8)
        )
        .padding(.horizontal, 4)
        .padding(.bottom, 8)
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
    @Environment(\.dynamicTypeSize) private var typeSize

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
                    .background(
                        isOwn
                            ? AnyShapeStyle(Color(hex: "#6C63FF"))
                            : AnyShapeStyle(Color.white.opacity(0.1))
                    )
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
