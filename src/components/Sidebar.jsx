import { useAuth } from '../context/AuthContext';

export default function Sidebar({ 
  tabs, 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  variant = 'admin',
  statusBadge = null 
}) {
  const { user, logout } = useAuth();

  return (
    <>
      <aside className={`sidebar ${variant === 'therapist' ? 'sidebar--therapist' : ''} ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">+</div>
            <span>FisioHomecare</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(t => (
            <button key={t.id} className={`nav-item ${activeTab === t.id ? 'nav-item--active' : ''}`}
              onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}>
              <span className="nav-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className={`avatar ${variant === 'therapist' ? 'avatar--green' : ''}`}>
              {user?.name?.[0] || (variant === 'therapist' ? 'T' : 'A')}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">
                {variant === 'admin' ? 'Administrator' : 'Terapis'}
                {statusBadge && ` ${statusBadge}`}
              </span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>Keluar</button>
        </div>
      </aside>
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ display: sidebarOpen ? 'block' : 'none' }} />
    </>
  );
}
