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
    var imageName: String?

    init(id: String, name: String, description: String, icon: String, price: Int, rarity: String, category: String, limited: Bool, totalSupply: Int?, sold: Int?, expiresAt: String?, colors: [String], imageName: String? = nil) {
        self.id = id
        self.name = name
        self.description = description
        self.icon = icon
        self.price = price
        self.rarity = rarity
        self.category = category
        self.limited = limited
        self.totalSupply = totalSupply
        self.sold = sold
        self.expiresAt = expiresAt
        self.colors = colors
        self.imageName = imageName
    }

    private enum CodingKeys: String, CodingKey {
        case id, name, description, icon, price, rarity, category, limited, totalSupply, sold, expiresAt, colors, imageName
    }
}

struct ReceivedGift: Identifiable, Codable, Hashable {
    let id: String
    let giftId: String
    let fromUserId: String
    let fromUserName: String
    let timestamp: Date
}