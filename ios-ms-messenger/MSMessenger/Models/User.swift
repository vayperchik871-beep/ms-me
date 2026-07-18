import Foundation

struct User: Codable, Identifiable, Equatable {
    let id: String
    var userId: String
    var name: String
    var isSystem: Bool?
    var avatar: String?
    var birthday: String?
    var gender: String?
    var profileColor: String?
    var isAdmin: Bool?
    var banned: Bool?
    var online: Bool?
    var lastSeen: Int?

    enum CodingKeys: String, CodingKey {
        case id, userId, name, avatar, birthday, gender
        case profileColor, isAdmin, banned, online, lastSeen
        case isSystem
    }
}

struct UserProfile: Codable {
    let user: User
    let mutualChats: [String]?
}

struct AuthResponse: Codable {
    let token: String?
    let user: User?
    let needsVerification: Bool?
    let userId: String?
    let message: String?
}

struct VerifyResponse: Codable {
    let token: String?
    let user: User?
}

struct SearchResult: Codable {
    let users: [User]
}

struct ContactsResponse: Codable {
    let contacts: [User]
}

struct AddContactResponse: Codable {
    let contact: User
    let chatId: String
}

struct MeResponse: Codable {
    let user: User
}

struct UpdateProfileResponse: Codable {
    let user: User
}

struct AvatarResponse: Codable {
    let avatar: String
}
