import Foundation

struct Chat: Codable, Identifiable, Equatable {
    let id: String
    let peer: ChatPeer?
    let lastMessage: String?
    let lastTime: String?
    let unread: Int
}

struct ChatPeer: Codable, Equatable {
    let id: String
    let userId: String
    let name: String
    let isSystem: Bool?
    let avatar: String?
    let online: Bool?
    let lastSeen: Int?
    let profileColor: String?
}

struct ChatsResponse: Codable {
    let chats: [Chat]
}

struct MessagesResponse: Codable {
    let messages: [Message]
}

struct SendMessageResponse: Codable {
    let message: Message
}

struct ReadResponse: Codable {
    let ok: Bool
}

struct PinResponse: Codable {
    let pinned: Bool
}

struct ReactResponse: Codable {
    let reactions: [Reaction]
}

struct EditMessageBody: Codable {
    let text: String
}
