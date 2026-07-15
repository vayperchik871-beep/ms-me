import AppHeader from './AppHeader'

export default function CallsTab() {
  return (
    <div className="tab-content">
      <AppHeader
        searchQuery=""
        onSearchChange={() => {}}
        onCompose={() => {}}
      />
      <div className="empty-tab">
        <p>Звонки</p>
        <p className="empty-hint">Скоро здесь будут голосовые и видеозвонки</p>
      </div>
    </div>
  )
}
