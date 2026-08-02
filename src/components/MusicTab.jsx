import { useState, useEffect, useRef } from 'react'
import { t } from '../i18n'
import { api, resolveMediaUrl } from '../api/client'

const STATUS_LABELS = {
  moderation: 'На модерации',
  published: 'Опубликован',
  rejected: 'Отклонён',
}

export default function MusicTab() {
  const [tab, setTab] = useState('main')
  const [data, setData] = useState({ artist: null })
  const [loading, setLoading] = useState(true)
  const [showArtistModal, setShowArtistModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [search, setSearch] = useState('')
  useEffect(() => { load() }, [])
  useEffect(() => { if (search.trim()) { debouncedSearch(search) } }, [search])

  const [searchResults, setSearchResults] = useState({ artists: [], tracks: [] })
  const debounceRef = useRef(null)
  const debouncedSearch = (q) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await api.request(`/music/search?q=${encodeURIComponent(q)}`)
        setSearchResults(r)
      } catch {}
    }, 300)
  }

  async function load() {
    setLoading(true)
    try {
      const r = await api.request('/music/me')
      setData(r)
    } catch {}
    setLoading(false)
  }

  const artist = data?.artist

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h1 className="tab-title">{t('Музыка')}</h1>
        <button className="tab-header-btn" onClick={() => { if (artist) setShowUploadModal(true); else setShowArtistModal(true) }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <div className="music-tabs">
        {[['main', 'Главная'], ['distribution', 'Дистрибуция'], ['favorites', 'Избранное'], ['downloads', 'Загрузки']].map(([id, label]) => (
          <button key={id} className={`music-tab ${tab === id ? 'music-tab-active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="music-search">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск артистов и треков…"
        />
      </div>

      {loading ? <div className="music-empty">Загрузка…</div> : tab === 'distribution' ? (
        <DistributionView
          artist={artist}
          loading={loading}
          onOpenArtist={() => setShowArtistModal(true)}
          onOpenUpload={() => setShowUploadModal(true)}
          onUpdated={load}
        />
      ) : tab === 'main' && search.trim() ? <SearchResults results={searchResults} /> : tab === 'favorites' ? (
        <div className="music-empty">{t('Нет треков')}</div>
      ) : tab === 'downloads' ? (
        <div className="music-empty">{t('Нет треков')}</div>
      ) : (
        <BrowseView artist={artist} onPlay />
      )}

      {showArtistModal && <ArtistModal onDone={(a) => { setData({ ...data, artist: a }); setShowArtistModal(false) }} onClose={() => setShowArtistModal(false)} />}
      {showUploadModal && <UploadTrackModal onDone={() => { setShowUploadModal(false); load() }} onClose={() => setShowUploadModal(false)} />}
    </div>
  )
}

function DistributionView({ artist, onCreateArtist, onOpenUpload, onUpdated }) {
  if (!artist) {
    return (
      <div className="music-center-card">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v2"/></svg>
        <p className="modal-hint">У вас нет карточки артиста</p>
        <button className="btn-primary btn-wide" onClick={onCreateArtist}>Создать</button>
      </div>
    )
  }
  const tracks = artist.tracks || []
  const inModeration = tracks.filter((tr) => tr.status === 'moderation')
  return (
    <div className="distribution-wrap">
      <div className="artist-hero">
        {artist.banner && <img className="artist-banner" src={resolveMediaUrl(artist.banner)} alt="" />}
        <img className="artist-photo" src={artist.photo ? resolveMediaUrl(artist.photo) : `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=6C63FF&color=fff`} alt="" />
        <h3>{artist.name}</h3>
        <button className="btn-ghost btn-small" onClick={onOpenUpload}>Добавить трек</button>
      </div>

      <div className="distr-section">
        <h4>Модерация</h4>
        {inModeration.length === 0 ? (
          <div className="music-empty" style={{ padding: 24 }}>Нет треков на модерации</div>
        ) : inModeration.map((tr) => <TrackRow key={tr.id} track={tr} />)}
      </div>

      <div className="distr-section">
        <h4>Мои треки</h4>
        {tracks.length === 0 ? (
          <div className="music-empty" style={{ padding: 24 }}>Пока нет треков</div>
        ) : tracks.map((tr) => <TrackRow key={tr.id} track={tr} />)}
      </div>
    </div>
  )
}

function TrackRow({ track, showModeration }) {
  const cover = track.cover ? resolveMediaUrl(track.cover) : null
  return (
    <div className="track-row" style={{ opacity: track.status === 'rejected' ? 0.6 : 1 }}>
      {cover ? (
        <img className="track-cover" src={cover} alt="" />
      ) : (
        <div className="track-cover track-cover-ph">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
      )}
      <div className="track-meta">
        <div className="track-title">{track.title}</div>
        <div className="track-sub">{track.artist} · {track.format?.toUpperCase()}{track.isPublic ? ' · Публичный' : ' · Приватный'}</div>
      </div>
      <span className={`track-status track-status-${track.status}`}>{STATUS_LABELS[track.status] || track.status}</span>
      <audio controls preload="none" src={resolveMediaUrl(track.fileUrl)} style={{ width: 40, opacity: 0 }} />
    </div>
  )
}

function SearchResults({ results }) {
  return (
    <div className="distribution-wrap">
      {results.artists.length > 0 && (
        <div className="distr-section">
          <h4>Артисты</h4>
          {results.artists.map((a) => (
            <div className="track-row" key={a.id}>
              <img className="track-cover" src={a.photo ? resolveMediaUrl(a.photo) : `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=4C63FF&color=fff`} alt="" />
              <div className="track-meta">
                <div className="track-title">{a.name}</div>
                <div className="track-sub">Артист</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {results.tracks.length > 0 && (
        <div className="distr-section">
          <h4>Треки</h4>
          {results.tracks.map((tr) => <TrackRow key={tr.id} track={tr} />)}
        </div>
      )}
      {!results.artists.length && !results.tracks.length && <div className="music-empty">Ничего не найдено</div>}
    </div>
  )
}

function BrowseBody({ artist }) {
  return <div className="music-empty">{t('Нет треков')}</div>
}

function ArtistModal({ onDone, onClose }) {
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState(null)
  const [banner, setBanner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (!name.trim()) { setErr('Введите никнейм'); return }
    setSaving(true); setErr('')
    try {
      const form = new FormData()
      form.append('name', name.trim())
      if (photo) form.append('photo', photo)
      if (banner) form.append('banner', banner)
      const token = localStorage.getItem('ms_active_account')
      const res = await fetch(`https://ms-messenger-server.onrender.com/api/music/artist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getTokenValue()}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      onDone(data.artist)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="artist-modal-top">
          <h3>Карточка артиста</h3>
          <button className="btn-primary btn-small" disabled={saving} onClick={submit}>{saving ? '…' : 'Готово'}</button>
        </div>
        <div className="artist-create-preview">
          {banner && <img className="artist-banner-preview" src={URL.createObjectURL(banner)} alt="" />}
          {photo ? (
            <img className="artist-photo-preview" src={URL.createObjectURL(photo)} alt="" />
          ) : (
            <div className="artist-photo-preview artist-photo-placeholder">Фото</div>
          )}
          <h3>{name || 'Никнейм'}</h3>
        </div>
        <input className="artist-input" placeholder="Никнейм артиста" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
        <FileField label="Фото" accept="image/*" onChange={setPhoto} />
        <FileField label="Баннер" accept="image/*" onChange={setBanner} />
        {err && <div className="form-error">{err}</div>}
      </div>
    </div>
  )
}

function FileField({ label, accept, onChange }) {
  const inputRef = useRef(null)
  return (
    <div className="file-field" onClick={() => inputRef.current?.click()}>
      <span className="file-field-label">{label}</span>
      <span className="file-field-value">Выбрать файл</span>
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => onChange?.(e.target.files?.[0] || null)} />
    </div>
  )
}

function UploadTrackModal({ onDone, onClose }) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [cover, setCover] = useState(null)
  const [isPublic, setIsPublic] = useState(true)
  const [releaseNow, setReleaseNow] = useState(true)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (!title.trim()) { setErr('Укажите название'); return }
    if (!file) { setErr('Выберите MP3 или WAV'); return }
    setSaving(true); setErr('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('title', title.trim())
      form.append('isPublic', String(isPublic))
      form.append('releaseNow', String(releaseNow))
      if (cover) form.append('cover', cover)
      if (!releaseNow && scheduledAt) form.append('scheduledAt', new Date(scheduledAt).getTime())
      const res = await fetch(`https://ms-messenger-server.onrender.com/api/music/track`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getTokenValue()}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      onDone()
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="artist-modal-top">
          <h3>Новый трек</h3>
          <button className="btn-primary btn-small" disabled={saving} onClick={submit}>{saving ? '…' : 'Готово'}</button>
        </div>
        <input className="artist-input" placeholder="Название трека" value={title} onChange={(e) => setTitle(e.target.value)} />
        <FileField label="Аудио (MP3/WAV)" accept="audio/mpeg,audio/wav,.mp3,.wav" onChange={setFile} />
        <FileField label="Обложка" accept="image/*" onChange={setCover} />
        {file && <div className="file-chosen">Файл: {file.name} ({formatMB(file.size)})</div>}
        <label className="track-toggle"><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Публичный трек</label>
        <label className="track-toggle"><input type="checkbox" checked={releaseNow} onChange={(e) => setReleaseNow(e.target.checked)} /> Выложить сейчас</label>
        {!releaseNow && (
          <input className="artist-input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        )}
        {err && <div className="form-error">{err}</div>}
      </div>
    </div>
  )
}

function formatMB(n) { return (n / 1024 / 1024).toFixed(1) + ' МБ' }

function getTokenValue() {
  if (localStorage.getItem('project_token')) return localStorage.getItem('project_token')
  return JSON.parse(localStorage.getItem('ms_accounts') || '[]')?.[0]?.token || ''
}