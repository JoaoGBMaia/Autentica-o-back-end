const state = {
  accessToken: localStorage.getItem("accessToken") || "",
  refreshToken: localStorage.getItem("refreshToken") || "",
  user: loadStoredUser()
};

const elements = {
  apiStatusLabel: document.getElementById("apiStatusLabel"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  profileForm: document.getElementById("profileForm"),
  passwordForm: document.getElementById("passwordForm"),
  profileSummary: document.getElementById("profileSummary"),
  sessionsList: document.getElementById("sessionsList"),
  refreshSessionBtn: document.getElementById("refreshSessionBtn"),
  loadSessionsBtn: document.getElementById("loadSessionsBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutCurrentBtn: document.getElementById("logoutCurrentBtn"),
  toast: document.getElementById("toast"),
  tabButtons: Array.from(document.querySelectorAll("[data-tab-target]")),
  tabPanels: Array.from(document.querySelectorAll("[data-tab-panel]"))
};

boot();

async function boot() {
  bindEvents();
  renderProfile();
  renderSessions([]);
  await checkApiHealth();

  if (state.accessToken) {
    await hydrateAuthenticatedArea();
  }
}

function bindEvents() {
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tabTarget));
  });

  elements.loginForm.addEventListener("submit", handleLogin);
  elements.registerForm.addEventListener("submit", handleRegister);
  elements.profileForm.addEventListener("submit", handleProfileUpdate);
  elements.passwordForm.addEventListener("submit", handlePasswordChange);
  elements.refreshSessionBtn.addEventListener("click", handleRefreshSession);
  elements.loadSessionsBtn.addEventListener("click", () => loadSessions(true));
  elements.logoutBtn.addEventListener("click", handleLogoutWithRefresh);
  elements.logoutCurrentBtn.addEventListener("click", handleLogoutCurrentSession);
}

function switchTab(tabName) {
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tabTarget === tabName);
  });

  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tabName);
  });
}

async function checkApiHealth() {
  try {
    const response = await fetch("/health");
    const data = await response.json();
    elements.apiStatusLabel.textContent =
      data.status === "ok" ? "Back-end online e pronto para login." : "API respondeu sem status esperado.";
  } catch (error) {
    elements.apiStatusLabel.textContent = "Nao foi possivel conectar na API.";
    showToast("Nao foi possivel verificar a API.", true);
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const payload = {
    email: formData.get("email"),
    password: formData.get("password")
  };

  const result = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return;
  }

  setSession(result.data);
  event.currentTarget.reset();
  await hydrateAuthenticatedArea();
  showToast("Login realizado com sucesso.");
}

async function handleRegister(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password")
  };

  const result = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return;
  }

  setSession(result.data);
  event.currentTarget.reset();
  switchTab("login");
  await hydrateAuthenticatedArea();
  showToast("Conta criada e autenticada com sucesso.");
}

async function handleProfileUpdate(event) {
  event.preventDefault();

  if (!ensureAuthenticated()) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  const payload = {};
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (name) payload.name = name;
  if (email) payload.email = email;

  if (!Object.keys(payload).length) {
    showToast("Preencha ao menos nome ou email para atualizar.", true);
    return;
  }

  const result = await request("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
    auth: true
  });

  if (!result.ok) {
    return;
  }

  state.user = result.data.user;
  state.accessToken = result.data.accessToken;
  persistSession();
  renderProfile();
  event.currentTarget.reset();
  showToast("Perfil atualizado.");
}

async function handlePasswordChange(event) {
  event.preventDefault();

  if (!ensureAuthenticated()) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  const payload = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword")
  };

  const result = await request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true
  });

  if (!result.ok) {
    return;
  }

  clearSession();
  event.currentTarget.reset();
  renderProfile();
  renderSessions([]);
  showToast("Senha alterada. Faça login novamente.");
}

async function handleRefreshSession() {
  if (!state.refreshToken) {
    showToast("Nao existe refresh token salvo.", true);
    return;
  }

  const result = await request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: state.refreshToken })
  });

  if (!result.ok) {
    return;
  }

  setSession(result.data);
  await hydrateAuthenticatedArea();
  showToast("Sessao renovada com sucesso.");
}

async function handleLogoutWithRefresh() {
  if (!state.refreshToken) {
    showToast("Nenhuma sessao autenticada para sair.", true);
    return;
  }

  const result = await request("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: state.refreshToken })
  });

  if (!result.ok) {
    return;
  }

  clearSession();
  renderProfile();
  renderSessions([]);
  showToast("Logout realizado.");
}

async function handleLogoutCurrentSession() {
  if (!ensureAuthenticated()) {
    return;
  }

  const result = await request("/auth/logout-current", {
    method: "POST",
    auth: true
  });

  if (!result.ok) {
    return;
  }

  clearSession();
  renderProfile();
  renderSessions([]);
  showToast("Sessao atual encerrada.");
}

