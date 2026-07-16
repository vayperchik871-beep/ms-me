const locales = {
  ru: {
    lang: 'Русский',
    'в сети': 'в сети',
    'был(а)': 'был(а)',
    'только что': 'только что',
    'мин. назад': 'мин. назад',
    'ч. назад': 'ч. назад',
    'дн. назад': 'дн. назад',
    'печатает...': 'печатает...',
    'Назад': 'Назад',
    'Здесь пока нет сообщений': 'Здесь пока нет сообщений',
    'Отправьте сообщение, чтобы начать': 'Отправьте сообщение, чтобы начать',
    'Настройки': 'Настройки',
    'Тема': 'Тема',
    'Язык': 'Язык',
    'Тёмная': 'Тёмная',
    'Светлая': 'Светлая',
    'Выйти': 'Выйти',
    'Профиль': 'Профиль',
    'Контакты': 'Контакты',
    'Чаты': 'Чаты',
    'Нет чатов': 'Нет чатов',
    'Найти по ID': 'Найти по ID',
    'изм.': 'изм.',
    'Ответ': 'Ответ',
    'Сообщение': 'Сообщение',
    'Ваше имя': 'Ваше имя',
    'Пароль': 'Пароль',
    'Регистрация': 'Регистрация',
    'Вход': 'Вход',
    'вчера': 'вчера',
  },
  en: {
    lang: 'English',
    'в сети': 'online',
    'был(а)': 'was',
    'только что': 'just now',
    'мин. назад': 'min. ago',
    'ч. назад': 'h. ago',
    'дн. назад': 'd. ago',
    'печатает...': 'typing...',
    'Назад': 'Back',
    'Здесь пока нет сообщений': 'No messages yet',
    'Отправьте сообщение, чтобы начать': 'Send a message to start',
    'Настройки': 'Settings',
    'Тема': 'Theme',
    'Язык': 'Language',
    'Тёмная': 'Dark',
    'Светлая': 'Light',
    'Выйти': 'Logout',
    'Профиль': 'Profile',
    'Контакты': 'Contacts',
    'Чаты': 'Chats',
    'Нет чатов': 'No chats',
    'Найти по ID': 'Search by ID',
    'изм.': 'edited',
    'Ответ': 'Reply',
    'Сообщение': 'Message',
    'Ваше имя': 'Your name',
    'Пароль': 'Password',
    'Регистрация': 'Register',
    'Вход': 'Login',
    'вчера': 'yesterday',
  },
}

let currentLang = 'ru'

export function setLanguage(lang) {
  if (locales[lang]) currentLang = lang
  localStorage.setItem('lang', lang)
}

export function getLanguage() {
  return currentLang
}

export function t(key) {
  const lang = locales[currentLang]
  if (lang && lang[key] !== undefined) return lang[key]
  if (locales.ru[key] !== undefined) return locales.ru[key]
  return key
}

export function detectLanguage() {
  const saved = localStorage.getItem('lang')
  if (saved && locales[saved]) { currentLang = saved; return }
  const browser = (navigator.language || '').slice(0, 2)
  currentLang = locales[browser] ? browser : 'ru'
}

export function getLanguages() {
  return Object.entries(locales).map(([code, l]) => ({ code, name: l.lang }))
}

export { locales }
