import Foundation

struct Chat: Codable, Identifiable, Hashable {
    let id: String
    let type: String
    var name: String?
    var avatar: String?
    var lastMessage: Message?
    var unreadCount: Int?
    var participants: [ChatParticipant]?
    var isPinned: Bool?
    var createdAt: Int?
}

struct ChatParticipant: Codable, Identifiable, Hashable {
    let userId: String
    let name: String
    var avatar: String?
    var lastRead: Int?
    var isOnline: Bool?
    var id: String { userId }
}

struct ChatListResponse: Codable { let chats: [Chat] }
