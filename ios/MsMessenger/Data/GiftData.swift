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
    Gift(id: "rose", name: "Роза", description: "Классическая красная роза — символ страсти и любви.", icon: "🌹", price: 50, rarity: Rarities.common, category: "popular", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ff3b30", "#ff6b6b"]),
    Gift(id: "chocolate", name: "Шоколад", description: "Набор изысканных шоколадных конфет в подарочной упаковке.", icon: "🍫", price: 80, rarity: Rarities.common, category: "popular", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#8e8e93", "#636366"]),
    Gift(id: "diamond", name: "Бриллиант", description: "Редкий бриллиант чистейшей воды, достойный королей.", icon: "💎", price: 500, rarity: Rarities.rare, category: "popular", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#5ac8fa", "#64d2ff", "#34aadc"]),
    Gift(id: "fire", name: "Пламя", description: "Яркое пламя страсти, которое невозможно потушить.", icon: "🔥", price: 120, rarity: Rarities.rare, category: "new", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ff9500", "#ff3b30", "#ffcc02"]),
    Gift(id: "star", name: "Звезда", description: "Падающая звезда, исполняющая самые заветные желания.", icon: "🌟", price: 200, rarity: Rarities.epic, category: "popular", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ffcc02", "#ff9500", "#fff5cc"]),
    Gift(id: "crown", name: "Корона", description: "Корона правителя мира. Только для избранных.", icon: "👑", price: 1000, rarity: Rarities.epic, category: "collectible", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ffcc02", "#ff9500", "#af52de"]),
    Gift(id: "unicorn", name: "Единорог", description: "Мифическое существо, приносящее удачу и вдохновение.", icon: "🦄", price: 350, rarity: Rarities.epic, category: "new", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#af52de", "#5ac8fa", "#ffcc02"]),
    Gift(id: "dragon", name: "Дракон", description: "Легендарный дракон — символ силы, мудрости и могущества.", icon: "🐉", price: 2500, rarity: Rarities.legendary, category: "collectible", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ff9500", "#ff3b30", "#ffcc02", "#5ac8fa"]),
    Gift(id: "phoenix", name: "Феникс", description: "Птица бессмертия, возрождающаяся из пепла.", icon: "🦅", price: 3000, rarity: Rarities.legendary, category: "collectible", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ff3b30", "#ff9500", "#ffcc02", "#af52de"]),
    Gift(id: "galaxy", name: "Галактика", description: "Целая вселенная в твоих руках. Бесконечность и красота космоса.", icon: "🌌", price: 5000, rarity: Rarities.legendary, category: "limited", limited: true, totalSupply: 100, sold: 42, expiresAt: "2027-01-01T00:00:00.000Z", colors: ["#af52de", "#5ac8fa", "#ffcc02", "#64d2ff"]),
    Gift(id: "heart-crystal", name: "Хрустальное сердце", description: "Сердце из чистейшего хрусталя, сверкающее на свету.", icon: "💖", price: 1500, rarity: Rarities.legendary, category: "limited", limited: true, totalSupply: 50, sold: 33, expiresAt: "2026-12-31T23:59:59.000Z", colors: ["#ff3b30", "#ff6b6b", "#ffcc02"]),
    Gift(id: "infinity", name: "Бесконечность", description: "Символ бесконечной любви и преданности. Высшая редкость.", icon: "♾️", price: 10000, rarity: Rarities.mythic, category: "limited", limited: true, totalSupply: 10, sold: 7, expiresAt: "2026-12-25T00:00:00.000Z", colors: ["#ff3b30", "#ff9500", "#ffcc02", "#5ac8fa", "#af52de"]),
    Gift(id: "rainbow", name: "Радуга", description: "Радуга после дождя — обещание счастья и надежды.", icon: "🌈", price: 750, rarity: Rarities.rare, category: "new", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ff3b30", "#ff9500", "#ffcc02", "#34c759", "#5ac8fa", "#af52de"]),
    Gift(id: "gift-box", name: "Сюрприз", description: "Загадочная коробка, внутри которой может быть что угодно.", icon: "🎁", price: 100, rarity: Rarities.common, category: "popular", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#ff3b30", "#ffcc02", "#5ac8fa"]),
    Gift(id: "moon", name: "Луна", description: "Таинственный лунный свет, озаряющий путь в темноте.", icon: "🌙", price: 400, rarity: Rarities.epic, category: "collectible", limited: false, totalSupply: nil, sold: nil, expiresAt: nil, colors: ["#5ac8fa", "#64d2ff", "#8e8e93"]),
]
