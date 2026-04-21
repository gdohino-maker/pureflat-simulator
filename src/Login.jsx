import React, { useState } from 'react';

const SHARED_PASSWORD = 'pf123456';
const REGISTERED_PHONES_KEY = 'pf_registered_phones';
const AUTH_SESSION_KEY = 'pf_auth_session';

export default function Login({ onLogin }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'password'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handlePhoneSubmit = () => {
    const trimmed = phone.trim();
    if (!trimmed) return setError('電話番号を入力してください');
    setError('');

    // 電話番号を登録リストに追加（初回・2回目以降どちらも同じ）
    const phones = JSON.parse(localStorage.getItem(REGISTERED_PHONES_KEY) || '[]');
    if (!phones.includes(trimmed)) {
      phones.push(trimmed);
      localStorage.setItem(REGISTERED_PHONES_KEY, JSON.stringify(phones));
    }

    setStep('password');
  };

  const handlePasswordSubmit = () => {
    if (password !== SHARED_PASSWORD) {
      setError('パスワードが正しくありません');
      return;
    }
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ phone: phone.trim(), time: Date.now() }));
    onLogin();
  };

  const handleKeyDown = (e, fn) => {
    if (e.key === 'Enter') fn();
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        boxSizing: 'border-box',
        margin: '0 16px',
      }}>
        {/* ロゴ・タイトル */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #e94560, #0f3460)',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginBottom: '16px',
          }}>
            🔐
          </div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
            PureFlat Simulator
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
            社内専用システム
          </p>
        </div>

        {/* Step 1: 電話番号 */}
        {step === 'phone' && (
          <div>
            <label style={labelStyle}>電話番号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => handleKeyDown(e, handlePhoneSubmit)}
              placeholder="090-1234-5678"
              style={inputStyle}
              autoFocus
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button onClick={handlePhoneSubmit} style={buttonStyle}>
              次へ
            </button>
          </div>
        )}

        {/* Step 2: パスワード */}
        {step === 'password' && (
          <div>
            <button onClick={() => { setStep('phone'); setError(''); setPassword(''); }} style={backStyle}>
              ← 戻る
            </button>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              パスワードを入力してください
            </p>
            <label style={labelStyle}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => handleKeyDown(e, handlePasswordSubmit)}
              placeholder="パスワードを入力"
              style={inputStyle}
              autoFocus
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button onClick={handlePasswordSubmit} style={buttonStyle}>
              ログイン
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '8px',
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: '16px',
};

const buttonStyle = {
  width: '100%',
  padding: '14px',
  background: 'linear-gradient(135deg, #e94560, #c23152)',
  border: 'none',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '700',
  cursor: 'pointer',
  marginTop: '4px',
};

const errorStyle = {
  color: '#ff6b6b',
  fontSize: '13px',
  marginBottom: '12px',
  textAlign: 'center',
};

const backStyle = {
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '0 0 16px',
  display: 'block',
};
