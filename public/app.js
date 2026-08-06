const app = document.getElementById('app');

const EQUIPMENT_OPTIONS = [
  'CLIMAX 1.1',
  'CLIMAX 1.1 CAMARA INTERIOR',
  'CLIMAX 1.1 CAMARA EXTERIOR',
  'CLIMAX 2.2',
  'CLIMAX 2.2 CAMARA INTERIOR',
  'CLIMAX 2.2 CAMARA EXTERIOR',
  'QOLSYS 1.1',
  'QOLSYS 1.1 CAMARA INTERIOR',
  'QOLSYS 1.1 CAMARA EXTERIOR',
  'QOLSYS 2.2',
  'QOLSYS 2.2 CAMARA INTERIOR',
  'QOLSYS 2.2 CAMARA EXTERIOR',
  'KIT COMERCIO 2.1',
  'KIT COMERCIO 2.1 CAMARA INTERIOR',
  'KIT COMERCIO 2.1 CAMARA EXTERIOR',
  'KIT GALPON 2.2',
  'KIT GALPON 2.2 CAMARA INTERIOR',
  'KIT GALPON 2.2 CAMARA EXTERIOR',
  'KIT CAM 1INT',
  'KIT CAM 2 INT',
  'KIT CAM 1 INT + 1 EXT'
];

function saveSession(user) {
  localStorage.setItem('alerta_user', JSON.stringify(user));
}

function getSession() {
  const raw = localStorage.getItem('alerta_user');
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem('alerta_user');
}

function applyTheme(theme) {
  document.body.style.transition = 'background 0.2s ease, color 0.2s ease';
  document.body.setAttribute('data-theme', theme);

  if (theme === 'dark') {
    document.body.style.background = '#111827';
    document.body.style.color = '#f9fafb';
  } else {
    document.body.style.background = '#f3f6fb';
    document.body.style.color = '#0f172a';
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'AP';
}

function roleLabel(role) {
  return role === 'admin' ? 'Jefatura' : 'Vendedor';
}

function statusLabel(status) {
  if (status === 'confirmed') return 'Aprobada';
  if (status === 'paid') return 'Aprobado Abonado';
  if (status === 'rejected') return 'Rechazada';
  return 'Pendiente';
}

function statusBadge(status) {
  const map = {
    pending: 'badge badge-pending',
    confirmed: 'badge badge-confirmed',
    paid: 'badge badge-paid',
    rejected: 'badge badge-rejected'
  };

  return `<span class="${map[status] || map.pending}">${statusLabel(status)}</span>`;
}

function escapePotentialClientHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function interestLevelLabel(level) {
  const labels = {
    green: '1. Verde',
    yellow: '2. Amarillo',
    red: '3. Rojo'
  };

  return labels[level] || 'Sin definir';
}

function interestLevelText(level) {
  const labels = {
    green: 'Interés alto',
    yellow: 'Interés medio',
    red: 'Interés bajo'
  };

  return labels[level] || 'Sin definir';
}

function interestLevelBadge(level) {
  const safeLevel = ['green', 'yellow', 'red'].includes(level)
    ? level
    : 'red';

  return `
    <span class="potential-interest-badge potential-interest-${safeLevel}">
      ${interestLevelLabel(safeLevel)}
    </span>
  `;
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-AR');
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-AR');
}

function getDayKey(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDashboardChart(surveys) {
  const labels = [];
  const values = [];
  const shortDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);

    const key = getDayKey(d);
    const count = surveys.filter(s => getDayKey(s.createdAt) === key).length;

    labels.push(shortDays[d.getDay()]);
    values.push(count);
  }

  const max = Math.max(...values, 1);
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const usableWidth = chartWidth - paddingX * 2;

  const points = values.map((value, index) => {
    const x = paddingX + (index / (values.length - 1 || 1)) * usableWidth;
    const y = paddingTop + usableHeight - (value / max) * usableHeight;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `
    M ${points[0].x} ${chartHeight - paddingBottom}
    ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')}
    L ${points[points.length - 1].x} ${chartHeight - paddingBottom}
    Z
  `;

  const ySteps = 4;
  const gridLines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const y = paddingTop + (usableHeight / ySteps) * i;
    return y;
  });

  return `
    <div class="chart-card-pro">
      <div class="chart-header-pro">
        <div>
          <div class="chart-title-pro">Ventas por semana</div>
          <div class="chart-subtitle-pro">Cantidad de ventas registradas en los últimos 7 días</div>
        </div>
        <div class="chart-range-pro">Últimos 7 días</div>
      </div>

      <div class="chart-body-pro">
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="chart-svg-pro" preserveAspectRatio="none">
          <defs>
            <linearGradient id="salesAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="rgba(37,99,235,0.35)" />
              <stop offset="100%" stop-color="rgba(37,99,235,0.03)" />
            </linearGradient>
          </defs>

          ${gridLines.map(y => `
            <line
              x1="${paddingX}"
              y1="${y}"
              x2="${chartWidth - paddingX}"
              y2="${y}"
              stroke="rgba(148,163,184,0.18)"
              stroke-width="1"
            />
          `).join('')}

          ${points.map(p => `
            <line
              x1="${p.x}"
              y1="${paddingTop}"
              x2="${p.x}"
              y2="${chartHeight - paddingBottom}"
              stroke="rgba(148,163,184,0.08)"
              stroke-width="1"
            />
          `).join('')}

          <path d="${areaPath}" fill="url(#salesAreaGradient)"></path>

          <path
            d="${linePath}"
            fill="none"
            stroke="#3b82f6"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>

          ${points.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#3b82f6"></circle>
            <circle cx="${p.x}" cy="${p.y}" r="8" fill="rgba(59,130,246,0.14)"></circle>
          `).join('')}
        </svg>

        <div class="chart-labels-pro">
          ${labels.map(label => `<span>${label}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function updateSaleSummaryFromForm(form, status = 'pending', sellerName = '-') {
  const holderName = (form.elements.holderName?.value || '').trim();
  const phone1 = (form.elements.phone1?.value || '').trim();
  const monitoringAddress = (form.elements.monitoringAddress?.value || '').trim();
  const equipment = (form.elements.equipment?.value || '').trim();
  const bonus = (form.elements.bonus?.value || '').trim();

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '-';
  };

  setText('summarySeller', sellerName || '-');
  setText('summaryClient', holderName || '-');
  setText('summaryPhone', phone1 || '-');
  setText('summaryAddress', monitoringAddress || '-');
  setText('summaryEquipment', equipment || '-');
  setText('summaryBonus', bonus || '-');

  const statusBox = document.getElementById('summaryStatus');
  if (statusBox) {
    statusBox.innerHTML = statusBadge(status || 'pending');
  }
}

function attachSaleSummarySync(form, sellerName, status = 'pending') {
  const sync = () => updateSaleSummaryFromForm(form, status, sellerName);
  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  sync();
}

function buildSidebar(user, active) {
  const sellerLinks = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'newSale', label: 'Nueva Venta' },
  { key: 'mySales', label: 'Mis Ventas' },
  {
    key: 'potentialClients',
    label: 'Clientes Potenciales'
  },
  { key: 'profile', label: 'Mi Perfil' },
  { key: 'settings', label: 'Configuración' }
];

const adminLinks = [
  { key: 'dashboard', label: 'Panel de Control' },
  { key: 'centralSales', label: 'Ventas en Central' },
  {
    key: 'potentialClients',
    label: 'Clientes Potenciales'
  },
  { key: 'vendors', label: 'Vendedores' },
  { key: 'settings', label: 'Configuración' }
];

  const links = user.role === 'admin' ? adminLinks : sellerLinks;

  return `
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="sidebar-logo">Alerta<span class="${user.role === 'admin' ? 'brand-accent-gold' : 'brand-accent'}">Plus</span></div>
        <div>☰</div>
      </div>

      <nav class="sidebar-nav">
        ${links.map(link => `
          <a href="#" class="sidebar-link ${active === link.key ? 'active' : ''}" data-nav="${link.key}">
            <span>•</span>
            <span>${link.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-spacer"></div>

      <button class="btn sidebar-logout" id="sidebarLogoutBtn">Cerrar Sesión</button>
    </aside>
  `;
}

function buildTopbar(user, title, subtitle, extraActions = '') {
  return `
    <div class="topbar">
      <div class="topbar-left">
        <button class="mobile-menu-btn" id="mobileMenuBtn">☰</button>

        <div class="topbar-title">
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>
      </div>

      <div class="topbar-user">
        ${extraActions}
        <div class="avatar">${getInitials(user.name)}</div>
        <div class="topbar-user-text">
          <div style="font-weight:700;">${user.name}</div>
          <div class="muted">${roleLabel(user.role)}</div>
        </div>
      </div>
    </div>
  `;
}

function buildFooter() {
  return `
    <footer class="app-footer">
      © 2025 AlertaPlus. Todos los derechos reservados.
    </footer>
  `;
}

function renderAppShell({ user, active, title, subtitle, content, extraActions = '' }) {
  app.innerHTML = `
    <div class="app-shell">
      <div class="mobile-sidebar-overlay" id="mobileSidebarOverlay"></div>

      <div class="sidebar-wrapper" id="sidebarWrapper">
        ${buildSidebar(user, active)}
      </div>

      <main class="main">
        ${buildTopbar(user, title, subtitle, extraActions)}
        ${content}
        ${buildFooter()}
      </main>
    </div>
  `;

  const sidebarWrapper = document.getElementById('sidebarWrapper');
  const overlay = document.getElementById('mobileSidebarOverlay');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');

  function openSidebar() {
    sidebarWrapper.classList.add('mobile-open');
    overlay.classList.add('show');
  }

  function closeSidebar() {
    sidebarWrapper.classList.remove('mobile-open');
    overlay.classList.remove('show');
  }

  function toggleSidebar() {
    const isOpen = sidebarWrapper.classList.contains('mobile-open');
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function handleNav(nav) {
    closeSidebar();

    if (nav === 'dashboard') {
      renderDashboard(user);
    } else if (nav === 'newSale') {
      renderSurveyForm(user);
    } else if (nav === 'mySales') {
      renderSellerSurveys(user);
    } else if (nav === 'potentialClients') {
      renderPotentialClients(user);
    } else if (nav === 'profile') {
      renderProfile(user);
    } else if (nav === 'settings') {
      renderSettings(user);
    } else if (nav === 'centralSales') {
      renderAdminSurveys();
    } else if (nav === 'vendors') {
      renderAdminPanel(user);
    }
  }

  document.getElementById('sidebarLogoutBtn').onclick = () => {
    clearSession();
    renderHome();
  };

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      handleNav(el.dataset.nav);
    };
  });

  if (mobileMenuBtn) {
    mobileMenuBtn.onclick = toggleSidebar;
  }

  if (overlay) {
    overlay.onclick = closeSidebar;
  }
}

function buildAuthShell({
  brandClass = '',
  accentClass = 'brand-accent',
  title,
  subtitle,
  formHtml,
  brandTitle,
  brandText,
  features = []
}) {
  return `
    <div class="auth-page">
      <div class="auth-shell">
        <div class="auth-brand ${brandClass}">
          <div class="auth-logo">Alerta<span class="${accentClass}">Plus</span></div>

          <div class="auth-brand-center">
            <div>
              <h2>${brandTitle}</h2>
              <p>${brandText}</p>
            </div>

            <div class="auth-features">
              ${features.map(item => `
                <div class="auth-feature">
                  <div class="auth-feature-icon">${item.icon}</div>
                  <div>
                    <div style="font-weight:700; margin-bottom:4px;">${item.title}</div>
                    <div>${item.text}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="auth-panel">
          <div class="auth-card">
            <h1>${title}</h1>
            <p class="auth-subtitle">${subtitle}</p>
            ${formHtml}
          </div>
        </div>
      </div>

      <footer class="auth-page-footer">
        © 2025 AlertaPlus. Todos los derechos reservados.
      </footer>
    </div>
  `;
}

function renderHome() {
  clearSession();
  applyTheme('light');

  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-shell">
        <div class="auth-brand">
          <div class="auth-logo">Alerta<span class="brand-accent">Plus</span></div>

          <div class="auth-brand-center">
            <div>
              <h2>Plataforma de gestión de ventas y contratos</h2>
              <p>Organizá tus encuestas, vendedores y validaciones de central en un solo lugar.</p>
            </div>

            <div class="auth-features">
              <div class="auth-feature">
                <div class="auth-feature-icon">✓</div>
                <div>
                  <div style="font-weight:700; margin-bottom:4px;">Seguridad</div>
                  <div>Protegemos la información de clientes y vendedores.</div>
                </div>
              </div>

              <div class="auth-feature">
                <div class="auth-feature-icon">↗</div>
                <div>
                  <div style="font-weight:700; margin-bottom:4px;">Seguimiento</div>
                  <div>Visualizá ventas, estados y documentación en tiempo real.</div>
                </div>
              </div>

              <div class="auth-feature">
                <div class="auth-feature-icon">★</div>
                <div>
                  <div style="font-weight:700; margin-bottom:4px;">Control Central</div>
                  <div>Jefatura puede revisar, aprobar y rechazar operaciones.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="auth-panel">
          <div class="auth-card" style="width:min(100%,780px);">
            <h1>¡Bienvenido a AlertaPlus!</h1>
            <p class="auth-subtitle">Seleccioná el tipo de acceso para continuar.</p>

            <div class="auth-actions">
              <div class="card" style="box-shadow:none;">
                <h2 style="margin-top:0;">Vendedor</h2>
                <p class="muted">Ingresá al sistema para cargar nuevas ventas y administrar tus encuestas.</p>
                <div class="btn-row" style="margin-top:16px;">
                  <button class="btn btn-primary" id="goSellerLoginBtn">Ingresar como Vendedor</button>
                  <button class="btn btn-outline" id="goRegisterBtn">Registrar Nuevo Vendedor</button>
                </div>
              </div>

              <div class="card" style="box-shadow:none;">
                <h2 style="margin-top:0;">Jefatura</h2>
                <p class="muted">Panel central para revisar ventas recibidas, gestionar vendedores y cambiar estados.</p>
                <div class="btn-row" style="margin-top:16px;">
                  <button class="btn btn-warning" id="goAdminLoginBtn">Ingresar como Jefe</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="auth-page-footer">
        © 2025 AlertaPlus. Todos los derechos reservados.
      </footer>
    </div>
  `;

  document.getElementById('goSellerLoginBtn').onclick = () => renderLogin('seller');
  document.getElementById('goAdminLoginBtn').onclick = () => renderLogin('admin');
  document.getElementById('goRegisterBtn').onclick = renderRegister;
}

function renderLogin(expectedRole = 'seller') {
  const isAdmin = expectedRole === 'admin';

  app.innerHTML = buildAuthShell({
    brandClass: isAdmin ? 'dark' : '',
    accentClass: isAdmin ? 'brand-accent-gold' : 'brand-accent',
    title: `Bienvenido, ${isAdmin ? 'Jefatura' : 'Vendedor'}`,
    subtitle: isAdmin
      ? 'Iniciá sesión para acceder al panel de administración.'
      : 'Iniciá sesión para continuar cargando nuevas ventas.',
    brandTitle: isAdmin ? 'Panel de administración y control central' : 'Plataforma de gestión comercial',
    brandText: isAdmin
      ? 'Revisá ventas recibidas, aprobá operaciones y administrá vendedores.'
      : 'Cargá nuevas ventas, gestioná clientes y enviá contratos a central.',
    features: isAdmin
      ? [
          { icon: '◴', title: 'Control Central', text: 'Visualizá todas las ventas recibidas en tiempo real.' },
          { icon: '👥', title: 'Gestión de Equipos', text: 'Administrá vendedores y sus resultados.' },
          { icon: '▣', title: 'Reportes', text: 'Generá informes y estadísticas avanzadas.' }
        ]
      : [
          { icon: '✓', title: 'Acceso exclusivo', text: 'Podrás cargar nuevas ventas y gestionar clientes.' },
          { icon: '⚡', title: 'Rapidez', text: 'Formulario optimizado para completar desde cualquier equipo.' },
          { icon: '☁', title: 'Sincronización', text: 'Tus encuestas quedan disponibles para central.' }
        ],
    formHtml: `
      <form id="loginForm">
        <div class="field">
          <label>Usuario</label>
          <input class="input" name="username" required placeholder="Ingresá tu usuario">
        </div>

        <div class="field">
          <label>Contraseña</label>
          <input class="input" name="password" type="password" required placeholder="Ingresá tu contraseña">
        </div>

        <div class="auth-actions">
          <button class="btn ${isAdmin ? 'btn-warning' : 'btn-primary'}" type="submit">
            Iniciar Sesión como ${isAdmin ? 'Jefe' : 'Vendedor'}
          </button>
          <button class="btn btn-secondary" type="button" id="backHomeBtn">Volver al inicio</button>
        </div>

        <div class="auth-footer">
          <a href="#" id="goForgotBtn">¿Olvidaste tu contraseña?</a>
        </div>

        <div id="msg" style="margin-top:16px;"></div>
      </form>
    `
  });

  document.getElementById('backHomeBtn').onclick = renderHome;
  document.getElementById('goForgotBtn').onclick = (e) => {
    e.preventDefault();
    renderForgotPassword();
  };

  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const body = Object.fromEntries(form);

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById('msg').innerHTML = `<p style="color:#dc2626;">${data.error}</p>`;
      return;
    }

    if (expectedRole && data.user.role !== expectedRole) {
      document.getElementById('msg').innerHTML = '<p style="color:#dc2626;">Ese usuario no corresponde a este acceso.</p>';
      return;
    }

    saveSession(data.user);
    applyTheme(data.user.theme || 'light');
    renderDashboard(data.user);
  };
}

