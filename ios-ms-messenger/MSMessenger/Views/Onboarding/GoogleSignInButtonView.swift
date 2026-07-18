import SwiftUI
import AuthenticationServices

struct GoogleSignInButtonView: View {
    @EnvironmentObject var auth: AuthManager
    @State private var loading = false

    var onComplete: () -> Void

    var body: some View {
        Button(action: signInWithGoogle) {
            if loading {
                ProgressView()
                    .tint(Color(.systemGray))
            } else {
                HStack(spacing: 10) {
                    Image(systemName: "g.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                    Text("Продолжить с Google")
                        .font(.system(size: 16, weight: .semibold))
                }
                .foregroundColor(Color(.label))
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(.separator), lineWidth: 1))
            }
        }
        .disabled(loading)
    }

    private func signInWithGoogle() {
        loading = true
        // iOS native Google Sign-In requires:
        // 1. Add GoogleSignIn Swift Package: https://github.com/google/GoogleSignIn-iOS
        // 2. Configure GoogleService-Info.plist in Xcode
        // 3. Add URL scheme in Info.plist (REVERSED_CLIENT_ID from GoogleService-Info)
        //
        // Implementation:
        // import GoogleSignIn
        //
        // guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
        //       let rootVC = windowScene.windows.first?.rootViewController else { return }
        //
        // GIDSignIn.sharedInstance.signIn(withPresenting: rootVC) { result, error in
        //     guard let idToken = result?.user.idToken?.tokenString else {
        //         loading = false; return
        //     }
        //     Task {
        //         do {
        //             try await auth.googleLogin(idToken: idToken)
        //             onComplete()
        //         } catch { print("Google sign-in error: \(error)") }
        //         loading = false
        //     }
        // }

        // Placeholder - logs a message
        print("Google Sign-In placeholder. Configure GoogleSignIn SDK in Xcode.")
        loading = false
    }
}
