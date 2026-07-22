import Foundation

struct Chat: Codable, Identifiable, Hashable {
    let id: String
    let peer: Peer?
    let lastMessage: String?
    let lastTime: String?
    let unread: Int?

    var name: String? { peer?.name }
    var unreadCount: Int? { unread }
}

struct Peer: Codable, Hashable {
    let id: String
    let userId: String
    let name: String
    let isSystem: Bool?
    let avatar: String?
    let profileColor: String?
    let online: Bool?
    let lastSeen: Int?
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
struct AddContactResponse: Codable { let contact: User; let chatId: String }