function renderRegister() {
  app.innerHTML = buildAuthShell({
    title: 'Registro de Vendedor',
    subtitle: 'Completá tus datos para crear tu cuenta.',
    brandTitle: 'Sumate al equipo de ventas',
    brandText: 'Creá tu cuenta de vendedor para cargar nuevas ventas y contratos.',
    features: [
      { icon: '✓', title: 'Alta inmediata', text: 'La cuenta se crea como vendedor activo.' },
      { icon: '⚡', title: 'Carga rápida', text: 'Podés comenzar a completar encuestas enseguida.' }
    ],
    formHtml: `
      <form id="registerForm">
        <div class="field">
          <label>Nombre Completo</label>
          <input class="input" name="name" required placeholder="Ej: Juan Pérez">
        </div>

        <div class="field">
          <label>Usuario</label>
          <input class="input" name="username" required placeholder="Ej: juan.perez">
        </div>

        <div class="field">
          <label>Contraseña</label>
          <input class="input" name="password" type="password" required placeholder="Mínimo 4 caracteres">
        </div>

        <div class="auth-actions">
          <button class="btn btn-primary" type="submit">Crear Cuenta</button>
          <button class="btn btn-secondary" type="button" id="backHomeBtn">Volver al inicio</button>
        </div>

        <div id="msg" style="margin-top:16px;"></div>
      </form>
    `
  });

  document.getElementById('backHomeBtn').onclick = renderHome;

  document.getElementById('registerForm').onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const body = Object.fromEntries(form);

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById('msg').innerHTML = `<p style="color:#dc2626;">${data.error}</p>`;
      return;
    }

    document.getElementById('msg').innerHTML = `<p style="color:#16a34a;">${data.message}</p>`;
    e.target.reset();
  };
}

function renderForgotPassword() {
  app.innerHTML = buildAuthShell({
    title: 'Recuperar contraseña',
    subtitle: 'Ingresá tu usuario. En modo local, el enlace queda guardado en la vista previa.',
    brandTitle: 'Recuperación de acceso',
    brandText: 'Generá un enlace local de recuperación para restablecer tu contraseña.',
    features: [
      { icon: '🔐', title: 'Enlace temporal', text: 'El token vence automáticamente.' },
      { icon: '📝', title: 'Vista previa local', text: 'Se guarda en data/password-reset-preview.txt.' }
    ],
    formHtml: `
      <form id="forgotForm">
        <div class="field">
          <label>Usuario</label>
          <input class="input" name="identifier" required placeholder="Ingresá tu usuario">
        </div>

        <div class="auth-actions">
          <button class="btn btn-primary" type="submit">Generar enlace</button>
          <button class="btn btn-secondary" type="button" id="backHomeBtn">Volver</button>
        </div>

        <div id="msg" style="margin-top:16px;"></div>
      </form>
    `
  });

  document.getElementById('backHomeBtn').onclick = renderHome;

  document.getElementById('forgotForm').onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const body = Object.fromEntries(form);

    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById('msg').innerHTML = `<p style="color:#dc2626;">${data.error}</p>`;
      return;
    }

    document.getElementById('msg').innerHTML = `
      <p style="color:#16a34a;">
        ${data.message}<br>
        Vista previa local: ${data.previewFile}
      </p>
    `;
  };
}

function buildDashboardPotentialClientsCard(
  recentPotentialClients,
  user
) {
  const isAdmin = user.role === 'admin';

  return `
    <div class="card potential-dashboard-card">
      <div class="card-header">
        <div>
          <h2>Últimos clientes potenciales</h2>

          <p class="muted">
            Seguimientos comerciales actualizados recientemente.
          </p>
        </div>

        <button
          class="btn btn-secondary"
          id="openPotentialClientsDashboardBtn"
        >
          Ver todos
        </button>
      </div>

      <div class="table-wrap desktop-sales-table">
        <table class="table">
          <thead>
            <tr>
              <th>Cliente / Razón Social</th>

              ${
                isAdmin
                  ? '<th>Vendedor</th>'
                  : ''
              }

              <th>Contacto / Dirección</th>
              <th>Localidad</th>
              <th>Nivel de interés</th>
              <th>Última actualización</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            ${buildPotentialClientRows(
              recentPotentialClients,
              user
            )}
          </tbody>
        </table>
      </div>

      <div class="mobile-sales-list">
        ${buildPotentialClientCards(
          recentPotentialClients,
          user
        )}
      </div>
    </div>
  `;
}

async function renderDashboard(user) {
  const statsRes = await fetch(`/api/stats?userId=${user.id}&role=${user.role}`);
  const statsData = await statsRes.json();
  const stats = statsData.stats;

  const surveysRes = await fetch('/api/surveys');
  const surveysData = await surveysRes.json();

  const potentialClients =
  await fetchPotentialClientsForUser(user);

const recentPotentialClients = [...potentialClients]
  .sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt) -
      new Date(a.updatedAt || a.createdAt)
  )
  .slice(0, 5);

const greenPotentialCount = potentialClients.filter(
  client => client.interestLevel === 'green'
).length;

const yellowPotentialCount = potentialClients.filter(
  client => client.interestLevel === 'yellow'
).length;

