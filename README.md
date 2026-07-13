# MS Messenger

Мессенджер с тёмным интерфейсом, регистрацией по ID (без номера телефона) и реальным обменом сообщениями между пользователями.

## Возможности

- Регистрация по **имени** и **уникальному ID** (@username)
- До **2 аккаунтов** на одном устройстве
- Поиск людей по ID
- Реальные сообщения между пользователями (WebSocket)
- Шифрование AES-256-GCM + bcrypt
- Бот **MS-Мессенджер** для кодов подтверждения с нового устройства
- Тёмный интерфейс, liquid glass навигация
- Долгое нажатие на сообщение: реакции, ответ, копирование, редактирование, удаление

---

## Быстрый запуск (локально)

### 1. Установка

```bash
npm install
```

### 2. Настройка сервера

```bash
copy server\.env.example server\.env
```

Откройте `server/.env` и **измените ключи**:

```
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
MS_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
PORT=3001
HOST=0.0.0.0
```

> `MS_ENCRYPTION_KEY` — ровно 64 hex-символа (32 байта). Сгенерировать:  
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Запуск

```bash
npm run dev
```

- **Клиент:** http://localhost:5173  
- **Сервер API:** http://localhost:3001  

---

## Запуск на других устройствах (в одной сети Wi-Fi)

### Шаг 1 — Узнайте IP вашего компьютера

**Windows (PowerShell):**
```powershell
ipconfig
```
Найдите `IPv4 Address` (например, `192.168.1.105`).

### Шаг 2 — Запустите сервер

```bash
npm run dev
```

Vite уже настроен с `--host`, сервер слушает `0.0.0.0`.

### Шаг 3 — Откройте на телефоне/планшете

В браузере другого устройства (в той же Wi-Fi сети):

```
http://192.168.1.105:5173
```

Замените IP на ваш.

### Шаг 4 — Регистрация

1. Нажмите **«Создать аккаунт»**
2. Введите имя и придумайте ID (например, `@ivan`)
3. Задайте пароль
4. Найдите друзей через **поиск по ID**

---

## Запуск в интернете (VPS / облако)

### 1. На сервере (Linux)

```bash
git clone <ваш-репозиторий>
cd ms-messenger
npm install
cp server/.env.example server/.env
# Отредактируйте server/.env — обязательно смените ключи!
```

### 2. Сборка фронтенда

```bash
npm run build
```

### 3. Запуск сервера (production)

```bash
npm run server
```

Сервер отдаёт API на порту 3001. Для production рекомендуется:

- **Nginx** как reverse proxy с SSL (Let's Encrypt)
- Проксирование `/api` и `/ws` на `localhost:3001`
- Раздача `dist/` как статики

Пример фрагмента Nginx:

```nginx
server {
    listen 443 ssl;
    server_name messenger.example.com;

    ssl_certificate /etc/letsencrypt/live/messenger.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/messenger.example.com/privkey.pem;

    location / {
        root /path/to/ms-messenger/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4. Автозапуск (PM2)

```bash
npm install -g pm2
pm2 start server/index.js --name ms-messenger
pm2 save
pm2 startup
```

---

## Структура проекта

```
├── src/                  # React-клиент
│   ├── components/       # UI-компоненты
│   ├── api/              # API-клиент
│   ├── context/          # Авторизация
│   └── styles/           # CSS (тёмная тема)
├── server/               # Node.js сервер
│   ├── index.js          # API + WebSocket
│   ├── db.js             # SQLite база
│   └── crypto.js         # Шифрование
├── public/
│   ├── logo.png          # Логотип
│   └── PRIVACY.md        # Политика конфиденциальности
└── README.md
```

---

## API (кратко)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/verify-device` | Подтверждение нового устройства |
| GET | `/api/users/search?q=` | Поиск по ID |
| POST | `/api/contacts` | Добавить контакт |
| GET | `/api/chats` | Список чатов |
| POST | `/api/chats/:id/messages` | Отправить сообщение |
| WS | `/ws?token=` | Real-time сообщения |

---

## Безопасность

- Смените `JWT_SECRET` и `MS_ENCRYPTION_KEY` перед использованием
- Используйте HTTPS в production
- Коды подтверждения приходят только в чат MS-Мессенджер
- Максимум 2 аккаунта на устройство

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Клиент + сервер (разработка) |
| `npm run dev:client` | Только клиент |
| `npm run dev:server` | Только сервер |
| `npm run build` | Сборка клиента |
| `npm run server` | Запуск сервера |
