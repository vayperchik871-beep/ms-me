import Foundation

struct Message: Codable, Identifiable, Hashable {
    let id: String
    let chatId: String
    let senderId: String
    let senderName: String?
    let senderAvatar: String?
    var text: String?
    var attachment: Attachment?
    var replyTo: ReplyTo?
    var pinned: Bool?
    var editedAt: Int?
    var deleted: Bool?
    var createdAt: Int
    var reactions: [Reaction]?
    var read: Bool?
    var favorited: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case chatId
        case senderId
        case senderName
        case senderAvatar
        case text
        case attachment
        case replyTo
        case pinned
        case editedAt
        case deleted
        case createdAt
        case reactions
        case read
        case favorited
    }
}

struct Attachment: Codable, Hashable {
    let url: String?
    let type: String?
    let name: String?
    let size: Int?
    let duration: Int?
    let width: Int?
    let height: Int?
}

struct ReplyTo: Codable, Hashable {
    let id: String
    let text: String?
    let senderName: String?
}

struct Reaction: Codable, Hashable {
    let emoji: String
    let userId: String
}

struct MessagesResponse: Codable {
    let messages: [Message]
}

struct SendMessageResponse: Codable {
    let message: Message?
    let messageId: String?
}

struct WSMessage: Codable {
    let type: String
    let chatId: String?
    let message: Message?
    let userId: String?
    let isTyping: Bool?
}