const redPotentialCount = potentialClients.filter(
  client => client.interestLevel === 'red'
).length;

  const surveys = user.role === 'admin'
    ? surveysData.surveys
    : surveysData.surveys.filter(s => s.sellerId === user.id);

  const pendingCount = surveys.filter(s => s.status === 'pending').length;
  const confirmedCount = surveys.filter(s => s.status === 'confirmed').length;
  const paidCount = surveys.filter(s => s.status === 'paid').length;
  const rejectedCount = surveys.filter(s => s.status === 'rejected').length;

  const recentSurveys = [...surveys]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (user.role === 'admin') {
    renderAppShell({
      user,
      active: 'dashboard',
      title: 'Panel de Control - Jefatura',
      subtitle: 'Resumen general de ventas recibidas en central.',
      extraActions: `<button class="btn btn-primary" id="manageUsersBtn">Gestionar Vendedores</button>`,
      content: `
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Ventas en Central</h3>
            <p class="stat-number">${pendingCount}</p>
            <div class="stat-meta">Pendientes de revisión</div>
          </div>

          <div class="stat-card">
            <h3>Ventas Aprobadas</h3>
            <p class="stat-number">${confirmedCount}</p>
            <div class="stat-meta">Aprobadas sin abonar</div>
          </div>

          <div class="stat-card">
            <h3>Aprobado Abonado</h3>
            <p class="stat-number">${paidCount}</p>
            <div class="stat-meta">Ventas aprobadas y abonadas</div>
          </div>

          <div class="stat-card">
            <h3>Vendedores Activos</h3>
            <p class="stat-number">${stats.activeSellers}</p>
            <div class="stat-meta">Actualmente activos</div>
          </div>

          <div class="stat-card">
            <h3>Ventas Enviadas</h3>
            <p class="stat-number">${stats.total}</p>
            <div class="stat-meta">Total general</div>
          </div>
        </div>
        
        
        ${buildDashboardPotentialClientsCard(
          recentPotentialClients,
          user
        )}

        <div class="card">
          <div class="card-header">
            <h2>Ventas recibidas en central</h2>
            <button class="btn btn-secondary" id="openCentralBtn">Ver todas</button>
          </div>

          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vendedor</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Documentación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                ${recentSurveys.map(s => `
                  <tr>
                    <td>${formatDate(s.createdAt)}</td>
                    <td>${s.sellerName}</td>

                    <td>
                      <div>${s.holderName}</div>
                      <div class="muted">${s.phone1 || '-'}</div>
                    </td>

                    <td>${s.equipment}</td>

                    <td>
                      ${s.dniFrontData && s.dniBackData
                        ? 'Completa'
                        : 'Incompleta'
                      }
                    </td>

                    <td>${statusBadge(s.status)}</td>

                    <td>
                      <div class="btn-row">
                        <button
                          class="btn btn-outline"
                          onclick="viewSurveyDetail(${s.id})"
                        >
                          Ver
                        </button>

                        <button
                          class="btn btn-secondary"
                          onclick="changeSurveyStatus(${s.id})"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `
    });

    document.getElementById('manageUsersBtn').onclick = () => {
      renderAdminPanel(user);
    };

    document.getElementById('openCentralBtn').onclick = () => {
      renderAdminSurveys();
    };

    document.getElementById(
      'openPotentialClientsDashboardBtn'
    ).onclick = () => {
      renderPotentialClients(user);
    };

    return;
  }

  renderAppShell({
    user,
    active: 'dashboard',
    title: `Hola, ${user.name}`,
    subtitle: 'Bienvenido a tu panel de vendedor',
    content: `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Ventas Totales</h3>
          <p class="stat-number">${stats.total}</p>
          <div class="stat-meta">Este mes</div>
        </div>

        <div class="stat-card">
          <h3>Aprobadas</h3>
          <p class="stat-number">${confirmedCount}</p>
          <div class="stat-meta">Aprobadas sin abonar</div>
        </div>

        <div class="stat-card">
          <h3>Aprobado Abonado</h3>
          <p class="stat-number">${paidCount}</p>
          <div class="stat-meta">Aprobadas y abonadas</div>
        </div>

        <div class="stat-card">
          <h3>Pendientes</h3>
          <p class="stat-number">${pendingCount}</p>
          <div class="stat-meta">En revisión</div>
        </div>

        <div class="stat-card">
          <h3>Rechazadas</h3>
          <p class="stat-number">${rejectedCount}</p>
          <div class="stat-meta">Este mes</div>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          ${buildDashboardChart(surveys)}
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Últimas ventas</h2>

            <button
              class="btn btn-secondary"
              id="viewAllSellerSalesBtn"
            >
              Ver todas
            </button>
          </div>

          <div class="list">
            ${recentSurveys.map(s => `
              <div class="list-item">
                <div class="avatar">${getInitials(s.holderName)}</div>

                <div>
                  <div style="font-weight:700;">
                    ${s.holderName}
                  </div>

                  <div class="muted">
                    ${s.equipment}
                  </div>
                </div>

                <div>${statusBadge(s.status)}</div>

                <div class="muted">
                  ${formatDate(s.createdAt)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Mis ventas</h2>

          <div class="toolbar-right">
            <button
              class="btn btn-secondary"
              id="openFiltersBtn"
            >
              Filtros
            </button>

            <button
              class="btn btn-primary"
              id="newSaleFromDashboardBtn"
            >
              Nueva Venta
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Última actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              ${recentSurveys.map(s => `
                <tr>
                  <td>${s.holderName}</td>
                  <td>${s.equipment}</td>
                  <td>${formatDate(s.createdAt)}</td>
                  <td>${statusBadge(s.status)}</td>
                  <td>${formatDateTime(s.createdAt)}</td>

                  <td>
                    <div class="btn-row">
                      <button
                        class="btn btn-outline"
                        onclick="viewSurveyDetail(${s.id})"
                      >
                        Ver
                      </button>

                      ${
                        s.status === 'pending'
                          ? `
                            <button
                              class="btn btn-secondary"
                              onclick="editSurvey(${s.id})"
                            >
                              Editar
                            </button>
                          `
                          : ''
                      }
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  });

  document.getElementById('viewAllSellerSalesBtn').onclick = () => {
    renderSellerSurveys(user);
  };

  document.getElementById('newSaleFromDashboardBtn').onclick = () => {
    renderSurveyForm(user);
  };

  document.getElementById('openFiltersBtn').onclick = () => {
    renderSellerSurveys(user);
  };
}

async function renderAdminPanel(user) {
  const res = await fetch('/api/users');
  const data = await res.json();

  renderAppShell({
    user,
    active: 'vendors',
    title: 'Gestión de Vendedores',
    subtitle: 'Administrá altas, bajas y roles del equipo.',
    extraActions: `<button class="btn btn-primary" id="goAdminDashboardBtn">Panel de Control</button>`,
    content: `
      <div class="profile-grid">
        <div class="section-card">
          <div class="section-title">Nuevo vendedor</div>

          <form id="newUserForm">
            <div class="field">
              <label>Nombre</label>
              <input class="input" name="name" required>
            </div>

            <div class="field">
              <label>Usuario</label>
              <input class="input" name="username" required>
            </div>

            <div class="field">
              <label>Contraseña</label>
              <input class="input" name="password" type="password" required>
            </div>

            <div class="field">
              <label>Rol</label>
              <select class="select" name="role">
                <option value="seller">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button class="btn btn-primary" type="submit">Crear empleado</button>
            <div id="newUserMsg" style="margin-top:14px;"></div>
          </form>
        </div>

        <div class="section-card">
          <div class="section-title">Resumen</div>
          <div class="info-list">
            <div class="info-row"><div>Vendedores</div><div>${data.users.filter(u => u.role === 'seller').length}</div></div>
            <div class="info-row"><div>Administradores</div><div>${data.users.filter(u => u.role === 'admin').length}</div></div>
            <div class="info-row"><div>Activos</div><div>${data.users.filter(u => u.active).length}</div></div>
            <div class="info-row"><div>Inactivos</div><div>${data.users.filter(u => !u.active).length}</div></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="card-header">
          <h2>Listado del equipo</h2>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Tema</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${data.users.map(u => `
                <tr>
                  <td>${u.id}</td>
                  <td>${u.name}</td>
                  <td>${u.username}</td>
                  <td>${roleLabel(u.role)}</td>
                  <td>${u.active ? '<span class="badge badge-confirmed">Activo</span>' : '<span class="badge badge-rejected">Inactivo</span>'}</td>
                  <td>${u.theme || 'light'}</td>
                  <td>
                    <button class="btn ${u.active ? 'btn-danger' : 'btn-success'}" onclick="toggleUser(${u.id}, ${u.active})">
                      ${u.active ? 'Dar de baja' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  });

  document.getElementById('goAdminDashboardBtn').onclick = () => renderDashboard(user);

  document.getElementById('newUserForm').onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const body = Object.fromEntries(form);

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const response = await res.json();

    if (!res.ok) {
      document.getElementById('newUserMsg').innerHTML = `<p style="color:#dc2626;">${response.error}</p>`;
      return;
    }

    document.getElementById('newUserMsg').innerHTML = `<p style="color:#16a34a;">${response.message}</p>`;
    renderAdminPanel(user);
  };
}

function buildAdminSalesRowsPro(sales) {
  if (!sales.length) {
    return `
      <tr>
        <td colspan="7">
          <div class="empty">No hay ventas para mostrar.</div>
        </td>
      </tr>
    `;
  }

  return sales.map(s => `
    <tr>
      <td>${formatDate(s.createdAt)}</td>
      <td>
        <div style="font-weight:700;">${s.sellerName || '-'}</div>
        <div class="muted">ID: ${s.sellerId || '-'}</div>
      </td>
      <td>
        <div style="font-weight:700;">${s.holderName || '-'}</div>
        <div class="muted">${s.phone1 || '-'}</div>
      </td>
      <td>
        <div>${s.equipment || '-'}</div>
        <div class="muted">${s.bonus || '-'}</div>
      </td>
      <td>
        ${s.dniFrontData && s.dniBackData
          ? '<span class="badge badge-confirmed">Completa</span>'
          : '<span class="badge badge-pending">Incompleta</span>'
        }
      </td>
      <td>${statusBadge(s.status)}</td>
      <td>
        <div class="btn-row">
          <button class="btn btn-outline" onclick="viewSurveyDetail(${s.id})">Ver</button>
          <button class="btn btn-secondary" onclick="changeSurveyStatus(${s.id})">Estado</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function buildSellerSalesRowsPro(sales) {
  if (!sales.length) {
    return `
      <tr>
        <td colspan="6">
          <div class="empty">No hay ventas para mostrar.</div>
        </td>
      </tr>
    `;
  }

  return sales.map(s => `
    <tr>
      <td>
        <div style="font-weight:700;">${s.holderName || '-'}</div>
        <div class="muted">${s.cuil || '-'}</div>
      </td>
      <td>
        <div>${s.equipment || '-'}</div>
        <div class="muted">${s.bonus || '-'}</div>
      </td>
      <td>${formatDate(s.createdAt)}</td>
      <td>${statusBadge(s.status)}</td>
      <td>${formatDateTime(s.createdAt)}</td>
      <td>
        <div class="btn-row">
          <button class="btn btn-outline" onclick="viewSurveyDetail(${s.id})">Ver</button>
          ${s.status === 'pending'
            ? `<button class="btn btn-secondary" onclick="editSurvey(${s.id})">Editar</button>`
            : ''
          }
        </div>
      </td>
    </tr>
  `).join('');
}

function buildSellerSalesCards(sales) {
  if (!sales.length) {
    return `<div class="empty">No hay ventas para mostrar.</div>`;
  }

  return sales.map(s => `
    <div class="sale-card-mobile">
      <div class="sale-card-mobile-header">
        <div>
          <div class="sale-card-mobile-title">${s.holderName || '-'}</div>
          <div class="sale-card-mobile-sub">${s.cuil || '-'}</div>
        </div>
        <div>${statusBadge(s.status)}</div>
      </div>

      <div class="sale-card-mobile-grid">
        <div><span>Equipo</span><strong>${s.equipment || '-'}</strong></div>
        <div><span>Promoción</span><strong>${s.bonus || '-'}</strong></div>
        <div><span>Fecha</span><strong>${formatDate(s.createdAt)}</strong></div>
        <div><span>Ciudad</span><strong>${s.city || '-'}</strong></div>
      </div>

      <div class="sale-card-mobile-actions">
        <button class="btn btn-outline" onclick="viewSurveyDetail(${s.id})">Ver</button>
        ${s.status === 'pending'
          ? `<button class="btn btn-secondary" onclick="editSurvey(${s.id})">Editar</button>`
          : ''
        }
      </div>
    </div>
  `).join('');
}

function buildAdminSalesCards(sales) {
  if (!sales.length) {
    return `<div class="empty">No hay ventas para mostrar.</div>`;
  }

  return sales.map(s => `
    <div class="sale-card-mobile">
      <div class="sale-card-mobile-header">
        <div>
          <div class="sale-card-mobile-title">${s.holderName || '-'}</div>
          <div class="sale-card-mobile-sub">${s.sellerName || '-'} · ${s.phone1 || '-'}</div>
        </div>
        <div>${statusBadge(s.status)}</div>
      </div>

      <div class="sale-card-mobile-grid">
        <div><span>Equipo</span><strong>${s.equipment || '-'}</strong></div>
        <div><span>Promoción</span><strong>${s.bonus || '-'}</strong></div>
        <div><span>Fecha</span><strong>${formatDate(s.createdAt)}</strong></div>
        <div><span>Documentación</span><strong>${s.dniFrontData && s.dniBackData ? 'Completa' : 'Incompleta'}</strong></div>
      </div>

      <div class="sale-card-mobile-actions">
        <button class="btn btn-outline" onclick="viewSurveyDetail(${s.id})">Ver</button>
        <button class="btn btn-secondary" onclick="changeSurveyStatus(${s.id})">Estado</button>
      </div>
    </div>
  `).join('');
}

async function renderAdminSurveys() {
  const sessionUser = getSession();

  const resUsers = await fetch('/api/users');
  const usersData = await resUsers.json();

  const res = await fetch('/api/surveys');
  const data = await res.json();

  const allSurveys = [...data.surveys].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  let currentStatus = 'all';
  let currentSeller = '';
  let currentSearch = '';

  function getFilteredSurveys() {
    let filtered = [...allSurveys];

    if (currentStatus !== 'all') {
      filtered = filtered.filter(s => s.status === currentStatus);
    }

    if (currentSeller) {
      filtered = filtered.filter(
        s => s.sellerName === currentSeller
      );
    }

    if (currentSearch) {
      const q = currentSearch.toLowerCase();

      filtered = filtered.filter(s =>
        String(s.holderName || '').toLowerCase().includes(q) ||
        String(s.sellerName || '').toLowerCase().includes(q) ||
        String(s.cuil || '').toLowerCase().includes(q) ||
        String(s.city || '').toLowerCase().includes(q) ||
        String(s.equipment || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  function renderScreen() {
    const filtered = getFilteredSurveys();

    const total = filtered.length;

    const pending = filtered.filter(
      s => s.status === 'pending'
    ).length;

    const confirmed = filtered.filter(
      s => s.status === 'confirmed'
    ).length;

    const paid = filtered.filter(
      s => s.status === 'paid'
    ).length;

    const rejected = filtered.filter(
      s => s.status === 'rejected'
    ).length;

    renderAppShell({
      user: sessionUser,
      active: 'centralSales',
      title: 'Ventas en Central',
      subtitle: 'Revisión y seguimiento de ventas enviadas por vendedores.',

      extraActions: `
        <button
          class="btn btn-secondary"
          id="goDashboardBtn"
        >
          Panel de Control
        </button>

        <button
          class="btn btn-primary"
          id="goVendorsBtn"
        >
          Gestionar Vendedores
        </button>
      `,

      content: `
        <div class="stats-grid admin-stats-grid">
          <div class="stat-card mini-stat-card ${
            currentStatus === 'all' ? 'active-stat' : ''
          }">
            <h3>Todas</h3>
            <p class="stat-number">${total}</p>
            <div class="stat-meta">Ventas visibles</div>
          </div>

          <div class="stat-card mini-stat-card ${
            currentStatus === 'pending' ? 'active-stat' : ''
          }">
            <h3>Pendientes</h3>
            <p class="stat-number">${pending}</p>
            <div class="stat-meta">En revisión</div>
          </div>

          <div class="stat-card mini-stat-card ${
            currentStatus === 'confirmed' ? 'active-stat' : ''
          }">
            <h3>Aprobadas</h3>
            <p class="stat-number">${confirmed}</p>
            <div class="stat-meta">Validadas sin abonar</div>
          </div>

          <div class="stat-card mini-stat-card ${
            currentStatus === 'paid' ? 'active-stat' : ''
          }">
            <h3>Aprobado Abonado</h3>
            <p class="stat-number">${paid}</p>
            <div class="stat-meta">Ventas abonadas</div>
          </div>

          <div class="stat-card mini-stat-card ${
            currentStatus === 'rejected' ? 'active-stat' : ''
          }">
            <h3>Rechazadas</h3>
            <p class="stat-number">${rejected}</p>
            <div class="stat-meta">Observadas</div>
          </div>
        </div>

        <div class="card">
          <div class="toolbar">
            <div class="tabs">
              <button
                class="tab ${currentStatus === 'all' ? 'active' : ''}"
                data-admin-status="all"
              >
                Todas
              </button>

              <button
                class="tab ${currentStatus === 'pending' ? 'active' : ''}"
                data-admin-status="pending"
              >
                Pendientes
              </button>

              <button
                class="tab ${currentStatus === 'confirmed' ? 'active' : ''}"
                data-admin-status="confirmed"
              >
                Aprobadas
              </button>

              <button
                class="tab ${currentStatus === 'paid' ? 'active' : ''}"
                data-admin-status="paid"
              >
                Aprobado Abonado
              </button>

              <button
                class="tab ${currentStatus === 'rejected' ? 'active' : ''}"
                data-admin-status="rejected"
              >
                Rechazadas
              </button>
            </div>

            <div class="toolbar-right">
              <select
                class="select"
                id="adminSellerFilter"
                style="min-width:220px;"
              >
                <option value="">
                  Todos los vendedores
                </option>

                ${usersData.users
                  .filter(u => u.role === 'seller')
                  .map(u => `
                    <option
                      value="${u.name}"
                      ${currentSeller === u.name ? 'selected' : ''}
                    >
                      ${u.name}
                    </option>
                  `)
                  .join('')}
              </select>

              <input
                class="input search"
                id="adminSalesSearch"
                placeholder="Buscar por cliente, vendedor, CUIL o ciudad..."
                value="${currentSearch}"
              >

              <button
                class="btn btn-secondary"
                id="resetAdminFiltersBtn"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div class="table-wrap desktop-sales-table">
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vendedor</th>
                  <th>Cliente / Teléfono</th>
                  <th>Equipo / Promo</th>
                  <th>Documentación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody id="adminSalesTableBody">
                ${buildAdminSalesRowsPro(filtered)}
              </tbody>
            </table>
          </div>

          <div
            class="mobile-sales-list"
            id="adminSalesCards"
          >
            ${buildAdminSalesCards(filtered)}
          </div>
        </div>
      `
    });

    document.getElementById('goDashboardBtn').onclick = () => {
      renderDashboard(sessionUser);
    };

    document.getElementById('goVendorsBtn').onclick = () => {
      renderAdminPanel(sessionUser);
    };

    document.querySelectorAll('[data-admin-status]').forEach(btn => {
      btn.onclick = () => {
        currentStatus = btn.dataset.adminStatus;
        renderScreen();
      };
    });

    document.getElementById('adminSellerFilter').onchange = (e) => {
      currentSeller = e.target.value;
      renderScreen();
    };

    document.getElementById('adminSalesSearch').oninput = (e) => {
      currentSearch = e.target.value.trim();

      const filteredNow = getFilteredSurveys();

      document.getElementById('adminSalesTableBody').innerHTML =
        buildAdminSalesRowsPro(filteredNow);

      document.getElementById('adminSalesCards').innerHTML =
        buildAdminSalesCards(filteredNow);
    };

    document.getElementById('resetAdminFiltersBtn').onclick = () => {
      currentStatus = 'all';
      currentSeller = '';
      currentSearch = '';
      renderScreen();
    };
  }

  renderScreen();
}

function buildSaleSummary(survey, user) {
  return `
    <div class="summary-card">
      <h3>Resumen de la Venta</h3>
      <div class="summary-list">
        <div class="summary-row">
          <span>Vendedor</span>
          <strong id="summarySeller">${user.name || '-'}</strong>
        </div>

        <div class="summary-row">
          <span>Cliente</span>
          <strong id="summaryClient">${survey?.holderName || '-'}</strong>
        </div>

        <div class="summary-row">
          <span>Teléfono</span>
          <strong id="summaryPhone">${survey?.phone1 || '-'}</strong>
        </div>

        <div class="summary-row">
          <span>Domicilio</span>
          <strong id="summaryAddress">${survey?.monitoringAddress || '-'}</strong>
        </div>

        <div class="summary-row">
          <span>Equipo</span>
          <strong id="summaryEquipment">${survey?.equipment || '-'}</strong>
        </div>

        <div class="summary-row">
          <span>Promoción / Abono</span>
          <strong id="summaryBonus">${survey?.bonus || '-'}</strong>
        </div>

        <div class="summary-row">
          <span>Estado</span>
          <div id="summaryStatus">${statusBadge(survey?.status || 'pending')}</div>
        </div>
      </div>

      <div class="notice" style="margin-top:18px;">
        Verificá que todos los datos sean correctos antes de enviar la venta a central.
      </div>
    </div>
  `;
}

function renderSurveyForm(user, survey = null) {
  renderAppShell({
    user,
    active: 'newSale',
    title: survey ? 'Editar Venta a Central' : 'Nueva Venta a Central',
    subtitle: 'Completá los datos para enviar la venta.',
    content: `
      <div class="form-shell">
        <div class="form-main">
          <div class="section-card">
            <div class="section-title">Datos de la Venta</div>

            <div class="grid-2">
              <div class="field">
                <label>Vendedor (Quién cargó la venta)</label>
                <input class="input" value="${user.name}" disabled>
              </div>

              <div class="field">
                <label>Titular Nombre y Apellido</label>
                <input class="input" name="holderName" form="surveyForm" value="${survey?.holderName || ''}" required>
              </div>

              <div class="field">
                <label>CUIT/CUIL</label>
                <input class="input" name="cuil" form="surveyForm" value="${survey?.cuil || ''}" required>
              </div>

              <div class="field">
                <label>Fecha de Nacimiento</label>
                <input class="input" type="date" name="birthDate" form="surveyForm" value="${survey?.birthDate || ''}" required>
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label>Mail</label>
                <input class="input" type="email" name="email" form="surveyForm" value="${survey?.email || ''}" required>
              </div>

              <div class="field">
                <label>Teléfono Principal</label>
                <input class="input" name="phone1" form="surveyForm" value="${survey?.phone1 || ''}" required>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">Ubicación y Servicio</div>

            <div class="grid-3">
              <div class="field">
                <label>Domicilio</label>
                <input class="input" name="monitoringAddress" form="surveyForm" value="${survey?.monitoringAddress || ''}" required>
              </div>

              <div class="field">
                <label>Entre Calles</label>
                <input class="input" name="betweenStreets" form="surveyForm" value="${survey?.betweenStreets || ''}" required>
              </div>

              <div class="field">
                <label>Barrio</label>
                <input class="input" name="neighborhood" form="surveyForm" value="${survey?.neighborhood || ''}" required>
              </div>

              <div class="field">
                <label>Código Postal</label>
                <input class="input" name="postalCode" form="surveyForm" value="${survey?.postalCode || ''}" required>
              </div>

              <div class="field">
                <label>Ciudad</label>
                <input class="input" name="city" form="surveyForm" value="${survey?.city || ''}" required>
              </div>

              <div class="field">
                <label>Promoción / Abono</label>
                <select class="select" name="bonus" form="surveyForm" required>
                  <option value="">Seleccione...</option>
                  <option value="6 meses al 30%" ${survey?.bonus === '6 meses al 30%' ? 'selected' : ''}>6 meses al 30%</option>
                  <option value="3 meses al 30%" ${survey?.bonus === '3 meses al 30%' ? 'selected' : ''}>3 meses al 30%</option>
                </select>
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label>Equipo a Instalar</label>
                <select class="select" name="equipment" form="surveyForm" required>
                  <option value="">Seleccione...</option>
                  ${EQUIPMENT_OPTIONS.map(option => `
                    <option value="${option}" ${survey?.equipment === option ? 'selected' : ''}>${option}</option>
                  `).join('')}
                </select>
              </div>

              <div class="field">
                <label>Equipo Adicional</label>
                <input class="input" name="additionalEquipment" form="surveyForm" value="${survey?.additionalEquipment || ''}">
              </div>
            </div>

            <div class="field">
              <label>Observaciones</label>
              <textarea class="textarea" name="observations" form="surveyForm" placeholder="Aclaraciones para central o instalación">${survey?.observations || ''}</textarea>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">Contactos adicionales</div>

            <div class="grid-3">
              <div class="field">
                <label>Teléfono 2</label>
                <input class="input" name="phone2" form="surveyForm" value="${survey?.phone2 || ''}" required>
              </div>

              <div class="field">
                <label>Nombre y Apellido Contacto 2</label>
                <input class="input" name="contact2Name" form="surveyForm" value="${survey?.contact2Name || ''}" required>
              </div>

              <div class="field">
                <label>Parentesco 2</label>
                <input class="input" name="contact2Relationship" form="surveyForm" value="${survey?.contact2Relationship || ''}" required>
              </div>

              <div class="field">
                <label>Teléfono 3</label>
                <input class="input" name="phone3" form="surveyForm" value="${survey?.phone3 || ''}">
              </div>

              <div class="field">
                <label>Nombre y Apellido Contacto 3</label>
                <input class="input" name="contact3Name" form="surveyForm" value="${survey?.contact3Name || ''}">
              </div>

              <div class="field">
                <label>Parentesco 3</label>
                <input class="input" name="contact3Relationship" form="surveyForm" value="${survey?.contact3Relationship || ''}">
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">Documentación Obligatoria</div>

            <form id="surveyForm">
              <div class="grid-2">
                <div class="field">
                  <label>DNI Frente (Foto)</label>
                  <input class="input" type="file" id="dniFrontFile" accept="image/*,.pdf">
                  ${survey?.dniFrontName ? `<div class="muted" style="margin-top:8px;">Actual: ${survey.dniFrontName}</div>` : ''}
                </div>

                <div class="field">
                  <label>DNI Dorso (Foto)</label>
                  <input class="input" type="file" id="dniBackFile" accept="image/*,.pdf">
                  ${survey?.dniBackName ? `<div class="muted" style="margin-top:8px;">Actual: ${survey.dniBackName}</div>` : ''}
                </div>
              </div>

              <div class="btn-row" style="margin-top:16px;">
                <button class="btn btn-secondary" type="button" id="cancelSurveyBtn">Cancelar</button>
                <button class="btn btn-primary" type="submit">${survey ? 'Guardar cambios' : 'Guardar encuesta'}</button>
              </div>

              <div id="surveyMsg" style="margin-top:16px;"></div>
            </form>
          </div>
        </div>

        ${buildSaleSummary(survey, user)}
      </div>
    `
  });

  document.getElementById('cancelSurveyBtn').onclick = () => renderSellerSurveys(user);

  const form = document.getElementById('surveyForm');
  attachSaleSummarySync(form, user.name, survey?.status || 'pending');

  form.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData);

    const dniFrontFile = document.getElementById('dniFrontFile').files[0];
    const dniBackFile = document.getElementById('dniBackFile').files[0];

    body.sellerId = user.id;
    body.sellerName = user.name;

    if (dniFrontFile) {
      body.dniFrontName = dniFrontFile.name;
      body.dniFrontData = await fileToBase64(dniFrontFile);
    } else if (survey) {
      body.dniFrontName = survey.dniFrontName || '';
      body.dniFrontData = survey.dniFrontData || '';
    }

    if (dniBackFile) {
      body.dniBackName = dniBackFile.name;
      body.dniBackData = await fileToBase64(dniBackFile);
    } else if (survey) {
      body.dniBackName = survey.dniBackName || '';
      body.dniBackData = survey.dniBackData || '';
    }

    const url = survey ? `/api/surveys/${survey.id}` : '/api/surveys';
    const method = survey ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const response = await res.json();

    if (!res.ok) {
      document.getElementById('surveyMsg').innerHTML = `<p style="color:#dc2626;">${response.error}</p>`;
      return;
    }

    document.getElementById('surveyMsg').innerHTML = `<p style="color:#16a34a;">${response.message}</p>`;

    setTimeout(() => {
      renderSellerSurveys(user);
    }, 600);
  };
}

async function renderSellerSurveys(user) {
  const res = await fetch('/api/surveys');
  const data = await res.json();

  const mySurveys = data.surveys
    .filter(s => s.sellerId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = mySurveys.length;

  const pending = mySurveys.filter(
    s => s.status === 'pending'
  ).length;

  const confirmed = mySurveys.filter(
    s => s.status === 'confirmed'
  ).length;

  const paid = mySurveys.filter(
    s => s.status === 'paid'
  ).length;

  const rejected = mySurveys.filter(
    s => s.status === 'rejected'
  ).length;

  renderAppShell({
    user,
    active: 'mySales',
    title: 'Mis Ventas',
    subtitle: 'Consultá todas las ventas que registraste',

    extraActions: `
      <button
        class="btn btn-primary"
        id="newSaleTopBtn"
      >
        Nueva Venta
      </button>
    `,

    content: `
      <div class="stats-grid seller-stats-grid">
        <div class="stat-card mini-stat-card active-stat">
          <h3>Todas</h3>
          <p class="stat-number">${total}</p>
        </div>

        <div class="stat-card mini-stat-card">
          <h3>Pendientes</h3>
          <p class="stat-number">${pending}</p>
        </div>

        <div class="stat-card mini-stat-card">
          <h3>Aprobadas</h3>
          <p class="stat-number">${confirmed}</p>
        </div>

        <div class="stat-card mini-stat-card">
          <h3>Aprobado Abonado</h3>
          <p class="stat-number">${paid}</p>
        </div>

        <div class="stat-card mini-stat-card">
          <h3>Rechazadas</h3>
          <p class="stat-number">${rejected}</p>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="tabs">
            <button
              class="tab active"
              data-filter="all"
            >
              Todas
            </button>

            <button
              class="tab"
              data-filter="pending"
            >
              Pendientes
            </button>

            <button
              class="tab"
              data-filter="confirmed"
            >
              Aprobadas
            </button>

            <button
              class="tab"
              data-filter="paid"
            >
              Aprobado Abonado
            </button>

            <button
              class="tab"
              data-filter="rejected"
            >
              Rechazadas
            </button>
          </div>

          <div class="toolbar-right">
            <input
              class="input search"
              id="salesSearchInput"
              placeholder="Buscar por cliente, CUIL o ciudad..."
            >

            <button
              class="btn btn-secondary"
              id="refreshSalesBtn"
            >
              Actualizar
            </button>
          </div>
        </div>

        <div class="table-wrap desktop-sales-table">
          <table class="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Última actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody id="sellerSalesTableBody">
              ${buildSellerSalesRowsPro(mySurveys)}
            </tbody>
          </table>
        </div>

        <div
          class="mobile-sales-list"
          id="sellerSalesCards"
        >
          ${buildSellerSalesCards(mySurveys)}
        </div>
      </div>
    `
  });

  document.getElementById('newSaleTopBtn').onclick = () => {
    renderSurveyForm(user);
  };

  document.getElementById('refreshSalesBtn').onclick = () => {
    renderSellerSurveys(user);
  };

  let currentFilter = 'all';
  let currentSearch = '';

  function applyFilters() {
    let filtered = [...mySurveys];

    if (currentFilter !== 'all') {
      filtered = filtered.filter(
        s => s.status === currentFilter
      );
    }

    if (currentSearch) {
      const q = currentSearch.toLowerCase();

      filtered = filtered.filter(s =>
        String(s.holderName || '').toLowerCase().includes(q) ||
        String(s.cuil || '').toLowerCase().includes(q) ||
        String(s.city || '').toLowerCase().includes(q) ||
        String(s.equipment || '').toLowerCase().includes(q)
      );
    }

    document.getElementById('sellerSalesTableBody').innerHTML =
      buildSellerSalesRowsPro(filtered);

    document.getElementById('sellerSalesCards').innerHTML =
      buildSellerSalesCards(filtered);
  }

  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-filter]').forEach(button => {
        button.classList.remove('active');
      });

      btn.classList.add('active');

      currentFilter = btn.dataset.filter;

      applyFilters();
    };
  });

  document.getElementById('salesSearchInput').oninput = (e) => {
    currentSearch = e.target.value.trim();
    applyFilters();
  };
}

function renderProfile(user) {
  fetch(`/api/stats?userId=${user.id}&role=${user.role}`)
    .then(res => res.json())
    .then(({ stats }) => {
      renderAppShell({
        user,
        active: 'profile',
        title: 'Mi Perfil',
        subtitle: 'Gestioná tu información personal.',

        content: `
          <div class="profile-grid">
            <div class="card">
              <div class="card-header">
                <h2>Información Personal</h2>
              </div>

              <div
                style="
                  display:flex;
                  gap:18px;
                  align-items:flex-start;
                  margin-bottom:18px;
                "
              >
                <div
                  class="avatar"
                  style="
                    width:64px;
                    height:64px;
                    font-size:22px;
                  "
                >
                  ${getInitials(user.name)}
                </div>

                <div>
                  <div style="font-size:22px; font-weight:800;">
                    ${user.name}
                  </div>

                  <div class="muted">
                    ${roleLabel(user.role)}
                  </div>
                </div>
              </div>

              <div class="info-list">
                <div class="info-row">
                  <div>Usuario</div>
                  <div>${user.username}</div>
                </div>

                <div class="info-row">
                  <div>Rol</div>
                  <div>${roleLabel(user.role)}</div>
                </div>

                <div class="info-row">
                  <div>Tema actual</div>
                  <div>
                    ${user.theme === 'dark' ? 'Oscuro' : 'Claro'}
                  </div>
                </div>

                <div class="info-row">
                  <div>Estado</div>

                  <div>
                    <span class="badge badge-confirmed">
                      Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2>Actividad reciente</h2>
              </div>

              <div class="info-list">
                <div class="info-row">
                  <div>Total de ventas</div>
                  <div>${stats.total}</div>
                </div>

                <div class="info-row">
                  <div>Ventas aprobadas</div>
                  <div>${stats.confirmed}</div>
                </div>

                <div class="info-row">
                  <div>Aprobado Abonado</div>
                  <div>${stats.paid || 0}</div>
                </div>

                <div class="info-row">
                  <div>Ventas pendientes</div>
                  <div>${stats.pending}</div>
                </div>

                <div class="info-row">
                  <div>Ventas rechazadas</div>
                  <div>${stats.rejected}</div>
                </div>
              </div>

              <div class="btn-row" style="margin-top:16px;">
                <button
                  class="btn btn-primary"
                  id="goProfileSettingsBtn"
                >
                  Editar información
                </button>
              </div>
            </div>
          </div>
        `
      });

      document.getElementById('goProfileSettingsBtn').onclick = () => {
        renderSettings(user);
      };
    })
    .catch(error => {
      console.error('Error cargando el perfil:', error);
      alert('No se pudo cargar la información del perfil');
    });
}

async function fetchPotentialClientsForUser(user) {
  const params = new URLSearchParams({
    userId: String(user.id),
    role: user.role
  });

  const res = await fetch(
    `/api/potential-clients?${params.toString()}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error || 'No se pudieron cargar los clientes potenciales'
    );
  }

  return Array.isArray(data.potentialClients)
    ? data.potentialClients
    : [];
}

