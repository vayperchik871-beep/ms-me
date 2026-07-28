import Foundation

struct Gift: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let price: Int
    let rarity: String
    let category: String
    let limited: Bool
    let totalSupply: Int?
    let sold: Int?
    let expiresAt: String?
    let colors: [String]
}

struct ReceivedGift: Identifiable, Codable, Hashable {
    let id: String
    let giftId: String
    let fromUserId: String
    let fromUserName: String
    let timestamp: Date
}
