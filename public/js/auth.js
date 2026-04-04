/**
 * NEXUS — Módulo de Autenticação Compartilhado
 * Inclua este arquivo em todas as páginas internas com:
 * <script src="/public/js/auth.js"></script>
 */

const NexusAuth = (() => {
  const KEYS = {
    token: 'nexus_token',
    refreshToken: 'nexus_refresh_token',
    user: 'nexus_user',
  };

  // Detecta a base URL da API (mesmo host, mesma porta)
  const API_BASE = '';

  // ── Storage ──────────────────────────────────────────────────
  function getToken() {
    return localStorage.getItem(KEYS.token);
  }

  function getRefreshToken() {
    return localStorage.getItem(KEYS.refreshToken);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.user));
    } catch {
      return null;
    }
  }

  function setSession(data) {
    localStorage.setItem(KEYS.token, data.token);
    if (data.refreshToken) {
      localStorage.setItem(KEYS.refreshToken, data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem(KEYS.user, JSON.stringify(data.user));
    }
  }

  function clearSession() {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.refreshToken);
    localStorage.removeItem(KEYS.user);
  }

  // ── Refresh token ─────────────────────────────────────────────
  let _refreshPromise = null;

  async function tryRefresh() {
    if (_refreshPromise) return _refreshPromise;

    const rt = getRefreshToken();
    if (!rt) return null;

    _refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
      .then(async (res) => {
        if (!res.ok) {
          clearSession();
          return null;
        }
        const data = await res.json();
        setSession(data);
        return data.token;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        _refreshPromise = null;
      });

    return _refreshPromise;
  }

  // ── Fetch autenticado ─────────────────────────────────────────
  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    let response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
      // Tenta renovar o token
      const newToken = await tryRefresh();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(fullUrl, { ...options, headers });
      } else {
        redirectToLogin();
        return null;
      }
    }

    return response;
  }

  // ── Logout ────────────────────────────────────────────────────
  async function logout() {
    const rt = getRefreshToken();
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
    } catch {
      // silently ignore
    }
    clearSession();
    redirectToLogin();
  }

  function redirectToLogin() {
    const role = getUser()?.role;
    window.location.href = '/login.html';
  }

  // ── Guard (redireciona se não autenticado) ────────────────────
  function requireAuth(requiredRole) {
    const user = getUser();
    const token = getToken();

    if (!user || !token) {
      redirectToLogin();
      return false;
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(user.role) && !roles.includes(user.accessLevel)) {
        window.location.href = '/';
        return false;
      }
    }

    return true;
  }

  // ── Preenchimento de nome do usuário no layout ────────────────
  function injectUserName(selector = '[data-user-name]') {
    const user = getUser();
    if (!user) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = user.nome || user.email;
    });
  }

  // ── Vincula botões/links de logout ────────────────────────────
  function bindLogout(selector = '[data-logout]') {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    });
  }

  // ── SSE (notificações in-app) ─────────────────────────────────
  let _sse = null;

  function conectarNotificacoes(onMessage) {
    const token = getToken();
    if (!token || _sse) return;

    _sse = new EventSource(`${API_BASE}/api/notificacoes/sse?token=${encodeURIComponent(token)}`);

    _sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (typeof onMessage === 'function') onMessage(data);
      } catch {}
    };

    _sse.onerror = () => {
      _sse.close();
      _sse = null;
    };
  }

  function desconectarNotificacoes() {
    if (_sse) {
      _sse.close();
      _sse = null;
    }
  }

  // ── API pública ───────────────────────────────────────────────
  return {
    getToken,
    getRefreshToken,
    getUser,
    setSession,
    clearSession,
    apiFetch,
    logout,
    requireAuth,
    injectUserName,
    bindLogout,
    conectarNotificacoes,
    desconectarNotificacoes,
  };
})();
