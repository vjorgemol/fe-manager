import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../fe_manager.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    academicYear TEXT,
    photoBase64 TEXT,
    phone TEXT
  )`);

  // Migrations for students table
  db.all("PRAGMA table_info(students)", (err, columns) => {
    if (!err && columns) {
      if (!columns.some(c => c.name === 'phone')) {
        db.run("ALTER TABLE students ADD COLUMN phone TEXT");
      }
      if (!columns.some(c => c.name === 'notes')) {
        db.run("ALTER TABLE students ADD COLUMN notes TEXT");
      }
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    location TEXT,
    contactPerson TEXT,
    phone TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS placements (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    companyId TEXT,
    hours INTEGER,
    startDate TEXT,
    endDate TEXT,
    status TEXT,
    academicYear TEXT,
    dailyHours INTEGER DEFAULT 4,
    excludedDates TEXT DEFAULT '[]'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);
  
  // Migrations for placements table
  db.all("PRAGMA table_info(placements)", (err, columns) => {
    if (!err && columns) {
      if (!columns.some(c => c.name === 'startEmailSent')) {
        db.run("ALTER TABLE placements ADD COLUMN startEmailSent INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'endEmailSent')) {
        db.run("ALTER TABLE placements ADD COLUMN endEmailSent INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'teacherId')) {
        db.run("ALTER TABLE placements ADD COLUMN teacherId TEXT");
      }
      if (!columns.some(c => c.name === 'anexoA1')) {
        db.run("ALTER TABLE placements ADD COLUMN anexoA1 TEXT");
      }
      if (!columns.some(c => c.name === 'anexoA2')) {
        db.run("ALTER TABLE placements ADD COLUMN anexoA2 TEXT");
      }
      if (!columns.some(c => c.name === 'anexoA3')) {
        db.run("ALTER TABLE placements ADD COLUMN anexoA3 TEXT");
      }
      if (!columns.some(c => c.name === 'anexoA5')) {
        db.run("ALTER TABLE placements ADD COLUMN anexoA5 TEXT");
      }
      if (!columns.some(c => c.name === 'allSigned')) {
        db.run("ALTER TABLE placements ADD COLUMN allSigned INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'a3EmailSent')) {
        db.run("ALTER TABLE placements ADD COLUMN a3EmailSent INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'a2Signed')) {
        db.run("ALTER TABLE placements ADD COLUMN a2Signed INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'a3Signed')) {
        db.run("ALTER TABLE placements ADD COLUMN a3Signed INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'trackingCount')) {
        db.run("ALTER TABLE placements ADD COLUMN trackingCount INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'dailyHours')) {
        db.run("ALTER TABLE placements ADD COLUMN dailyHours INTEGER DEFAULT 4");
      }
      if (!columns.some(c => c.name === 'excludedDates')) {
        db.run("ALTER TABLE placements ADD COLUMN excludedDates TEXT DEFAULT '[]'");
      }
      if (!columns.some(c => c.name === 'weeklySchedule')) {
        db.run("ALTER TABLE placements ADD COLUMN weeklySchedule TEXT DEFAULT '{}'");
      }
    }
  });

  // Migrations for companies table
  db.all("PRAGMA table_info(companies)", (err, columns) => {
    if (!err && columns) {
      if (!columns.some(c => c.name === 'address')) {
        db.run("ALTER TABLE companies ADD COLUMN address TEXT");
      }
      if (!columns.some(c => c.name === 'prospectingSent')) {
        db.run("ALTER TABLE companies ADD COLUMN prospectingSent INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'prospectingYears')) {
        db.run("ALTER TABLE companies ADD COLUMN prospectingYears TEXT DEFAULT ''");
      }
      if (!columns.some(c => c.name === 'acceptedYears')) {
        db.run("ALTER TABLE companies ADD COLUMN acceptedYears TEXT DEFAULT ''");
      }
      if (!columns.some(c => c.name === 'rejectedYears')) {
        db.run("ALTER TABLE companies ADD COLUMN rejectedYears TEXT DEFAULT ''");
      }
      if (!columns.some(c => c.name === 'inactiveEmail')) {
        db.run("ALTER TABLE companies ADD COLUMN inactiveEmail INTEGER DEFAULT 0");
      }
      if (!columns.some(c => c.name === 'phone')) {
        db.run("ALTER TABLE companies ADD COLUMN phone TEXT");
      }
      if (!columns.some(c => c.name === 'instructorName')) {
        db.run("ALTER TABLE companies ADD COLUMN instructorName TEXT");
      }
      if (!columns.some(c => c.name === 'instructorDni')) {
        db.run("ALTER TABLE companies ADD COLUMN instructorDni TEXT");
      }
      if (!columns.some(c => c.name === 'instructorEmail')) {
        db.run("ALTER TABLE companies ADD COLUMN instructorEmail TEXT");
      }
      if (!columns.some(c => c.name === 'academicYear')) {
        db.run("ALTER TABLE companies ADD COLUMN academicYear TEXT");
      }
    }
  });
  
  // Insert default settings if they don't exist
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('schoolName', 'Centro Educativo')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('academicYear', '25/26')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('reminderDays', '14')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('tutorName', 'Tutor FCT')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('tutorEmail', 'tutor@centro.edu')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('cycleName', 'Formación Profesional')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('templateProspecting', '')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('templateStart', '')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('templateTracking', '')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('templateEnd', '')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('cycleHours', '400')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('originAddress', '')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('googleMapsApiKey', '')`);

  // Default Auth Settings
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('admin', salt);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('adminPassword', '${hash}')`);
  
  const jwtSecret = crypto.randomUUID() + crypto.randomUUID();
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('jwtSecret', '${jwtSecret}')`);

  // Default 2FA Settings
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('twoFactorEnabled', 'false')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('twoFactorSecret', '')`);
});

export default db;
