import XCTest

final class FullReviewTests: XCTestCase {

    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }

    func testFullReview() throws {
        sleep(3)

        let startButton = app.buttons["Начать"]
        if startButton.waitForExistence(timeout: 10) {
            startButton.tap()
            sleep(2)
        }

        let phonePrefix = app.textFields["XXXX"].firstMatch
        if phonePrefix.waitForExistence(timeout: 5) {
            phonePrefix.tap()
            phonePrefix.typeText("7777")
        }

        let phoneLast = app.textFields["XXXX"].element(boundBy: 1)
        if phoneLast.waitForExistence(timeout: 3) {
            phoneLast.tap()
            phoneLast.typeText("1234")
        }

        let doneButton = app.buttons["Готово"]
        if doneButton.waitForExistence(timeout: 3) {
            doneButton.tap()
            sleep(2)
        }

        let idField = app.textFields["Уникальный ID"]
        if idField.waitForExistence(timeout: 5) {
            idField.tap()
            idField.typeText("reviewuser")
        }

        let passwordField = app.secureTextFields["Пароль (минимум 6 символов)"]
        if passwordField.waitForExistence(timeout: 3) {
            passwordField.tap()
            passwordField.typeText("Test123!")
        }

        let nextButton = app.buttons["Далее"]
        if nextButton.waitForExistence(timeout: 3) {
            nextButton.tap()
            sleep(2)
        }

        let nameField = app.textFields["Как вас зовут?"]
        if nameField.waitForExistence(timeout: 5) {
            nameField.tap()
            nameField.typeText("Review User")
        }

        let registerButton = app.buttons["Зарегистрироваться"]
        if registerButton.waitForExistence(timeout: 3) {
            registerButton.tap()
            sleep(8)
        }

        let settingsTab = app.tabBars.buttons["Настройки"]
        if settingsTab.waitForExistence(timeout: 15) {
            settingsTab.tap()
            sleep(4)
        }

        let premiumRow = app.staticTexts["Premium и бонусы"]
        if premiumRow.waitForExistence(timeout: 5) {
            premiumRow.tap()
            sleep(4)
        }

        let buyButton = app.buttons.matching(
            NSPredicate(format: "label BEGINSWITH 'Купить за'")
        ).firstMatch
        if buyButton.waitForExistence(timeout: 5) {
            buyButton.tap()
            sleep(5)
        }

        app.navigationBars.buttons.firstMatch.tap()
        sleep(2)

        let chatsTab = app.tabBars.buttons["Чаты"]
        if chatsTab.waitForExistence(timeout: 5) {
            chatsTab.tap()
            sleep(3)
        }

        let musicTab = app.tabBars.buttons["Музыка"]
        if musicTab.waitForExistence(timeout: 5) {
            musicTab.tap()
            sleep(3)
        }

        let profileTab = app.tabBars.buttons["Профиль"]
        if profileTab.waitForExistence(timeout: 5) {
            profileTab.tap()
            sleep(3)
        }
    }
}
