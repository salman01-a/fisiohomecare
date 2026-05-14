import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderAPI, therapistAPI, recordAPI } from '../services/api';
import './Dashboard.css';

export default function TherapistDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ date: '', start_time: '', end_time: '' });

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const res = await orderAPI.getAll();
        setOrders(res.data || []);
      } else if (activeTab === 'schedules') {
        if (user?.therapist_id || profile?.id) {
          const tid = user?.therapist_id || profile?.id;
          const res = await therapistAPI.getSchedules(tid);
          setSchedules(res.data || []);
        }
      } else if (activeTab === 'profile') {
        // Profile loaded from user context
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Load therapist profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get the therapist profile from /auth/me which includes therapist data
        const meRes = await import('../services/api').then(m => m.authAPI.getMe());
        if (meRes.data?.therapist) {
          setProfile(meRes.data.therapist);
        }
      } catch (err) { console.error(err); }
    };
    loadProfile();
  }, []);

  const handleOrderStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, status);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const tid = user?.therapist_id || profile?.id;
      await therapistAPI.createSchedule(tid, newSchedule);
      setNewSchedule({ date: '', start_time: '', end_time: '' });
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteSchedule = async (sid) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      const tid = user?.therapist_id || profile?.id;
      await therapistAPI.deleteSchedule(tid, sid);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const statusBadge = (s) => <span className={`badge badge--${s}`}>{s}</span>;
  const nextStatus = { pending: null, confirmed: 'otw', otw: 'ongoing', ongoing: 'done' };

  const tabs = [
    { id: 'orders', label: 'Pesanan Saya', icon: '📋' },
    { id: 'schedules', label: 'Jadwal', icon: '📅' },
    { id: 'profile', label: 'Profil', icon: '👤' },
  ];

  return (
    <div className="dashboard">
      <aside className={`sidebar sidebar--therapist ${sidebarOpen ? 'sidebar--open' : ''}`}>
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
            <div className="avatar avatar--green">{user?.name?.[0] || 'T'}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">Terapis {profile?.status === 'active' ? '✓' : profile?.status === 'pending' ? '⏳' : ''}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>Keluar</button>
        </div>
      </aside>

      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ display: sidebarOpen ? 'block' : 'none' }} />

      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          <h1 className="page-title">{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="topbar-right">
            {profile?.status === 'pending' && <span className="badge badge--pending">Menunggu Validasi</span>}
            {profile?.status === 'active' && <span className="badge badge--active">Terverifikasi</span>}
          </div>
        </header>

        <div className="content">
          {profile?.status === 'pending' && (
            <div className="alert alert--warning">
              ⚠️ Akun Anda masih menunggu validasi admin. Beberapa fitur dibatasi sampai akun divalidasi.
            </div>
          )}

          {loading ? (
            <div className="content-loading"><div className="loading-spinner" /><p>Memuat data...</p></div>
          ) : activeTab === 'orders' ? (
            <div className="section-card">
              <div className="section-header"><h2>Daftar Pesanan</h2></div>
              {orders.length === 0 ? <p className="empty-text">Belum ada pesanan</p> : (
                <div className="cards-grid">
                  {orders.map(o => (
                    <div key={o.id} className="order-card">
                      <div className="order-card-header">
                        <div>
                          <h3>{o.patient?.user?.name || 'Pasien'}</h3>
                          <p className="text-muted">{o.service?.name || o.service_type || '-'}</p>
                        </div>
                        {statusBadge(o.status)}
                      </div>
                      <div className="order-card-body">
                        <div className="info-row"><span>📍 Alamat</span><span>{o.address}</span></div>
                        {o.notes && <div className="info-row"><span>📝 Catatan</span><span>{o.notes}</span></div>}
                        <div className="info-row"><span>📅 Jadwal</span><span>{o.schedule?.date || '-'} {o.schedule?.start_time || ''}</span></div>
                      </div>
                      {nextStatus[o.status] && profile?.status === 'active' && (
                        <div className="order-card-actions">
                          <button className="btn btn--primary" onClick={() => handleOrderStatus(o.id, nextStatus[o.status])}>
                            {o.status === 'confirmed' ? '🚗 Dalam Perjalanan' : o.status === 'otw' ? '▶️ Mulai Sesi' : o.status === 'ongoing' ? '✅ Selesai' : 'Update'}
                          </button>
                          {o.status !== 'ongoing' && (
                            <button className="btn btn--danger" onClick={() => handleOrderStatus(o.id, 'cancelled')}>Batalkan</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'schedules' ? (
            <div>
              {profile?.status === 'active' && (
                <div className="section-card" style={{ marginBottom: 24 }}>
                  <div className="section-header"><h2>Tambah Jadwal Baru</h2></div>
                  <form onSubmit={handleCreateSchedule} className="schedule-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tanggal</label>
                        <input type="date" value={newSchedule.date} onChange={e => setNewSchedule(p => ({ ...p, date: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label>Jam Mulai</label>
                        <input type="time" value={newSchedule.start_time} onChange={e => setNewSchedule(p => ({ ...p, start_time: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label>Jam Selesai</label>
                        <input type="time" value={newSchedule.end_time} onChange={e => setNewSchedule(p => ({ ...p, end_time: e.target.value }))} required />
                      </div>
                      <button type="submit" className="btn btn--primary">+ Tambah</button>
                    </div>
                  </form>
                </div>
              )}
              <div className="section-card">
                <div className="section-header"><h2>Jadwal Saya</h2></div>
                {schedules.length === 0 ? <p className="empty-text">Belum ada jadwal</p> : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Tanggal</th><th>Mulai</th><th>Selesai</th><th>Status</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {schedules.map(s => (
                          <tr key={s.id}>
                            <td>{s.date}</td>
                            <td>{s.start_time}</td>
                            <td>{s.end_time}</td>
                            <td>{s.is_booked ? <span className="badge badge--confirmed">Dipesan</span> : <span className="badge badge--active">Tersedia</span>}</td>
                            <td>{!s.is_booked && <button className="btn btn--sm btn--danger" onClick={() => handleDeleteSchedule(s.id)}>Hapus</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="section-card">
              <div className="profile-header">
                <div className="avatar avatar--xl avatar--green">{user?.name?.[0] || 'T'}</div>
                <div>
                  <h2>{user?.name}</h2>
                  <p className="text-muted">{user?.email}</p>
                  {profile && statusBadge(profile.status)}
                </div>
              </div>
              {profile && (
                <div className="profile-details">
                  <div className="info-row"><span>📱 Telepon</span><span>{user?.phone || '-'}</span></div>
                  <div className="info-row"><span>🏥 Spesialisasi</span><span>{profile.specialization || '-'}</span></div>
                  <div className="info-row"><span>📄 No. STR</span><span>{profile.license_number || '-'}</span></div>
                  <div className="info-row"><span>⭐ Rating</span><span>{profile.rating || '0.00'}</span></div>
                  <div className="info-row"><span>📋 Status</span>{statusBadge(profile.status)}</div>
                  {profile.validated_at && <div className="info-row"><span>✅ Divalidasi</span><span>{new Date(profile.validated_at).toLocaleDateString('id-ID')}</span></div>}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
