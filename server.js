const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SURVEYS_FILE = path.join(DATA_DIR, 'surveys.json');
const POTENTIAL_CLIENTS_FILE = path.join(
  DATA_DIR,
  'potential-clients.json'
);
const RESETS_FILE = path.join(DATA_DIR, 'password_resets.json');
const RESET_PREVIEW_FILE = path.join(DATA_DIR, 'password-reset-preview.txt');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadUsers() {
  const users = loadJson(USERS_FILE, [
    {
      id: 1,
      username: 'Pablo',
      password: '142707P',
      role: 'admin',
      name: 'Pablo',
      active: true,
      theme: 'light'
    },
    {
      id: 2,
      username: 'Morena',
      password: 'Mgmn1227.',
      role: 'seller',
      name: 'Morena Giovanna Marina Noguera',
      active: true,
      theme: 'light'
    }
  ]);

  let changed = false;

  for (const user of users) {
    if (user.active === undefined) {
      user.active = true;
      changed = true;
    }
    if (user.theme === undefined) {
      user.theme = 'light';
      changed = true;
    }
  }

  if (changed) saveJson(USERS_FILE, users);
  return users;
}

function saveUsers(users) {
  saveJson(USERS_FILE, users);
}

function loadSurveys() {
  return loadJson(SURVEYS_FILE, []);
}

function saveSurveys(surveys) {
  saveJson(SURVEYS_FILE, surveys);
}

function loadPotentialClients() {
  const clients = loadJson(POTENTIAL_CLIENTS_FILE, []);

  let changed = false;

  for (const client of clients) {
    if (!Array.isArray(client.followUps)) {
      client.followUps = [];
      changed = true;
    }

    if (!client.createdAt) {
      client.createdAt = new Date().toISOString();
      changed = true;
    }

    if (!client.updatedAt) {
      client.updatedAt = client.createdAt;
      changed = true;
    }

    if (client.sold === undefined) {
      client.sold = false;
      changed = true;
    }

    if (client.soldAt === undefined) {
      client.soldAt = null;
      changed = true;
    }

    if (client.soldSurveyId === undefined) {
      client.soldSurveyId = null;
      changed = true;
    }
  }

  if (changed) {
    saveJson(POTENTIAL_CLIENTS_FILE, clients);
  }

  return clients;
}

function savePotentialClients(clients) {
  saveJson(POTENTIAL_CLIENTS_FILE, clients);
}

function loadResets() {
  return loadJson(RESETS_FILE, []);
}

