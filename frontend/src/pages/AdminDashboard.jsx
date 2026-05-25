import { useState, useEffect } from 'react';
import { dashboardAPI, therapistAPI, serviceAPI, orderAPI, paymentAPI, nosqlAPI, recordAPI, patientAPI, getImageUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
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
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toast = useToast();

  // Service CRUD State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', duration_minutes: 60, is_active: true });

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderTracking, setOrderTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Full Therapy Record (with NoSQL data)
  const [fullRecord, setFullRecord] = useState(null);
  const [fullRecordLoading, setFullRecordLoading] = useState(false);

  // Payment Proof Image Modal State
  const [proofImageUrl, setProofImageUrl] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);

  // Therapist Schedule Modal State
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [therapistSchedules, setTherapistSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ date: '', start_time: '', end_time: '' });

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Reviews Modal State
  const [selectedTherapistReviews, setSelectedTherapistReviews] = useState(null);
  const [therapistReviews, setTherapistReviews] = useState(null);
  const [reviewsSummary, setReviewsSummary] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => { loadData(); }, [activeTab]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await nosqlAPI.getNotifications();
        const data = res.data || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      } catch (err) { console.error(err); }
    };
    fetchNotifications();
  }, []);

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
      } else if (activeTab === 'payments') {
        const params = paymentFilter ? { status: paymentFilter } : {};
        const res = await paymentAPI.getAll(params);
        setPayments(res.data || []);
      } else if (activeTab === 'patients') {
        const res = await patientAPI.getAll();
        setPatients(res.data || []);
      } else if (activeTab === 'notifications') {
        const res = await nosqlAPI.getNotifications();
        const data = res.data || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      } else if (activeTab === 'activity-logs') {
        const res = await nosqlAPI.getActivityLogs();
        setActivityLogs(res.data || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { if (activeTab === 'orders') loadData(); }, [statusFilter]);
  useEffect(() => { if (activeTab === 'payments') loadData(); }, [paymentFilter]);

  const handleValidate = async (id, status) => {
    try {
      await therapistAPI.validate(id, status);
      toast.success(`Terapis ${status === 'active' ? 'divalidasi' : 'di-suspend'}`);
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleOrderStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, status);
      toast.success('Status pesanan berhasil diupdate');
      loadData();
      if (selectedOrder) {
        const res = await orderAPI.getById(id);
        setSelectedOrder(res.data);
      }
    } catch (err) { toast.error(err.message); }
  };

  const handlePaymentConfirm = async (orderId, status) => {
    try {
      await paymentAPI.confirm(orderId, status);
      toast.success('Pembayaran berhasil ' + (status === 'confirmed' ? 'disetujui' : 'ditolak'));
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleViewProof = async (orderId) => {
    try {
      setProofLoading(true);
      const blobUrl = await paymentAPI.getProofBlobUrl(orderId);
      setProofImageUrl(blobUrl);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProofLoading(false);
    }
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
        toast.success('Layanan diupdate');
      } else {
        await serviceAPI.create(serviceForm);
        toast.success('Layanan ditambahkan');
      }
      setIsServiceModalOpen(false);
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleServiceDelete = async (id) => {
    if (!confirm('Hapus layanan ini?')) return;
    try {
      await serviceAPI.delete(id);
      toast.success('Layanan dihapus');
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  // Order Detail
  const handleViewOrder = async (id) => {
    try {
      const res = await orderAPI.getById(id);
      setSelectedOrder(res.data);
      // Fetch NoSQL tracking in parallel
      setOrderTracking(null);
      setTrackingLoading(true);
      setFullRecord(null);
      try {
        const trackRes = await nosqlAPI.getTracking(id);
        setOrderTracking(trackRes.data);
      } catch (_) {
        setOrderTracking(null);
      } finally {
        setTrackingLoading(false);
      }
      // Fetch full therapy record (with NoSQL data) if available
      if (res.data?.therapyRecord?.id) {
        setFullRecordLoading(true);
        try {
          const recRes = await recordAPI.getById(res.data.therapyRecord.id);
          setFullRecord(recRes.data);
        } catch (_) {
          setFullRecord(null);
        } finally {
          setFullRecordLoading(false);
        }
      }
    } catch (err) { toast.error(err.message); }
  };

  // Therapist Schedule Management
  const handleViewSchedules = async (therapist) => {
    setSelectedTherapist(therapist);
    setScheduleLoading(true);
    try {
      const res = await therapistAPI.getSchedules(therapist.id);
      setTherapistSchedules(res.data || []);
    } catch (err) { console.error(err); }
    setScheduleLoading(false);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await therapistAPI.createSchedule(selectedTherapist.id, newSchedule);
      toast.success('Jadwal ditambahkan');
      setNewSchedule({ date: '', start_time: '', end_time: '' });
      const res = await therapistAPI.getSchedules(selectedTherapist.id);
      setTherapistSchedules(res.data || []);
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteSchedule = async (sid) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      await therapistAPI.deleteSchedule(selectedTherapist.id, sid);
      toast.success('Jadwal dihapus');
      const res = await therapistAPI.getSchedules(selectedTherapist.id);
      setTherapistSchedules(res.data || []);
    } catch (err) { toast.error(err.message); }
  };

  const handleViewReviews = async (therapist) => {
    setSelectedTherapistReviews(therapist);
    setReviewsLoading(true);
    try {
      const res = await therapistAPI.getReviews(therapist.id);
      setTherapistReviews(res.data);
      setReviewsSummary(res.pagination?.summary || null);
    } catch (err) { console.error(err); }
    setReviewsLoading(false);
  };

  const handleMarkRead = async (notifId) => {
    try {
      await nosqlAPI.markAsRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Pesanan', icon: '📋' },
    { id: 'payments', label: 'Pembayaran', icon: '💳' },
    { id: 'patients', label: 'Pasien', icon: '🧑‍🤝‍🧑' },
    { id: 'therapists', label: 'Terapis', icon: '👨‍⚕️' },
    { id: 'services', label: 'Layanan', icon: '🏥' },
    { id: 'notifications', label: 'Notifikasi', icon: '🔔' },
    { id: 'activity-logs', label: 'Log Aktivitas', icon: '📜' },
  ];

  const rightTopbarContent = (
    <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center' }}>
      <div className="notification-bell" onClick={() => setActiveTab('notifications')} style={{ cursor: 'pointer', position: 'relative', marginRight: '16px' }}>
        <span style={{ fontSize: '20px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  );

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
          rightContent={rightTopbarContent}
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
                          <tr key={o.id} style={{cursor:'pointer'}} onClick={() => handleViewOrder(o.id)}>
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
                                <button className="btn btn--sm btn--primary" onClick={() => handleViewOrder(o.id)}>Detail</button>
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

          ) : activeTab === 'payments' ? (
            <div>
              <div className="toolbar">
                <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="filter-select">
                  <option value="">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="confirmed">Dikonfirmasi</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
              <div className="section-card">
                {payments.length === 0 ? <p className="empty-text">Belum ada pembayaran</p> : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Order</th><th>Pasien</th><th>Jumlah</th><th>Metode</th><th>Bukti</th><th>Status</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id}>
                            <td>#{p.order_id}</td>
                            <td>{p.order?.patient?.user?.name || '-'}</td>
                            <td className="text-bold">{formatCurrency(p.amount)}</td>
                            <td style={{textTransform:'capitalize'}}>{p.method}</td>
                            <td>
                              {p.proof_url ? (
                                <button type="button" className="btn btn--sm btn--primary" onClick={() => handleViewProof(p.order_id)}>Lihat</button>
                              ) : <span className="text-muted">-</span>}
                            </td>
                            <td><StatusBadge status={p.status} /></td>
                            <td>
                              {p.status === 'pending' ? (
                                <div className="action-btns">
                                  <button className="btn btn--sm btn--primary" onClick={() => handlePaymentConfirm(p.order_id, 'confirmed')}>✓ Setujui</button>
                                  <button className="btn btn--sm btn--danger" onClick={() => handlePaymentConfirm(p.order_id, 'rejected')}>✗ Tolak</button>
                                </div>
                              ) : (
                                <span className="text-muted">{p.confirmer?.name ? `oleh ${p.confirmer.name}` : '-'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          ) : activeTab === 'patients' ? (
            <div className="section-card">
              <div className="section-header">
                <h2>Daftar Pasien</h2>
              </div>
              {patients.length === 0 ? <p className="empty-text">Belum ada pasien terdaftar</p> : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Alamat</th><th>Kontak Darurat</th><th>Tgl Daftar</th></tr></thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.id}>
                          <td className="text-bold">{p.user?.name || '-'}</td>
                          <td>{p.user?.email || '-'}</td>
                          <td>{p.user?.phone || '-'}</td>
                          <td className="td-truncate" style={{maxWidth: '200px'}}>{p.address || '-'}</td>
                          <td>{p.emergency_contact || '-'}</td>
                          <td>{p.user?.created_at ? new Date(p.user.created_at).toLocaleDateString('id-ID') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                      <div className="therapist-card-actions">
                        <button className="btn btn--sm btn--primary" onClick={() => handleViewSchedules(t)}>📅 Jadwal</button>
                        <button className="btn btn--sm btn--primary" onClick={() => handleViewReviews(t)}>⭐ Ulasan</button>
                        {t.status === 'pending' && (
                          <>
                            <button className="btn btn--sm btn--primary" onClick={() => handleValidate(t.id, 'active')}>Validasi</button>
                            <button className="btn btn--sm btn--danger" onClick={() => handleValidate(t.id, 'suspended')}>Tolak</button>
                          </>
                        )}
                        {t.status === 'active' && (
                          <button className="btn btn--sm btn--danger" onClick={() => handleValidate(t.id, 'suspended')}>Suspend</button>
                        )}
                        {t.status === 'suspended' && (
                          <button className="btn btn--sm btn--primary" onClick={() => handleValidate(t.id, 'active')}>Aktifkan</button>
                        )}
                      </div>
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
          ) : activeTab === 'notifications' ? (
            <div className="section-card">
              <div className="section-header">
                <h2>Notifikasi</h2>
              </div>
              {notifications.length === 0 ? <p className="empty-text">Belum ada notifikasi</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notifications.map(n => {
                    const dateObj = n.created_at?.seconds ? new Date(n.created_at.seconds * 1000) : new Date();
                    return (
                      <div key={n.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: n.is_read ? 'white' : '#f0fdf4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : 'ℹ️'} {n.title}
                            </h4>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{n.message}</p>
                            <small style={{ color: '#94a3b8', marginTop: '8px', display: 'block' }}>{dateObj.toLocaleString('id-ID')}</small>
                          </div>
                          {!n.is_read && (
                            <button className="btn btn--sm btn--primary" onClick={() => handleMarkRead(n.id)}>Tandai Dibaca</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'activity-logs' ? (
            <div className="section-card">
              <div className="section-header">
                <h2>Log Aktivitas</h2>
                <span className="text-muted" style={{ fontSize: '13px' }}>🔥 Data dari Firestore (NoSQL)</span>
              </div>
              {activityLogs.length === 0 ? <p className="empty-text">Belum ada log aktivitas</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activityLogs.map(log => {
                    const dateObj = log.created_at?.seconds ? new Date(log.created_at.seconds * 1000) : (log.created_at ? new Date(log.created_at) : new Date());
                    const actionIcons = {
                      create_order: '📦', update_order_status: '🔄', cancel_order: '❌',
                      rate_order: '⭐', validate_therapist: '✅', initiate_payment: '💳',
                      confirm_payment: '💰',
                    };
                    return (
                      <div key={log.id} style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                          <span style={{ fontSize: '20px' }}>{actionIcons[log.action] || '📝'}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{log.description}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                              oleh <strong>{log.user_name || 'System'}</strong> • {dateObj.toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>

      {/* Service Modal */}
      <Modal 
        isOpen={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)} 
        title={editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
      >
        <form onSubmit={handleServiceSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Nama Layanan</label>
            <input type="text" required value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Deskripsi</label>
            <textarea rows="3" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Harga (Rp)</label>
              <input type="number" required value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Durasi (Menit)</label>
              <input type="number" required value={serviceForm.duration_minutes} onChange={e => setServiceForm({...serviceForm, duration_minutes: e.target.value})} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Status Layanan</label>
            <select value={serviceForm.is_active ? 'true' : 'false'} onChange={e => setServiceForm({...serviceForm, is_active: e.target.value === 'true'})}>
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

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => { setSelectedOrder(null); setOrderTracking(null); setFullRecord(null); }}
        title={`Detail Pesanan #${selectedOrder?.id || ''}`}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section-card" style={{ margin: 0 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>👤 Pasien</h3>
              <div className="info-row"><span>Nama</span><span>{selectedOrder.patient?.user?.name || '-'}</span></div>
              <div className="info-row"><span>Email</span><span>{selectedOrder.patient?.user?.email || '-'}</span></div>
              <div className="info-row"><span>Telepon</span><span>{selectedOrder.patient?.user?.phone || '-'}</span></div>
            </div>
            <div className="section-card" style={{ margin: 0 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>👨‍⚕️ Terapis</h3>
              <div className="info-row"><span>Nama</span><span>{selectedOrder.therapist?.user?.name || '-'}</span></div>
              <div className="info-row"><span>Email</span><span>{selectedOrder.therapist?.user?.email || '-'}</span></div>
            </div>
            <div className="section-card" style={{ margin: 0 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>📋 Detail Order</h3>
              <div className="info-row"><span>Layanan</span><span>{selectedOrder.service?.name || selectedOrder.service_type || '-'}</span></div>
              <div className="info-row"><span>Alamat</span><span style={{maxWidth:'200px',textAlign:'right'}}>{selectedOrder.address}</span></div>
              {selectedOrder.lat && <div className="info-row"><span>Koordinat</span><span>{selectedOrder.lat}, {selectedOrder.lng}</span></div>}
              <div className="info-row"><span>Jadwal</span><span>{selectedOrder.schedule?.date || '-'} {selectedOrder.schedule?.start_time || ''} - {selectedOrder.schedule?.end_time || ''}</span></div>
              <div className="info-row"><span>Status</span><StatusBadge status={selectedOrder.status} /></div>
              {selectedOrder.notes && <div className="info-row"><span>Catatan</span><span style={{maxWidth:'200px',textAlign:'right'}}>{selectedOrder.notes}</span></div>}
            </div>

            {/* NoSQL Visit Tracking Panel */}
            <div className="section-card" style={{ margin: 0, borderLeft: '3px solid #f59e0b' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                🔥 Tracking Kunjungan <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>NoSQL</span>
              </h3>
              {trackingLoading ? (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Memuat data Firestore...</p>
              ) : !orderTracking ? (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Belum ada data tracking. Tracking otomatis tersimpan saat status order berubah.</p>
              ) : (
                <div>
                  <div className="info-row">
                    <span>Status Saat Ini</span>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize', color: '#6366f1' }}>
                      {orderTracking.current_status === 'otw' ? '🚗 Dalam Perjalanan'
                        : orderTracking.current_status === 'ongoing' ? '▶️ Berlangsung'
                        : orderTracking.current_status === 'done' ? '✅ Selesai'
                        : orderTracking.current_status === 'confirmed' ? '✅ Dikonfirmasi'
                        : orderTracking.current_status === 'cancelled' ? '❌ Dibatalkan'
                        : orderTracking.current_status || '-'}
                    </span>
                  </div>
                  {orderTracking.history?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Riwayat Tracking:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[...orderTracking.history].reverse().map((h, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#6366f1' : '#cbd5e1', flexShrink: 0, marginTop: 4 }} />
                            <div>
                              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{h.status}</span>
                              {h.notes && <span style={{ color: '#64748b' }}> — {h.notes}</span>}
                              {h.timestamp && <div style={{ color: '#94a3b8', fontSize: 11 }}>{formatDate(h.timestamp)}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedOrder.payment && (
              <div className="section-card" style={{ margin: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>💳 Pembayaran</h3>
                <div className="info-row"><span>Jumlah</span><span className="text-bold">{formatCurrency(selectedOrder.payment.amount)}</span></div>
                <div className="info-row"><span>Metode</span><span style={{textTransform:'capitalize'}}>{selectedOrder.payment.method}</span></div>
                <div className="info-row"><span>Status</span><StatusBadge status={selectedOrder.payment.status} /></div>
                {selectedOrder.payment.proof_url && <div className="info-row"><span>Bukti</span><button type="button" className="link-btn" style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}} onClick={() => handleViewProof(selectedOrder.id)}>Lihat Bukti →</button></div>}
              </div>
            )}
            {selectedOrder.therapyRecord && (
              <div className="section-card" style={{ margin: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>📝 Rekam Medis</h3>
                <div className="info-row"><span>Keluhan</span><span style={{maxWidth:'200px',textAlign:'right'}}>{selectedOrder.therapyRecord.chief_complaint || '-'}</span></div>
                <div className="info-row"><span>Diagnosis</span><span style={{maxWidth:'200px',textAlign:'right'}}>{selectedOrder.therapyRecord.diagnosis || '-'}</span></div>
                <div className="info-row"><span>Tindakan</span><span style={{maxWidth:'200px',textAlign:'right'}}>{selectedOrder.therapyRecord.actions_taken || '-'}</span></div>
                <div className="info-row"><span>Sesi ke</span><span>{selectedOrder.therapyRecord.session_number || 1}</span></div>
                {selectedOrder.therapyRecord.check_in_at && <div className="info-row"><span>Check-in</span><span>{new Date(selectedOrder.therapyRecord.check_in_at).toLocaleString('id-ID')}</span></div>}
                {selectedOrder.therapyRecord.check_out_at && <div className="info-row"><span>Check-out</span><span>{new Date(selectedOrder.therapyRecord.check_out_at).toLocaleString('id-ID')}</span></div>}

                {/* Therapy Photos (SQL) */}
                {(() => {
                  const rec = fullRecord || selectedOrder.therapyRecord;
                  const photos = rec.photo_urls || [];
                  if (photos.length === 0) return null;
                  return (
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>📸 Foto Dokumentasi ({photos.length})</span>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {photos.map((url, i) => (
                          <img
                            key={i}
                            src={getImageUrl(url)}
                            alt={`therapy-photo-${i}`}
                            onClick={() => setProofImageUrl(getImageUrl(url))}
                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.15s' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* NoSQL Therapy Details */}
            {fullRecordLoading && (
              <div className="section-card" style={{ margin: 0, borderLeft: '3px solid #f59e0b' }}>
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Memuat data NoSQL...</p>
              </div>
            )}
            {fullRecord?.nosql_details && (
              <div className="section-card" style={{ margin: 0, borderLeft: '3px solid #f59e0b' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔥 Catatan Fleksibel <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>NoSQL</span>
                </h3>
                {fullRecord.nosql_details.progress_rating != null && (
                  <div className="info-row">
                    <span>Progres Pemulihan</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: '#6366f1' }}>{fullRecord.nosql_details.progress_rating}/10</span>
                      <span style={{
                        display: 'inline-block', width: 60, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden'
                      }}>
                        <span style={{
                          display: 'block', height: '100%', borderRadius: 3,
                          width: `${(fullRecord.nosql_details.progress_rating / 10) * 100}%`,
                          background: fullRecord.nosql_details.progress_rating <= 3 ? '#ef4444' : fullRecord.nosql_details.progress_rating <= 6 ? '#f59e0b' : '#10b981',
                        }} />
                      </span>
                    </span>
                  </div>
                )}
                {fullRecord.nosql_details.flexible_notes && (
                  <div className="info-row"><span>Catatan</span><span style={{maxWidth:'200px',textAlign:'right'}}>{fullRecord.nosql_details.flexible_notes}</span></div>
                )}
                {fullRecord.nosql_details.attachments?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>📎 Lampiran ({fullRecord.nosql_details.attachments.length})</span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {fullRecord.nosql_details.attachments.map((url, i) => (
                        <img
                          key={i}
                          src={getImageUrl(url)}
                          alt={`attachment-${i}`}
                          onClick={() => setProofImageUrl(getImageUrl(url))}
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.15s' }}
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Review Pasien Section */}
            {selectedOrder.status === 'done' && selectedOrder.rating && (
              <div className="section-card" style={{ margin: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>⭐ Ulasan Pasien</h3>
                <div className="info-row">
                  <span>Rating</span>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '16px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < selectedOrder.rating ? '#f59e0b' : '#e2e8f0' }}>★</span>
                    ))}
                  </span>
                </div>
                {selectedOrder.rating_comment && (
                  <div className="info-row">
                    <span>Komentar</span>
                    <span style={{ maxWidth: '200px', textAlign: 'right', fontStyle: 'italic' }}>"{selectedOrder.rating_comment}"</span>
                  </div>
                )}
              </div>
            )}
            <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
              {selectedOrder.status === 'pending' && <button className="btn btn--primary" onClick={() => handleOrderStatus(selectedOrder.id, 'confirmed')}>Konfirmasi Pesanan</button>}
              {selectedOrder.status !== 'done' && selectedOrder.status !== 'cancelled' && <button className="btn btn--danger" onClick={() => handleOrderStatus(selectedOrder.id, 'cancelled')}>Batalkan</button>}
            </div>
          </div>
        )}
      </Modal>

      {/* Therapist Schedule Modal */}
      <Modal
        isOpen={!!selectedTherapist}
        onClose={() => setSelectedTherapist(null)}
        title={`Jadwal: ${selectedTherapist?.user?.name || 'Terapis'}`}
      >
        {selectedTherapist && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedTherapist.status === 'active' && (
              <form onSubmit={handleCreateSchedule} className="schedule-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tanggal</label>
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={newSchedule.date} onChange={e => setNewSchedule(p => ({ ...p, date: e.target.value }))} required />
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
            )}
            {scheduleLoading ? (
              <p className="text-muted" style={{textAlign:'center'}}>Memuat jadwal...</p>
            ) : therapistSchedules.length === 0 ? (
              <p className="empty-text">Belum ada jadwal</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Tanggal</th><th>Mulai</th><th>Selesai</th><th>Status</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {therapistSchedules.map(s => (
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
        )}
      </Modal>

      {/* Therapist Reviews Modal */}
      <Modal
        isOpen={!!selectedTherapistReviews}
        onClose={() => { setSelectedTherapistReviews(null); setTherapistReviews(null); setReviewsSummary(null); }}
        title={`Ulasan: ${selectedTherapistReviews?.user?.name || 'Terapis'}`}
      >
        {reviewsLoading ? (
          <p className="text-muted" style={{ textAlign: 'center' }}>Memuat ulasan...</p>
        ) : !therapistReviews || therapistReviews.length === 0 ? (
          <p className="empty-text">Belum ada ulasan</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section-card" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                ⭐ {reviewsSummary?.avgRating?.toFixed(2) || '0.00'}
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Dari total {reviewsSummary?.totalReviews || 0} ulasan pasien</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {therapistReviews.map(r => (
                <div key={r.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{r.patient?.user?.name || 'Pasien'}</span>
                    <span style={{ color: '#f59e0b' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ color: i < r.rating ? '#f59e0b' : '#e2e8f0' }}>★</span>
                      ))}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                    {r.service?.name || r.service_type || '-'} • {new Date(r.created_at).toLocaleDateString('id-ID')}
                  </div>
                  {r.rating_comment && <div style={{ fontStyle: 'italic', fontSize: '14px' }}>"{r.rating_comment}"</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Proof / Image Lightbox Modal */}
      {proofImageUrl && (
        <div
          className="modal-overlay"
          onClick={() => { setProofImageUrl(null); }}
          style={{ zIndex: 10000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => setProofImageUrl(null)}
              style={{
                position: 'absolute', top: -12, right: -12, zIndex: 10,
                width: 32, height: 32, borderRadius: '50%',
                background: '#1e293b', color: 'white', border: 'none',
                fontSize: 16, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
            <img
              src={proofImageUrl}
              alt="Bukti Pembayaran"
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                borderRadius: 12,
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                objectFit: 'contain',
                background: 'white',
              }}
            />
          </div>
        </div>
      )}
      {proofLoading && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="loading-spinner" />
            <p style={{ color: 'white', fontSize: 14 }}>Memuat bukti pembayaran...</p>
          </div>
        </div>
      )}

    </div>
  );
}
