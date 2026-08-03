import XCTest

final class FullReviewTests: XCTestCase {

    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }

    func testFullReview() throws {
        let unique = String(format: "%04d", Int(Date().timeIntervalSince1970) % 10000)
        let userId = "review\(unique)"

        let startButton = app.buttons["Начать"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 15), "Кнопка «Начать» не найдена")
        startButton.tap()

        let phonePrefix = app.textFields["prefixField"]
        XCTAssertTrue(phonePrefix.waitForExistence(timeout: 10), "Поле первой части номера не найдено")
        phonePrefix.tap()
        phonePrefix.typeText("7777")

        let phoneLast = app.textFields["lastField"]
        XCTAssertTrue(phoneLast.waitForExistence(timeout: 5), "Поле второй части номера не найдено")
        phoneLast.tap()
        phoneLast.typeText(unique)

        let doneButton = app.buttons["Готово"]
        XCTAssertTrue(doneButton.waitForExistence(timeout: 5), "Кнопка «Готово» не найдена")
        XCTAssertTrue(doneButton.isEnabled, "«Готово» неактивна — номер введён не полностью")
        doneButton.tap()

        let idField = app.textFields["Уникальный ID"]
        XCTAssertTrue(idField.waitForExistence(timeout: 10), "Поле ID не появилось после шага номера")
        idField.tap()
        idField.typeText(userId)

        let passwordField = app.secureTextFields["Пароль (минимум 6 символов)"]
        XCTAssertTrue(passwordField.waitForExistence(timeout: 5), "Поле пароля не найдено")
        passwordField.tap()
        passwordField.typeText("Test123!")

        let nextButton = app.buttons["Далее"]
        XCTAssertTrue(nextButton.waitForExistence(timeout: 5), "Кнопка «Далее» не найдена")
        XCTAssertTrue(nextButton.isEnabled, "«Далее» неактивна")
        nextButton.tap()

        let nameField = app.textFields["Как вас зовут?"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 10), "Поле имени не появилось")
        nameField.tap()
        nameField.typeText("Review User")

        let registerButton = app.buttons["Зарегистрироваться"]
        XCTAssertTrue(registerButton.waitForExistence(timeout: 5), "Кнопка «Зарегистрироваться» не найдена")
        registerButton.tap()

        let settingsTab = app.tabBars.buttons["Настройки"]
        XCTAssertTrue(settingsTab.waitForExistence(timeout: 30), "Регистрация не завершилась, таббар не появился (userId: \(userId))")
        settingsTab.tap()

        let premiumRow = app.staticTexts["Premium и бонусы"]
        XCTAssertTrue(premiumRow.waitForExistence(timeout: 10), "Строка «Premium и бонусы» не найдена")
        premiumRow.tap()

        let buyButton = app.buttons.matching(
            NSPredicate(format: "label BEGINSWITH 'Купить за'")
        ).firstMatch
        XCTAssertTrue(buyButton.waitForExistence(timeout: 10), "Кнопка «Купить за …» не найдена")
        buyButton.tap()
        sleep(4)

        let backButton = app.navigationBars.buttons.firstMatch
        if backButton.waitForExistence(timeout: 5) {
            backButton.tap()
        }
        sleep(2)

        let chatsTab = app.tabBars.buttons["Чаты"]
        XCTAssertTrue(chatsTab.waitForExistence(timeout: 10), "Таб «Чаты» не найден")
        chatsTab.tap()
        sleep(3)

        let musicTab = app.tabBars.buttons["Музыка"]
        XCTAssertTrue(musicTab.waitForExistence(timeout: 5), "Таб «Музыка» не найден")
        musicTab.tap()
        sleep(3)

        let profileTab = app.tabBars.buttons["Профиль"]
        XCTAssertTrue(profileTab.waitForExistence(timeout: 5), "Таб «Профиль» не найден")
        profileTab.tap()
        sleep(3)
    }
}
