import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Login.css'; // Reusing login styles for consistency

export default function RegisterTherapist() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    specialization: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Add role manually
      const submitData = { ...formData, role: 'therapist' };
      const res = await authAPI.register(submitData);
      
      // Store token and redirect
      localStorage.setItem('token', res.token);
      alert('Pendaftaran berhasil! Akun Anda sedang menunggu validasi admin.');
      
      // We force page reload to auth context kicks in and redirects
      window.location.href = '/therapist';
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: '1000px' }}>
        {/* Left panel - branding */}
        <div className="login-branding">
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.2)"/>
                <path d="M12 6c-1.1 0-2 .9-2 2v2H8c-1.1 0-2 .9-2 2s.9 2 2 2h2v2c0 1.1.9 2 2 2s2-.9 2-2v-2h2c1.1 0 2-.9 2-2s-.9-2-2-2h-2V8c0-1.1-.9-2-2-2z" fill="white"/>
              </svg>
            </div>
            <h1 className="login-logo-text">Bergabung Jadi Mitra</h1>
          </div>
          <p className="login-tagline">
            Bantu lebih banyak pasien untuk kembali pulih dengan nyaman di rumah mereka. Daftar sekarang sebagai mitra terapis FisioHomecare.
          </p>
          <div className="login-features">
            <div className="login-feature">✅ Jadwal fleksibel sesuai ketersediaan Anda</div>
            <div className="login-feature">✅ Sistem bagi hasil yang transparan</div>
            <div className="login-feature">✅ Pencatatan rekam medis terpadu</div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper" style={{ maxWidth: '400px' }}>
            <div className="login-form-header">
              <h2>Daftar Terapis</h2>
              <p>Lengkapi profil profesional Anda</p>
            </div>

            {error && (
              <div className="login-error">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" style={{ gap: '12px' }}>
              <div className="form-group">
                <label htmlFor="name">Nama Lengkap & Gelar</label>
                <div className="input-wrapper">
                  <input id="name" type="text" placeholder="Dr. Budi / Budi, S.Ft" value={formData.name} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="email">Email</label>
                  <div className="input-wrapper">
                    <input id="email" type="email" placeholder="budi@email.com" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="phone">No. Handphone</label>
                  <div className="input-wrapper">
                    <input id="phone" type="tel" placeholder="08123456789" value={formData.phone} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="license_number">Nomor STR</label>
                  <div className="input-wrapper">
                    <input id="license_number" type="text" placeholder="0123456789" value={formData.license_number} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="specialization">Spesialisasi</label>
                  <div className="input-wrapper">
                    <select 
                      id="specialization" 
                      value={formData.specialization} 
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#334155', outline: 'none' }}
                      required
                    >
                      <option value="">Pilih Spesialisasi...</option>
                      <option value="Umum">Umum</option>
                      <option value="Ortopedi">Ortopedi</option>
                      <option value="Neurologi">Neurologi</option>
                      <option value="Pediatri">Pediatri</option>
                      <option value="Geriatri">Geriatri</option>
                      <option value="Olahraga">Olahraga</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: '16px' }}>
                {loading ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
              Sudah punya akun? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Login di sini</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
