import { useState, useEffect, useRef } from 'react'
import { api, resolveMediaUrl } from '../api/client'

const STICKER_CACHE_KEY = 'sticker_packs_cache'
const STICKER_CACHE_TTL = 5 * 60 * 1000

function loadCachedPacks() {
  try {
    const raw = localStorage.getItem(STICKER_CACHE_KEY)
    if (!raw) return null
    const { packs, ts } = JSON.parse(raw)
    if (Date.now() - ts > STICKER_CACHE_TTL) return null
    return packs
  } catch { return null }
}

function saveCachedPacks(packs) {
  try {
    localStorage.setItem(STICKER_CACHE_KEY, JSON.stringify({ packs, ts: Date.now() }))
  } catch {}
}

export default function StickerPicker({ onSelect, onClose }) {
  const [packs, setPacks] = useState(() => loadCachedPacks() || [])
  const [activePack, setActivePack] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [stickerUrls, setStickerUrls] = useState([])
  const panelRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    Promise.all([
      api.getMyStickerPacks().catch(() => ({ packs: [] })),
      api.getStickerPacks().catch(() => ({ packs: [] })),
    ]).then(([my, all]) => {
      const myPacks = my.packs || []
      const allPacks = (all.packs || []).filter(p => !p.owned)
      const combined = [...myPacks, ...allPacks]
      setPacks(combined)
      saveCachedPacks(combined)
      if (combined.length && !activePack) setActivePack(combined[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (activePack?.stickers?.length) {
      activePack.stickers.slice(0, 20).forEach(url => {
        const img = new Image()
        img.src = resolveMediaUrl(url)
      })
    }
  }, [activePack])

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const handleUploadSticker = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const results = await Promise.all(files.map(f => api.uploadSticker(f)))
      setStickerUrls(prev => [...prev, ...results.map(r => r.url)])
    } catch {}
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCreatePack = async () => {
    if (!newTitle.trim() || !stickerUrls.length) return
    try {
      const { packId } = await api.createStickerPack(newTitle, stickerUrls)
      const pack = { id: packId, title: newTitle, stickers: stickerUrls, author: 'you' }
      setPacks(prev => [pack, ...prev])
      setActivePack(pack)
      setShowCreate(false)
      setNewTitle('')
      setStickerUrls([])
    } catch {}
  }

  const removeSticker = (idx) => {
    setStickerUrls(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="sticker-picker" ref={panelRef}>
      {showCreate ? (
        <div className="sticker-create">
          <div className="sticker-create-header">
            <button className="sticker-create-back" onClick={() => setShowCreate(false)}>←</button>
            <span className="sticker-create-title">Новый пакет</span>
            <button
              className="sticker-create-save"
              disabled={!newTitle.trim() || !stickerUrls.length}
              onClick={handleCreatePack}
            >
              Готово
            </button>
          </div>
          <input
            className="sticker-title-input"
            placeholder="Название пакета..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            maxLength={30}
          />
          <div className="sticker-upload-area">
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleUploadSticker} />
            <button className="sticker-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? '...' : '+'}
            </button>
            {stickerUrls.map((url, i) => (
              <div key={i} className="sticker-upload-preview">
                <img src={resolveMediaUrl(url)} alt="" />
                <button className="sticker-remove" onClick={() => removeSticker(i)}>×</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="sticker-packs-row">
            {packs.map(p => (
              <button
                key={p.id}
                className={`sticker-pack-tab ${activePack?.id === p.id ? 'active' : ''}`}
                onClick={() => setActivePack(p)}
              >
                {p.stickers?.[0] ? (
                  <img src={resolveMediaUrl(p.stickers[0])} alt="" />
                ) : (
                  <span>{p.title[0]}</span>
                )}
              </button>
            ))}
            <button className="sticker-pack-tab sticker-add" onClick={() => setShowCreate(true)}>+</button>
          </div>
          <div className="sticker-grid">
            {activePack?.stickers?.map((url, i) => (
              <button key={i} className="sticker-item" onClick={() => onSelect(url)}>
                <img src={resolveMediaUrl(url)} alt="" />
              </button>
            ))}
            {(!activePack?.stickers?.length) && (
              <div className="sticker-empty">Нет стикеров. Создайте пакет!</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
