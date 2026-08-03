import XCTest

final class FullReviewTests: XCTestCase {

    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }

    func testFullReview() throws {
        sleep(2)

        let startButton = app.buttons["Начать"]
        if startButton.waitForExistence(timeout: 5) {
            startButton.tap()
            sleep(1)
        }

        let phonePrefix = app.textFields["XXXX"].firstMatch
        if phonePrefix.waitForExistence(timeout: 3) {
            phonePrefix.tap()
            phonePrefix.typeText("7777")
        }

        let phoneLast = app.textFields["XXXX"].element(boundBy: 1)
        if phoneLast.waitForExistence(timeout: 2) {
            phoneLast.tap()
            phoneLast.typeText("1234")
        }

        let doneButton = app.buttons["Готово"]
        if doneButton.waitForExistence(timeout: 2) {
            doneButton.tap()
            sleep(1)
        }

        let idField = app.textFields["Уникальный ID"]
        if idField.waitForExistence(timeout: 3) {
            idField.tap()
            idField.typeText("reviewuser")
        }

        let passwordField = app.secureTextFields["Пароль (минимум 6 символов)"]
        if passwordField.waitForExistence(timeout: 2) {
            passwordField.tap()
            passwordField.typeText("Test123!")
        }

        let nextButton = app.buttons["Далее"]
        if nextButton.waitForExistence(timeout: 2) {
            nextButton.tap()
            sleep(1)
        }

        let nameField = app.textFields["Как вас зовут?"]
        if nameField.waitForExistence(timeout: 3) {
            nameField.tap()
            nameField.typeText("Review User")
        }

        let registerButton = app.buttons["Зарегистрироваться"]
        if registerButton.waitForExistence(timeout: 2) {
            registerButton.tap()
            sleep(5)
        }

        let settingsTab = app.tabBars.buttons["Настройки"]
        if settingsTab.waitForExistence(timeout: 10) {
            settingsTab.tap()
            sleep(2)
        }

        let premiumRow = app.staticTexts["Премиум подписка"]
        if premiumRow.waitForExistence(timeout: 3) {
            premiumRow.tap()
            sleep(3)
        }

        app.navigationBars.buttons.firstMatch.tap()
        sleep(2)

        let chatsTab = app.tabBars.buttons["Чаты"]
        if chatsTab.waitForExistence(timeout: 3) {
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
    }
}
