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
}

struct UserResponse: Codable { let user: User }
struct AuthResponse: Codable { let token: String?; let user: User?; let needsVerification: Bool?; let needsSetup: Bool? }
struct ErrorResponse: Codable { let error: String }
struct AdminCommandResponse: Codable { let output: String }
struct EmptyResponse: Codable {}
struct UsersResponse: Codable { let users: [User] }
struct UploadResponse: Codable { let url: String }
