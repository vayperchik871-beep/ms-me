import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import { sendWsMessage } from '../hooks/useWebSocket'
import { t } from '../i18n'

export default function InputBar({ onSend, editText, onCancelEdit, chatId }) {
  const [text, setText] = useState('')
  const [attachPreview, setAttachPreview] = useState(null)
  const [attachFile, setAttachFile] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const recordingSecRef = useRef(0)
  const recordingLockRef = useRef(false)
  const typingTimerRef = useRef(null)

  useEffect(() => {
    if (editText) setText(editText)
  }, [editText])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() && !attachFile) return
    if (attachFile) {
      try {
        const { url, type, duration } = await api.uploadAttachment(attachFile)
        onSend(text, { url, type, name: attachFile.name, size: attachFile.size, duration })
      } catch {}
      setAttachFile(null)
      setAttachPreview(null)
      setText('')
      return
    }
    onSend(text)
    setText('')
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendWsMessage({ type: 'typing', chatId, isTyping: false })
    inputRef.current?.focus()
  }

  const handleChange = (e) => {
    setText(e.target.value)
    if (!chatId) return
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendWsMessage({ type: 'typing', chatId, isTyping: true })
    typingTimerRef.current = setTimeout(() => {
      sendWsMessage({ type: 'typing', chatId, isTyping: false })
    }, 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleAttach = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setAttachPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setAttachPreview(null)
    }
  }

  const cancelAttach = () => {
    setAttachFile(null)
    setAttachPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startRecording = async () => {
    if (recordingLockRef.current) return
    recordingLockRef.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      recordingSecRef.current = 0
      setRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        recordingSecRef.current += 1
        setRecordingTime(recordingSecRef.current)
      }, 1000)

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      mediaRecorder.onstop = async () => {
        clearInterval(timerRef.current)
        recordingLockRef.current = false
        setRecording(false)
        stream.getTracks().forEach((t) => t.stop())
        if (chunksRef.current.length === 0) return
        const blob = new Blob(chunksRef.current, { type: mime })
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: mime })
        try {
          const { url, type } = await api.uploadAttachment(file, recordingSecRef.current)
          onSend('', { url, type, name: t('Голосовое сообщение'), duration: recordingSecRef.current })
        } catch {}
      }
      mediaRecorder.start()
    } catch {
      recordingLockRef.current = false
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <form className="input-bar dark" onSubmit={handleSubmit}>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={handleAttach} />

      {recording ? (
        <div className="recording-bar">
          <div className="recording-dot" />
          <span className="recording-time">{formatTime(recordingTime)}</span>
          <button type="button" className="send-btn active" onClick={stopRecording} aria-label={t('Отправить')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          {!attachFile && (
            <button type="button" className="icon-btn chat-action-btn" onClick={() => fileInputRef.current?.click()} aria-label={t('Прикрепить')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          )}

          <div className="input-wrap dark">
            {editText && (
              <button type="button" className="cancel-edit" onClick={onCancelEdit}>✕</button>
            )}
            {attachFile && (
              <div className="attach-preview">
                {attachPreview ? (
                  <img src={attachPreview} alt="" className="attach-thumb" />
                ) : (
                  <div className="attach-file-icon">📎</div>
                )}
                <button type="button" className="cancel-edit" onClick={cancelAttach}>✕</button>
              </div>
            )}
            {!attachFile && (
              <>
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('Сообщение')}
                  rows={1}
                />
                <button type="button" className="emoji-btn" aria-label={t('Эмодзи')}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
                    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {text.trim() || attachFile ? (
            <button type="submit" className="icon-btn chat-action-btn send-active" aria-label={t('Отправить')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button type="button" className="icon-btn chat-action-btn" onPointerDown={(e) => { e.preventDefault(); startRecording() }} onPointerUp={stopRecording} onPointerLeave={stopRecording} onContextMenu={(e) => e.preventDefault()} aria-label={t('Голосовое')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
        </>
      )}
    </form>
  )
}
