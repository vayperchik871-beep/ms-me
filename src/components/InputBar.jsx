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
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const audioFileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const recordingTimeRef = useRef(0)
  const typingTimerRef = useRef(null)

  useEffect(() => {
    if (editText) setText(editText)
  }, [editText])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px'
    }
  }, [text])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const hasText = text.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((!text.trim() && !attachFile) || uploading) return
    if (attachFile) {
      setUploading(true)
      try {
        const { url, type, duration } = await api.uploadAttachment(attachFile)
        onSend(text, { url, type, name: attachFile.name, size: attachFile.size, duration })
      } catch (err) {
        console.error('Upload error:', err)
      }
      setAttachFile(null)
      setAttachPreview(null)
      setUploading(false)
      setText('')
      return
    }
    onSend(text)
    setText('')
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendWsMessage({ type: 'typing', chatId, isTyping: false })
    textareaRef.current?.focus()
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/wav'
      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      recordingTimeRef.current = 0
      setRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1
        setRecordingTime(recordingTimeRef.current)
      }, 1000)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onerror = () => {
        stopRecording()
      }

      mediaRecorder.onstop = async () => {
        clearInterval(timerRef.current)
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setRecording(false)

        if (chunksRef.current.length === 0) return
        const blob = new Blob(chunksRef.current, { type: mime })
        if (blob.size < 100) return

        const ext = mime.includes('webm') ? 'webm' : mime.includes('mp4') ? 'm4a' : 'wav'
        const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: mime })
        const dur = recordingTimeRef.current

        try {
          const { url, type } = await api.uploadAttachment(file, dur)
          onSend('', { url, type, name: t('Голосовое сообщение'), duration: dur })
        } catch (err) {
          console.error('Voice upload error:', err)
        }
      }

      mediaRecorder.start(250)
    } catch (err) {
      console.error('Mic permission error:', err)
      setRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    chunksRef.current = []
    setRecording(false)
    setRecordingTime(0)
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleAudioFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url, type, duration } = await api.uploadAttachment(file)
      onSend('', { url, type, name: file.name, duration })
    } catch (err) {
      console.error('Audio file upload error:', err)
    }
    setUploading(false)
    if (audioFileInputRef.current) audioFileInputRef.current.value = ''
  }

  return (
    <form className="ig-bar" onSubmit={handleSubmit}>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={handleAttach} />
      <input ref={audioFileInputRef} type="file" accept="audio/*" hidden onChange={handleAudioFile} />

      {recording ? (
        <div className="ig-recording">
          <button type="button" className="ig-rec-cancel" onClick={cancelRecording} aria-label={t('Отмена')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div className="ig-rec-dot" />
          <span className="ig-rec-time">{formatTime(recordingTime)}</span>
          <button type="button" className="ig-btn ig-send" onClick={stopRecording} aria-label={t('Отправить')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="ig-row">
          {!attachFile && !uploading && (
            <button type="button" className="ig-btn ig-attach" onClick={() => fileInputRef.current?.click()} aria-label={t('Прикрепить')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          )}

          <div className={`ig-capsule${attachFile ? ' ig-capsule-attach' : ''}`}>
            {editText && (
              <button type="button" className="ig-cancel" onClick={onCancelEdit}>✕</button>
            )}
            {attachFile && (
              <div className="ig-attach-preview">
                {attachPreview ? (
                  <img src={attachPreview} alt="" />
                ) : (
                  <div className="ig-attach-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  </div>
                )}
                <button type="button" className="ig-cancel" onClick={cancelAttach}>✕</button>
              </div>
            )}
            {!attachFile && (
              <>
                <textarea
                  ref={textareaRef}
                  className="ig-textarea"
                  value={text}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder={uploading ? t('Загрузка...') : t('Сообщение')}
                  rows={1}
                  disabled={uploading}
                />
                <button type="button" className="ig-emoji" aria-label={t('Эмодзи')}>
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

          {hasText || attachFile ? (
            <button type="submit" className="ig-btn ig-send" disabled={uploading} aria-label={t('Отправить')}>
              {uploading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ig-spinner"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" className="ig-btn ig-mic" onClick={startRecording} aria-label={t('Голосовое')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
              <button type="button" className="ig-btn ig-attach-audio" onClick={() => audioFileInputRef.current?.click()} aria-label={t('Аудиофайл')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
