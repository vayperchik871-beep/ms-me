import SwiftUI

struct ChatWindowView: View {
    let chatId: String
    let onBack: () -> Void

    @StateObject private var i18n = I18n.shared
    @EnvironmentObject var auth: AuthManager

    @State private var chat: Chat?
    @State private var messages: [Message] = []
    @State private var replyTo: Message?
    @State private var editId: String?
    @State private var typingUserId: String?
    @State private var otherUnread = 0
    @State private var profileUserId: String?
    @State private var isLoading = true

    private var peer: ChatPeer? { chat?.peer }

    private var statusText: String {
        if typingUserId != nil { return i18n.t("печатает...") }
        if peer?.online == true { return i18n.t("в сети") }
        return ""
    }

    var body: some View {
        VStack(spacing: 0) {
            ChatHeaderView(
                peer: peer,
                typingUserId: typingUserId,
                otherUnread: otherUnread,
                onBack: onBack,
                onTapCenter: { profileUserId = peer?.userId },
                onTapAvatar: { profileUserId = peer?.userId }
            )

            messagesView

            if let reply = replyTo {
                replyBar(reply)
            }

            InputBarView(
                chatId: chatId,
                onSend: handleSend,
                editText: editId != nil ? messages.first(where: { $0.id == editId })?.text : nil,
                onCancelEdit: { editId = nil }
            )
        }
        .task { await loadChat() }
        .onReceive(NotificationCenter.default.publisher(for: .wsMessage)) { notification in
            guard let msg = notification.object as? WSMessage else { return }
            handleWSMessage(msg)
        }
        .fullScreenCover(item: $profileUserId.map(UserIdWrapper.init)) { wrapper in
            UserProfileModalView(userId: wrapper.id, onClose: { profileUserId = nil })
        }
    }

    private var messagesView: some View {
        ScrollViewReader { proxy in
            if messages.isEmpty && !isLoading {
                VStack(spacing: 16) {
                    Spacer()
                    Text("👋 🤝 ✌️").font(.largeTitle)
                    Text("Start a conversation").foregroundColor(.secondary)
                    Spacer()
                }
                .frame(maxWidth: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(messages) { msg in
                            MessageBubbleView(
                                message: msg,
                                isMine: msg.senderId == auth.user?.id,
                                onLongPress: {}
                            )
                            .id(msg.id)
                        }
                    }
                    .padding(.vertical, 8)
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last { proxy.scrollTo(last.id, anchor: .bottom) }
                }
            }
        }
        .background(Color(.systemBackground))
    }

    private func replyBar(_ message: Message) -> some View {
        HStack {
            Image(systemName: "arrowshape.turn.up.left")
                .foregroundColor(.msGreen)
            VStack(alignment: .leading, spacing: 1) {
                Text(i18n.t("Ответить")).font(.caption.weight(.semibold)).foregroundColor(.msGreen)
                Text(message.text ?? "").font(.caption).foregroundColor(.secondary).lineLimit(1)
            }
            Spacer()
            Button { replyTo = nil } label: {
                Image(systemName: "xmark").font(.caption).foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial)
    }

    private func loadChat() async {
        isLoading = true
        do {
            async let chatsResp = APIClient.shared.getChats()
            async let msgsResp = APIClient.shared.getMessages(chatId: chatId)
            let (chats, msgs) = try await (chatsResp, msgsResp)
            if let c = chats.chats.first(where: { $0.id == chatId }) {
                chat = c
                otherUnread = chats.chats.filter { $0.id != chatId }.reduce(0) { $0 + $1.unread }
            }
            messages = msgs.messages
            _ = try? await APIClient.shared.readChat(chatId: chatId)
        } catch {}
        isLoading = false
    }

    private func handleSend(_ text: String, _ attachment: Attachment?) {
        Task {
            if let eid = editId, !text.isEmpty {
                _ = try? await APIClient.shared.editMessage(id: eid, text: text)
                if let idx = messages.firstIndex(where: { $0.id == eid }) {
                    messages[idx].text = text
                }
                editId = nil
            } else {
                let optMsg = Message(id: UUID().uuidString, chatId: chatId, senderId: auth.user?.id ?? "",
                                     text: text, createdAt: Int(Date().timeIntervalSince1970 * 1000),
                                     reactions: nil, attachment: attachment)
                messages.append(optMsg)
                _ = try? await APIClient.shared.sendMessage(chatId: chatId, text: text, attachment: attachment)
            }
        }
    }

    private func handleWSMessage(_ msg: WSMessage) {
        switch msg.type {
        case "new_message":
            if let m = msg.message, m.chatId == chatId, !messages.contains(where: { $0.id == m.id }) {
                messages.append(m)
            }
        case "message_updated":
            if let m = msg.message, let idx = messages.firstIndex(where: { $0.id == m.id }) {
                messages[idx] = m
            }
        case "message_deleted":
            if let mid = msg.messageId { messages.removeAll { $0.id == mid } }
        case "typing":
            if msg.chatId == chatId, let uid = msg.userId, let typing = msg.isTyping {
                typingUserId = typing && uid != auth.user?.id ? uid : nil
            }
        case "read_receipt":
            if msg.chatId == chatId {
                messages.indices.forEach { i in
                    if messages[i].senderId != auth.user?.id { messages[i].read = true }
                }
            }
        default: break
        }
    }
}

struct UserIdWrapper: Identifiable {
    let id: String
}