function saveResets(resets) {
  saveJson(RESETS_FILE, resets);
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 25 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function surveyStatusLabel(status) {
  if (status === 'confirmed') return 'Aprobada';
  if (status === 'paid') return 'Aprobado Abonado';
  if (status === 'rejected') return 'Rechazada';
  return 'Pendiente';
}

function exportSurveysToExcel(res, surveys) {
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td {
            border: 1px solid #999;
            padding: 6px;
            font-size: 12px;
            vertical-align: top;
          }
          th {
            background: #d9eaf7;
            font-weight: bold;
            text-align: center;
          }
          tr:nth-child(even) { background: #f7f7f7; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 12px; }
          .meta { margin-bottom: 12px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="title">Alerta Plus - Exportación de Encuestas</div>
        <div class="meta">Cantidad de registros: ${surveys.length}</div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Vendedor</th>
              <th>Titular</th>
              <th>CUIL</th>
              <th>Fecha de Nacimiento</th>
              <th>Mail</th>
              <th>Dirección de Monitoreo</th>
              <th>Entre Calles</th>
              <th>Barrio</th>
              <th>Código Postal</th>
              <th>Ciudad</th>
              <th>Equipo</th>
              <th>Equipo Adicional</th>
              <th>Bonificación</th>
              <th>Teléfono Titular</th>
              <th>Teléfono 2</th>
              <th>Contacto 2</th>
              <th>Parentesco 2</th>
              <th>Teléfono 3</th>
              <th>Contacto 3</th>
              <th>Parentesco 3</th>
              <th>DNI Frente</th>
              <th>DNI Dorso</th>
              <th>Observaciones</th>
              <th>Estado</th>
              <th>Observaciones Admin</th>
              <th>Fecha de Carga</th>
            </tr>
          </thead>
          <tbody>
            ${surveys.map(s => `
              <tr>
                <td>${escapeHtml(s.id)}</td>
                <td>${escapeHtml(s.sellerName)}</td>
                <td>${escapeHtml(s.holderName)}</td>
                <td>${escapeHtml(s.cuil)}</td>
                <td>${escapeHtml(s.birthDate)}</td>
                <td>${escapeHtml(s.email)}</td>
                <td>${escapeHtml(s.monitoringAddress)}</td>
                <td>${escapeHtml(s.betweenStreets)}</td>
                <td>${escapeHtml(s.neighborhood)}</td>
                <td>${escapeHtml(s.postalCode)}</td>
                <td>${escapeHtml(s.city)}</td>
                <td>${escapeHtml(s.equipment)}</td>
                <td>${escapeHtml(s.additionalEquipment)}</td>
                <td>${escapeHtml(s.bonus)}</td>
                <td>${escapeHtml(s.phone1)}</td>
                <td>${escapeHtml(s.phone2)}</td>
                <td>${escapeHtml(s.contact2Name)}</td>
                <td>${escapeHtml(s.contact2Relationship)}</td>
                <td>${escapeHtml(s.phone3)}</td>
                <td>${escapeHtml(s.contact3Name)}</td>
                <td>${escapeHtml(s.contact3Relationship)}</td>
                <td>${escapeHtml(s.dniFrontName)}</td>
                <td>${escapeHtml(s.dniBackName)}</td>
                <td>${escapeHtml(s.observations)}</td>
                <td>${escapeHtml(surveyStatusLabel(s.status))}</td>
                <td>${escapeHtml(s.adminNotes || '')}</td>
                <td>${escapeHtml(s.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  res.writeHead(200, {
    'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
    'Content-Disposition': 'attachment; filename="encuestas-alerta-plus.xls"'
  });

  res.end('\ufeff' + html);
}

function createResetToken() {
  return crypto.randomBytes(24).toString('hex');
}

function cleanupExpiredResets() {
  const resets = loadResets().filter(r => !r.used && r.expiresAt > Date.now());
  saveResets(resets);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/login' && req.method === 'POST') {
      const users = loadUsers();
      const body = await readBody(req);

      const user = users.find(
        u => u.username === body.username && u.password === body.password
      );

      if (!user) {
        return sendJson(res, 401, { error: 'Usuario o contraseña incorrectos' });
      }

      if (!user.active) {
        return sendJson(res, 403, { error: 'La cuenta está inactiva' });
      }

      return sendJson(res, 200, {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          active: user.active,
          theme: user.theme || 'light'
        }
      });
    }

    if (req.url === '/api/register' && req.method === 'POST') {
      const users = loadUsers();
      const body = await readBody(req);

      if (!body.name || !body.username || !body.password) {
        return sendJson(res, 400, { error: 'Completá todos los campos' });
      }

      const exists = users.find(u => u.username === body.username);

      if (exists) {
        return sendJson(res, 400, { error: 'Ese usuario ya existe' });
      }

      const newUser = {
        id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: body.username,
        password: body.password,
        role: 'seller',
        name: body.name,
        active: true,
        theme: 'light'
      };

      users.push(newUser);
      saveUsers(users);

      return sendJson(res, 201, { message: 'Cuenta creada correctamente' });
    }

    if (req.url === '/api/forgot-password' && req.method === 'POST') {
      cleanupExpiredResets();

      const users = loadUsers();
      const body = await readBody(req);
      const identifier = String(body.identifier || '').trim();

      const user = users.find(
        u => u.username.toLowerCase() === identifier.toLowerCase()
      );

      if (user) {
        const resets = loadResets();
        const token = createResetToken();

        resets.push({
          id: resets.length ? Math.max(...resets.map(r => r.id)) + 1 : 1,
          userId: user.id,
          token,
          used: false,
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000
        });

        saveResets(resets);

        const preview = [
          `Usuario: ${user.username}`,
          `Nombre: ${user.name}`,
          `Token: ${token}`,
          `Enlace local: ${APP_URL}/#/reset?token=${token}`
        ].join('\n');

        fs.writeFileSync(RESET_PREVIEW_FILE, preview, 'utf8');
      }

      return sendJson(res, 200, {
        message: 'Si la cuenta existe, se generó un enlace de recuperación.',
        previewFile: 'data/password-reset-preview.txt'
      });
    }

    if (req.url === '/api/reset-password' && req.method === 'POST') {
      cleanupExpiredResets();

      const users = loadUsers();
      const resets = loadResets();
      const body = await readBody(req);

      const token = String(body.token || '').trim();
      const newPassword = String(body.newPassword || '').trim();

      if (!token || !newPassword) {
        return sendJson(res, 400, { error: 'Faltan datos para restablecer la contraseña' });
      }

      if (newPassword.length < 4) {
        return sendJson(res, 400, { error: 'La nueva contraseña es demasiado corta' });
      }

      const reset = resets.find(r => r.token === token && !r.used && r.expiresAt > Date.now());

      if (!reset) {
        return sendJson(res, 400, { error: 'El enlace o token ya no es válido' });
      }

      const user = users.find(u => u.id === reset.userId);

      if (!user) {
        return sendJson(res, 404, { error: 'Usuario no encontrado' });
      }

      user.password = newPassword;
      reset.used = true;

      saveUsers(users);
      saveResets(resets);

      return sendJson(res, 200, { message: 'Contraseña actualizada correctamente' });
    }

    if (req.url === '/api/users' && req.method === 'GET') {
      const users = loadUsers();

      return sendJson(res, 200, {
        users: users.map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          active: u.active,
          theme: u.theme || 'light'
        }))
      });
    }

    if (req.url === '/api/users' && req.method === 'POST') {
      const users = loadUsers();
      const body = await readBody(req);

      if (!body.name || !body.username || !body.password) {
        return sendJson(res, 400, { error: 'Completá todos los campos' });
      }

      const exists = users.find(u => u.username === body.username);

      if (exists) {
        return sendJson(res, 400, { error: 'Ese usuario ya existe' });
      }

      const newUser = {
        id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: body.username,
        password: body.password,
        role: body.role || 'seller',
        name: body.name,
        active: true,
        theme: 'light'
      };

      users.push(newUser);
      saveUsers(users);

      return sendJson(res, 201, { message: 'Usuario creado correctamente' });
    }

    if (req.url.startsWith('/api/users/') && req.method === 'PATCH') {
      const users = loadUsers();
      const id = Number(req.url.split('/').pop());
      const body = await readBody(req);

      const user = users.find(u => u.id === id);

      if (!user) {
        return sendJson(res, 404, { error: 'Usuario no encontrado' });
      }

      if (body.name !== undefined) user.name = body.name;
      if (body.username !== undefined) user.username = body.username;
      if (body.password !== undefined && body.password !== '') user.password = body.password;
      if (body.role !== undefined) user.role = body.role;
      if (body.active !== undefined) user.active = body.active;
      if (body.theme !== undefined) user.theme = body.theme;

      saveUsers(users);

      return sendJson(res, 200, { message: 'Usuario actualizado correctamente' });
    }

    if (req.url === '/api/settings/profile' && req.method === 'PATCH') {
      const users = loadUsers();
      const body = await readBody(req);

      const user = users.find(u => u.id === Number(body.userId));

      if (!user) {
        return sendJson(res, 404, { error: 'Usuario no encontrado' });
      }

      if (body.name !== undefined && body.name !== '') user.name = body.name;
      if (body.theme !== undefined && body.theme !== '') user.theme = body.theme;

      saveUsers(users);

      return sendJson(res, 200, {
        message: 'Perfil actualizado correctamente',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          active: user.active,
          theme: user.theme
        }
      });
    }

    if (req.url === '/api/settings/password' && req.method === 'PATCH') {
      const users = loadUsers();
      const body = await readBody(req);

      const user = users.find(u => u.id === Number(body.userId));

      if (!user) {
        return sendJson(res, 404, { error: 'Usuario no encontrado' });
      }

      if (user.password !== body.currentPassword) {
        return sendJson(res, 400, { error: 'La contraseña actual es incorrecta' });
      }

      if (!body.newPassword || body.newPassword.length < 4) {
        return sendJson(res, 400, { error: 'La nueva contraseña es demasiado corta' });
      }

      user.password = body.newPassword;
      saveUsers(users);

      return sendJson(res, 200, { message: 'Contraseña actualizada correctamente' });
    }

    if (req.url.startsWith('/api/stats') && req.method === 'GET') {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const userId = Number(urlObj.searchParams.get('userId') || 0);
      const role = urlObj.searchParams.get('role') || '';

      const surveys = loadSurveys();
      const users = loadUsers();

      let filteredSurveys = surveys;

      if (role === 'seller') {
        filteredSurveys = surveys.filter(s => s.sellerId === userId);
      }

      const stats = {
  total: filteredSurveys.length,

  pending: filteredSurveys.filter(
    s => s.status === 'pending'
  ).length,

  confirmed: filteredSurveys.filter(
    s => s.status === 'confirmed'
  ).length,

  paid: filteredSurveys.filter(
    s => s.status === 'paid'
  ).length,

  rejected: filteredSurveys.filter(
    s => s.status === 'rejected'
  ).length,

  activeSellers: users.filter(
    u => u.role === 'seller' && u.active
  ).length
};

      return sendJson(res, 200, { stats });
    }

    if (
  req.url.startsWith('/api/potential-clients') &&
  req.method === 'GET'
) {
  const urlObj = new URL(
    req.url,
    `http://${req.headers.host}`
  );

  if (urlObj.pathname !== '/api/potential-clients') {
    return sendJson(res, 404, {
      error: 'Ruta no encontrada'
    });
  }

  const userId = Number(
    urlObj.searchParams.get('userId') || 0
  );

  const role = String(
    urlObj.searchParams.get('role') || ''
  );

  let potentialClients = loadPotentialClients();

  /*
    El administrador recibe todos los registros.
    El vendedor recibe solamente los que cargó.
  */
  if (role === 'seller') {
    potentialClients = potentialClients.filter(
      client => Number(client.sellerId) === userId
    );
  }

  potentialClients.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt) -
      new Date(a.updatedAt || a.createdAt)
  );

  return sendJson(res, 200, {
    potentialClients
  });
}

