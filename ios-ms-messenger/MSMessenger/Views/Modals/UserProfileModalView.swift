import SwiftUI

struct UserProfileModalView: View {
    let userId: String
    let onClose: () -> Void
    var onStartChat: ((String, String) -> Void)?

    @EnvironmentObject var auth: AuthManager
    @StateObject private var i18n = I18n.shared

    @State private var user: User?
    @State private var loading = true

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.black, Color(red: 0.04, green: 0.04, blue: 0.04),
                         Color(red: 0.07, green: 0.07, blue: 0.07)],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            if loading {
                ProgressView().tint(.white)
            } else if let u = user {
                ScrollView {
                    VStack(spacing: 0) {
                        header(u)
                        infoSection(u)
                        groupsSection
                        Spacer(minLength: 40)
                    }
                }
            }
        }
        .task { await loadUser() }
    }

    private func header(_ u: User) -> some View {
        VStack(spacing: 0) {
            HStack {
                Button(i18n.t("Закрыть")) { onClose() }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(.white.opacity(0.2), in: Capsule())
                    .overlay(Capsule().stroke(.white.opacity(0.15), lineWidth: 1))
                Spacer()
            }
            .padding(.top, 56)
            .padding(.horizontal, 16)

            Spacer().frame(height: 16)

            AvatarView(name: u.name, avatarURL: u.avatar, size: 96, color: u.profileColor)
                .overlay(
                    Circle().stroke(.white.opacity(0.25), lineWidth: 3)
                )
                .shadow(color: .black.opacity(0.3), radius: 20)

            Spacer().frame(height: 14)

            Text(u.name)
                .font(.system(size: 26, weight: .bold))
                .foregroundColor(.white)

            Text("@\(u.userId)")
                .font(.system(size: 15))
                .foregroundColor(.white.opacity(0.55))

            HStack(spacing: 5) {
                Circle().fill(Color.green).frame(width: 7, height: 7)
                Text(i18n.t("недавно"))
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.45))
            }
            .padding(.top, 6)

            Spacer().frame(height: 20)

            HStack(spacing: 10) {
                profileAction(icon: "message.fill", label: i18n.t("Сообщение")) {
                    if let uid = u.userId {
                        api.addContact(userId: uid) { resp in
                            if let chatId = resp?.chatId {
                                onStartChat?(chatId, uid)
                                onClose()
                            }
                        }
                    }
                }
                profileAction(icon: "phone.fill", label: i18n.t("Звонок"), disabled: true) {}
                profileAction(icon: "video.fill", label: i18n.t("Видео"), disabled: true) {}
                profileAction(icon: "arrow.up.circle.fill", label: i18n.t("Поделиться"), disabled: true) {}
            }
            .padding(.horizontal, 16)
        }
    }

    private func profileAction(icon: String, label: String, disabled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(.white.opacity(0.12))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundColor(.white)
                }
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(.white.opacity(0.08), lineWidth: 1))
        }
        .disabled(disabled)
        .opacity(disabled ? 0.45 : 1)
        .buttonStyle(PlainButtonStyle())
    }

    private func infoSection(_ u: User) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(i18n.t("Информация"))
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 2)

            VStack(spacing: 0) {
                infoRow(icon: "at", label: i18n.t("Имя пользователя"), value: "@\(u.userId)")
                Divider().background(.white.opacity(0.06)).padding(.leading, 44)

                if let b = u.birthday, !b.isEmpty {
                    infoRow(icon: "calendar", label: i18n.t("День рождения"), value: b)
                    Divider().background(.white.opacity(0.06)).padding(.leading, 44)
                }

                if let g = u.gender, !g.isEmpty {
                    infoRow(icon: "person", label: i18n.t("Пол"), value: i18n.genderLabel(g))
                    Divider().background(.white.opacity(0.06)).padding(.leading, 44)
                }

                infoRow(icon: "photo.on.rectangle", label: i18n.t("Медиа, ссылки и документы"), value: "")
                    .opacity(0.5)

                HStack {
                    Image(systemName: "gift")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.5))
                        .frame(width: 32, height: 32)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(i18n.t("Подарки"))
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(.white)
                        Text(i18n.t("скоро"))
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.35))
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.3))
                }
                .padding(14)
                .opacity(0.5)
            }
            .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(.white.opacity(0.08), lineWidth: 1))
        }
        .padding(.horizontal, 16)
        .padding(.top, 24)
    }

    private func infoRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.6))
                .frame(width: 32, height: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.55))
                if !value.isEmpty {
                    Text(value)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.white)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.3))
        }
        .padding(14)
    }

    private var groupsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(i18n.t("Общие группы"))
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 2)

            VStack {
                Text(i18n.t("Общих групп нет"))
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.35))
                    .padding(.vertical, 16)
            }
            .frame(maxWidth: .infinity)
            .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(.white.opacity(0.08), lineWidth: 1))
        }
        .padding(.horizontal, 16)
        .padding(.top, 20)
    }

    private let api = APIClient.shared

    private func loadUser() async {
        do {
            let resp = try await api.getUser(userId: userId)
            user = resp
        } catch {}
        loading = false
    }
}

private extension UserProfileModalView {
    struct AddContactResp: Codable {
        let chatId: String?
    }

    func addContact(userId: String, completion: @escaping (AddContactResp?) -> Void) {
        Task {
            do {
                let resp: AddContactResp = try await request("POST", "/contacts", body: ["userId": userId])
                completion(resp)
            } catch {
                completion(nil)
            }
        }
    }

    func request<T: Decodable>(_ method: String, _ path: String, body: Encodable? = nil) async throws -> T {
        try await APIClient.shared.request(method, path, body: body)
    }
}
