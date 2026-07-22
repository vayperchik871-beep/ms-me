# MS Messenger — инструкция

## Окружение
- **OS**: Windows
- **Gradle cache**: `GRADLE_USER_HOME` = `D:\.gradle-cache`
- **Node**: >=22
- **Server**: Render — `https://ms-messenger-server.onrender.com`

## Сборка APK
```bash
npm run build                  # собрать web-клиент (Vite)
npx cap copy android           # скопировать в Android проект
cd android && ./gradlew assembleDebug   # собрать APK
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`
APK подписан `release.keystore` (debug build через signingConfigs.release).

## Google Sign-In (GSI — WebView redirect)
Не использует нативные плагины. Работает через `@react-oauth/google` (`ux_mode="redirect"`):
- При клике WebView редиректит на accounts.google.com
- После входа редиректит обратно в приложение с id_token в URL
- `GoogleOAuthProvider` обрабатывает редирект

Client IDs:
- **Web (server)**: `202627330294-tb4nvaatchp87ke6g1i01nedpc8b5c33.apps.googleusercontent.com`
- **Android**: `202627330294-i3glf16hem9j85of1ma9gq9h5vg3cvl4.apps.googleusercontent.com`
- **SHA-1** (release.keystore): `F6:EF:F6:CA:17:D3:93:E7:8F:F5:BE:91:7A:8C:63:69:C5:4B:1A:68`

## Админ CLI (терминал для ПК)
```bash
node admin-cli.js admin asfghyu78
```
Без пароля — запросит интерактивно. Поддерживает все команды (help, stats, ban и т.д.)

## Файлы
- `.env` — VITE_API_BASE_URL, VITE_GOOGLE_WEB_CLIENT_ID
- `server/.env` — GOOGLE_CLIENT_ID (web), JWT_SECRET
- `capacitor.config.json` — plugins.GoogleAuth (clientId = web client ID)

## Очистка всех аккаунтов (админ)
1. Зарегистрироваться в приложении (через ID + пароль)
2. Стать админом:
   - Отправить `POST /api/admin/promote` с `{ "secret": "admin123" }`
   - Или открыть админку и ввести команду `promote admin123`
3. В админ-панели ввести команду: `purge --force`

## Команды админ-терминала
- `help` — справка
- `stats` — статистика
- `users` — список пользователей
- `ban <id>` / `unban <id>`
- `scam <id>` / `unscam <id>`
- `promote <id>` / `demote <id>` — дать/снять админа
- `delete <id>` — удалить пользователя
- `purge --force` — удалить все аккаунты
- `bc <текст>` — отправить всем сообщение
- `say <id> <текст>` — написать от имени бота
