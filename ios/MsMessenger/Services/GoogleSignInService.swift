import Foundation
import AuthenticationServices

enum GoogleSignInError: LocalizedError {
    case cancelled
    case noToken
    case failed(Error)

    var errorDescription: String? {
        switch self {
        case .cancelled: return "Вход отменён"
        case .noToken: return "Не получен токен"
        case .failed(let err): return err.localizedDescription
        }
    }
}

@MainActor
final class GoogleSignInService: NSObject {
    static let shared = GoogleSignInService()

    private let clientID = "202627330294-tb4nvaatchp87ke6g1i01nedpc8b5c33.apps.googleusercontent.com"
    private let redirectURI = "com.googleusercontent.apps.202627330294-i3glf16hem9j85of1ma9gq9h5vg3cvl4:/oauthredirect"
    private var continuation: CheckedContinuation<String, Error>?
    private var webAuthSession: ASWebAuthenticationSession?

    func signIn() async throws -> String {
        let authURL = URL(string: [
            "https://accounts.google.com/o/oauth2/v2/auth",
            "?client_id=\(clientID)",
            "&redirect_uri=\(redirectURI)",
            "&response_type=id_token",
            "&scope=openid%20email%20profile",
            "&nonce=\(UUID().uuidString)"
        ].joined())!

        return try await withCheckedThrowingContinuation { [weak self] continuation in
            guard let self else {
                continuation.resume(throwing: GoogleSignInError.cancelled)
                return
            }
            self.continuation = continuation
            let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: "com.googleusercontent.apps.202627330294-i3glf16hem9j85of1ma9gq9h5vg3cvl4") { url, error in
                if let error {
                    self.continuation?.resume(throwing: GoogleSignInError.failed(error))
                    self.continuation = nil
                    return
                }
                guard let url, let fragment = URLComponents(url: url, resolvingAgainstBaseURL: false)?.query,
                      let idToken = fragment.components(separatedBy: "&")
                        .first(where: { $0.hasPrefix("id_token=") })?
                        .replacingOccurrences(of: "id_token=", with: "") else {
                    self.continuation?.resume(throwing: GoogleSignInError.noToken)
                    self.continuation = nil
                    return
                }
                self.continuation?.resume(returning: idToken)
                self.continuation = nil
            }
            session.prefersEphemeralWebBrowserSession = false
            session.start()
        }
    }
}
