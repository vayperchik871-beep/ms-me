import SwiftUI

struct InputBarView: View {
    let chatId: String
    let onSend: (String, Attachment?) -> Void
    var editText: String?
    var onCancelEdit: (() -> Void)?

    @State private var text = ""
    @State private var isRecording = false
    @State private var recordingTime = 0
    @State private var attachFile: Attachment?
    @FocusState private var isFocused: Bool

    @StateObject private var i18n = I18n.shared

    var body: some View {
        VStack(spacing: 0) {
            if let edit = editText {
                HStack {
                    Text(i18n.t("Редактировать"))
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.msGreen)
                    Spacer()
                    Button { onCancelEdit?() } label: {
                        Image(systemName: "xmark").font(.caption).foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
                .background(.ultraThinMaterial)
            }

            HStack(spacing: 8) {
                if isRecording {
                    recordingBar
                } else {
                    if attachFile == nil {
                        Button(action: {}) {
                            Image(systemName: "paperclip")
                                .font(.system(size: 18))
                                .foregroundColor(.secondary)
                                .frame(width: 44, height: 44)
                                .background(.ultraThinMaterial, in: Circle())
                        }
                    }

                    HStack(spacing: 8) {
                        if let edit = editText, !edit.isEmpty {
                            Button { onCancelEdit?() } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }

                        if let _ = attachFile {
                            attachPreview
                        } else {
                            TextField(i18n.t("Введите сообщение..."), text: $text, axis: .vertical)
                                .font(.system(size: 15))
                                .focused($isFocused)
                                .lineLimit(1...4)
                                .onSubmit { send() }

                            Button(action: {}) {
                                Image(systemName: "face.smiling")
                                    .font(.system(size: 20))
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22))
                    .overlay(
                        RoundedRectangle(cornerRadius: 22)
                            .stroke(Color(.separator).opacity(0.2), lineWidth: 1)
                    )

                    if !text.trimmingCharacters(in: .whitespaces).isEmpty || attachFile != nil {
                        Button(action: send) {
                            Image(systemName: "arrow.up")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44)
                                .background(Color.msGreen, in: Circle())
                        }
                    } else {
                        Button(action: startRecording) {
                            Image(systemName: "mic.fill")
                                .font(.system(size: 18))
                                .foregroundColor(.secondary)
                                .frame(width: 44, height: 44)
                                .background(.ultraThinMaterial, in: Circle())
                        }
                        .simultaneousGesture(
                            LongPressGesture(minimumDuration: 0.3).onEnded { _ in startRecording() }
                        )
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
        }
    }

    private var recordingBar: some View {
        HStack {
            Circle().fill(.msRed).frame(width: 8, height: 8)
                .symbolEffect(.pulse)
            Text("\(recordingTime / 60):\(String(format: "%02d", recordingTime % 60))")
                .font(.body.monospacedDigit())
            Spacer()
            Button(action: stopRecording) {
                Image(systemName: "stop.fill")
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(.msRed, in: Circle())
            }
        }
        .padding(.horizontal, 8)
        .frame(height: 44)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22))
    }

    private var attachPreview: some View {
        HStack {
            if let _ = attachFile {
                Image(systemName: "doc.fill").foregroundColor(.msGreen)
                Text(attachFile?.name ?? "")
                    .font(.caption).lineLimit(1)
            }
            Button { attachFile = nil } label: {
                Image(systemName: "xmark.circle.fill").foregroundColor(.secondary)
            }
        }
        .font(.caption)
    }

    private func send() {
        let t = text.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty || attachFile != nil else { return }
        onSend(t, attachFile)
        text = ""
        attachFile = nil
    }

    private func startRecording() {
        isRecording = true
        recordingTime = 0
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
            if !isRecording { timer.invalidate(); return }
            recordingTime += 1
        }
    }

    private func stopRecording() {
        isRecording = false
        // Upload voice memo
    }
}
