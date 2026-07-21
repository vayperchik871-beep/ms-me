import Foundation
import CryptoKit

struct CryptoService {
    static let shared = CryptoService()
    private let key: SymmetricKey

    private init() {
        if let stored = KeychainService.load(key: "aes_key"),
           let data = Data(base64Encoded: stored) {
            key = SymmetricKey(data: data)
        } else {
            let newKey = SymmetricKey(size: .bits256)
            KeychainService.save(key: "aes_key", value: newKey.withUnsafeBytes { Data($0) }.base64EncodedString())
            self.key = newKey
        }
    }

    func encrypt(_ text: String) throws -> (Data, Data, Data) {
        let data = text.data(using: .utf8)!
        let nonce = try AES.GCM.Nonce()
        let sealedBox = try AES.GCM.seal(data, using: key, nonce: nonce)
        return (sealedBox.ciphertext, sealedBox.tag, nonce.withUnsafeBytes { Data($0) })
    }

    func decrypt(encrypted: Data, tag: Data, nonce: Data) throws -> String {
        let nonce = try AES.GCM.Nonce(data: nonce)
        let sealedBox = try AES.GCM.SealedBox(nonce: nonce, ciphertext: encrypted, tag: tag)
        let data = try AES.GCM.open(sealedBox, using: key)
        return String(data: data, encoding: .utf8) ?? ""
    }
}

final class KeychainService {
    static func save(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    static func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: CFTypeRef?
        SecItemCopyMatching(query as CFDictionary, &item)
        guard let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