/*
  Crear un cliente potencial
*/
if (
  req.url === '/api/potential-clients' &&
  req.method === 'POST'
) {
  const potentialClients = loadPotentialClients();
  const body = await readBody(req);

  const requiredFields = [
    'sellerId',
    'sellerName',
    'fullNameOrBusinessName',
    'email',
    'phone',
    'address',
    'city',
    'interestLevel'
  ];

  for (const field of requiredFields) {
    if (
      body[field] === undefined ||
      String(body[field]).trim() === ''
    ) {
      return sendJson(res, 400, {
        error: `Falta completar: ${field}`
      });
    }
  }

  const allowedInterestLevels = [
    'green',
    'yellow',
    'red'
  ];

  const interestLevel = String(
    body.interestLevel
  ).trim().toLowerCase();

  if (!allowedInterestLevels.includes(interestLevel)) {
    return sendJson(res, 400, {
      error: 'Nivel de interés inválido'
    });
  }

  const now = new Date().toISOString();

  const newPotentialClient = {
    id: potentialClients.length
      ? Math.max(
          ...potentialClients.map(
            client => Number(client.id) || 0
          )
        ) + 1
      : 1,

    sellerId: Number(body.sellerId),
    sellerName: String(body.sellerName).trim(),

    fullNameOrBusinessName: String(
      body.fullNameOrBusinessName
    ).trim(),

    email: String(body.email).trim(),
    phone: String(body.phone).trim(),
    address: String(body.address).trim(),
    city: String(body.city).trim(),

    interestLevel,

    observations: String(
      body.observations || ''
    ).trim(),

    followUps: [],

    sold: false,
    soldAt: null,
    soldSurveyId: null,

    createdAt: now,
    updatedAt: now
  };

  potentialClients.push(newPotentialClient);
  savePotentialClients(potentialClients);

  return sendJson(res, 201, {
    message: 'Cliente potencial guardado correctamente',
    potentialClient: newPotentialClient
  });
}

