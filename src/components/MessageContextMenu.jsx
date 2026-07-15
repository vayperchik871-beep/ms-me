import { parseEmoji } from '../utils/emoji'

const REACTIONS = ['❤️', '👍', '👎', '😂', '😮', '😢', '🔥']

const MENU_ITEMS = [
  { id: 'reply', label: 'Ответить', icon: ReplyIcon },
  { id: 'forward', label: 'Переслать', icon: ForwardIcon },
  { id: 'favorite', label: 'В избранное', icon: StarIcon },
  { id: 'copy', label: 'Копировать', icon: CopyIcon },
  { id: 'edit', label: 'Редактировать', icon: EditIcon, mineOnly: true },
  { id: 'pin', label: 'Закрепить', icon: PinIcon },
  { id: 'select', label: 'Выбрать', icon: SelectIcon },
  { id: 'delete', label: 'Удалить', icon: DeleteIcon, mineOnly: true, danger: true },
]

export default function MessageContextMenu({ message, isMine, position, onAction, onReact, onClose }) {
  const items = MENU_ITEMS.filter((item) => !item.mineOnly || isMine)

  return (
    <div className="context-overlay" onClick={onClose}>
      <div
        className="context-menu-wrap"
        style={{ top: position.y, left: position.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reactions-bar">
          {REACTIONS.map((emoji) => (
            <button key={emoji} className="reaction-btn" onClick={() => { onReact(emoji); onClose() }} dangerouslySetInnerHTML={{ __html: parseEmoji(emoji) }} />
          ))}
          <button className="reaction-btn more" dangerouslySetInnerHTML={{ __html: parseEmoji('😊') }} />
        </div>

        <div className="context-menu">
          {items.map((item) => (
            <button
              key={item.id}
              className={`context-item ${item.danger ? 'danger' : ''}`}
              onClick={() => { onAction(item.id); onClose() }}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReplyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 14L4 9l5-5" /><path d="M4 9h10a4 4 0 014 4v1" />
    </svg>
  )
}

function ForwardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 14l5-5-5-5" /><path d="M20 9H10a4 4 0 00-4 4v1" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 17v5M9 3h6l1 7h4l-3 5H7L4 10h4l1-7z" />
    </svg>
  )
}

function SelectIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}