async function hydrateAuthenticatedArea() {
  const meResult = await request("/auth/me", {
    method: "GET",
    auth: true
  });

  if (!meResult.ok) {
    clearSession();
    renderProfile();
    renderSessions([]);
    return;
  }

  state.user = meResult.data.user;
  persistSession();
  renderProfile();
  await loadSessions(false);
}

async function loadSessions(showNotification) {
  if (!ensureAuthenticated()) {
    return;
  }

  const result = await request("/auth/sessions", {
    method: "GET",
    auth: true
  });

  if (!result.ok) {
    return;
  }

  renderSessions(result.data.sessions);

  if (showNotification) {
    showToast("Lista de sessoes atualizada.");
  }
}

async function revokeSession(sessionId) {
  if (!ensureAuthenticated()) {
    return;
  }

  const result = await request(`/auth/sessions/${sessionId}`, {
    method: "DELETE",
    auth: true
  });

  if (!result.ok) {
    return;
  }

  await loadSessions(false);
  showToast("Sessao encerrada com sucesso.");
}

function renderProfile() {
  if (!state.user) {
    elements.profileSummary.innerHTML =
      '<div class="empty-state">Faca login para ver seu perfil e gerenciar suas sessoes.</div>';
    return;
  }

  elements.profileSummary.innerHTML = `
    <div class="profile-grid">
      <article class="profile-card">
        <div class="profile-line">
          <span>Nome</span>
          <strong>${escapeHtml(state.user.name || "-")}</strong>
        </div>
      </article>
      <article class="profile-card">
        <div class="profile-line">
          <span>Email</span>
          <strong>${escapeHtml(state.user.email || "-")}</strong>
        </div>
      </article>
      <article class="profile-card">
        <div class="profile-line">
          <span>Criado em</span>
          <strong>${formatDate(state.user.createdAt)}</strong>
        </div>
      </article>
      <article class="profile-card">
        <div class="profile-line">
          <span>Ultimo login</span>
          <strong>${formatDate(state.user.lastLoginAt)}</strong>
        </div>
      </article>
    </div>
  `;
}

function renderSessions(sessions) {
  if (!sessions || !sessions.length) {
    elements.sessionsList.innerHTML =
      '<div class="empty-state">Nenhuma sessao ativa para exibir.</div>';
    return;
  }

  elements.sessionsList.innerHTML = sessions
    .map((session) => {
      const revokedBadge = session.revokedAt
        ? `<p>Status: encerrada em ${formatDate(session.revokedAt)}</p>`
        : "<p>Status: ativa</p>";

      return `
        <article class="session-item">
          <div class="session-meta">
            <strong>Sessao ${escapeHtml(session.id.slice(0, 8))}</strong>
            <p>Criada em ${formatDate(session.createdAt)}</p>
            <p>Expira em ${formatDate(session.expiresAt)}</p>
            <p>IP: ${escapeHtml(session.ip || "nao informado")}</p>
            <p>User-Agent: ${escapeHtml(session.userAgent || "nao informado")}</p>
            ${revokedBadge}
          </div>
          <button class="ghost-btn danger" type="button" data-revoke-session="${escapeHtml(session.id)}">
            Encerrar
          </button>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-revoke-session]").forEach((button) => {
    button.addEventListener("click", () => revokeSession(button.dataset.revokeSession));
  });
}

async function request(url, options = {}) {
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  if (options.auth && state.accessToken) {
    config.headers.Authorization = `Bearer ${state.accessToken}`;
  }

  if (options.body) {
    config.body = options.body;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showToast(data.error || "Algo deu errado.", true);
      return { ok: false, data };
    }

    return { ok: true, data };
  } catch (error) {
    showToast("Nao foi possivel completar a requisicao.", true);
    return { ok: false, data: null };
  }
}

function setSession(data) {
  state.accessToken = data.accessToken || "";
  state.refreshToken = data.refreshToken || "";
  state.user = data.user || null;
  persistSession();
}

function clearSession() {
  state.accessToken = "";
  state.refreshToken = "";
  state.user = null;
  persistSession();
}

function persistSession() {
  localStorage.setItem("accessToken", state.accessToken || "");
  localStorage.setItem("refreshToken", state.refreshToken || "");
  localStorage.setItem("authUser", JSON.stringify(state.user || null));
}

function loadStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "null");
  } catch (error) {
    return null;
  }
}

function ensureAuthenticated() {
  if (state.accessToken) {
    return true;
  }

  showToast("Faça login primeiro para usar essa acao.", true);
  return false;
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError
    ? "rgba(135, 39, 27, 0.94)"
    : "rgba(24, 49, 45, 0.92)";
  elements.toast.classList.add("visible");

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2800);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