/*
  Agregar un avance de seguimiento
*/
const potentialFollowUpMatch = new URL(
  req.url,
  `http://${req.headers.host}`
).pathname.match(
  /^\/api\/potential-clients\/(\d+)\/follow-ups$/
);

if (
  potentialFollowUpMatch &&
  req.method === 'POST'
) {
  const potentialClients = loadPotentialClients();

  const clientId = Number(
    potentialFollowUpMatch[1]
  );

  const body = await readBody(req);

  const potentialClient = potentialClients.find(
    client => Number(client.id) === clientId
  );

  if (!potentialClient) {
    return sendJson(res, 404, {
      error: 'Cliente potencial no encontrado'
    });
  }

  const text = String(body.text || '').trim();

  if (!text) {
    return sendJson(res, 400, {
      error: 'Escribí el avance del seguimiento'
    });
  }

  if (!Array.isArray(potentialClient.followUps)) {
    potentialClient.followUps = [];
  }

  const now = new Date().toISOString();

  const newFollowUp = {
    id: potentialClient.followUps.length
      ? Math.max(
          ...potentialClient.followUps.map(
            followUp => Number(followUp.id) || 0
          )
        ) + 1
      : 1,

    text,

    authorId: Number(body.authorId || 0),

    authorName: String(
      body.authorName || 'Usuario'
    ).trim(),

    authorRole:
      body.authorRole === 'admin'
        ? 'admin'
        : 'seller',

    createdAt: now
  };

  potentialClient.followUps.push(newFollowUp);
  potentialClient.updatedAt = now;

  savePotentialClients(potentialClients);

  return sendJson(res, 201, {
    message: 'Avance agregado correctamente',
    followUp: newFollowUp,
    potentialClient
  });
}

