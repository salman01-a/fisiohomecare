import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, setSidebarOpen, rightContent }) {
  const { user } = useAuth();
  
  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
      <h1 className="page-title">{title}</h1>
      <div className="topbar-right">
        {rightContent ? rightContent : <span className="topbar-greeting">Halo, {user?.name} 👋</span>}
      </div>
    </header>
  );
}
