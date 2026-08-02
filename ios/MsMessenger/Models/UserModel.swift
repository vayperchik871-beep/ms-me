import Foundation

struct User: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let name: String
    var phone: String?
    var bio: String?
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
    var music: String?
    var profileBanner: String?
    var isOnline: Bool?
}

struct UserResponse: Codable { let user: User }
struct AuthResponse: Codable { let token: String?; let user: User?; let needsVerification: Bool?; let needsSetup: Bool? }
struct ErrorResponse: Codable { let error: String }
struct AdminCommandResponse: Codable { let output: String }
struct EmptyResponse: Codable {}
struct UsersResponse: Codable { let users: [User] }
struct UploadResponse: Codable { let url: String }

// ─── Music Distribution ───

struct Artist: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let name: String
    let photo: String?
    let banner: String?
    let createdAt: Int?
    var tracks: [MusicDistributionTrack]?
}

struct ArtistResponse: Codable { let artist: Artist? }

struct MusicDistributionTrack: Codable, Identifiable, Hashable {
    var id: String?
    var artistId: String?
    var userId: String?
    let title: String?
    let artist: String?
    let format: String?
    let fileUrl: String?
    let cover: String?
    let isPublic: Bool?
    let releaseNow: Bool?
    let scheduledAt: Int?
    let status: String?
    let createdAt: Int?
    let reviewedAt: Int?
    let reviewedBy: String?
}

struct MusicSearchResponse: Codable { let artists: [Artist]; let tracks: [MusicDistributionTrack] }
struct TrackListResponse: Codable { let tracks: [MusicDistributionTrack] }
struct TrackUploadResponse: Codable { let track: MusicDistributionTrack?; let id: String? }

struct MultiPartForm {
    let boundary = "Boundary-\(UUID().uuidString)"
    var body = Data()

    mutating func addField(name: String, value: String) {
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(value)\r\n".data(using: .utf8)!)
    }

    mutating func addFile(name: String, fileName: String, data: Data, contentType: String) {
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(contentType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n".data(using: .utf8)!)
    }

    var end: Data {
        var d = body
        d.append("--\(boundary)--\r\n".data(using: .utf8)!)
        return d
    }
}