/*
  Editar o eliminar un avance de seguimiento
*/
const potentialFollowUpItemMatch = new URL(
  req.url,
  `http://${req.headers.host}`
).pathname.match(
  /^\/api\/potential-clients\/(\d+)\/follow-ups\/(\d+)$/
);

if (
  potentialFollowUpItemMatch &&
  req.method === 'PATCH'
) {
  const potentialClients = loadPotentialClients();
  const clientId = Number(potentialFollowUpItemMatch[1]);
  const followUpId = Number(potentialFollowUpItemMatch[2]);
  const body = await readBody(req);

  const potentialClient = potentialClients.find(
    client => Number(client.id) === clientId
  );

  if (!potentialClient) {
    return sendJson(res, 404, {
      error: 'Cliente potencial no encontrado'
    });
  }

  if (!Array.isArray(potentialClient.followUps)) {
    return sendJson(res, 404, {
      error: 'Avance no encontrado'
    });
  }

  const followUp = potentialClient.followUps.find(
    item => Number(item.id) === followUpId
  );

  if (!followUp) {
    return sendJson(res, 404, {
      error: 'Avance no encontrado'
    });
  }

  const requesterId = Number(body.requesterId || 0);
  const requesterRole =
    body.requesterRole === 'admin'
      ? 'admin'
      : 'seller';

  const requester = loadUsers().find(
    user =>
      Number(user.id) === requesterId &&
      user.role === requesterRole &&
      user.active
  );

  if (!requester) {
    return sendJson(res, 403, {
      error: 'Usuario no autorizado'
    });
  }

  if (followUp.authorRole !== requester.role) {
    return sendJson(res, 403, {
      error:
        'No tenés permiso para modificar esta observación'
    });
  }

  const text = String(body.text || '').trim();

  if (!text) {
    return sendJson(res, 400, {
      error: 'La observación no puede quedar vacía'
    });
  }

  const now = new Date().toISOString();
  followUp.text = text;
  followUp.updatedAt = now;
  potentialClient.updatedAt = now;

  savePotentialClients(potentialClients);

  return sendJson(res, 200, {
    message: 'Observación actualizada correctamente',
    followUp,
    potentialClient
  });
}

if (
  potentialFollowUpItemMatch &&
  req.method === 'DELETE'
) {
  const potentialClients = loadPotentialClients();
  const clientId = Number(potentialFollowUpItemMatch[1]);
  const followUpId = Number(potentialFollowUpItemMatch[2]);
  const body = await readBody(req);

  const potentialClient = potentialClients.find(
    client => Number(client.id) === clientId
  );

  if (!potentialClient) {
    return sendJson(res, 404, {
      error: 'Cliente potencial no encontrado'
    });
  }

  if (!Array.isArray(potentialClient.followUps)) {
    return sendJson(res, 404, {
      error: 'Avance no encontrado'
    });
  }

  const followUpIndex = potentialClient.followUps.findIndex(
    item => Number(item.id) === followUpId
  );

  if (followUpIndex === -1) {
    return sendJson(res, 404, {
      error: 'Avance no encontrado'
    });
  }

  const followUp =
    potentialClient.followUps[followUpIndex];

  const requesterId = Number(body.requesterId || 0);
  const requesterRole =
    body.requesterRole === 'admin'
      ? 'admin'
      : 'seller';

  const requester = loadUsers().find(
    user =>
      Number(user.id) === requesterId &&
      user.role === requesterRole &&
      user.active
  );

  if (!requester) {
    return sendJson(res, 403, {
      error: 'Usuario no autorizado'
    });
  }

  if (followUp.authorRole !== requester.role) {
    return sendJson(res, 403, {
      error:
        'No tenés permiso para eliminar esta observación'
    });
  }

  potentialClient.followUps.splice(followUpIndex, 1);
  potentialClient.updatedAt = new Date().toISOString();

  savePotentialClients(potentialClients);

  return sendJson(res, 200, {
    message: 'Observación eliminada correctamente',
    potentialClient
  });
}

/*
  Editar un cliente potencial
*/
const potentialClientMatch = new URL(
  req.url,
  `http://${req.headers.host}`
).pathname.match(
  /^\/api\/potential-clients\/(\d+)$/
);

