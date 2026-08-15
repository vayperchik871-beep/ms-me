package com.ms.messenger.i18n

import com.ms.messenger.theme.ThemeManager

object Strings {
    val titleSettings get() = if (ThemeManager.language == "en") "Settings" else "Настройки"
    val titleAppearance get() = if (ThemeManager.language == "en") "Appearance" else "Оформление"
    val titlePrivacy get() = if (ThemeManager.language == "en") "Privacy" else "Конфиденциальность"
    val titleLanguage get() = if (ThemeManager.language == "en") "Language" else "Язык"
    val labelNavigation get() = if (ThemeManager.language == "en") "Navigation" else "Навигация"
    val labelTheme get() = if (ThemeManager.language == "en") "Theme" else "Тема"
    val labelChats get() = if (ThemeManager.language == "en") "Chats" else "Чаты"
    val labelContacts get() = if (ThemeManager.language == "en") "Contacts" else "Контакты"
    val labelSettingsTab get() = if (ThemeManager.language == "en") "Settings" else "Настройки"
    val labelSystem get() = if (ThemeManager.language == "en") "System" else "Системная"
    val labelDark get() = if (ThemeManager.language == "en") "Dark" else "Тёмная"
    val labelLight get() = if (ThemeManager.language == "en") "Light" else "Светлая"
    val labelProfile get() = if (ThemeManager.language == "en") "Profile" else "Профиль"
    val labelChatsTab get() = if (ThemeManager.language == "en") "Chats" else "Чаты"
    val labelOnline get() = if (ThemeManager.language == "en") "online" else "online"
    val labelPhone get() = if (ThemeManager.language == "en") "Phone" else "Телефон"
    val labelId get() = if (ThemeManager.language == "en") "ID" else "ID"
    val labelAbout get() = if (ThemeManager.language == "en") "About" else "О себе"
    val labelEditProfile get() = if (ThemeManager.language == "en") "Edit profile" else "Редактировать профиль"
    val labelName get() = if (ThemeManager.language == "en") "Name" else "Имя"
    val labelSave get() = if (ThemeManager.language == "en") "Save" else "Сохранить"
    val labelCancel get() = if (ThemeManager.language == "en") "Cancel" else "Отмена"
    val labelNavigationAndTheme get() = if (ThemeManager.language == "en") "Navigation and theme" else "Навигация и тема"
    val labelPrivacyPolicy get() = if (ThemeManager.language == "en") "Privacy policy" else "Политика конфиденциальности"
    val langRu get() = if (ThemeManager.language == "en") "Russian" else "Русский"
    val langEn get() = if (ThemeManager.language == "en") "English" else "Английский"
    val labelUser get() = if (ThemeManager.language == "en") "User" else "Пользователь"
}
