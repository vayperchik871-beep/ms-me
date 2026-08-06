import SwiftUI

struct GiftAnimationView: View {
    let gift: Gift
    let onDismiss: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.5)
                .ignoresSafeArea()

            ConfettiView(colors: gift.colors)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(Color(hex: rarityColors[gift.rarity] ?? "#8e8e93").opacity(0.3))
                        .frame(width: 100, height: 100)
                    if let img = gift.imageName {
                        Image(img)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 94, height: 94)
                            .clipShape(Circle())
                    } else {
                        Text(gift.icon)
                            .font(.system(size: 60))
                    }
                }

                Text(gift.name)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)

                Text(rarityLabels[gift.rarity] ?? "")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(hex: rarityColors[gift.rarity] ?? "#8e8e93"))

                Text("Подарок отправлен!")
                    .font(.system(size: 16))
                    .foregroundColor(.white.opacity(0.8))

                Button(action: onDismiss) {
                    Text("Отлично")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(ThemeManager.shared.accentText)
                        .padding(.horizontal, 40)
                        .padding(.vertical, 14)
                        .background(ThemeManager.shared.accent)
                        .cornerRadius(14)
                }
                .padding(.top, 20)
            }
        }
    }
}

struct ConfettiView: UIViewRepresentable {
    let colors: [String]

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        uiView.subviews.forEach { $0.removeFromSuperview() }

        let emitter = CAEmitterLayer()
        emitter.emitterPosition = CGPoint(x: uiView.bounds.midX, y: -20)
        emitter.emitterShape = .line
        emitter.emitterSize = CGSize(width: uiView.bounds.width, height: 1)

        let cells = colors.map { hex -> CAEmitterCell in
            let cell = CAEmitterCell()
            cell.contents = confettiImage().cgImage
            cell.color = Color(hex: hex).cgColor
            cell.birthRate = 6
            cell.lifetime = 8
            cell.velocity = 200
            cell.velocityRange = 100
            cell.emissionLongitude = .pi
            cell.emissionRange = .pi / 2
            cell.spin = 3
            cell.spinRange = 2
            cell.scale = 0.6
            cell.scaleRange = 0.2
            return cell
        }

        emitter.emitterCells = cells
        let layerView = UIView(frame: uiView.bounds)
        layerView.layer.addSublayer(emitter)
        uiView.addSubview(layerView)

        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            emitter.birthRate = 0
        }
    }

    private func confettiImage() -> UIImage {
        let size = CGSize(width: 10, height: 10)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            let rect = CGRect(origin: .zero, size: size)
            let path = UIBezierPath(ovalIn: rect)
            UIColor.white.setFill()
            path.fill()
        }
    }
}
