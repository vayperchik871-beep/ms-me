import { useState, useRef, useEffect } from 'react'

export default function InputBar({ onSend, editText, onCancelEdit }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editText) setText(editText)
  }, [editText])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form className="input-bar dark" onSubmit={handleSubmit}>
      <button type="button" className="icon-btn attach-btn" aria-label="Прикрепить">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="input-wrap dark">
        {editText && (
          <button type="button" className="cancel-edit" onClick={onCancelEdit}>✕</button>
        )}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение..."
          rows={1}
        />
      </div>

      {text.trim() ? (
        <button type="submit" className="send-btn active" aria-label="Отправить">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      ) : (
        <button type="button" className="icon-btn mic-btn" aria-label="Голосовое">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
          </svg>
        </button>
      )}
    </form>
  )
}
