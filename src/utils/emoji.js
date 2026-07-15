import twemoji from 'twemoji'

const CDN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'

export function parseEmoji(text) {
  if (!text) return ''
  return twemoji.parse(text, { base: CDN, folder: '72x72', ext: '.png' })
}
