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
    if (cp === 0x200D) { i++; continue }
    codePoints.push(cp)
    i += cp > 0xFFFF ? 2 : 1
  }
  if (codePoints.length === 0) return emoji
  const hex = codePoints.map(codePointToHex).join('-')
  return `<img class="twemoji" draggable="false" alt="${emoji}" src="${TWEMOJI_BASE}/${hex}.svg" />`
}

const EMOJI_RE = /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D\p{Emoji_Presentation})*/gu

export function parseEmoji(text) {
  if (!text) return ''
  return text.replace(EMOJI_RE, (match) => emojiToImg(match))
}
