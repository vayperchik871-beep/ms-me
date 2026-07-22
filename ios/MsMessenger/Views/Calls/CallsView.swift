import SwiftUI

struct CallsView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var number = ""
    @State private var searchResult: User?
    @State private var error: String?
    @State private var loading = false

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 16), count: 3)

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                numberDisplay
                Spacer()
                dialPad
                Spacer()
                callSection
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Звонки")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                }
            }
            .toolbarBackground(Color.clear, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .onChange(of: number) { _, _ in search() }
        }
        .tint(Color(hex: "#6C63FF"))
    }

    // MARK: - Number Display

    private var numberDisplay: some View {
        VStack(spacing: 4) {
            if number.isEmpty {
                Text("+777 XXX XXXX")
                    .font(.system(size: 32, weight: .light, design: .monospaced))
                    .foregroundColor(.white.opacity(0.2))
            } else {
                Text(formattedNumber)
                    .font(.system(size: 32, weight: .light, design: .monospaced))
                    .foregroundColor(.white)
            }

            if let user = searchResult {
                Text(user.name)
                    .font(.system(size: 15))
                    .foregroundColor(.white.opacity(0.5))
            } else if !number.isEmpty && number.count >= 4 {
                Text("контакт не найден")
                    .font(.system(size: 15))
                    .foregroundColor(.white.opacity(0.3))
            }
        }
        .frame(height: 80)
        .padding(.top, 16)
    }

    private var formattedNumber: String {
        let digits = number.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        if digits.isEmpty { return "" }
        var result = "+777"
        let afterPrefix = digits.count > 3 ? String(digits.dropFirst(3)) : ""
        if !afterPrefix.isEmpty {
            let prefix = String(afterPrefix.prefix(3))
            result += " \(prefix)"
            let last = String(afterPrefix.dropFirst(3))
            if !last.isEmpty {
                result += " \(String(last.prefix(4)))"
            }
        }
        return result
    }

    // MARK: - Dial Pad

    private var dialPad: some View {
        VStack(spacing: 20) {
            ForEach(0..<3) { row in
                HStack(spacing: 28) {
                    ForEach(0..<3) { col in
                        let idx = row * 3 + col + 1
                        dialButton(String(idx), subtitle: digitLetters(idx))
                    }
                }
            }
            HStack(spacing: 28) {
                dialButton("*", subtitle: nil)
                dialButton("0", subtitle: "+")
                dialButton("#", subtitle: nil)
            }
        }
        .padding(.horizontal, 50)
    }

    private func dialButton(_ digit: String, subtitle: String?) -> some View {
        Button(action: { addDigit(digit) }) {
            VStack(spacing: 2) {
                Text(digit)
                    .font(.system(size: 32, weight: .light))
                    .foregroundColor(.white)
                if let sub = subtitle {
                    Text(sub)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(0.4))
                }
            }
            .frame(width: 76, height: 76)
            .background(Color.white.opacity(0.08))
            .clipShape(Circle())
            .contentShape(Circle())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Call Section

    private var callSection: some View {
        HStack(spacing: 40) {
            if !number.isEmpty {
                Button(action: { deleteDigit() }) {
                    Image(systemName: "delete.left")
                        .font(.system(size: 24))
                        .foregroundColor(.white.opacity(0.5))
                        .frame(width: 60, height: 60)
                }.buttonStyle(.plain)
            } else {
                Color.clear.frame(width: 60, height: 60)
            }

            Button(action: makeCall) {
                Image(systemName: "phone.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.white)
                    .frame(width: 72, height: 72)
                    .background(number.count >= 4 ? Color.green : Color.white.opacity(0.15))
                    .clipShape(Circle())
            }
            .disabled(number.count < 4)
            .buttonStyle(.plain)

            if !number.isEmpty && searchResult != nil {
                Button(action: addContact) {
                    Image(systemName: "person.crop.circle.badge.plus")
                        .font(.system(size: 24))
                        .foregroundColor(.white.opacity(0.5))
                        .frame(width: 60, height: 60)
                }.buttonStyle(.plain)
            } else {
                Color.clear.frame(width: 60, height: 60)
            }
        }
        .padding(.bottom, 40)
    }

    // MARK: - Helpers

    private func digitLetters(_ digit: Int) -> String? {
        let map = ["", "", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"]
        guard digit >= 2, digit <= 9 else { return nil }
        return map[digit]
    }

    private func addDigit(_ d: String) {
        let digits = number.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        guard digits.count < 11 else { return }
        number = digits + d
    }

    private func deleteDigit() {
        var digits = number.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        guard !digits.isEmpty else { return }
        digits.removeLast()
        number = digits
    }

    private func search() {
        let digits = number.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        guard digits.count >= 7 else { searchResult = nil; error = nil; return }
        loading = true; error = nil
        Task {
            do {
                let resp = try await APIClient.shared.searchUsers(query: "+777\(digits.hasPrefix("777") ? String(digits.dropFirst(3)) : digits)")
                searchResult = resp.users.first
            } catch { self.error = error.localizedDescription }
            loading = false
        }
    }

    private func makeCall() {
        guard let user = searchResult else { return }
        print("Calling \(user.userId)...")
    }

    private func addContact() {
        guard let user = searchResult else { return }
        Task {
            do { _ = try await APIClient.shared.addContact(userId: user.userId) }
            catch { self.error = error.localizedDescription }
        }
    }
}
