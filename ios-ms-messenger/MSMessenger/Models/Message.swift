import Foundation

struct Message: Codable, Identifiable, Equatable {
    let id: String
    let chatId: String
    let senderId: String
    let senderUserId: String?
    let senderName: String?
    var text: String?
    let replyTo: String?
    let pinned: Bool?
    let edited: Bool?
    let time: String?
    let createdAt: Int
    let reactions: [Reaction]?
    let attachment: Attachment?
    var read: Bool?

    static func == (lhs: Message, rhs: Message) -> Bool { lhs.id == rhs.id }
}

struct Reaction: Codable, Equatable {
    let emoji: String
    let user_id: String
}

struct Attachment: Codable {
    let url: String
    let type: String
    let name: String?
    let size: Int?
    let duration: Int?
}

struct SendMessageBody: Codable {
    let text: String?
    let replyTo: String?
    let attachment: Attachment?
}

struct ReactBody: Codable {
    let emoji: String
}
