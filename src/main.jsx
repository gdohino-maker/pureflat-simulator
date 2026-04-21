import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './Login.jsx'

const AUTH_SESSION_KEY = 'pf_auth_session';

function Root() {
  // セッションが残っていれば自動ログイン
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY));
      if (!session) return false;
      // 7日間セッションを保持
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      return Date.now() - session.time < sevenDays;
    } catch {
      return false;
    }
  });

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
