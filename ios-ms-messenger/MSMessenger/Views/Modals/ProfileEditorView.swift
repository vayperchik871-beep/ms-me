import SwiftUI

struct ProfileEditorView: View {
    let onClose: () -> Void

    @EnvironmentObject var auth: AuthManager
    @StateObject private var i18n = I18n.shared

    @State private var birthday = ""
    @State private var gender = ""
    @State private var profileColor = "#007AFF"
    @State private var saving = false

    private let colors = ["#007AFF", "#FF2D55", "#FF9500", "#FFCC00",
                          "#34C759", "#5AC8FA", "#AF52DE", "#FF6482",
                          "#00C7BE", "#FFD60A"]

    var body: some View {
        ZStack {
            Color.black.opacity(0.4).ignoresSafeArea()

            VStack(spacing: 20) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(.secondary.opacity(0.3))
                    .frame(width: 36, height: 5)
                    .padding(.top, 8)

                Text(i18n.t("Редактировать профиль"))
                    .font(.headline)

                ScrollView {
                    VStack(spacing: 16) {
                        DatePicker(i18n.t("День рождения"), selection: .init(
                            get: { dateFromString(birthday) ?? Date() },
                            set: { birthday = stringFromDate($0) }
                        ), displayedComponents: .date)
                        .datePickerStyle(.graphical)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))

                        VStack(alignment: .leading, spacing: 8) {
                            Text(i18n.t("Пол")).font(.subheadline.weight(.medium))
                            HStack(spacing: 8) {
                                genderButton("male")
                                genderButton("female")
                                genderButton("other")
                                if !gender.isEmpty {
                                    Button(i18n.t("Отмена")) { gender = "" }
                                        .font(.caption).foregroundColor(.secondary)
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Profile Color").font(.subheadline.weight(.medium))
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 5), spacing: 8) {
                                ForEach(colors, id: \.self) { hex in
                                    Button(action: { profileColor = hex }) {
                                        Circle()
                                            .fill(hexColor(hex) ?? .gray)
                                            .frame(width: 44, height: 44)
                                            .overlay(
                                                Circle()
                                                    .stroke(profileColor == hex ? Color.white : Color.clear, lineWidth: 3)
                                            )
                                            .shadow(color: .black.opacity(0.15), radius: 4)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                }

                HStack(spacing: 12) {
                    Button(i18n.t("Назад")) { onClose() }
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))

                    Button(action: save) {
                        if saving {
                            ProgressView().tint(.white)
                        } else {
                            Text(i18n.t("Сохранить"))
                                .font(.headline)
                        }
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(LinearGradient(colors: [.msGreen, .msGreenDark], startPoint: .leading, endPoint: .trailing))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .disabled(saving)
                }
                .padding(.horizontal)
                .padding(.bottom, 20)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 18))
        }
        .task { loadCurrent() }
    }

    private func genderButton(_ g: String) -> some View {
        Button(action: { gender = g }) {
            Text(i18n.genderLabel(g))
                .font(.subheadline.weight(.medium))
                .foregroundColor(gender == g ? .white : .primary)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(gender == g ? Color.msGreen : .ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func save() {
        saving = true
        Task {
            do {
                _ = try await APIClient.shared.updateProfile(
                    birthday: birthday.isEmpty ? nil : birthday,
                    gender: gender.isEmpty ? nil : gender,
                    profileColor: profileColor.isEmpty ? nil : profileColor
                )
                await auth.refreshUser()
                onClose()
            } catch {}
            saving = false
        }
    }

    private func loadCurrent() {
        birthday = auth.user?.birthday ?? ""
        gender = auth.user?.gender ?? ""
        profileColor = auth.user?.profileColor ?? "#007AFF"
    }

    private func dateFromString(_ s: String) -> Date? {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        return fmt.date(from: s)
    }

    private func stringFromDate(_ d: Date) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        return fmt.string(from: d)
    }

    private func hexColor(_ hex: String) -> Color? {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let val = Int(s, radix: 16) else { return nil }
        return Color(red: Double((val >> 16) & 0xFF) / 255,
                     green: Double((val >> 8) & 0xFF) / 255,
                     blue: Double(val & 0xFF) / 255)
    }
}
