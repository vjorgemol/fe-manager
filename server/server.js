import express from 'express';
import cors from 'cors';
import db from './database.js';

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

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
  const rows = await query('SELECT key, value FROM settings');
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json(settings);
});

app.put('/api/settings', async (req, res) => {
  const { key, value } = req.body;
  await run('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
  res.json({ success: true });
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
      await run(`INSERT INTO companies (id, name, email, location, contactPerson, address, prospectingSent, prospectingYears, acceptedYears, rejectedYears, inactiveEmail, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [c.id, c.name, c.email, c.location, c.contactPerson || null, c.address || null, c.prospectingSent ? 1 : 0, c.prospectingYears || '', c.acceptedYears || '', c.rejectedYears || '', c.inactiveEmail ? 1 : 0, c.phone || null]);
    }

    for (const p of placements) {
      await run(`INSERT INTO placements (id, studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent, endEmailSent, teacherId, anexoA1, anexoA2, anexoA3, allSigned, a3EmailSent, a2Signed, a3Signed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [p.id, p.studentId, p.companyId, p.hours, p.startDate, p.endDate, p.status, p.academicYear, p.startEmailSent ? 1 : 0, p.endEmailSent ? 1 : 0, p.teacherId || null, p.anexoA1 || null, p.anexoA2 || null, p.anexoA3 || null, p.allSigned ? 1 : 0, p.a3EmailSent ? 1 : 0, p.a2Signed ? 1 : 0, p.a3Signed ? 1 : 0]);
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
  await run(`INSERT INTO companies (id, name, email, location, contactPerson, address, prospectingSent, prospectingYears, acceptedYears, rejectedYears, inactiveEmail, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [c.id, c.name, c.email, c.location, c.contactPerson || null, c.address || null, c.prospectingSent ? 1 : 0, c.prospectingYears || '', c.acceptedYears || '', c.rejectedYears || '', c.inactiveEmail ? 1 : 0, c.phone || null]);
  res.json({ success: true });
});

app.put('/api/companies/:id', async (req, res) => {
  const c = req.body;
  await run(`UPDATE companies SET name=?, email=?, location=?, contactPerson=?, address=?, prospectingSent=?, prospectingYears=?, acceptedYears=?, rejectedYears=?, inactiveEmail=?, phone=? WHERE id=?`, 
    [c.name, c.email, c.location, c.contactPerson || null, c.address || null, c.prospectingSent ? 1 : 0, c.prospectingYears || '', c.acceptedYears || '', c.rejectedYears || '', c.inactiveEmail ? 1 : 0, c.phone || null, req.params.id]);
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
  const { id, studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent, endEmailSent, teacherId, anexoA1, anexoA2, anexoA3, allSigned, a2Signed, a3Signed } = req.body;
  await run(`INSERT INTO placements (id, studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent, endEmailSent, teacherId, anexoA1, anexoA2, anexoA3, allSigned, a3EmailSent, a2Signed, a3Signed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [id, studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent ? 1 : 0, endEmailSent ? 1 : 0, teacherId || null, anexoA1 || null, anexoA2 || null, anexoA3 || null, allSigned ? 1 : 0, req.body.a3EmailSent ? 1 : 0, a2Signed ? 1 : 0, a3Signed ? 1 : 0]);
  res.json({ success: true });
});

app.put('/api/placements/:id', async (req, res) => {
  const { studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent, endEmailSent, teacherId, anexoA1, anexoA2, anexoA3, allSigned, a2Signed, a3Signed } = req.body;
  await run(`UPDATE placements SET studentId=?, companyId=?, hours=?, startDate=?, endDate=?, status=?, academicYear=?, startEmailSent=?, endEmailSent=?, teacherId=?, anexoA1=?, anexoA2=?, anexoA3=?, allSigned=?, a3EmailSent=?, a2Signed=?, a3Signed=? WHERE id=?`, 
    [studentId, companyId, hours, startDate, endDate, status, academicYear, startEmailSent ? 1 : 0, endEmailSent ? 1 : 0, teacherId || null, anexoA1 || null, anexoA2 || null, anexoA3 || null, allSigned ? 1 : 0, req.body.a3EmailSent ? 1 : 0, a2Signed ? 1 : 0, a3Signed ? 1 : 0, req.params.id]);
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
