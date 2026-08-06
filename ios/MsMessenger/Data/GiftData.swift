import Foundation

struct Rarities {
    static let common = "common"
    static let rare = "rare"
    static let epic = "epic"
    static let legendary = "legendary"
    static let mythic = "mythic"
}

struct Categories {
    static let all = "all"
    static let popular = "popular"
    static let new = "new"
    static let limited = "limited"
    static let collectible = "collectible"
}

let categories = ["all", "popular", "new", "limited", "collectible"]

let categoryLabels: [String: String] = [
    "all": "Все",
    "popular": "Популярные",
    "new": "Новые",
    "limited": "Лимитированные",
    "collectible": "Коллекционные",
]

let rarityColors: [String: String] = [
    Rarities.common: "#8e8e93",
    Rarities.rare: "#5ac8fa",
    Rarities.epic: "#af52de",
    Rarities.legendary: "#ff9500",
    Rarities.mythic: "#ff3b30",
]

let rarityLabels: [String: String] = [
    Rarities.common: "Обычный",
    Rarities.rare: "Редкий",
    Rarities.epic: "Эпический",
    Rarities.legendary: "Легендарный",
    Rarities.mythic: "Мифический",
]

let allGifts: [Gift] = [
    Gift(id: "lisa", name: "Лиса", description: "Хитрая рыжая лиса — символ очарования и хитрости.", icon: "🦊", price: 50, rarity: Rarities.common, category: "popular", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ff9500", "#ff3b30"], imageName: "GiftFox"),
    Gift(id: "vapka", name: "Лицо", description: "Забавное лицо, которое поднимет настроение.", icon: "😀", price: 25, rarity: Rarities.common, category: "popular", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#5ac8fa", "#64d2ff"], imageName: "GiftFace"),
]