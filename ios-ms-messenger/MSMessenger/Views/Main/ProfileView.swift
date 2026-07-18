import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var auth: AuthManager
    @StateObject private var i18n = I18n.shared

    @State private var showEditor = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                profileHeader

                infoSection

                VStack(spacing: 0) {
                    actionRow(i18n.t("Редактировать профиль"), "pencil") { showEditor = true }
                }
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
                .padding(.horizontal, 16)
            }
            .padding(.top, 24)
        }
        .fullScreenCover(isPresented: $showEditor) { ProfileEditorView(onClose: { showEditor = false }) }
    }

    private var profileHeader: some View {
        VStack(spacing: 8) {
            AvatarView(name: auth.user?.name ?? "?", avatarURL: auth.user?.avatar,
                       size: 96, color: auth.user?.profileColor)
                .overlay(
                    ZStack {
                        Circle().fill(Color(.systemBackground)).frame(width: 28, height: 28)
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24)).foregroundColor(.msGreen)
                    }
                    .offset(x: 35, y: 35)
                )

            Text(auth.user?.name ?? "")
                .font(.title2.bold())

            Text("@\(auth.user?.userId ?? "")")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }

    private var infoSection: some View {
        VStack(spacing: 0) {
            infoRow(i18n.t("Имя"), auth.user?.name ?? "")
            Divider().padding(.leading, 16)
            infoRow("ID", "@\(auth.user?.userId ?? "")")
            Divider().padding(.leading, 16)
            infoRow(i18n.t("День рождения"), auth.user?.birthday ?? "—")
            Divider().padding(.leading, 16)
            infoRow(i18n.t("Пол"), i18n.genderLabel(auth.user?.gender ?? ""))
        }
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 16)
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).foregroundColor(.secondary).font(.subheadline)
            Spacer()
            Text(value).font(.subheadline.weight(.medium))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private func actionRow(_ label: String, _ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(.msGreen)
                    .frame(width: 24)
                Text(label).font(.subheadline)
                Spacer()
                Image(systemName: "chevron.right").font(.caption).foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