function buildPotentialClientRows(clients, user) {
  const isAdmin = user.role === 'admin';
  const columnCount = isAdmin ? 7 : 6;

  if (!clients.length) {
    return `
      <tr>
        <td colspan="${columnCount}">
          <div class="empty">
            No hay clientes potenciales para mostrar.
          </div>
        </td>
      </tr>
    `;
  }

  return clients.map(client => `
    <tr>
      <td>
        <div style="font-weight:700;">
          ${escapePotentialClientHtml(
            client.fullNameOrBusinessName || '-'
          )}
        </div>

        <div class="muted">
          ${escapePotentialClientHtml(client.email || '-')}
        </div>
      </td>

      ${
        isAdmin
          ? `
            <td>
              <div style="font-weight:700;">
                ${escapePotentialClientHtml(
                  client.sellerName || '-'
                )}
              </div>

              <div class="muted">
                ID: ${escapePotentialClientHtml(
                  client.sellerId || '-'
                )}
              </div>
            </td>
          `
          : ''
      }

      <td>
        <div>
          ${escapePotentialClientHtml(client.phone || '-')}
        </div>

        <div class="muted">
          ${escapePotentialClientHtml(client.address || '-')}
        </div>
      </td>

      <td>
        ${escapePotentialClientHtml(client.city || '-')}
      </td>

      <td>
        ${interestLevelBadge(client.interestLevel)}
      </td>

      <td>
        ${formatDateTime(
          client.updatedAt || client.createdAt
        )}
      </td>

      <td>
        <div class="btn-row">
          <button
            class="btn btn-outline"
            onclick="viewPotentialClient(${client.id})"
          >
            Ver
          </button>

          <button
            class="btn btn-secondary"
            onclick="editPotentialClient(${client.id})"
          >
            Editar
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function buildPotentialClientCards(clients, user) {
  const isAdmin = user.role === 'admin';

  if (!clients.length) {
    return `
      <div class="empty">
        No hay clientes potenciales para mostrar.
      </div>
    `;
  }

  return clients.map(client => `
    <div class="sale-card-mobile potential-client-mobile-card">
      <div class="sale-card-mobile-header">
        <div>
          <div class="sale-card-mobile-title">
            ${escapePotentialClientHtml(
              client.fullNameOrBusinessName || '-'
            )}
          </div>

          <div class="sale-card-mobile-sub">
            ${escapePotentialClientHtml(client.phone || '-')}
          </div>
        </div>

        <div>
          ${interestLevelBadge(client.interestLevel)}
        </div>
      </div>

      <div class="sale-card-mobile-grid">
        ${
          isAdmin
            ? `
              <div>
                <span>Vendedor</span>
                <strong>
                  ${escapePotentialClientHtml(
                    client.sellerName || '-'
                  )}
                </strong>
              </div>
            `
            : ''
        }

        <div>
          <span>Mail</span>
          <strong>
            ${escapePotentialClientHtml(client.email || '-')}
          </strong>
        </div>

        <div>
          <span>Localidad</span>
          <strong>
            ${escapePotentialClientHtml(client.city || '-')}
          </strong>
        </div>

        <div>
          <span>Último avance</span>
          <strong>
            ${formatDate(
              client.updatedAt || client.createdAt
            )}
          </strong>
        </div>
      </div>

      <div class="sale-card-mobile-actions">
        <button
          class="btn btn-outline"
          onclick="viewPotentialClient(${client.id})"
        >
          Ver
        </button>

        <button
          class="btn btn-secondary"
          onclick="editPotentialClient(${client.id})"
        >
          Editar
        </button>
      </div>
    </div>
  `).join('');
}

async function renderPotentialClients(user) {
  try {
    const potentialClients =
      await fetchPotentialClientsForUser(user);

    let sellers = [];

    if (user.role === 'admin') {
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();

      sellers = usersRes.ok
        ? usersData.users.filter(
            candidate => candidate.role === 'seller'
          )
        : [];
    }

    let currentInterest = 'all';
    let currentSeller = '';
    let currentSearch = '';

    function getFilteredClients() {
      let filtered = [...potentialClients];

      if (currentInterest !== 'all') {
        filtered = filtered.filter(
          client =>
            client.interestLevel === currentInterest
        );
      }

      if (currentSeller) {
        filtered = filtered.filter(
          client =>
            String(client.sellerId) === currentSeller
        );
      }

      if (currentSearch) {
        const query = currentSearch.toLowerCase();

        filtered = filtered.filter(client =>
          String(
            client.fullNameOrBusinessName || ''
          ).toLowerCase().includes(query) ||

          String(
            client.email || ''
          ).toLowerCase().includes(query) ||

          String(
            client.phone || ''
          ).toLowerCase().includes(query) ||

          String(
            client.address || ''
          ).toLowerCase().includes(query) ||

          String(
            client.city || ''
          ).toLowerCase().includes(query) ||

          String(
            client.sellerName || ''
          ).toLowerCase().includes(query)
        );
      }

      return filtered.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
    }

    function renderScreen() {
      const filtered = getFilteredClients();

      const greenCount = filtered.filter(
        client => client.interestLevel === 'green'
      ).length;

      const yellowCount = filtered.filter(
        client => client.interestLevel === 'yellow'
      ).length;

      const redCount = filtered.filter(
        client => client.interestLevel === 'red'
      ).length;

      renderAppShell({
        user,
        active: 'potentialClients',
        title: 'Clientes Potenciales',

        subtitle: user.role === 'admin'
          ? 'Consultá y gestioná los posibles clientes registrados por el equipo.'
          : 'Registrá posibles clientes y realizá el seguimiento comercial.',

        extraActions: `
  <button
    class="btn btn-secondary"
    id="backPotentialDashboardBtn"
  >
    Panel de control
  </button>

  ${
    user.role === 'seller'
      ? `
        <button
          class="btn btn-primary"
          id="newPotentialClientBtn"
        >
          + Nuevo cliente potencial
        </button>
      `
      : ''
  }
`,

        content: `
          <div class="stats-grid potential-stats-grid">
            <div class="stat-card mini-stat-card">
              <h3>Total</h3>
              <p class="stat-number">${filtered.length}</p>
              <div class="stat-meta">
                Registros visibles
              </div>
            </div>

            <div class="stat-card mini-stat-card">
              <h3>Interés alto</h3>
              <p class="stat-number">${greenCount}</p>
              <div class="stat-meta">
                Nivel verde
              </div>
            </div>

            <div class="stat-card mini-stat-card">
              <h3>Interés medio</h3>
              <p class="stat-number">${yellowCount}</p>
              <div class="stat-meta">
                Nivel amarillo
              </div>
            </div>

            <div class="stat-card mini-stat-card">
              <h3>Interés bajo</h3>
              <p class="stat-number">${redCount}</p>
              <div class="stat-meta">
                Nivel rojo
              </div>
            </div>
          </div>

          <div class="card">
            <div class="toolbar">
              <div class="tabs">
                <button
                  class="tab ${
                    currentInterest === 'all'
                      ? 'active'
                      : ''
                  }"
                  data-potential-interest="all"
                >
                  Todos
                </button>

                <button
                  class="tab ${
                    currentInterest === 'green'
                      ? 'active'
                      : ''
                  }"
                  data-potential-interest="green"
                >
                  Verdes
                </button>

                <button
                  class="tab ${
                    currentInterest === 'yellow'
                      ? 'active'
                      : ''
                  }"
                  data-potential-interest="yellow"
                >
                  Amarillos
                </button>

                <button
                  class="tab ${
                    currentInterest === 'red'
                      ? 'active'
                      : ''
                  }"
                  data-potential-interest="red"
                >
                  Rojos
                </button>
              </div>

              <div class="toolbar-right">
                ${
                  user.role === 'admin'
                    ? `
                      <select
                        class="select"
                        id="potentialSellerFilter"
                      >
                        <option value="">
                          Todos los vendedores
                        </option>

                        ${sellers.map(seller => `
                          <option
                            value="${seller.id}"
                            ${
                              currentSeller === String(seller.id)
                                ? 'selected'
                                : ''
                            }
                          >
                            ${escapePotentialClientHtml(
                              seller.name
                            )}
                          </option>
                        `).join('')}
                      </select>
                    `
                    : ''
                }

                <input
                  class="input search"
                  id="potentialClientSearch"
                  placeholder="Buscar por nombre, mail, celular o localidad..."
                  value="${escapePotentialClientHtml(
                    currentSearch
                  )}"
                >

                <button
                  class="btn btn-secondary"
                  id="resetPotentialFiltersBtn"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div class="table-wrap desktop-sales-table">
              <table class="table">
                <thead>
                  <tr>
                    <th>
                      Persona / Razón Social
                    </th>

                    ${
                      user.role === 'admin'
                        ? '<th>Vendedor</th>'
                        : ''
                    }

                    <th>Contacto / Dirección</th>
                    <th>Localidad</th>
                    <th>Nivel de interés</th>
                    <th>Última actualización</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody id="potentialClientsTableBody">
                  ${buildPotentialClientRows(
                    filtered,
                    user
                  )}
                </tbody>
              </table>
            </div>

            <div
              class="mobile-sales-list"
              id="potentialClientsCards"
            >
              ${buildPotentialClientCards(
                filtered,
                user
              )}
            </div>
          </div>
        `
      });

      const dashboardButton = document.getElementById(
  'backPotentialDashboardBtn'
);

if (dashboardButton) {
  dashboardButton.onclick = () => {
    renderDashboard(user);
  };
}

      const newButton = document.getElementById(
        'newPotentialClientBtn'
      );

      if (newButton) {
        newButton.onclick = () => {
          openPotentialClientForm(user);
        };
      }

      document.querySelectorAll(
        '[data-potential-interest]'
      ).forEach(button => {
        button.onclick = () => {
          currentInterest =
            button.dataset.potentialInterest;

          renderScreen();
        };
      });

      const sellerFilter = document.getElementById(
        'potentialSellerFilter'
      );

      if (sellerFilter) {
        sellerFilter.onchange = event => {
          currentSeller = event.target.value;
          renderScreen();
        };
      }

      document.getElementById(
        'potentialClientSearch'
      ).oninput = event => {
        currentSearch = event.target.value.trim();

        const filteredNow = getFilteredClients();

        document.getElementById(
          'potentialClientsTableBody'
        ).innerHTML = buildPotentialClientRows(
          filteredNow,
          user
        );

        document.getElementById(
          'potentialClientsCards'
        ).innerHTML = buildPotentialClientCards(
          filteredNow,
          user
        );
      };

      document.getElementById(
        'resetPotentialFiltersBtn'
      ).onclick = () => {
        currentInterest = 'all';
        currentSeller = '';
        currentSearch = '';
        renderScreen();
      };
    }

    renderScreen();
  } catch (error) {
    console.error(
      'Error cargando clientes potenciales:',
      error
    );

    alert(
      'No se pudieron cargar los clientes potenciales'
    );
  }
}

function closePotentialClientModal() {
  const overlay = document.getElementById(
    'potentialClientModalOverlay'
  );

  if (overlay) {
    overlay.remove();
  }
}

function openPotentialClientForm(user, client = null) {
  closePotentialClientModal();

  const isEditing = Boolean(client);

  const overlay = document.createElement('div');

  overlay.id = 'potentialClientModalOverlay';
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-card potential-client-modal">
      <div class="modal-header">
        <div>
          <h3>
            ${
              isEditing
                ? 'Editar cliente potencial'
                : 'Nuevo cliente potencial'
            }
          </h3>

          <p>
            Completá la información comercial del posible cliente.
          </p>
        </div>

        <button
          class="modal-close-btn"
          id="closePotentialClientModalBtn"
          type="button"
        >
          ✕
        </button>
      </div>

      ${
        user.role === 'admin' && client
          ? `
            <div class="potential-client-owner">
              Registrado por:
              <strong>
                ${escapePotentialClientHtml(
                  client.sellerName || '-'
                )}
              </strong>
            </div>
          `
          : ''
      }

      <form id="potentialClientForm">
        <div class="potential-form-grid">
          <div class="field potential-field-wide">
            <label>
              Apellido y Nombre / Razón Social
            </label>

            <input
              class="input"
              name="fullNameOrBusinessName"
              required
              value="${escapePotentialClientHtml(
                client?.fullNameOrBusinessName || ''
              )}"
              placeholder="Ej: Juan Pérez o Comercio Central"
            >
          </div>

          <div class="field">
            <label>Mail</label>

            <input
              class="input"
              name="email"
              type="email"
              required
              value="${escapePotentialClientHtml(
                client?.email || ''
              )}"
              placeholder="correo@ejemplo.com"
            >
          </div>

          <div class="field">
            <label>Celular</label>

            <input
              class="input"
              name="phone"
              required
              value="${escapePotentialClientHtml(
                client?.phone || ''
              )}"
              placeholder="Ej: 351 1234567"
            >
          </div>

          <div class="field">
            <label>Dirección</label>

            <input
              class="input"
              name="address"
              required
              value="${escapePotentialClientHtml(
                client?.address || ''
              )}"
              placeholder="Calle y número"
            >
          </div>

          <div class="field">
            <label>Localidad</label>

            <input
              class="input"
              name="city"
              required
              value="${escapePotentialClientHtml(
                client?.city || ''
              )}"
              placeholder="Localidad"
            >
          </div>

          <div class="field potential-field-wide">
            <label>Nivel de Interés</label>

            <select
              class="select potential-interest-select"
              name="interestLevel"
              required
            >
              <option
                value="green"
                ${
                  !client ||
                  client.interestLevel === 'green'
                    ? 'selected'
                    : ''
                }
              >
                1. Verde — Interés alto
              </option>

              <option
                value="yellow"
                ${
                  client?.interestLevel === 'yellow'
                    ? 'selected'
                    : ''
                }
              >
                2. Amarillo — Interés medio
              </option>

              <option
                value="red"
                ${
                  client?.interestLevel === 'red'
                    ? 'selected'
                    : ''
                }
              >
                3. Rojo — Interés bajo
              </option>
            </select>
          </div>

          <div class="field potential-field-wide">
            <label>Observaciones</label>

            <textarea
              class="textarea"
              name="observations"
              placeholder="Información general del posible cliente..."
            >${escapePotentialClientHtml(
              client?.observations || ''
            )}</textarea>
          </div>
        </div>

        <div id="potentialClientFormMsg"></div>

        <div class="modal-actions">
          <button
            class="btn btn-secondary"
            type="button"
            id="cancelPotentialClientBtn"
          >
            Cancelar
          </button>

          <button
            class="btn btn-primary"
            type="submit"
            id="savePotentialClientBtn"
          >
            ${
              isEditing
                ? 'Guardar cambios'
                : 'Crear cliente potencial'
            }
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById(
    'closePotentialClientModalBtn'
  ).onclick = closePotentialClientModal;

  document.getElementById(
    'cancelPotentialClientBtn'
  ).onclick = closePotentialClientModal;

  overlay.onclick = event => {
    if (event.target === overlay) {
      closePotentialClientModal();
    }
  };

  document.getElementById(
    'potentialClientForm'
  ).onsubmit = async event => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const body = Object.fromEntries(formData);

    if (!isEditing) {
      body.sellerId = user.id;
      body.sellerName = user.name;
    }

    const saveButton = document.getElementById(
      'savePotentialClientBtn'
    );

    const messageBox = document.getElementById(
      'potentialClientFormMsg'
    );

    saveButton.disabled = true;
    saveButton.textContent = 'Guardando...';

    try {
      const res = await fetch(
        isEditing
          ? `/api/potential-clients/${client.id}`
          : '/api/potential-clients',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        messageBox.innerHTML = `
          <p style="color:#dc2626;">
            ${escapePotentialClientHtml(
              data.error || 'No se pudo guardar'
            )}
          </p>
        `;

        saveButton.disabled = false;
        saveButton.textContent = isEditing
          ? 'Guardar cambios'
          : 'Crear cliente potencial';

        return;
      }

      messageBox.innerHTML = `
        <p style="color:#16a34a;">
          ${escapePotentialClientHtml(data.message)}
        </p>
      `;

      setTimeout(() => {
        closePotentialClientModal();
        renderPotentialClients(user);
      }, 400);
    } catch (error) {
      console.error(
        'Error guardando cliente potencial:',
        error
      );

      messageBox.innerHTML = `
        <p style="color:#dc2626;">
          No se pudo guardar el cliente potencial
        </p>
      `;

      saveButton.disabled = false;
      saveButton.textContent = isEditing
        ? 'Guardar cambios'
        : 'Crear cliente potencial';
    }
  };
}

function closePotentialFollowUpModal() {
  const overlay = document.getElementById(
    'potentialFollowUpModalOverlay'
  );

  if (overlay) {
    overlay.remove();
  }
}

function openPotentialFollowUpModal(user, client) {
  closePotentialFollowUpModal();

  const overlay = document.createElement('div');

  overlay.id = 'potentialFollowUpModalOverlay';
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>+ Agregar avance</h3>

          <p>
            ${escapePotentialClientHtml(
              client.fullNameOrBusinessName || ''
            )}
          </p>
        </div>

        <button
          class="modal-close-btn"
          id="closePotentialFollowUpBtn"
          type="button"
        >
          ✕
        </button>
      </div>

      <form id="potentialFollowUpForm">
        <div class="field">
          <label>Avance del seguimiento</label>

          <textarea
            class="textarea"
            name="text"
            required
            placeholder="Ej: Se realizó una visita y solicitó una nueva propuesta..."
          ></textarea>
        </div>

        <div id="potentialFollowUpMsg"></div>

        <div class="modal-actions">
          <button
            class="btn btn-secondary"
            type="button"
            id="cancelPotentialFollowUpBtn"
          >
            Cancelar
          </button>

          <button
            class="btn btn-primary"
            type="submit"
            id="savePotentialFollowUpBtn"
          >
            Agregar avance
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById(
    'closePotentialFollowUpBtn'
  ).onclick = closePotentialFollowUpModal;

  document.getElementById(
    'cancelPotentialFollowUpBtn'
  ).onclick = closePotentialFollowUpModal;

  overlay.onclick = event => {
    if (event.target === overlay) {
      closePotentialFollowUpModal();
    }
  };

  document.getElementById(
    'potentialFollowUpForm'
  ).onsubmit = async event => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const body = Object.fromEntries(formData);

    body.authorId = user.id;
    body.authorName = user.name;
    body.authorRole = user.role;

    const saveButton = document.getElementById(
      'savePotentialFollowUpBtn'
    );

    const messageBox = document.getElementById(
      'potentialFollowUpMsg'
    );

    saveButton.disabled = true;
    saveButton.textContent = 'Guardando...';

    try {
      const res = await fetch(
        `/api/potential-clients/${client.id}/follow-ups`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        messageBox.innerHTML = `
          <p style="color:#dc2626;">
            ${escapePotentialClientHtml(
              data.error || 'No se pudo agregar el avance'
            )}
          </p>
        `;

        saveButton.disabled = false;
        saveButton.textContent = 'Agregar avance';
        return;
      }

      closePotentialFollowUpModal();
      viewPotentialClient(client.id);
    } catch (error) {
      console.error(
        'Error agregando avance:',
        error
      );

      messageBox.innerHTML = `
        <p style="color:#dc2626;">
          No se pudo agregar el avance
        </p>
      `;

      saveButton.disabled = false;
      saveButton.textContent = 'Agregar avance';
    }
  };
}

window.editPotentialClient = async function(id) {
  const user = getSession();

  if (!user) {
    renderHome();
    return;
  }

  try {
    const clients =
      await fetchPotentialClientsForUser(user);

    const client = clients.find(
      item => Number(item.id) === Number(id)
    );

    if (!client) {
      alert('Cliente potencial no encontrado');
      return;
    }

    openPotentialClientForm(user, client);
  } catch (error) {
    console.error(
      'Error buscando cliente potencial:',
      error
    );

    alert('No se pudo cargar el cliente potencial');
  }
};

window.viewPotentialClient = async function(id) {
  const user = getSession();

  if (!user) {
    renderHome();
    return;
  }

  try {
    const clients =
      await fetchPotentialClientsForUser(user);

    const client = clients.find(
      item => Number(item.id) === Number(id)
    );

    if (!client) {
      alert('Cliente potencial no encontrado');
      return;
    }

    const followUps = Array.isArray(client.followUps)
      ? [...client.followUps].sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )
      : [];

    renderAppShell({
      user,
      active: 'potentialClients',
      title: 'Detalle del Cliente Potencial',

      subtitle:
        client.fullNameOrBusinessName ||
        'Seguimiento comercial',

      extraActions: `
        <button
          class="btn btn-secondary"
          id="backPotentialClientsBtn"
        >
          Volver
        </button>

        <button
          class="btn btn-outline"
          id="editPotentialClientBtn"
        >
          Editar
        </button>

        <button
          class="btn btn-primary"
          id="addPotentialFollowUpBtn"
        >
          + Agregar avance
        </button>
      `,

      content: `
        <div class="profile-grid potential-detail-grid">
          <div class="card">
            <div class="card-header">
              <div>
                <h2>
                  ${escapePotentialClientHtml(
                    client.fullNameOrBusinessName || '-'
                  )}
                </h2>

                <div style="margin-top:8px;">
                  ${interestLevelBadge(
                    client.interestLevel
                  )}
                </div>
              </div>
            </div>

            <div class="info-list">
              ${
                user.role === 'admin'
                  ? `
                    <div class="info-row">
                      <div>Vendedor</div>
                      <div>
                        ${escapePotentialClientHtml(
                          client.sellerName || '-'
                        )}
                      </div>
                    </div>
                  `
                  : ''
              }

              <div class="info-row">
                <div>Mail</div>
                <div>
                  ${escapePotentialClientHtml(
                    client.email || '-'
                  )}
                </div>
              </div>

              <div class="info-row">
                <div>Celular</div>
                <div>
                  ${escapePotentialClientHtml(
                    client.phone || '-'
                  )}
                </div>
              </div>

              <div class="info-row">
                <div>Dirección</div>
                <div>
                  ${escapePotentialClientHtml(
                    client.address || '-'
                  )}
                </div>
              </div>

              <div class="info-row">
                <div>Localidad</div>
                <div>
                  ${escapePotentialClientHtml(
                    client.city || '-'
                  )}
                </div>
              </div>

              <div class="info-row">
                <div>Nivel de interés</div>
                <div>
                  ${interestLevelText(
                    client.interestLevel
                  )}
                </div>
              </div>

              <div class="info-row">
                <div>Fecha de carga</div>
                <div>
                  ${formatDateTime(client.createdAt)}
                </div>
              </div>

              <div class="info-row">
                <div>Última actualización</div>
                <div>
                  ${formatDateTime(
                    client.updatedAt ||
                    client.createdAt
                  )}
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2>Observaciones</h2>
            </div>

            <div class="potential-observations">
              ${
                client.observations
                  ? escapePotentialClientHtml(
                      client.observations
                    ).replace(/\n/g, '<br>')
                  : '<span class="muted">Sin observaciones.</span>'
              }
            </div>
          </div>
        </div>

        <div class="card potential-follow-up-card">
          <div class="card-header">
            <div>
              <h2>Avances del seguimiento</h2>

              <p class="muted">
                Historial de contactos y novedades comerciales.
              </p>
            </div>

            <button
              class="btn btn-primary"
              id="addPotentialFollowUpBtnInside"
            >
              + Agregar avance
            </button>
          </div>

          <div class="potential-follow-up-list">
            ${
              followUps.length
                ? followUps.map(followUp => `
                  <div class="potential-follow-up-item">
                    <div class="potential-follow-up-marker"></div>

                    <div class="potential-follow-up-content">
                      <div class="potential-follow-up-header">
                        <strong>
                          ${escapePotentialClientHtml(
                            followUp.authorName ||
                            'Usuario'
                          )}
                        </strong>

                        <span class="muted">
                          ${roleLabel(
                            followUp.authorRole
                          )}
                          ·
                          ${formatDateTime(
                            followUp.createdAt
                          )}
                        </span>
                      </div>

                      <div class="potential-follow-up-text">
                        ${escapePotentialClientHtml(
                          followUp.text || ''
                        ).replace(/\n/g, '<br>')}
                      </div>
                    </div>
                  </div>
                `).join('')
                : `
                  <div class="empty">
                    Todavía no se agregaron avances.
                  </div>
                `
            }
          </div>
        </div>
      `
    });

    document.getElementById(
      'backPotentialClientsBtn'
    ).onclick = () => {
      renderPotentialClients(user);
    };

    document.getElementById(
      'editPotentialClientBtn'
    ).onclick = () => {
      openPotentialClientForm(user, client);
    };

    document.getElementById(
      'addPotentialFollowUpBtn'
    ).onclick = () => {
      openPotentialFollowUpModal(user, client);
    };

    document.getElementById(
      'addPotentialFollowUpBtnInside'
    ).onclick = () => {
      openPotentialFollowUpModal(user, client);
    };
  } catch (error) {
    console.error(
      'Error cargando detalle de cliente potencial:',
      error
    );

    alert(
      'No se pudo cargar el cliente potencial'
    );
  }
};

function renderSettings(user) {
  renderAppShell({
    user,
    active: 'settings',
    title: 'Configuración',
    subtitle: 'Personalizá tu experiencia en la plataforma.',
    content: `
      <div class="profile-grid">
        <div class="section-card">
          <div class="section-title">Información de la Cuenta</div>

          <form id="profileForm">
            <div class="field">
              <label>Nombre completo</label>
              <input class="input" name="name" value="${user.name}" required>
            </div>

            <div class="field">
              <label>Usuario</label>
              <input class="input" value="${user.username}" disabled>
            </div>

            <div class="field">
              <label>Rol</label>
              <input class="input" value="${roleLabel(user.role)}" disabled>
            </div>

            <div class="field">
              <label>Tema</label>
              <select class="select" name="theme">
                <option value="light" ${user.theme === 'light' ? 'selected' : ''}>Claro</option>
                <option value="dark" ${user.theme === 'dark' ? 'selected' : ''}>Oscuro</option>
              </select>
            </div>

            <button class="btn btn-primary" type="submit">Guardar Cambios</button>
            <div id="profileMsg" style="margin-top:14px;"></div>
          </form>
        </div>

        <div class="section-card">
          <div class="section-title">Seguridad</div>

          <form id="passwordForm">
            <div class="field">
              <label>Contraseña actual</label>
              <input class="input" name="currentPassword" type="password" required>
            </div>

            <div class="field">
              <label>Nueva contraseña</label>
              <input class="input" name="newPassword" type="password" required>
            </div>

            <button class="btn btn-primary" type="submit">Actualizar Contraseña</button>
            <div id="passwordMsg" style="margin-top:14px;"></div>
          </form>

          <div class="notice" style="margin-top:18px;">
            Mantené tus credenciales seguras. Si olvidás la contraseña, usá la recuperación desde la pantalla inicial.
          </div>
        </div>
      </div>
    `
  });

  document.getElementById('profileForm').onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const body = Object.fromEntries(form);
    body.userId = user.id;

    const res = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const response = await res.json();

    if (!res.ok) {
      document.getElementById('profileMsg').innerHTML = `<p style="color:#dc2626;">${response.error}</p>`;
      return;
    }

    saveSession(response.user);
    applyTheme(response.user.theme);
    document.getElementById('profileMsg').innerHTML = `<p style="color:#16a34a;">${response.message}</p>`;
  };

  document.getElementById('passwordForm').onsubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const body = Object.fromEntries(form);
    body.userId = user.id;

    const res = await fetch('/api/settings/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const response = await res.json();

    if (!res.ok) {
      document.getElementById('passwordMsg').innerHTML = `<p style="color:#dc2626;">${response.error}</p>`;
      return;
    }

    document.getElementById('passwordMsg').innerHTML = `<p style="color:#16a34a;">${response.message}</p>`;
    e.target.reset();
  };
}

function closeStatusModal() {
  const modal = document.getElementById('statusModalOverlay');
  if (modal) modal.remove();
}

function openStatusModal({
  currentStatus = 'pending',
  currentNotes = '',
  onSave
}) {
  closeStatusModal();

  const overlay = document.createElement('div');

  overlay.id = 'statusModalOverlay';
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>Cambiar estado de la venta</h3>
          <p>
            Actualizá el estado y agregá una observación si hace falta.
          </p>
        </div>

        <button
          class="modal-close-btn"
          id="closeStatusModalBtn"
        >
          ✕
        </button>
      </div>

      <div class="field">
        <label>Estado</label>

        <select
          class="select"
          id="statusSelect"
        >
          <option
            value="pending"
            ${currentStatus === 'pending' ? 'selected' : ''}
          >
            Pendiente
          </option>

          <option
            value="confirmed"
            ${currentStatus === 'confirmed' ? 'selected' : ''}
          >
            Aprobada
          </option>

          <option
            value="paid"
            ${currentStatus === 'paid' ? 'selected' : ''}
          >
            Aprobado Abonado
          </option>

          <option
            value="rejected"
            ${currentStatus === 'rejected' ? 'selected' : ''}
          >
            Rechazada
          </option>
        </select>
      </div>

      <div class="field">
        <label>Observaciones de jefatura</label>

        <textarea
          class="textarea"
          id="statusNotes"
          placeholder="Escribí una observación opcional..."
        >${currentNotes}</textarea>
      </div>

      <div class="modal-actions">
        <button
          class="btn btn-secondary"
          id="cancelStatusModalBtn"
        >
          Cancelar
        </button>

        <button
          class="btn btn-primary"
          id="saveStatusModalBtn"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('closeStatusModalBtn').onclick =
    closeStatusModal;

  document.getElementById('cancelStatusModalBtn').onclick =
    closeStatusModal;

  overlay.onclick = (event) => {
    if (event.target === overlay) {
      closeStatusModal();
    }
  };

  document.getElementById('saveStatusModalBtn').onclick = async () => {
    const saveButton =
      document.getElementById('saveStatusModalBtn');

    const status =
      document.getElementById('statusSelect').value;

    const notes =
      document.getElementById('statusNotes').value.trim();

    saveButton.disabled = true;
    saveButton.textContent = 'Guardando...';

    try {
      await onSave({ status, notes });
    } catch (error) {
      console.error('Error guardando el estado:', error);

      saveButton.disabled = false;
      saveButton.textContent = 'Guardar cambios';

      alert('No se pudo guardar el nuevo estado');
    }
  };
}

function closeImageModal() {
  const modal = document.getElementById('imageModalOverlay');
  if (modal) modal.remove();
}

function openImageModal(data) {
  closeImageModal();

  const overlay = document.createElement('div');
  overlay.id = 'imageModalOverlay';
  overlay.className = 'modal-overlay image-modal-overlay';

  overlay.innerHTML = `
    <div class="modal-card image-modal-card">
      <div class="modal-header">
        <div>
          <h3>Documento DNI</h3>
          <p>Visualización del archivo cargado</p>
        </div>
        <button class="modal-close-btn" id="closeImageModalBtn">✕</button>
      </div>

      <div class="image-modal-body">
        ${
          data.startsWith('data:application/pdf')
            ? `<iframe src="${data}" class="image-modal-frame"></iframe>`
            : `<img src="${data}" alt="DNI" class="image-modal-img">`
        }
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" id="closeImageModalBtn2">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('closeImageModalBtn').onclick = closeImageModal;
  document.getElementById('closeImageModalBtn2').onclick = closeImageModal;

  overlay.onclick = (e) => {
    if (e.target === overlay) closeImageModal();
  };
}

