const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg'

function codePointToHex(cp) {
  return cp.toString(16).toLowerCase()
}

export function emojiToImg(emoji) {
  if (!emoji) return ''
  const codePoints = []
  let i = 0
  while (i < emoji.length) {
    const cp = emoji.codePointAt(i)
    if (cp === 0xFE0F || cp === 0xFE0E) { i++; continue }
    codePoints.push(cp)
    i += cp > 0xFFFF ? 2 : 1
  }
  if (codePoints.length === 0) return emoji
  const hex = codePoints.map(codePointToHex).join('-')
  return `<img class="twemoji" draggable="false" alt="${emoji}" src="${TWEMOJI_BASE}/${hex}.svg" width="16" height="16" />`
}

export function parseEmoji(text) {
  if (!text) return ''
  try {
    return text.replace(
      /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu,
      (match) => emojiToImg(match)
    )
  } catch {
    return text
  }
}

export function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
