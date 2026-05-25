import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderAPI, therapistAPI, recordAPI, uploadAPI, nosqlAPI, getImageUrl } from '../services/api';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import './Dashboard.css';

export default function TherapistDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ date: '', start_time: '', end_time: '' });
  const toast = useToast();

  // History Detail Modal
  const [historyDetailOrder, setHistoryDetailOrder] = useState(null);

  // Therapy Record Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [recordForm, setRecordForm] = useState({ chief_complaint: '', diagnosis: '', actions_taken: '' });
  const [nosqlForm, setNosqlForm] = useState({ flexible_notes: '', progress_rating: 5, attachments: [] });
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [recordPhotos, setRecordPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [fullRecord, setFullRecord] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Reviews State
  const [therapistReviews, setTherapistReviews] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

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
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    const loadReviews = async () => {
      if (activeTab === 'profile' && profile?.id && !therapistReviews) {
        setReviewsLoading(true);
        try {
          const res = await therapistAPI.getReviews(profile.id);
          setTherapistReviews(res.data);
        } catch (err) { console.error(err); }
        setReviewsLoading(false);
      }
    };
    loadReviews();
  }, [activeTab, profile, therapistReviews]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const res = await orderAPI.getAll();
        setOrders(res.data || []);
      } else if (activeTab === 'schedules') {
        if (profile?.id) {
          const tid = profile.id;
          const res = await therapistAPI.getSchedules(tid);
          setSchedules(res.data || []);
        }
      } else if (activeTab === 'notifications') {
        const res = await nosqlAPI.getNotifications();
        const data = res.data || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const meRes = await import('../services/api').then(m => m.authAPI.getMe());
        if (meRes.data?.therapistProfile) {
          setProfile(meRes.data.therapistProfile);
        }
      } catch (err) { console.error(err); }
    };
    loadProfile();
  }, []);

  const handleOrderStatus = async (id, status) => {
    if (status === 'done') {
      const order = orders.find(o => o.id === id);
      setSelectedOrder(order);
      return;
    }
    try {
      await orderAPI.updateStatus(id, status);
      toast.success('Status pesanan berhasil diupdate');
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleTrackingUpdate = async (orderId, trackingStatus, notes) => {
    try {
      await nosqlAPI.updateTracking(orderId, trackingStatus, notes);
    } catch (err) {
      console.warn('[NoSQL] Tracking update failed:', err.message);
    }
  };

  const handleMarkRead = async (notifId) => {
    try {
      await nosqlAPI.markAsRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const handleViewHistoryDetail = async (order) => {
    setHistoryDetailOrder(order);
    setFullRecord(null);
    if (order.therapyRecord?.id) {
      try {
        const res = await recordAPI.getById(order.therapyRecord.id);
        setFullRecord(res.data);
      } catch (err) { console.error(err); }
    }
  };

  const submitTherapyRecord = async (e) => {
    e.preventDefault();
    if (!selectedOrder || submittingRecord) return;
    setSubmittingRecord(true);
    try {
      // 1. Upload photos/attachments if any
      let photoUrls = [];
      if (recordPhotos.length > 0) {
        try {
          const uploadRes = await uploadAPI.uploadMultiple(recordPhotos);
          photoUrls = uploadRes.data?.urls || [];
        } catch (uploadErr) {
          console.warn('Photo upload failed, continuing without photos:', uploadErr);
        }
      }

      // 2. Create SQL therapy record + NoSQL therapy note (via backend)
      try {
        await recordAPI.create({
          order_id: selectedOrder.id,
          therapist_id: profile?.id,
          patient_id: selectedOrder.patient_id,
          chief_complaint: recordForm.chief_complaint,
          diagnosis: recordForm.diagnosis,
          actions_taken: recordForm.actions_taken,
          session_number: 1,
          photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
          // NoSQL fields — saved to Firestore by backend recordController
          flexible_notes: nosqlForm.flexible_notes || undefined,
          progress_rating: nosqlForm.progress_rating || undefined,
          attachments: photoUrls.length > 0 ? photoUrls : undefined,
        });
      } catch (createErr) {
        if (!createErr.message.includes('already exists')) {
          throw createErr;
        }
      }

      // 3. Update order status to done (also auto-logs tracking to Firestore)
      await orderAPI.updateStatus(selectedOrder.id, 'done');

      // Reset
      setSelectedOrder(null);
      setRecordForm({ chief_complaint: '', diagnosis: '', actions_taken: '' });
      setNosqlForm({ flexible_notes: '', progress_rating: 5, attachments: [] });
      setRecordPhotos([]);
      setPhotoPreviewUrls([]);
      loadData();
      toast.success('Sesi berhasil diselesaikan, Rekam Medis & data NoSQL tersimpan!');
    } catch (err) { toast.error(err.message); }
    finally { setSubmittingRecord(false); }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const tid = profile?.id;
      await therapistAPI.createSchedule(tid, newSchedule);
      toast.success('Jadwal ditambahkan');
      setNewSchedule({ date: '', start_time: '', end_time: '' });
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteSchedule = async (sid) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      const tid = profile?.id;
      await therapistAPI.deleteSchedule(tid, sid);
      toast.success('Jadwal dihapus');
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const nextStatus = { pending: null, confirmed: 'otw', otw: 'ongoing', ongoing: 'done' };

  const tabs = [
    { id: 'orders', label: 'Pesanan Saya', icon: '📋' },
    { id: 'schedules', label: 'Jadwal', icon: '📅' },
    { id: 'profile', label: 'Profil', icon: '👤' },
    { id: 'notifications', label: 'Notifikasi', icon: '🔔' },
  ];

  const profileStatusBadge = profile?.status === 'active' ? '✓' : profile?.status === 'pending' ? '⏳' : '';
  
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
      {profile?.status === 'pending' && <span className="badge badge--pending">Menunggu Validasi</span>}
      {profile?.status === 'active' && <span className="badge badge--active">Terverifikasi</span>}
    </div>
  );

  const activeOrders = orders.filter(o => !['done', 'cancelled'].includes(o.status));
  const historyOrders = orders.filter(o => ['done', 'cancelled'].includes(o.status));

  return (
    <div className="dashboard">
      <Sidebar 
        tabs={tabs} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        variant="therapist"
        statusBadge={profileStatusBadge}
      />

      <main className="main-content">
        <Topbar 
          title={tabs.find(t => t.id === activeTab)?.label} 
          setSidebarOpen={setSidebarOpen} 
          rightContent={rightTopbarContent}
        />

        <div className="content">
          {profile?.status === 'pending' && (
            <div className="alert alert--warning">
              ⚠️ Akun Anda masih menunggu validasi admin. Beberapa fitur dibatasi sampai akun divalidasi.
            </div>
          )}

          {loading ? (
            <div className="content-loading"><div className="loading-spinner" /><p>Memuat data...</p></div>
          ) : activeTab === 'orders' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="section-card" style={{ margin: 0 }}>
                <div className="section-header"><h2>Pesanan Aktif</h2></div>
                {activeOrders.length === 0 ? <p className="empty-text">Belum ada pesanan aktif</p> : (
                  <div className="cards-grid">
                    {activeOrders.map(o => (
                      <div key={o.id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <h3>{o.patient?.user?.name || 'Pasien'}</h3>
                            <p className="text-muted">{o.service?.name || o.service_type || '-'}</p>
                          </div>
                          <StatusBadge status={o.status} />
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
              
              <div className="section-card" style={{ margin: 0 }}>
                <div className="section-header"><h2>Riwayat Pesanan</h2></div>
                {historyOrders.length === 0 ? <p className="empty-text">Belum ada riwayat pesanan</p> : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Pasien</th><th>Layanan</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {historyOrders.map(o => (
                          <tr key={o.id}>
                            <td>{o.patient?.user?.name || '-'}</td>
                            <td>{o.service?.name || o.service_type || '-'}</td>
                            <td>{o.schedule?.date || '-'}</td>
                            <td><StatusBadge status={o.status} /></td>
                            <td>
                              <button className="btn btn--sm btn--primary" onClick={() => handleViewHistoryDetail(o)}>Detail</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
                  {profile && <StatusBadge status={profile.status} />}
                </div>
              </div>
              {profile && (
                <div className="profile-details">
                  <div className="info-row"><span>📱 Telepon</span><span>{user?.phone || '-'}</span></div>
                  <div className="info-row"><span>🏥 Spesialisasi</span><span>{profile.specialization || '-'}</span></div>
                  <div className="info-row"><span>📄 No. STR</span><span>{profile.license_number || '-'}</span></div>
                  <div className="info-row"><span>⭐ Rating</span><span>{profile.rating || '0.00'}</span></div>
                  <div className="info-row"><span>📋 Status</span><StatusBadge status={profile.status} /></div>
                  {profile.validated_at && <div className="info-row"><span>✅ Divalidasi</span><span>{new Date(profile.validated_at).toLocaleDateString('id-ID')}</span></div>}
                </div>
              )}
              {profile && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1e293b' }}>⭐ Ulasan dari Pasien</h3>
                  {reviewsLoading ? (
                    <p className="text-muted">Memuat ulasan...</p>
                  ) : !therapistReviews || therapistReviews.length === 0 ? (
                    <p className="empty-text">Belum ada ulasan</p>
                  ) : (
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
                  )}
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
          ) : null}
        </div>
      </main>

      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title="Isi Rekam Medis"
      >
        <form onSubmit={submitTherapyRecord}>
          {/* ── SQL Fields ── */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>📋 Data Utama (SQL)</p>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Keluhan Utama</label>
            <textarea 
              rows="3" 
              required
              value={recordForm.chief_complaint}
              onChange={e => setRecordForm({...recordForm, chief_complaint: e.target.value})}
              placeholder="Contoh: Pasien mengeluh nyeri pada lutut kanan..."
            />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Diagnosis Fisioterapi</label>
            <input 
              type="text" 
              required
              value={recordForm.diagnosis}
              onChange={e => setRecordForm({...recordForm, diagnosis: e.target.value})}
              placeholder="Contoh: Osteoarthritis Knee Dextra"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Tindakan yang Dilakukan</label>
            <textarea 
              rows="4" 
              required
              value={recordForm.actions_taken}
              onChange={e => setRecordForm({...recordForm, actions_taken: e.target.value})}
              placeholder="Contoh: 1. TENS 15 menit&#10;2. Ultrasound 5 menit"
            />
          </div>

          {/* ── NoSQL Fields (Firestore) ── */}
          <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px 0 12px' }} />
          <p style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>🔥 Data Fleksibel (NoSQL / Firestore)</p>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Catatan Tambahan</label>
            <textarea
              rows="3"
              value={nosqlForm.flexible_notes}
              onChange={e => setNosqlForm({...nosqlForm, flexible_notes: e.target.value})}
              placeholder="Catatan perkembangan, observasi klinis, rekomendasi latihan..."
            />
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Progres Pemulihan: <strong>{nosqlForm.progress_rating}/10</strong></label>
            <input
              type="range" min="1" max="10" step="1"
              value={nosqlForm.progress_rating}
              onChange={e => setNosqlForm({...nosqlForm, progress_rating: parseInt(e.target.value)})}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
              <span>Awal Pemulihan</span><span>Sangat Baik</span>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>📸 Foto Dokumentasi (Opsional, maks 5)</label>
            <input 
              type="file" 
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 5);
                setRecordPhotos(files);
                setPhotoPreviewUrls(files.map(f => URL.createObjectURL(f)));
              }}
              style={{ marginTop: '6px' }}
            />
            {photoPreviewUrls.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {photoPreviewUrls.map((url, i) => (
                  <img key={i} src={url} alt={`preview-${i}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--danger" onClick={() => setSelectedOrder(null)} disabled={submittingRecord}>Batal</button>
            <button type="submit" className="btn btn--primary" disabled={submittingRecord}>
              {submittingRecord ? 'Menyimpan...' : '💾 Simpan & Selesai'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal 
        isOpen={!!historyDetailOrder} 
        onClose={() => setHistoryDetailOrder(null)} 
        title={`Riwayat Pesanan #${historyDetailOrder?.id || ''}`}
      >
        {historyDetailOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section-card" style={{ margin: 0 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>👤 Pasien</h3>
              <div className="info-row"><span>Nama</span><span>{historyDetailOrder.patient?.user?.name || '-'}</span></div>
              <div className="info-row"><span>Alamat</span><span style={{maxWidth:'200px',textAlign:'right'}}>{historyDetailOrder.address}</span></div>
            </div>

            <div className="section-card" style={{ margin: 0 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>📋 Detail Layanan</h3>
              <div className="info-row"><span>Layanan</span><span>{historyDetailOrder.service?.name || historyDetailOrder.service_type || '-'}</span></div>
              <div className="info-row"><span>Jadwal</span><span>{historyDetailOrder.schedule?.date || '-'}</span></div>
              <div className="info-row"><span>Status</span><StatusBadge status={historyDetailOrder.status} /></div>
            </div>

            {historyDetailOrder.therapyRecord && (
              <div className="section-card" style={{ margin: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>📝 Rekam Medis (SQL)</h3>
                <div className="info-row"><span>Keluhan</span><span style={{maxWidth:'200px',textAlign:'right'}}>{historyDetailOrder.therapyRecord.chief_complaint || '-'}</span></div>
                <div className="info-row"><span>Diagnosis</span><span style={{maxWidth:'200px',textAlign:'right'}}>{historyDetailOrder.therapyRecord.diagnosis || '-'}</span></div>
                <div className="info-row"><span>Tindakan</span><span style={{maxWidth:'200px',textAlign:'right'}}>{historyDetailOrder.therapyRecord.actions_taken || '-'}</span></div>

                {(() => {
                  const rec = fullRecord || historyDetailOrder.therapyRecord;
                  const photos = rec.photo_urls || [];
                  if (photos.length === 0) return null;
                  return (
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>📸 Foto Dokumentasi Terapis ({photos.length})</span>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {photos.map((url, i) => (
                          <img key={i} src={getImageUrl(url)} alt={`photo-${i}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* NoSQL Data in History */}
            {fullRecord?.nosql_details && (
              <div className="section-card" style={{ margin: 0, borderLeft: '3px solid #f59e0b' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔥 Catatan Fleksibel <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>NoSQL</span>
                </h3>
                {fullRecord.nosql_details.progress_rating != null && (
                  <div className="info-row">
                    <span>Progres Pemulihan</span>
                    <span style={{ fontWeight: 700, color: '#6366f1' }}>{fullRecord.nosql_details.progress_rating}/10</span>
                  </div>
                )}
                {fullRecord.nosql_details.flexible_notes && (
                  <div className="info-row"><span>Catatan Tambahan</span><span style={{maxWidth:'200px',textAlign:'right'}}>{fullRecord.nosql_details.flexible_notes}</span></div>
                )}
                {fullRecord.nosql_details.attachments?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>📎 Lampiran ({fullRecord.nosql_details.attachments.length})</span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {fullRecord.nosql_details.attachments.map((url, i) => (
                        <img key={i} src={getImageUrl(url)} alt={`attachment-${i}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {historyDetailOrder.status === 'done' && historyDetailOrder.rating && (
              <div className="section-card" style={{ margin: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>⭐ Ulasan Pasien</h3>
                <div className="info-row">
                  <span>Rating</span>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '16px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < historyDetailOrder.rating ? '#f59e0b' : '#e2e8f0' }}>★</span>
                    ))}
                  </span>
                </div>
                {historyDetailOrder.rating_comment && (
                  <div className="info-row">
                    <span>Komentar</span>
                    <span style={{ maxWidth: '200px', textAlign: 'right', fontStyle: 'italic' }}>"{historyDetailOrder.rating_comment}"</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