window.toggleUser = async function(id, currentActive) {
  const sessionUser = getSession();

  const res = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: !currentActive })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
    return;
  }

  renderAdminPanel(sessionUser);
};

window.viewImage = function(encodedData) {
  const data = decodeURIComponent(encodedData);
  openImageModal(data);
};

window.changeSurveyStatus = async function(id) {
  const resSurvey = await fetch('/api/surveys');
  const surveyData = await resSurvey.json();
  const survey = surveyData.surveys.find(s => s.id === id);

  if (!survey) {
    alert('Encuesta no encontrada');
    return;
  }

  openStatusModal({
    currentStatus: survey.status || 'pending',
    currentNotes: survey.adminNotes || '',
    onSave: async ({ status, notes }) => {
      const saveBtn = document.getElementById('saveStatusModalBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      const res = await fetch(`/api/surveys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: notes
        })
      });

      const response = await res.json();

      if (!res.ok) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar cambios';
        alert(response.error);
        return;
      }

      closeStatusModal();
      renderAdminSurveys();
    }
  });
};

window.editSurvey = async function(id) {
  const user = getSession();

  const res = await fetch('/api/surveys');
  const data = await res.json();

  const survey = data.surveys.find(s => s.id === id && s.sellerId === user.id);

  if (!survey) {
    alert('Encuesta no encontrada');
    return;
  }

  if (survey.status !== 'pending') {
    alert('Solo se pueden editar encuestas pendientes');
    return;
  }

  renderSurveyForm(user, survey);
};

