# MS Messenger — iOS (SwiftUI)

## Как собрать в Xcode

1. Открой Xcode
2. Создай новый iOS проект: **File → New → Project → iOS → App**
3. Выбери:
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Bundle Identifier:** `com.ms.messenger`
4. Закрой созданный проект

5. Скопируй всё из папки `MSMessenger/` в созданный проект:
   - Замени `MSMessengerApp.swift`
   - Добавь папки `Models/`, `Services/`, `Managers/`, `Views/`, `Components/`
   - Замени `Assets.xcassets/` на папку из `Resources/`

6. В **Signing & Capabilities**:
   - Добавь **Push Notifications** (если нужны уведомления)
   - Добавь **Background Modes → Remote notifications**

7. Выбери симулятор или устройство → **Build and Run (Cmd+R)**

## Структура проекта

```
MSMessenger/
├── MSMessengerApp.swift        # Точка входа
├── Info.plist
├── Resources/Assets.xcassets/  # Иконки, цвета
├── Models/                     # Модели данных
│   ├── User.swift
│   ├── Chat.swift
│   ├── Message.swift
│   ├── Gift.swift
│   └── WSMessage.swift
├── Services/                   # Сервисы
│   ├── APIClient.swift         # HTTP-клиент (все endpoints)
│   ├── WebSocketManager.swift  # WebSocket для real-time
│   ├── AuthManager.swift       # Управление авторизацией
│   └── I18n.swift              # Локализация RU/EN
├── Managers/
│   ├── ThemeManager.swift      # Темизация + Liquid Glass модификаторы
├── Components/
│   ├── AvatarView.swift        # Аватар с картинкой/заглушкой/online
├── Views/
│   ├── ContentView.swift       # Главный навигатор
│   ├── Onboarding/
│   │   ├── OnboardingView.swift
│   │   ├── LoginView.swift
│   │   └── RegisterView.swift
│   ├── Main/
│   │   ├── BottomNavBar.swift         # iOS 26 Liquid Glass
│   │   ├── ChatsListView.swift
│   │   ├── ContactsListView.swift
│   │   ├── ProfileView.swift
│   │   └── SettingsView.swift
│   ├── Chat/
│   │   ├── ChatWindowView.swift
│   │   ├── ChatHeaderView.swift       # iOS 26 три капсулы
│   │   ├── MessageBubbleView.swift
│   │   └── InputBarView.swift
│   └── Modals/
│       └── ProfileEditorView.swift
```

## Особенности дизайна

- iOS 26 Liquid Glass везде: `ultraThinMaterial`, `blur(28px)`, `saturate(1.2)`
- Нижняя навигация — плавающая пилюля 72pt, radius 36
- Шапка чата — 3 стеклянные капсулы (назад, имя+статус, аватар)
- Тёмная/светлая тема через `UIUserInterfaceStyle`
- Языки: RU / EN
