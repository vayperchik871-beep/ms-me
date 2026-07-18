import Foundation

struct WSMessage: Codable {
    let type: String
    let chatId: String?
    let message: Message?
    let messageId: String?
    let userId: String?
    let isTyping: Bool?
    let lastRead: Int?
}

struct TypingMessage: Codable {
    let type: String
    let chatId: String
    let isTyping: Bool
}
