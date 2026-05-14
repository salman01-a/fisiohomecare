import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, therapistAPI, serviceAPI, orderAPI, paymentAPI } from '../services/api';
import './Dashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsRes, ordersRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getOrders({ limit: 5 })
        ]);
        setStats(statsRes.data);
        setOrders(ordersRes.data || []);
      } else if (activeTab === 'orders') {
        const params = statusFilter ? { status: statusFilter } : {};
        const res = await dashboardAPI.getOrders(params);
        setOrders(res.data || []);
      } else if (activeTab === 'therapists') {
        const res = await therapistAPI.getAll();
        setTherapists(res.data || []);
      } else if (activeTab === 'services') {
        const res = await serviceAPI.getAll();
        setServices(res.data || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { if (activeTab === 'orders') loadData(); }, [statusFilter]);

  const handleValidate = async (id, status) => {
    try {
      await therapistAPI.validate(id, status);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleOrderStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, status);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleConfirmPayment = async (orderId, status) => {
    try {
      await paymentAPI.confirm(orderId, status);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const statusBadge = (status) => <span className={`badge badge--${status}`}>{status}</span>;

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Pesanan', icon: '📋' },
    { id: 'therapists', label: 'Terapis', icon: '👨‍⚕️' },
    { id: 'services', label: 'Layanan', icon: '🏥' },
  ];

  return (
    <div className="dashboard">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
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
            <div className="avatar">{user?.name?.[0] || 'A'}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">Administrator</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            Keluar
          </button>
        </div>
      </aside>

      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ display: sidebarOpen ? 'block' : 'none' }} />

      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          <h1 className="page-title">{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="topbar-right">
            <span className="topbar-greeting">Halo, {user?.name} 👋</span>
          </div>
        </header>

        <div className="content">
          {loading ? (
            <div className="content-loading"><div className="loading-spinner" /><p>Memuat data...</p></div>
          ) : activeTab === 'overview' ? (
            <div className="overview">
              <div className="stats-grid">
                {[
                  { label: 'Total Order', value: stats?.totalOrders || 0, icon: '📦', color: '#6366f1' },
                  { label: 'Pendapatan', value: formatCurrency(stats?.totalRevenue), icon: '💰', color: '#10b981' },
                  { label: 'Terapis Aktif', value: stats?.activeTherapists || 0, icon: '👨‍⚕️', color: '#06b6d4' },
                  { label: 'Menunggu Validasi', value: stats?.pendingTherapists || 0, icon: '⏳', color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} className="stat-card" style={{ '--accent': s.color }}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-info">
                      <span className="stat-value">{s.value}</span>
                      <span className="stat-label">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="section-card">
                <div className="section-header">
                  <h2>Pesanan Terbaru</h2>
                  <button className="link-btn" onClick={() => setActiveTab('orders')}>Lihat Semua →</button>
                </div>
                {orders.length === 0 ? <p className="empty-text">Belum ada pesanan</p> : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Pasien</th><th>Terapis</th><th>Layanan</th><th>Status</th><th>Alamat</th></tr></thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id}>
                            <td>{o.patient?.user?.name || o.patient_id}</td>
                            <td>{o.therapist?.user?.name || o.therapist_id}</td>
                            <td>{o.service?.name || o.service_type || '-'}</td>
                            <td>{statusBadge(o.status)}</td>
                            <td className="td-truncate">{o.address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <div>
              <div className="toolbar">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
                  <option value="">Semua Status</option>
                  {['pending','confirmed','otw','ongoing','done','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="section-card">
                {orders.length === 0 ? <p className="empty-text">Tidak ada pesanan</p> : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Pasien</th><th>Terapis</th><th>Layanan</th><th>Alamat</th><th>Status</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id}>
                            <td>{o.patient?.user?.name || '-'}</td>
                            <td>{o.therapist?.user?.name || '-'}</td>
                            <td>{o.service?.name || o.service_type || '-'}</td>
                            <td className="td-truncate">{o.address}</td>
                            <td>{statusBadge(o.status)}</td>
                            <td>
                              <div className="action-btns">
                                {o.status === 'pending' && <button className="btn btn--sm btn--primary" onClick={() => handleOrderStatus(o.id, 'confirmed')}>Konfirmasi</button>}
                                {o.status !== 'done' && o.status !== 'cancelled' && <button className="btn btn--sm btn--danger" onClick={() => handleOrderStatus(o.id, 'cancelled')}>Batal</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'therapists' ? (
            <div className="section-card">
              {therapists.length === 0 ? <p className="empty-text">Belum ada terapis</p> : (
                <div className="cards-grid">
                  {therapists.map(t => (
                    <div key={t.id} className="therapist-card">
                      <div className="therapist-card-header">
                        <div className="avatar avatar--lg">{t.user?.name?.[0] || 'T'}</div>
                        <div>
                          <h3>{t.user?.name || 'Terapis'}</h3>
                          <p className="text-muted">{t.specialization || 'Umum'}</p>
                        </div>
                        {statusBadge(t.status)}
                      </div>
                      <div className="therapist-card-body">
                        <div className="info-row"><span>Email</span><span>{t.user?.email}</span></div>
                        <div className="info-row"><span>No. STR</span><span>{t.license_number}</span></div>
                        <div className="info-row"><span>Rating</span><span>⭐ {t.rating || '0.00'}</span></div>
                      </div>
                      {t.status === 'pending' && (
                        <div className="therapist-card-actions">
                          <button className="btn btn--primary" onClick={() => handleValidate(t.id, 'active')}>Validasi</button>
                          <button className="btn btn--danger" onClick={() => handleValidate(t.id, 'suspended')}>Tolak</button>
                        </div>
                      )}
                      {t.status === 'active' && (
                        <div className="therapist-card-actions">
                          <button className="btn btn--danger" onClick={() => handleValidate(t.id, 'suspended')}>Suspend</button>
                        </div>
                      )}
                      {t.status === 'suspended' && (
                        <div className="therapist-card-actions">
                          <button className="btn btn--primary" onClick={() => handleValidate(t.id, 'active')}>Aktifkan</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'services' ? (
            <div className="section-card">
              {services.length === 0 ? <p className="empty-text">Belum ada layanan</p> : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Nama</th><th>Deskripsi</th><th>Harga</th><th>Durasi</th><th>Status</th></tr></thead>
                    <tbody>
                      {services.map(s => (
                        <tr key={s.id}>
                          <td className="text-bold">{s.name}</td>
                          <td className="td-truncate">{s.description || '-'}</td>
                          <td>{formatCurrency(s.price)}</td>
                          <td>{s.duration_minutes} menit</td>
                          <td>{s.is_active ? <span className="badge badge--active">Aktif</span> : <span className="badge badge--suspended">Nonaktif</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
