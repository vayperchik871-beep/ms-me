import XCTest

final class FullReviewTests: XCTestCase {

    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }

    func testFullReview() throws {
        let loginButton = app.staticTexts["Уже есть аккаунт? Войти"]
        if loginButton.waitForExistence(timeout: 5) {
            loginButton.tap()
        }

        let idField = app.textFields["ID"]
        if idField.waitForExistence(timeout: 5) {
            idField.tap()
            idField.typeText("admin")
        }

        let passwordField = app.secureTextFields["Пароль"]
        if passwordField.waitForExistence(timeout: 3) {
            passwordField.tap()
            passwordField.typeText("AdminPass123!")
        }

        let signInButton = app.buttons["Войти"]
        if signInButton.waitForExistence(timeout: 3) {
            signInButton.tap()
        }

        sleep(3)

        let chatsTab = app.tabBars.buttons["Чаты"]
        if chatsTab.waitForExistence(timeout: 10) {
            chatsTab.tap()
            sleep(2)
        }

        let contactsTab = app.tabBars.buttons["Контакты"]
        if contactsTab.waitForExistence(timeout: 3) {
            contactsTab.tap()
            sleep(2)
        }

        let musicTab = app.tabBars.buttons["Музыка"]
        if musicTab.waitForExistence(timeout: 3) {
            musicTab.tap()
            sleep(2)
        }

        let profileTab = app.tabBars.buttons["Профиль"]
        if profileTab.waitForExistence(timeout: 3) {
            profileTab.tap()
            sleep(2)
        }

        let settingsTab = app.tabBars.buttons["Настройки"]
        if settingsTab.waitForExistence(timeout: 3) {
            settingsTab.tap()
            sleep(2)
        }
    }
}
