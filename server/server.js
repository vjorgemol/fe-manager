import express from 'express';
import cors from 'cors';
import db from './database.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');



const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper for async DB calls
const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

// --- AUTH MIDDLEWARE & ENDPOINTS ---
app.post('/api/login', async (req, res) => {
  const { password, totpToken } = req.body;
  try {
    const rows = await query("SELECT key, value FROM settings WHERE key IN ('adminPassword', 'jwtSecret', 'twoFactorEnabled', 'twoFactorSecret')");
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

    if (!settings.adminPassword || !settings.jwtSecret) return res.status(500).json({ error: 'Server configuration error' });

    const match = await bcrypt.compare(password, settings.adminPassword);
    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    if (settings.twoFactorEnabled === 'true') {
      if (!totpToken) {
        return res.json({ require2FA: true });
      }

      const isValid = authenticator.verify({ token: totpToken, secret: settings.twoFactorSecret });
      if (!isValid) {
        return res.status(401).json({ error: 'Código de verificación incorrecto' });
      }
    }

    const token = jwt.sign({ role: 'admin' }, settings.jwtSecret, { expiresIn: '24h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protect all other /api routes
app.use('/api', (req, res, next) => {
  if (req.path === '/login') return next();
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ error: 'Unauthorized' });

  query("SELECT value FROM settings WHERE key = 'jwtSecret'").then(rows => {
    const jwtSecret = rows[0]?.value;
    if (!jwtSecret) return res.status(500).json({ error: 'Configuration missing' });

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) return res.status(401).json({ error: 'Token expired or invalid' });
      req.user = user;
      next();
    });
  }).catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/change-password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const rows = await query("SELECT value FROM settings WHERE key = 'adminPassword'");
    const hash = rows[0]?.value;
    const match = await bcrypt.compare(oldPassword, hash);
    if (match) {
      const newHash = await bcrypt.hash(newPassword, 10);
      await run("UPDATE settings SET value = ? WHERE key = 'adminPassword'", [newHash]);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2FA Endpoints ---
app.get('/api/2fa/generate', async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri('admin', 'FE Connect', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    res.json({ secret, qrCodeDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/2fa/enable', async (req, res) => {
  const { secret, token } = req.body;
  try {
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      return res.status(400).json({ error: 'El código introducido no es válido' });
    }
    await run("UPDATE settings SET value = ? WHERE key = 'twoFactorSecret'", [secret]);
    await run("UPDATE settings SET value = 'true' WHERE key = 'twoFactorEnabled'");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/2fa/disable', async (req, res) => {
  const { password } = req.body;
  try {
    const rows = await query("SELECT value FROM settings WHERE key = 'adminPassword'");
    const hash = rows[0]?.value;
    const match = await bcrypt.compare(password, hash);
    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    await run("UPDATE settings SET value = '' WHERE key = 'twoFactorSecret'");
    await run("UPDATE settings SET value = 'false' WHERE key = 'twoFactorEnabled'");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PDF PARSING ---
app.post('/api/parse-a3', async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'No PDF provided' });

    // The base64 string usually comes as 'data:application/pdf;base64,XXXX...'
    const base64Data = pdfBase64.split(',')[1] || pdfBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    const data = await pdfParse(buffer);
    const text = data.text;

    // Extract instructor name and email by looking for the specific value pattern:
    // [Name] - [DNI/NIE] - [Email]
    // The name part captures up to 60 chars excluding colons and newlines.
    const exactPattern = text.match(/([^:\n]{3,60}?)\s*-\s*([XYZ0-9][0-9]{7}[A-Z])\s*-\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    
    let instructorName = null;
    let instructorDni = null;
    let instructorEmail = null;

    if (exactPattern) {
      instructorName = exactPattern[1].trim();
      instructorDni = exactPattern[2].trim();
      instructorEmail = exactPattern[3].trim();
    } else {
      // Fallback if the DNI is missing for some reason, try to find the label
      const labelMatch = text.match(/Instructor\/a\s*\/\s*Instructor\/a:\s*([^:\n]+)/i);
      if (labelMatch) {
        const line = labelMatch[1].trim();
        if (!line.toLowerCase().includes('hores') && !line.toLowerCase().includes('horas')) {
          const parts = line.split(/\s*-\s*/);
          if (parts.length > 0) instructorName = parts[0].trim();
          const emailPart = parts.find(p => p.includes('@'));
          if (emailPart) {
            const emailMatch = emailPart.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            if (emailMatch) instructorEmail = emailMatch[1].trim();
          }
        }
      }
    }

    res.json({ 
      success: true, 
      instructorName, 
      instructorDni,
      instructorEmail,
      fullText: text // Useful for debugging if needed
    });
  } catch (err) {
    console.error('Error parsing PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
  const rows = await query("SELECT key, value FROM settings WHERE key NOT IN ('adminPassword', 'jwtSecret', 'twoFactorSecret')");
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json(settings);
});

app.put('/api/settings', async (req, res) => {
  const { key, value } = req.body;
  await run('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
  res.json({ success: true });
});

app.post('/api/optimize-route', async (req, res) => {
  const { origin, waypoints } = req.body;
  if (!origin || !waypoints || waypoints.length < 2) {
    return res.status(400).json({ error: 'Origen y al menos 2 destinos (waypoints) son requeridos' });
  }

  try {
    const geocode = async (address) => {
      const fetchCoords = async (queryStr) => {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'FE_Manager/1.0 (OpenStreetMap integration)' } });
        const data = await response.json();
        if (data && data.length > 0) {
          return `${data[0].lon},${data[0].lat}`;
        }
        return null;
      };

      // Intentar primero con la dirección completa
      let coords = await fetchCoords(address);
      if (coords) return coords;

      // Si falla, intentar limpiar detalles como "Bajo", "Piso", etc. (todo lo que haya entre el número y la última parte que suele ser la ciudad)
      // Ejemplo: "Calle Miguel Servet 28 Bajo N-3, Valencia" -> "Calle Miguel Servet 28, Valencia"
      const cleanedAddress = address.replace(/^(.+?\d+).*?(,[^,]+)?$/, '$1$2');
      if (cleanedAddress !== address) {
        // Respetar el límite de Nominatim antes del reintento
        await new Promise(resolve => setTimeout(resolve, 1100));
        coords = await fetchCoords(cleanedAddress);
      }
      
      return coords;
    };

    const coords = [];
    const allAddresses = [origin, ...waypoints];
    
    for (let i = 0; i < allAddresses.length; i++) {
      const coord = await geocode(allAddresses[i]);
      if (!coord) {
        return res.status(400).json({ error: `No se pudo localizar geográficamente la dirección: ${allAddresses[i]}` });
      }
      coords.push(coord);
      
      // Nominatim requires max 1 request per second for public usage
      if (i < allAddresses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }

    const osrmUrl = `http://router.project-osrm.org/trip/v1/driving/${coords.join(';')}?source=first&roundtrip=false`;
    const osrmRes = await fetch(osrmUrl);
    const osrmData = await osrmRes.json();

    if (osrmData.code === 'Ok') {
      const order = osrmData.waypoints
        .slice(1) // excluir el origen
        .map((wp, index) => ({ index, waypoint_index: wp.waypoint_index }))
        .sort((a, b) => a.waypoint_index - b.waypoint_index)
        .map(item => item.index);
      
      res.json({ success: true, order });
    } else {
      res.status(400).json({ error: `Error en el cálculo de la ruta (OSRM): ${osrmData.message || osrmData.code}` });
    }
  } catch (err) {
    console.error('Error optimizando ruta:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import', async (req, res) => {
  const { students, companies, placements, teachers, schoolName, academicYear, reminderDays, tutorName, tutorEmail, cycleName, templateProspecting, templateStart, templateEnd, cycleHours } = req.body;

  try {
    await run('BEGIN TRANSACTION');

    // Update settings
    await run('UPDATE settings SET value = ? WHERE key = ?', [schoolName, 'schoolName']);
    await run('UPDATE settings SET value = ? WHERE key = ?', [academicYear, 'academicYear']);
    if (reminderDays !== undefined) {
      await run('UPDATE settings SET value = ? WHERE key = ?', [reminderDays.toString(), 'reminderDays']);
    }
    if (tutorName !== undefined) {
      await run('UPDATE settings SET value = ? WHERE key = ?', [tutorName, 'tutorName']);
    }
    if (tutorEmail !== undefined) {
      await run('UPDATE settings SET value = ? WHERE key = ?', [tutorEmail, 'tutorEmail']);
    }
    if (cycleName !== undefined) {
      await run('UPDATE settings SET value = ? WHERE key = ?', [cycleName, 'cycleName']);
    }
    if (templateProspecting !== undefined) {
      await run('UPDATE settings SET value = ? WHERE key = ?', [templateProspecting, 'templateProspecting']);
    }
    if (templateStart !== undefined) {
      await run('UPDATE settings SET value = ? WHERE key = ?', [templateStart, 'templateStart']);
    }
    if (templateEnd !== undefined) {
      await run('UPDATE settings SET value = ? WHERE key = ?', [templateEnd, 'templateEnd']);
    }
    if (cycleHours !== undefined) {
      await run('UPDATE settings SET value = ? WHERE key = ?', [cycleHours.toString(), 'cycleHours']);
    }

    // Clear existing data
    await run('DELETE FROM students');
    await run('DELETE FROM companies');
    await run('DELETE FROM placements');
    await run('DELETE FROM teachers');

    // Insert new data
    for (const s of students) {
      await run(`INSERT INTO students (id, firstName, lastName, email, academicYear, photoBase64, phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [s.id, s.firstName, s.lastName, s.email, s.academicYear || null, s.photoBase64 || null, s.phone || null, s.notes || null]);
    }

    for (const c of companies) {
      await run(`INSERT INTO companies (id, name, email, location, contactPerson, address, prospectingSent, prospectingYears, acceptedYears, rejectedYears, inactiveEmail, phone, instructorName, instructorDni, instructorEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [c.id, c.name, c.email, c.location, c.contactPerson || null, c.address || null, c.prospectingSent ? 1 : 0, c.prospectingYears || '', c.acceptedYears || '', c.rejectedYears || '', c.inactiveEmail ? 1 : 0, c.phone || null, c.instructorName || null, c.instructorDni || null, c.instructorEmail || null]);
    }

    for (const p of placements) {
      await run(`INSERT INTO placements (id, studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent, endEmailSent, teacherId, anexoA1, anexoA2, anexoA3, allSigned, a3EmailSent, a2Signed, a3Signed, trackingCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [p.id, p.studentId, p.companyId, p.hours, p.startDate, p.endDate, p.status, p.academicYear, p.startEmailSent ? 1 : 0, p.endEmailSent ? 1 : 0, p.teacherId || null, p.anexoA1 || null, p.anexoA2 || null, p.anexoA3 || null, p.allSigned ? 1 : 0, p.a3EmailSent ? 1 : 0, p.a2Signed ? 1 : 0, p.a3Signed ? 1 : 0, p.trackingCount || 0]);
    }
    
    if (teachers) {
      for (const t of teachers) {
        await run(`INSERT INTO teachers (id, name) VALUES (?, ?)`, [t.id, t.name]);
      }
    }

    await run('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// --- STUDENTS ---
app.get('/api/students', async (req, res) => {
  const rows = await query('SELECT * FROM students');
  res.json(rows);
});

app.post('/api/students', async (req, res) => {
  const s = req.body;
  await run(`INSERT INTO students (id, firstName, lastName, email, academicYear, photoBase64, phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [s.id, s.firstName, s.lastName, s.email, s.academicYear || null, s.photoBase64 || null, s.phone || null, s.notes || null]);
  res.json({ success: true });
});

app.put('/api/students/:id', async (req, res) => {
  const s = req.body;
  await run(`UPDATE students SET firstName=?, lastName=?, email=?, academicYear=?, photoBase64=?, phone=?, notes=? WHERE id=?`, 
    [s.firstName, s.lastName, s.email, s.academicYear || null, s.photoBase64 || null, s.phone || null, s.notes || null, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/students/:id', async (req, res) => {
  await run('DELETE FROM students WHERE id=?', [req.params.id]);
  await run('DELETE FROM placements WHERE studentId=?', [req.params.id]);
  res.json({ success: true });
});

// --- COMPANIES ---
app.get('/api/companies', async (req, res) => {
  const rows = await query('SELECT * FROM companies');
  res.json(rows);
});

app.post('/api/companies', async (req, res) => {
  const c = req.body;
  await run(`INSERT INTO companies (id, name, email, location, contactPerson, address, prospectingSent, prospectingYears, acceptedYears, rejectedYears, inactiveEmail, phone, instructorName, instructorDni, instructorEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [c.id, c.name, c.email, c.location, c.contactPerson || null, c.address || null, c.prospectingSent ? 1 : 0, c.prospectingYears || '', c.acceptedYears || '', c.rejectedYears || '', c.inactiveEmail ? 1 : 0, c.phone || null, c.instructorName || null, c.instructorDni || null, c.instructorEmail || null]);
  res.json({ success: true });
});

app.put('/api/companies/:id', async (req, res) => {
  const c = req.body;
  await run(`UPDATE companies SET name=?, email=?, location=?, contactPerson=?, address=?, prospectingSent=?, prospectingYears=?, acceptedYears=?, rejectedYears=?, inactiveEmail=?, phone=?, instructorName=?, instructorDni=?, instructorEmail=? WHERE id=?`, 
    [c.name, c.email, c.location, c.contactPerson || null, c.address || null, c.prospectingSent ? 1 : 0, c.prospectingYears || '', c.acceptedYears || '', c.rejectedYears || '', c.inactiveEmail ? 1 : 0, c.phone || null, c.instructorName || null, c.instructorDni || null, c.instructorEmail || null, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/companies/:id', async (req, res) => {
  await run('DELETE FROM companies WHERE id=?', [req.params.id]);
  await run('DELETE FROM placements WHERE companyId=?', [req.params.id]);
  res.json({ success: true });
});

// --- TEACHERS ---
app.get('/api/teachers', async (req, res) => {
  const rows = await query('SELECT * FROM teachers');
  res.json(rows);
});

app.post('/api/teachers', async (req, res) => {
  const t = req.body;
  await run(`INSERT INTO teachers (id, name) VALUES (?, ?)`, [t.id, t.name]);
  res.json({ success: true });
});

app.delete('/api/teachers/:id', async (req, res) => {
  await run('DELETE FROM teachers WHERE id=?', [req.params.id]);
  // Optionally clear from placements, but better to keep for history or let it be null
  await run('UPDATE placements SET teacherId = NULL WHERE teacherId = ?', [req.params.id]);
  res.json({ success: true });
});

// --- PLACEMENTS ---
app.get('/api/placements', async (req, res) => {
  const rows = await query('SELECT * FROM placements');
  res.json(rows);
});

app.post('/api/placements', async (req, res) => {
  const { id, studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent, endEmailSent, teacherId, anexoA1, anexoA2, anexoA3, allSigned, a2Signed, a3Signed, trackingCount } = req.body;
  await run(`INSERT INTO placements (id, studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent, endEmailSent, teacherId, anexoA1, anexoA2, anexoA3, allSigned, a3EmailSent, a2Signed, a3Signed, trackingCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [id, studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent ? 1 : 0, endEmailSent ? 1 : 0, teacherId || null, anexoA1 || null, anexoA2 || null, anexoA3 || null, allSigned ? 1 : 0, req.body.a3EmailSent ? 1 : 0, a2Signed ? 1 : 0, a3Signed ? 1 : 0, trackingCount || 0]);
  res.json({ success: true });
});

app.put('/api/placements/:id', async (req, res) => {
  const { studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent, endEmailSent, teacherId, anexoA1, anexoA2, anexoA3, allSigned, a2Signed, a3Signed, trackingCount } = req.body;
  await run(`UPDATE placements SET studentId=?, companyId=?, hours=?, startDate=?, endDate=?, status=?, academicYear=?, startEmailSent=?, endEmailSent=?, teacherId=?, anexoA1=?, anexoA2=?, anexoA3=?, allSigned=?, a3EmailSent=?, a2Signed=?, a3Signed=?, trackingCount=? WHERE id=?`, 
    [studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent ? 1 : 0, endEmailSent ? 1 : 0, teacherId || null, anexoA1 || null, anexoA2 || null, anexoA3 || null, allSigned ? 1 : 0, req.body.a3EmailSent ? 1 : 0, a2Signed ? 1 : 0, a3Signed ? 1 : 0, trackingCount || 0, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/placements/:id', async (req, res) => {
  await run('DELETE FROM placements WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

const PORT = 3005;
const server = app.listen(PORT, () => {
  console.log(`SQLite Server running on http://localhost:${PORT}`);
});

// Prevent Node from exiting just in case
setInterval(() => {}, 1000 * 60 * 60);
