import { useState, useEffect } from 'react';
import { dashboardAPI, therapistAPI, serviceAPI, orderAPI, paymentAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import './Dashboard.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Service CRUD State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', duration_minutes: 60, is_active: true });

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

  const handleOpenServiceModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setServiceForm(service);
    } else {
      setEditingService(null);
      setServiceForm({ name: '', description: '', price: '', duration_minutes: 60, is_active: true });
    }
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await serviceAPI.update(editingService.id, serviceForm);
      } else {
        await serviceAPI.create(serviceForm);
      }
      setIsServiceModalOpen(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleServiceDelete = async (id) => {
    if (!confirm('Hapus layanan ini?')) return;
    try {
      await serviceAPI.delete(id);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Pesanan', icon: '📋' },
    { id: 'therapists', label: 'Terapis', icon: '👨‍⚕️' },
    { id: 'services', label: 'Layanan', icon: '🏥' },
  ];

  return (
    <div className="dashboard">
      <Sidebar 
        tabs={tabs} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        variant="admin"
      />

      <main className="main-content">
        <Topbar 
          title={tabs.find(t => t.id === activeTab)?.label} 
          setSidebarOpen={setSidebarOpen} 
        />

        <div className="content">
          {loading ? (
            <div className="content-loading"><div className="loading-spinner" /><p>Memuat data...</p></div>
          ) : activeTab === 'overview' ? (
            <div className="overview">
              <div className="stats-grid">
                <StatCard label="Total Order" value={stats?.totalOrders || 0} icon="📦" color="#6366f1" />
                <StatCard label="Pendapatan" value={formatCurrency(stats?.totalRevenue)} icon="💰" color="#10b981" />
                <StatCard label="Terapis Aktif" value={stats?.activeTherapists || 0} icon="👨‍⚕️" color="#06b6d4" />
                <StatCard label="Menunggu Validasi" value={stats?.pendingTherapists || 0} icon="⏳" color="#f59e0b" />
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
                            <td><StatusBadge status={o.status} /></td>
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
                            <td><StatusBadge status={o.status} /></td>
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
                        <StatusBadge status={t.status} />
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
              <div className="section-header">
                <h2>Daftar Layanan</h2>
                <button className="btn btn--primary" onClick={() => handleOpenServiceModal()}>+ Tambah Layanan</button>
              </div>
              {services.length === 0 ? <p className="empty-text">Belum ada layanan</p> : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Nama</th><th>Deskripsi</th><th>Harga</th><th>Durasi</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {services.map(s => (
                         <tr key={s.id}>
                          <td className="text-bold">{s.name}</td>
                          <td className="td-truncate">{s.description || '-'}</td>
                          <td>{formatCurrency(s.price)}</td>
                          <td>{s.duration_minutes} menit</td>
                          <td>{s.is_active ? <span className="badge badge--active">Aktif</span> : <span className="badge badge--suspended">Nonaktif</span>}</td>
                          <td>
                            <div className="action-btns">
                              <button className="btn btn--sm btn--primary" onClick={() => handleOpenServiceModal(s)}>Edit</button>
                              <button className="btn btn--sm btn--danger" onClick={() => handleServiceDelete(s.id)}>Hapus</button>
                            </div>
                          </td>
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

      <Modal 
        isOpen={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)} 
        title={editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
      >
        <form onSubmit={handleServiceSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Nama Layanan</label>
            <input 
              type="text" 
              required
              value={serviceForm.name}
              onChange={e => setServiceForm({...serviceForm, name: e.target.value})}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Deskripsi</label>
            <textarea 
              rows="3" 
              value={serviceForm.description}
              onChange={e => setServiceForm({...serviceForm, description: e.target.value})}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Harga (Rp)</label>
              <input 
                type="number" 
                required
                value={serviceForm.price}
                onChange={e => setServiceForm({...serviceForm, price: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Durasi (Menit)</label>
              <input 
                type="number" 
                required
                value={serviceForm.duration_minutes}
                onChange={e => setServiceForm({...serviceForm, duration_minutes: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Status Layanan</label>
            <select 
              value={serviceForm.is_active ? 'true' : 'false'}
              onChange={e => setServiceForm({...serviceForm, is_active: e.target.value === 'true'})}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--danger" onClick={() => setIsServiceModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn--primary">Simpan</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
