import SwiftUI

struct MessageBubbleView: View {
    let message: Message
    let isMine: Bool
    let onLongPress: () -> Void

    var body: some View {
        HStack {
            if isMine { Spacer(minLength: 60) }

            VStack(alignment: isMine ? .trailing : .leading, spacing: 2) {
                if let reply = message.replyTo {
                    Text("→ \(reply)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 12)
                        .padding(.top, 6)
                }

                if let attach = message.attachment {
                    attachmentView(attach)
                }

                if let text = message.text, !text.isEmpty {
                    Text(text)
                        .font(.system(size: 15))
                        .foregroundColor(.primary)
                }

                HStack(spacing: 4) {
                    if message.edited == true {
                        Text("edited")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    Text(message.time ?? "")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    if isMine {
                        Image(systemName: message.read == true ? "checkmark.circle.fill" : "checkmark")
                            .font(.system(size: 10))
                            .foregroundColor(message.read == true ? .msGreen : .secondary)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 6)

                if let reactions = message.reactions, !reactions.isEmpty {
                    HStack(spacing: 2) {
                        ForEach(reactions, id: \.user_id) { r in
                            Text(r.emoji).font(.caption)
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(.ultraThinMaterial, in: Capsule())
                    .offset(y: 8)
                }
            }
            .padding(.vertical, 4)
            .background(isMine ? Color.bubbleMine : Color.bubbleTheirs)
            .clipShape(BubbleShape(isMine: isMine))
            .contentShape(.contextMenuPreview, BubbleShape(isMine: isMine))

            if !isMine { Spacer(minLength: 60) }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 1)
        .contextMenu {
            Button(i18n("Ответить"), systemImage: "arrowshape.turn.up.left") { onLongPress() }
            Button(i18n("Скопировано"), systemImage: "doc.on.doc") { UIPasteboard.general.string = message.text }
            Button(i18n("В избранное"), systemImage: "star") {}
            Button(i18n("Удалить"), systemImage: "trash", role: .destructive) {}
        }
    }

    @ViewBuilder
    private func attachmentView(_ attach: Attachment) -> some View {
        if attach.type == "image" {
            AsyncImage(url: APIClient.shared.resolveMediaURL(attach.url)) { phase in
                switch phase {
                case .success(let img):
                    img.resizable().scaledToFit()
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                default:
                    RoundedRectangle(cornerRadius: 12)
                        .fill(.ultraThinMaterial)
                        .frame(height: 150)
                        .overlay(ProgressView())
                }
            }
            .frame(maxWidth: 200)
        } else if attach.type == "voice" {
            HStack {
                Image(systemName: "waveform").foregroundColor(.msGreen)
                if let d = attach.duration {
                    Text("\(d / 60):\(String(format: "%02d", d % 60))")
                        .font(.caption.monospacedDigit())
                }
            }
            .padding(12)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10))
        } else {
            HStack {
                Image(systemName: "doc.fill").foregroundColor(.msGreen)
                Text(attach.name ?? "File").font(.caption)
            }
            .padding(12)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10))
        }
    }

    private func i18n(_ key: String) -> String { I18n.shared.t(key) }
}

struct BubbleShape: Shape {
    let isMine: Bool

    func path(in rect: CGRect) -> Path {
        let r: CGFloat = 18
        var path = Path()

        path.move(to: CGPoint(x: rect.minX + r, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - r, y: rect.minY))
        path.addQuadCurve(to: CGPoint(x: rect.maxX, y: rect.minY + r),
                          control: CGPoint(x: rect.maxX, y: rect.minY))

        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - r))
        path.addQuadCurve(to: CGPoint(x: rect.maxX - r, y: rect.maxY),
                          control: CGPoint(x: rect.maxX, y: rect.maxY))

        if isMine {
            path.addLine(to: CGPoint(x: rect.minX + r + 8, y: rect.maxY))
            path.addQuadCurve(to: CGPoint(x: rect.minX + r, y: rect.maxY - 8),
                              control: CGPoint(x: rect.minX + 4, y: rect.maxY - 4))
        }

        path.addLine(to: CGPoint(x: rect.minX + (isMine ? r : r), y: rect.minY + r))
        if !isMine {
            path.addQuadCurve(to: CGPoint(x: rect.minX, y: rect.minY + r + 8),
                              control: CGPoint(x: rect.minX - 2, y: rect.minY + 4))
        }

        path.addQuadCurve(to: CGPoint(x: rect.minX + r, y: rect.minY),
                          control: CGPoint(x: rect.minX, y: rect.minY))
        return path
    }
}
