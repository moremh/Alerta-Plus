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
                <td>${escapeHtml(surveyStatusLabel(s.status))}</td><td>${escapeHtml(s.status)}</td>
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

      const newSurvey = {
        id: surveys.length ? Math.max(...surveys.map(s => s.id)) + 1 : 1,
        sellerId: body.sellerId,
        sellerName: body.sellerName,
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

      return sendJson(res, 201, { message: 'Encuesta guardada correctamente' });
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