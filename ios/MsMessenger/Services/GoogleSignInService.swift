import Foundation
import AuthenticationServices

class GoogleSignInService: NSObject {
    static let shared = GoogleSignInService()
    private let clientID = "202627330294-tb4nvaatchp87ke6g1i01nedpc8b5c33.apps.googleusercontent.com"
    private let redirectURI = "com.googleusercontent.apps.202627330294-i3glf16hem9j85of1ma9gq9h5vg3cvl4:/oauthredirect"
    private var session: ASWebAuthenticationSession?

    func signIn() async throws -> String {
        let authURL = URL(string: "https://accounts.google.com/o/oauth2/v2/auth?client_id=\(clientID)&redirect_uri=\(redirectURI)&response_type=id_token&scope=openid%20email%20profile&nonce=\(UUID().uuidString)")!

        return try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: "com.googleusercontent.apps.202627330294-i3glf16hem9j85of1ma9gq9h5vg3cvl4") { url, error in
                if let error { continuation.resume(throwing: error); return }
                guard let url, let comps = URLComponents(url: url, resolvingAgainstBaseURL: false),
                      let token = comps.queryItems?.first(where: { $0.name == "id_token" })?.value else {
                    continuation.resume(throwing: NSError(domain: "GoogleAuth", code: -1, userInfo: [NSLocalizedDescriptionKey: "No token"]))
                    return
                }
                continuation.resume(returning: token)
            }
            session.prefersEphemeralWebBrowserSession = true
            session.start()
            self.session = session
        }
    }
}