window.viewSurveyDetail = async function(id) {
  const user = getSession();

  if (!user) {
    renderHome();
    return;
  }

  try {
    const res = await fetch('/api/surveys');
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo cargar la venta');
      return;
    }

    const survey = data.surveys.find(s => Number(s.id) === Number(id));

    if (!survey) {
      alert('Venta no encontrada');
      return;
    }

    renderAppShell({
      user,
      active: user.role === 'admin' ? 'centralSales' : 'mySales',
      title: 'Detalle de Venta',
      subtitle: 'Información completa de la venta seleccionada.',
      extraActions: `
        <button class="btn btn-secondary" id="backFromDetailBtn">
          Volver
        </button>

        ${
          user.role === 'admin'
            ? `
              <button
                class="btn btn-primary"
                onclick="changeSurveyStatus(${survey.id})"
              >
                Cambiar Estado
              </button>
            `
            : ''
        }
      `,
      content: `
        <div class="detail-grid-pro">
          <div class="detail-main-pro">

            <!-- DATOS DEL CLIENTE -->
            <div class="detail-card-pro">
              <h3>Datos del Cliente</h3>

              <div class="detail-info-grid">
                <div>
                  <span>Nombre y apellido</span>
                  <strong>${survey.holderName || '-'}</strong>
                </div>

                <div>
                  <span>CUIT / CUIL</span>
                  <strong>${survey.cuil || '-'}</strong>
                </div>

                <div>
                  <span>Fecha de nacimiento</span>
                  <strong>${survey.birthDate ? formatDate(survey.birthDate) : '-'}</strong>
                </div>

                <div>
                  <span>Teléfono titular</span>
                  <strong>${survey.phone1 || '-'}</strong>
                </div>

                <div>
                  <span>Correo electrónico</span>
                  <strong>${survey.email || '-'}</strong>
                </div>

                <div>
                  <span>Vendedor</span>
                  <strong>${survey.sellerName || '-'}</strong>
                </div>
              </div>
            </div>

            <!-- CONTACTOS ADICIONALES -->
            <div class="detail-card-pro">
              <h3>Contactos adicionales</h3>

              <div class="detail-info-grid">
                <div>
                  <span>Nombre del contacto 2</span>
                  <strong>${survey.contact2Name || '-'}</strong>
                </div>

                <div>
                  <span>Teléfono del contacto 2</span>
                  <strong>${survey.phone2 || '-'}</strong>
                </div>

                <div>
                  <span>Parentesco del contacto 2</span>
                  <strong>${survey.contact2Relationship || '-'}</strong>
                </div>

                <div>
                  <span>Nombre del contacto 3</span>
                  <strong>${survey.contact3Name || 'No informado'}</strong>
                </div>

                <div>
                  <span>Teléfono del contacto 3</span>
                  <strong>${survey.phone3 || 'No informado'}</strong>
                </div>

                <div>
                  <span>Parentesco del contacto 3</span>
                  <strong>${survey.contact3Relationship || 'No informado'}</strong>
                </div>
              </div>
            </div>

            <!-- UBICACIÓN -->
            <div class="detail-card-pro">
              <h3>Ubicación</h3>

              <div class="detail-info-grid">
                <div>
                  <span>Domicilio</span>
                  <strong>${survey.monitoringAddress || '-'}</strong>
                </div>

                <div>
                  <span>Entre calles</span>
                  <strong>${survey.betweenStreets || '-'}</strong>
                </div>

                <div>
                  <span>Barrio</span>
                  <strong>${survey.neighborhood || '-'}</strong>
                </div>

                <div>
                  <span>Ciudad</span>
                  <strong>${survey.city || '-'}</strong>
                </div>

                <div>
                  <span>Código Postal</span>
                  <strong>${survey.postalCode || '-'}</strong>
                </div>
              </div>
            </div>

            <!-- SERVICIO -->
            <div class="detail-card-pro">
              <h3>Servicio Contratado</h3>

              <div class="detail-info-grid">
                <div>
                  <span>Equipo principal</span>
                  <strong>${survey.equipment || '-'}</strong>
                </div>

                <div>
                  <span>Equipo adicional</span>
                  <strong>${survey.additionalEquipment || 'Sin equipo adicional'}</strong>
                </div>

                <div>
                  <span>Promoción / Abono</span>
                  <strong>${survey.bonus || '-'}</strong>
                </div>

                <div>
                  <span>Observaciones del vendedor</span>
                  <strong>${survey.observations || 'Sin observaciones'}</strong>
                </div>
              </div>
            </div>

            <!-- DOCUMENTACIÓN -->
            <div class="detail-card-pro">
              <h3>Documentación</h3>

              <div class="detail-info-grid" style="margin-bottom:16px;">
                <div>
                  <span>Archivo DNI frente</span>
                  <strong>${survey.dniFrontName || 'No cargado'}</strong>
                </div>

                <div>
                  <span>Archivo DNI dorso</span>
                  <strong>${survey.dniBackName || 'No cargado'}</strong>
                </div>
              </div>

              <div class="btn-row">
                ${
                  survey.dniFrontData
                    ? `
                      <button
                        class="btn btn-outline"
                        onclick="viewImage('${encodeURIComponent(survey.dniFrontData)}')"
                      >
                        Ver DNI Frente
                      </button>
                    `
                    : `<span class="muted">Sin DNI frente</span>`
                }

                ${
                  survey.dniBackData
                    ? `
                      <button
                        class="btn btn-outline"
                        onclick="viewImage('${encodeURIComponent(survey.dniBackData)}')"
                      >
                        Ver DNI Dorso
                      </button>
                    `
                    : `<span class="muted">Sin DNI dorso</span>`
                }
              </div>
            </div>

            <!-- HISTORIAL -->
            <div class="detail-card-pro">
              <h3>Historial</h3>

              <div class="timeline-pro">
                <div class="timeline-item-pro done">
                  <div class="timeline-dot-pro"></div>

                  <div>
                    <strong>Venta creada</strong>
                    <div class="muted">
                      ${formatDateTime(survey.createdAt)}
                    </div>
                  </div>
                </div>

                <div class="timeline-item-pro ${
                  survey.status !== 'pending' ? 'done' : ''
                }">
                  <div class="timeline-dot-pro"></div>

                  <div>
                    <strong>En revisión</strong>
                    <div class="muted">
                      ${
                        survey.status === 'pending'
                          ? 'Pendiente de validación por jefatura'
                          : 'La venta fue revisada por jefatura'
                      }
                    </div>
                  </div>
                </div>

                <div class="timeline-item-pro ${
                  ['confirmed', 'paid'].includes(survey.status) ? 'done' : ''
                }">
                  <div class="timeline-dot-pro"></div>

                  <div>
                    <strong>Venta aprobada</strong>
                    <div class="muted">
                      ${
  survey.status === 'paid'
    ? 'Aprobada y abonada'
    : survey.status === 'confirmed'
      ? 'Aprobada por jefatura'
      : 'Todavía no aprobada'
}
                    </div>
                  </div>
                </div>

                <div class="timeline-item-pro ${
                  survey.status === 'rejected' ? 'done rejected' : ''
                }">
                  <div class="timeline-dot-pro"></div>

                  <div>
                    <strong>Venta rechazada</strong>
                    <div class="muted">
                      ${
                        survey.status === 'rejected'
                          ? survey.adminNotes || 'Rechazada por jefatura'
                          : 'Sin rechazo'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA -->
          <div class="detail-side-pro">
            <div class="detail-card-pro">
              <h3>Estado</h3>

              <div style="margin:16px 0 20px 0;">
                ${statusBadge(survey.status)}
              </div>

              <div class="detail-side-list">
                <div class="summary-row">
                  <span>Fecha de creación</span>
                  <strong>${formatDateTime(survey.createdAt)}</strong>
                </div>

                <div class="summary-row">
                  <span>Última actualización</span>
                  <strong>
                    ${formatDateTime(survey.updatedAt || survey.createdAt)}
                  </strong>
                </div>

                <div class="summary-row">
                  <span>Vendedor</span>
                  <strong>${survey.sellerName || '-'}</strong>
                </div>

                <div class="summary-row">
                  <span>Cliente</span>
                  <strong>${survey.holderName || '-'}</strong>
                </div>
              </div>
            </div>

            <div class="detail-card-pro">
              <h3>Observaciones de Jefatura</h3>

              <p class="muted" style="margin:0; white-space:pre-wrap;">
                ${survey.adminNotes || 'Sin observaciones registradas.'}
              </p>
            </div>

            <div class="detail-card-pro">
              <h3>Resumen de contactos</h3>

              <div class="detail-side-list">
                <div class="summary-row">
                  <span>Teléfono titular</span>
                  <strong>${survey.phone1 || '-'}</strong>
                </div>

                <div class="summary-row">
                  <span>Contacto 2</span>
                  <strong>
                    ${survey.contact2Name || '-'}<br>
                    ${survey.phone2 || '-'}
                  </strong>
                </div>

                <div class="summary-row">
                  <span>Contacto 3</span>
                  <strong>
                    ${survey.contact3Name || 'No informado'}<br>
                    ${survey.phone3 || ''}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    });

    const backButton = document.getElementById('backFromDetailBtn');

    if (backButton) {
      backButton.onclick = () => {
        if (user.role === 'admin') {
          renderAdminSurveys();
        } else {
          renderSellerSurveys(user);
        }
      };
    }
  } catch (error) {
    console.error('Error cargando el detalle de la venta:', error);
    alert('No se pudo cargar el detalle de la venta');
  }
};

function init() {
  const user = getSession();

  if (!user) {
    renderHome();
    applyTheme('light');
    return;
  }

  applyTheme(user.theme || 'light');
  renderDashboard(user);
}

init();