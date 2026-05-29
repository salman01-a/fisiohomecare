import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'therapist') {
        navigate('/therapist');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left panel - branding */}
        <div className="login-branding">
          <div className="login-branding-content">
            <div className="login-logo">
              <div className="login-logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.2)" />
                  <path d="M12 6c-1.1 0-2 .9-2 2v2H8c-1.1 0-2 .9-2 2s.9 2 2 2h2v2c0 1.1.9 2 2 2s2-.9 2-2v-2h2c1.1 0 2-.9 2-2s-.9-2-2-2h-2V8c0-1.1-.9-2-2-2z" fill="white" />
                </svg>
              </div>
              <h1 className="login-logo-text">FisioHomecare</h1>
            </div>
            <p className="login-tagline">
              Platform fisioterapi homecare terpercaya untuk pemulihan pasca-operasi yang nyaman di rumah Anda.
            </p>
            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>Terapis Profesional</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>Layanan ke Rumah</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>Terjamin & Aman</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Selamat Datang</h2>
              <p>Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            {error && (
              <div className="login-error" id="login-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" id="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="contoh@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-btn"
                id="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="login-btn-loading">
                    <span className="spinner"></span>
                    Memproses...
                  </span>
                ) : (
                  <span className="login-btn-text">
                    Masuk
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            <div className="login-demo-info">
              <p className="login-demo-title">Akun Demo:</p>
              <div className="login-demo-accounts">
                <button
                  type="button"
                  className="demo-account-btn"
                  onClick={() => { setEmail('admin@fisiohomecare.com'); setPassword('admin123'); }}
                >
                  <span className="demo-role admin">Admin</span>
                  <span className="demo-email">admin@fisiohomecare.com</span>
                </button>
                <button
                  type="button"
                  className="demo-account-btn"
                  onClick={() => { setEmail('budi@fisiohomecare.com'); setPassword('therapist123'); }}
                >
                  <span className="demo-role therapist">Terapis</span>
                  <span className="demo-email">budi@fisiohomecare.com</span>
                </button>
                <button
                  type="button"
                  className="demo-account-btn"
                  onClick={() => { setEmail('andi@gmail.com'); setPassword('patient123'); }}
                >
                  <span className="demo-role patient">Pasien</span>
                  <span className="demo-email">andi@gmail.com</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
              Belum punya akun? <Link to="/register-therapist" style={{ color: '#3b82f6', fontWeight: 600 }}>Daftar sebagai Terapis</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
