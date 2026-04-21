import React, { useState, useRef, useEffect } from 'react';

const SHARED_PASSWORD = 'pf123456';
const VERIFIED_PHONES_KEY = 'pf_verified_phones';
const AUTH_SESSION_KEY = 'pf_auth_session';

// 日本の電話番号をE.164形式に変換 (090-1234-5678 → +819012345678)
function formatPhoneJP(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '+81' + digits.slice(1);
  }
  return '+' + digits;
}

export default function Login({ onLogin }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'password'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isReturning, setIsReturning] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  // 電話番号送信
  const handlePhoneSubmit = async () => {
    const trimmed = phone.trim();
    if (!trimmed) return setError('電話番号を入力してください');
    setError('');

    const verifiedPhones = JSON.parse(localStorage.getItem(VERIFIED_PHONES_KEY) || '[]');

    if (verifiedPhones.includes(trimmed)) {
      // 登録済みユーザー → パスワード入力へ
      setIsReturning(true);
      setStep('password');
    } else {
      // 初回ユーザー → SMS認証へ
      setLoading(true);
      try {
        const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
        const { auth } = await import('./firebase');

        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
          });
        }

        const formatted = formatPhoneJP(trimmed);
        const result = await signInWithPhoneNumber(auth, formatted, recaptchaVerifierRef.current);
        setConfirmationResult(result);
        setStep('otp');
      } catch (err) {
        console.error(err);
        setError('SMS送信エラー: ' + (err.code || err.message));
        // recaptchaをリセット
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // OTP確認
  const handleOtpSubmit = async () => {
    if (!otp.trim()) return setError('認証コードを入力してください');
    setLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(otp.trim());
      // 認証成功 → 電話番号を登録済みリストに追加
      const verifiedPhones = JSON.parse(localStorage.getItem(VERIFIED_PHONES_KEY) || '[]');
      if (!verifiedPhones.includes(phone.trim())) {
        verifiedPhones.push(phone.trim());
        localStorage.setItem(VERIFIED_PHONES_KEY, JSON.stringify(verifiedPhones));
      }
      setStep('password');
    } catch (err) {
      setError('認証コードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  // パスワード確認
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
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* reCAPTCHA用の非表示コンテナ */}
      <div id="recaptcha-container"></div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
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

        {/* ステップ表示 */}
        {step === 'phone' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              登録済みの場合はパスワード入力へ進みます<br />
              初回はSMS認証を行います
            </p>
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
            <button
              onClick={handlePhoneSubmit}
              disabled={loading}
              style={buttonStyle(loading)}
            >
              {loading ? '送信中...' : '次へ'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div>
            <button onClick={() => { setStep('phone'); setError(''); setOtp(''); }} style={backStyle}>
              ← 戻る
            </button>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              <strong style={{ color: '#fff' }}>{phone}</strong> にSMSを送信しました<br />
              認証コード（6桁）を入力してください
            </p>
            <label style={labelStyle}>認証コード</label>
            <input
              type="number"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              onKeyDown={e => handleKeyDown(e, handleOtpSubmit)}
              placeholder="123456"
              style={{ ...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '22px' }}
              maxLength={6}
              autoFocus
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button
              onClick={handleOtpSubmit}
              disabled={loading}
              style={buttonStyle(loading)}
            >
              {loading ? '確認中...' : '認証する'}
            </button>
          </div>
        )}

        {step === 'password' && (
          <div>
            <button onClick={() => { setStep('phone'); setError(''); setPassword(''); }} style={backStyle}>
              ← 戻る
            </button>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              {isReturning
                ? `おかえりなさい！\nパスワードを入力してください`
                : `SMS認証が完了しました\nパスワードを入力してください`}
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
            <button
              onClick={handlePasswordSubmit}
              style={buttonStyle(false)}
            >
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

const buttonStyle = (disabled) => ({
  width: '100%',
  padding: '14px',
  background: disabled
    ? 'rgba(233,69,96,0.4)'
    : 'linear-gradient(135deg, #e94560, #c23152)',
  border: 'none',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '700',
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: '4px',
  transition: 'opacity 0.2s',
});

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
