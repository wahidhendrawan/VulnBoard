import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const { token, user } = await authApi.login(email, password);
      login(token, user); nav('/');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={wrap}>
      <h2>VulnBoard Login</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
        {error && <span style={{ color: 'red', fontSize: 13 }}>{error}</span>}
        <button type="submit" style={btn}>Login</button>
      </form>
      <p style={{ marginTop: 12, fontSize: 13 }}>No account? <Link to="/register">Register</Link></p>
    </div>
  );
};

const wrap: React.CSSProperties = { maxWidth: 360, margin: '80px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 };
const inp: React.CSSProperties = { padding: '8px 10px', fontSize: 14, borderRadius: 4, border: '1px solid #ccc' };
const btn: React.CSSProperties = { padding: '9px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };

export default Login;
