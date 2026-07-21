import Foundation

struct User: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let name: String
    var isSystem: Bool?
    var avatar: String?
    var isAdmin: Bool?
    var isVerified: Bool?
    var verifyType: String?
    var mcoins: Int?
    var birthday: String?
    var gender: String?
    var profileColor: String?
    var banned: Bool?
    var scam: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case name
        case isSystem
        case avatar
        case isAdmin
        case isVerified
        case verifyType
        case mcoins
        case birthday
        case gender
        case profileColor
        case banned
        case scam
    }
}

struct UserResponse: Codable {
    let user: User
}

struct AuthResponse: Codable {
    let token: String
    let user: User
    let needsVerification: Bool?
    let needsSetup: Bool?
}

struct ErrorResponse: Codable {
    let error: String
}

struct AdminCommandResponse: Codable {
    let output: String
}