if (
  potentialClientMatch &&
  req.method === 'PATCH'
) {
  const potentialClients = loadPotentialClients();

  const clientId = Number(
    potentialClientMatch[1]
  );

  const body = await readBody(req);

  const potentialClient = potentialClients.find(
    client => Number(client.id) === clientId
  );

  if (!potentialClient) {
    return sendJson(res, 404, {
      error: 'Cliente potencial no encontrado'
    });
  }

  if (body.fullNameOrBusinessName !== undefined) {
    const value = String(
      body.fullNameOrBusinessName
    ).trim();

    if (!value) {
      return sendJson(res, 400, {
        error:
          'Apellido y nombre o razón social es obligatorio'
      });
    }

    potentialClient.fullNameOrBusinessName = value;
  }

  if (body.email !== undefined) {
    const value = String(body.email).trim();

    if (!value) {
      return sendJson(res, 400, {
        error: 'El mail es obligatorio'
      });
    }

    potentialClient.email = value;
  }

  if (body.phone !== undefined) {
    const value = String(body.phone).trim();

    if (!value) {
      return sendJson(res, 400, {
        error: 'El celular es obligatorio'
      });
    }

    potentialClient.phone = value;
  }

  if (body.address !== undefined) {
    const value = String(body.address).trim();

    if (!value) {
      return sendJson(res, 400, {
        error: 'La dirección es obligatoria'
      });
    }

    potentialClient.address = value;
  }

  if (body.city !== undefined) {
    const value = String(body.city).trim();

    if (!value) {
      return sendJson(res, 400, {
        error: 'La localidad es obligatoria'
      });
    }

    potentialClient.city = value;
  }

  if (body.interestLevel !== undefined) {
    const allowedInterestLevels = [
      'green',
      'yellow',
      'red'
    ];

    const interestLevel = String(
      body.interestLevel
    ).trim().toLowerCase();

    if (
      !allowedInterestLevels.includes(interestLevel)
    ) {
      return sendJson(res, 400, {
        error: 'Nivel de interés inválido'
      });
    }

    potentialClient.interestLevel = interestLevel;
  }

  if (body.sold !== undefined) {
    const nextSold = body.sold === true;

    if (!nextSold) {
      const surveys = loadSurveys();

      const linkedSurvey = surveys.find(
        survey =>
          Number(survey.potentialClientId) ===
          Number(potentialClient.id)
      );

      if (linkedSurvey) {
        return sendJson(res, 409, {
          error:
            'Este cliente está vinculado a una venta y no se puede quitar la marca de vendido manualmente'
        });
      }
    }

    potentialClient.sold = nextSold;

    if (nextSold) {
      potentialClient.soldAt =
        potentialClient.soldAt ||
        new Date().toISOString();

      if (!potentialClient.soldSurveyId) {
        potentialClient.soldSurveyId = null;
      }
    } else {
      potentialClient.soldAt = null;
      potentialClient.soldSurveyId = null;
    }
  }

  if (body.observations !== undefined) {
    potentialClient.observations = String(
      body.observations || ''
    ).trim();
  }

  potentialClient.updatedAt =
    new Date().toISOString();

  savePotentialClients(potentialClients);

  return sendJson(res, 200, {
    message:
      'Cliente potencial actualizado correctamente',

    potentialClient
  });
}

    if (req.url === '/api/surveys' && req.method === 'GET') {
      const surveys = loadSurveys();
      return sendJson(res, 200, { surveys });
    }

    if (req.url.startsWith('/api/surveys/export') && req.method === 'GET') {
      const surveys = loadSurveys();
      const urlObj = new URL(req.url, `http://${req.headers.host}`);

      const seller = urlObj.searchParams.get('seller') || '';
      const status = urlObj.searchParams.get('status') || '';

      let filtered = [...surveys];

      if (seller) {
        filtered = filtered.filter(s => s.sellerName === seller);
      }

      if (status) {
        filtered = filtered.filter(s => s.status === status);
      }

      return exportSurveysToExcel(res, filtered);
    }

    if (req.url === '/api/surveys' && req.method === 'POST') {
      const surveys = loadSurveys();
      const body = await readBody(req);

      const requiredFields = [
        'sellerId',
        'sellerName',
        'holderName',
        'cuil',
        'birthDate',
        'email',
        'monitoringAddress',
        'betweenStreets',
        'neighborhood',
        'postalCode',
        'city',
        'equipment',
        'bonus',
        'phone1',
        'phone2',
        'contact2Name',
        'contact2Relationship'
      ];

      for (const field of requiredFields) {
        if (!body[field]) {
          return sendJson(res, 400, { error: `Falta completar: ${field}` });
        }
      }

      const now = Date.now();

const duplicateSurvey = surveys.find(survey => {
  const createdAt = new Date(
    survey.createdAt
  ).getTime();

  const isRecent =
    Number.isFinite(createdAt) &&
    now - createdAt < 2 * 60 * 1000;

  return (
    Number(survey.sellerId) ===
      Number(body.sellerId) &&

    String(survey.cuil || '').trim() ===
      String(body.cuil || '').trim() &&

    String(survey.monitoringAddress || '').trim().toLowerCase() ===
      String(body.monitoringAddress || '').trim().toLowerCase() &&

    String(survey.equipment || '').trim().toLowerCase() ===
      String(body.equipment || '').trim().toLowerCase() &&

    isRecent
  );
});

if (duplicateSurvey) {
  return sendJson(res, 409, {
    error:
      'Esta venta ya fue registrada hace unos instantes. Revisá Mis Ventas antes de volver a cargarla.'
  });
}

      const potentialClientId = Number(
        body.potentialClientId || 0
      );

      let linkedPotentialClients = null;
      let linkedPotentialClient = null;

      if (potentialClientId > 0) {
        linkedPotentialClients = loadPotentialClients();

        linkedPotentialClient = linkedPotentialClients.find(
          client =>
            Number(client.id) === potentialClientId &&
            Number(client.sellerId) === Number(body.sellerId)
        );

        if (!linkedPotentialClient) {
          return sendJson(res, 400, {
            error: 'El cliente potencial seleccionado no es válido'
          });
        }

        if (linkedPotentialClient.sold) {
          return sendJson(res, 409, {
            error: 'El cliente potencial seleccionado ya figura como vendido'
          });
        }
      }

      const newSurvey = {
        id: surveys.length ? Math.max(...surveys.map(s => s.id)) + 1 : 1,
        sellerId: body.sellerId,
        sellerName: body.sellerName,
        potentialClientId: linkedPotentialClient
          ? Number(linkedPotentialClient.id)
          : null,
        potentialClientName: linkedPotentialClient
          ? linkedPotentialClient.fullNameOrBusinessName
          : '',
        holderName: body.holderName,
        cuil: body.cuil,
        birthDate: body.birthDate,
        email: body.email,
        monitoringAddress: body.monitoringAddress,
        betweenStreets: body.betweenStreets,
        neighborhood: body.neighborhood,
        postalCode: body.postalCode,
        city: body.city,
        equipment: body.equipment,
        additionalEquipment: body.additionalEquipment || '',
        bonus: body.bonus,
        phone1: body.phone1,
        phone2: body.phone2,
        contact2Name: body.contact2Name,
        contact2Relationship: body.contact2Relationship,
        phone3: body.phone3 || '',
        contact3Name: body.contact3Name || '',
        contact3Relationship: body.contact3Relationship || '',
        dniFrontName: body.dniFrontName || '',
        dniFrontData: body.dniFrontData || '',
        dniBackName: body.dniBackName || '',
        dniBackData: body.dniBackData || '',
        observations: body.observations || '',
        status: 'pending',
        adminNotes: '',
        createdAt: new Date().toISOString()
      };

      surveys.push(newSurvey);
      saveSurveys(surveys);

      if (linkedPotentialClient && linkedPotentialClients) {
        const soldAt = new Date().toISOString();

        linkedPotentialClient.sold = true;
        linkedPotentialClient.soldAt = soldAt;
        linkedPotentialClient.soldSurveyId = newSurvey.id;
        linkedPotentialClient.updatedAt = soldAt;

        savePotentialClients(linkedPotentialClients);
      }

      return sendJson(res, 201, {
        message: 'Encuesta guardada correctamente',
        survey: newSurvey
      });
    }

    if (req.url.startsWith('/api/surveys/') && req.method === 'PATCH') {
      const surveys = loadSurveys();
      const id = Number(req.url.split('/').pop());
      const body = await readBody(req);

      const survey = surveys.find(s => s.id === id);

      if (!survey) {
        return sendJson(res, 404, { error: 'Encuesta no encontrada' });
      }

      const allowedStatuses = [
  'pending',
  'confirmed',
  'paid',
  'rejected'
];

if (body.status !== undefined) {
  const nextStatus = String(body.status).trim();

  if (!allowedStatuses.includes(nextStatus)) {
    return sendJson(res, 400, {
      error: 'Estado de venta inválido'
    });
  }

  survey.status = nextStatus;
}

if (body.adminNotes !== undefined) {
  survey.adminNotes = body.adminNotes;
}

      if (body.potentialClientId !== undefined) {
        const nextPotentialClientId = Number(body.potentialClientId || 0);

        survey.potentialClientId = nextPotentialClientId > 0
          ? nextPotentialClientId
          : null;
      }

      if (body.potentialClientName !== undefined) {
        survey.potentialClientName = String(
          body.potentialClientName || ''
        ).trim();
      }

      if (body.holderName !== undefined) survey.holderName = body.holderName;
      if (body.cuil !== undefined) survey.cuil = body.cuil;
      if (body.birthDate !== undefined) survey.birthDate = body.birthDate;
      if (body.email !== undefined) survey.email = body.email;
      if (body.monitoringAddress !== undefined) survey.monitoringAddress = body.monitoringAddress;
      if (body.betweenStreets !== undefined) survey.betweenStreets = body.betweenStreets;
      if (body.neighborhood !== undefined) survey.neighborhood = body.neighborhood;
      if (body.postalCode !== undefined) survey.postalCode = body.postalCode;
      if (body.city !== undefined) survey.city = body.city;
      if (body.equipment !== undefined) survey.equipment = body.equipment;
      if (body.additionalEquipment !== undefined) survey.additionalEquipment = body.additionalEquipment;
      if (body.bonus !== undefined) survey.bonus = body.bonus;
      if (body.phone1 !== undefined) survey.phone1 = body.phone1;
      if (body.phone2 !== undefined) survey.phone2 = body.phone2;
      if (body.contact2Name !== undefined) survey.contact2Name = body.contact2Name;
      if (body.contact2Relationship !== undefined) survey.contact2Relationship = body.contact2Relationship;
      if (body.phone3 !== undefined) survey.phone3 = body.phone3;
      if (body.contact3Name !== undefined) survey.contact3Name = body.contact3Name;
      if (body.contact3Relationship !== undefined) survey.contact3Relationship = body.contact3Relationship;
      if (body.dniFrontName !== undefined) survey.dniFrontName = body.dniFrontName;
      if (body.dniFrontData !== undefined) survey.dniFrontData = body.dniFrontData;
      if (body.dniBackName !== undefined) survey.dniBackName = body.dniBackName;
      if (body.dniBackData !== undefined) survey.dniBackData = body.dniBackData;
      if (body.observations !== undefined) {
  survey.observations = body.observations;
}

survey.updatedAt = new Date().toISOString();

saveSurveys(surveys);

      return sendJson(res, 200, { message: 'Encuesta actualizada correctamente' });
    }

    if (
  req.url.startsWith('/api/surveys/') &&
  req.method === 'DELETE'
) {
  const surveys = loadSurveys();

  const id = Number(
    req.url.split('/').pop()
  );

  if (!Number.isInteger(id) || id <= 0) {
    return sendJson(res, 400, {
      error: 'ID de venta inválido'
    });
  }

  const surveyIndex = surveys.findIndex(
    survey => Number(survey.id) === id
  );

  if (surveyIndex === -1) {
    return sendJson(res, 404, {
      error: 'Venta no encontrada'
    });
  }

  const deletedSurvey = surveys[surveyIndex];

  surveys.splice(surveyIndex, 1);

  saveSurveys(surveys);

  const deletedPotentialClientId = Number(
    deletedSurvey.potentialClientId || 0
  );

  if (deletedPotentialClientId > 0) {
    const potentialClients = loadPotentialClients();
    const potentialClient = potentialClients.find(
      client => Number(client.id) === deletedPotentialClientId
    );

    if (potentialClient) {
      const remainingLinkedSurvey = surveys
        .filter(
          survey =>
            Number(survey.potentialClientId) ===
            deletedPotentialClientId
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

      if (remainingLinkedSurvey) {
        potentialClient.sold = true;
        potentialClient.soldAt =
          remainingLinkedSurvey.createdAt ||
          new Date().toISOString();
        potentialClient.soldSurveyId =
          remainingLinkedSurvey.id;
      } else {
        potentialClient.sold = false;
        potentialClient.soldAt = null;
        potentialClient.soldSurveyId = null;
      }

      potentialClient.updatedAt =
        new Date().toISOString();

      savePotentialClients(potentialClients);
    }
  }

  return sendJson(res, 200, {
    message: 'Venta eliminada correctamente',
    deletedSurveyId: deletedSurvey.id
  });
}

    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(PUBLIC_DIR, filePath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Ruta no encontrada');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'Error interno del servidor' });
  }
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en ${APP_URL}`);
});