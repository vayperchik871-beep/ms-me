import SwiftUI

struct OnboardingView: View {
    @State private var showLogin = true
    var onComplete: () -> Void

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()

            VStack(spacing: 16) {
                if showLogin {
                    LoginView(onComplete: onComplete, onSwitchRegister: { showLogin = false })
                        .transition(.move(edge: .leading))
                } else {
                    RegisterView(onComplete: onComplete, onSwitchLogin: { showLogin = true })
                        .transition(.move(edge: .trailing))
                }

                GoogleSignInButtonView(onComplete: onComplete)
                    .padding(.horizontal)

                if !showLogin {
                    Button("Уже есть аккаунт?") { showLogin = true }
                        .font(.subheadline)
                        .foregroundColor(.msGreen)
                }
            }
            .animation(.spring(response: 0.4, dampingFraction: 0.9), value: showLogin)
        }
    }
}
