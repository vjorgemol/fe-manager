import React, { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { Database, UploadCloud, DownloadCloud, AlertTriangle, CheckCircle2, Plus, UserCheck, Trash2, Mail } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    allStudents, companies, allPlacements, teachers, schoolName, academicYear, 
    reminderDays, setReminderDays, tutorName, setTutorName, tutorEmail, setTutorEmail, 
    cycleName, setCycleName, importData, addTeacher, deleteTeacher,
    templateProspecting, setTemplateProspecting,
    templateStart, setTemplateStart,
    templateEnd, setTemplateEnd,
    cycleHours, setCycleHours
  } = useData();
  const [newTeacherName, setNewTeacherName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const exportToXML = () => {
    // Helper to safely escape XML strings
    const escapeXml = (unsafe: string) => {
      if (!unsafe) return '';
      return unsafe.toString().replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<fe_connect_backup>\n`;
    xml += `  <metadata>\n`;
    xml += `    <schoolName>${escapeXml(schoolName)}</schoolName>\n`;
    xml += `    <academicYear>${escapeXml(academicYear)}</academicYear>\n`;
    xml += `    <reminderDays>${reminderDays}</reminderDays>\n`;
    xml += `    <tutorName>${escapeXml(tutorName)}</tutorName>\n`;
    xml += `    <tutorEmail>${escapeXml(tutorEmail)}</tutorEmail>\n`;
    xml += `    <cycleName>${escapeXml(cycleName)}</cycleName>\n`;
    xml += `    <templateProspecting>${escapeXml(templateProspecting)}</templateProspecting>\n`;
    xml += `    <templateStart>${escapeXml(templateStart)}</templateStart>\n`;
    xml += `    <templateEnd>${escapeXml(templateEnd)}</templateEnd>\n`;
    xml += `    <cycleHours>${cycleHours}</cycleHours>\n`;
    xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
    xml += `  </metadata>\n`;

    xml += `  <students>\n`;
    allStudents.forEach(s => {
      xml += `    <student>\n`;
      xml += `      <id>${escapeXml(s.id)}</id>\n`;
      xml += `      <firstName>${escapeXml(s.firstName)}</firstName>\n`;
      xml += `      <lastName>${escapeXml(s.lastName)}</lastName>\n`;
      xml += `      <email>${escapeXml(s.email)}</email>\n`;
      xml += `      <academicYear>${escapeXml(s.academicYear || '')}</academicYear>\n`;
      if (s.photoBase64) {
        xml += `      <photoBase64>${s.photoBase64}</photoBase64>\n`;
      }
      xml += `    </student>\n`;
    });
    xml += `  </students>\n`;

    xml += `  <companies>\n`;
    companies.forEach(c => {
      xml += `    <company>\n`;
      xml += `      <id>${escapeXml(c.id)}</id>\n`;
      xml += `      <name>${escapeXml(c.name)}</name>\n`;
      xml += `      <email>${escapeXml(c.email)}</email>\n`;
      xml += `      <location>${escapeXml(c.location)}</location>\n`;
      if (c.address) xml += `      <address>${escapeXml(c.address)}</address>\n`;
      xml += `      <contactPerson>${escapeXml(c.contactPerson || '')}</contactPerson>\n`;
      xml += `    </company>\n`;
    });
    xml += `  </companies>\n`;

    xml += `  <placements>\n`;
    allPlacements.forEach(p => {
      xml += `    <placement>\n`;
      xml += `      <id>${escapeXml(p.id)}</id>\n`;
      xml += `      <studentId>${escapeXml(p.studentId)}</studentId>\n`;
      xml += `      <companyId>${escapeXml(p.companyId)}</companyId>\n`;
      xml += `      <hours>${p.hours}</hours>\n`;
      xml += `      <startDate>${escapeXml(p.startDate)}</startDate>\n`;
      xml += `      <endDate>${escapeXml(p.endDate)}</endDate>\n`;
      xml += `      <status>${escapeXml(p.status)}</status>\n`;
      xml += `      <academicYear>${escapeXml(p.academicYear || '')}</academicYear>\n`;
      xml += `      <startEmailSent>${p.startEmailSent ? 'true' : 'false'}</startEmailSent>\n`;
      xml += `      <endEmailSent>${p.endEmailSent ? 'true' : 'false'}</endEmailSent>\n`;
      if (p.teacherId) xml += `      <teacherId>${escapeXml(p.teacherId)}</teacherId>\n`;
      xml += `    </placement>\n`;
    });
    xml += `  </placements>\n`;

    xml += `  <teachers>\n`;
    teachers.forEach(t => {
      xml += `    <teacher>\n`;
      xml += `      <id>${escapeXml(t.id)}</id>\n`;
      xml += `      <name>${escapeXml(t.name)}</name>\n`;
      xml += `    </teacher>\n`;
    });
    xml += `  </teachers>\n`;

    xml += `</fe_connect_backup>`;

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fe_connect_backup_${new Date().toISOString().split('T')[0]}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromXML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlText = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // Check for parse errors
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
          throw new Error("El archivo XML no tiene un formato válido.");
        }

        const backupRoot = xmlDoc.getElementsByTagName("fe_connect_backup")[0];
        if (!backupRoot) {
          throw new Error("El archivo no es una copia de seguridad válida de FE Connect.");
        }

        // Parse Metadata
        const meta = backupRoot.getElementsByTagName("metadata")[0];
        const loadedSchoolName = meta?.getElementsByTagName("schoolName")[0]?.textContent || 'Centro Educativo';
        const loadedAcademicYear = meta?.getElementsByTagName("academicYear")[0]?.textContent || '25/26';
        const loadedReminderDays = Number(meta?.getElementsByTagName("reminderDays")[0]?.textContent) || 14;
        const loadedTutorName = meta?.getElementsByTagName("tutorName")[0]?.textContent || 'Tutor FCT';
        const loadedTutorEmail = meta?.getElementsByTagName("tutorEmail")[0]?.textContent || 'tutor@centro.edu';
        const loadedCycleName = meta?.getElementsByTagName("cycleName")[0]?.textContent || 'Formación Profesional';
        const loadedTemplateProspecting = meta?.getElementsByTagName("templateProspecting")[0]?.textContent || '';
        const loadedTemplateStart = meta?.getElementsByTagName("templateStart")[0]?.textContent || '';
        const loadedTemplateEnd = meta?.getElementsByTagName("templateEnd")[0]?.textContent || '';
        const loadedCycleHours = Number(meta?.getElementsByTagName("cycleHours")[0]?.textContent) || 400;

        // Parse Students
        const studentsList = Array.from(backupRoot.getElementsByTagName("student")).map(node => ({
          id: node.getElementsByTagName("id")[0]?.textContent || '',
          firstName: node.getElementsByTagName("firstName")[0]?.textContent || '',
          lastName: node.getElementsByTagName("lastName")[0]?.textContent || '',
          email: node.getElementsByTagName("email")[0]?.textContent || '',
          academicYear: node.getElementsByTagName("academicYear")[0]?.textContent || undefined,
          photoBase64: node.getElementsByTagName("photoBase64")[0]?.textContent || undefined
        }));

        // Parse Companies
        const companiesList = Array.from(backupRoot.getElementsByTagName("company")).map(node => ({
          id: node.getElementsByTagName("id")[0]?.textContent || '',
          name: node.getElementsByTagName("name")[0]?.textContent || '',
          email: node.getElementsByTagName("email")[0]?.textContent || '',
          location: node.getElementsByTagName("location")[0]?.textContent || '',
          address: node.getElementsByTagName("address")[0]?.textContent || undefined,
          contactPerson: node.getElementsByTagName("contactPerson")[0]?.textContent || undefined
        }));

        // Parse Placements
        const placementsList = Array.from(backupRoot.getElementsByTagName("placement")).map(node => ({
          id: node.getElementsByTagName("id")[0]?.textContent || '',
          studentId: node.getElementsByTagName("studentId")[0]?.textContent || '',
          companyId: node.getElementsByTagName("companyId")[0]?.textContent || '',
          hours: Number(node.getElementsByTagName("hours")[0]?.textContent || 0),
          startDate: node.getElementsByTagName("startDate")[0]?.textContent || '',
          endDate: node.getElementsByTagName("endDate")[0]?.textContent || '',
          status: (node.getElementsByTagName("status")[0]?.textContent || 'pending') as any,
          academicYear: node.getElementsByTagName("academicYear")[0]?.textContent || undefined,
          startEmailSent: node.getElementsByTagName("startEmailSent")[0]?.textContent === 'true',
          endEmailSent: node.getElementsByTagName("endEmailSent")[0]?.textContent === 'true',
          teacherId: node.getElementsByTagName("teacherId")[0]?.textContent || undefined
        }));

        // Parse Teachers
        const teachersList = Array.from(backupRoot.getElementsByTagName("teacher")).map(node => ({
          id: node.getElementsByTagName("id")[0]?.textContent || '',
          name: node.getElementsByTagName("name")[0]?.textContent || ''
        }));

        // Import all
        importData({
          students: studentsList,
          companies: companiesList,
          placements: placementsList,
          schoolName: loadedSchoolName,
          academicYear: loadedAcademicYear,
          reminderDays: loadedReminderDays,
          tutorName: loadedTutorName,
          tutorEmail: loadedTutorEmail,
          cycleName: loadedCycleName,
          templateProspecting: loadedTemplateProspecting,
          templateStart: loadedTemplateStart,
          templateEnd: loadedTemplateEnd,
          cycleHours: loadedCycleHours,
          teachers: teachersList
        });

        setImportStatus({ type: 'success', message: 'Datos restaurados correctamente.' });
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (err: any) {
        setImportStatus({ type: 'error', message: err.message || 'Error desconocido al cargar el archivo.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Ajustes y Datos</h2>
        <p className="text-zinc-500 mt-2">Gestiona la copia de seguridad de toda la información del sistema.</p>
      </div>

      {importStatus && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          importStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertTriangle className="shrink-0 mt-0.5" size={20} />}
          <div>
            <h4 className="font-semibold">{importStatus.type === 'success' ? 'Éxito' : 'Error'}</h4>
            <p className="text-sm mt-1">{importStatus.message}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900">Días de antelación para recordatorios</h3>
          <p className="text-zinc-500 text-sm mt-1">Configura cuántos días antes del inicio/fin se mostrarán los avisos de formación en el Dashboard y Comunicaciones.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <input 
            type="number" 
            min="1" 
            max="60"
            className="w-20 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-center font-bold text-lg"
            value={reminderDays}
            onChange={e => setReminderDays(Number(e.target.value))}
          />
          <span className="text-zinc-500 font-medium whitespace-nowrap">días</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900">Datos del Tutor</h3>
          <p className="text-zinc-500 text-sm mt-1">Este nombre y correo se usarán como remitente en las comunicaciones automáticas.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Nombre del Tutor"
            className="w-full sm:w-48 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            value={tutorName}
            onChange={e => setTutorName(e.target.value)}
          />
          <input 
            type="email" 
            placeholder="Correo electrónico"
            className="w-full sm:w-64 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            value={tutorEmail}
            onChange={e => setTutorEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900">Datos del Ciclo Formativo</h3>
          <p className="text-zinc-500 text-sm mt-1">Este nombre aparecerá en el cuerpo de los correos automáticos.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Ej: Desarrollo de Aplicaciones Web"
            className="w-full sm:w-80 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            value={cycleName}
            onChange={e => setCycleName(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Horas"
              className="w-24 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={cycleHours}
              onChange={e => setCycleHours(Number(e.target.value))}
            />
            <span className="text-sm font-medium text-zinc-500">horas</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900">Gestión de Profesores</h3>
          <p className="text-zinc-500 text-sm mt-1">Añade los nombres de los profesores que gestionarán la formación.</p>
        </div>
        <div className="flex flex-col gap-4 w-full md:w-auto min-w-[300px]">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nombre completo del profesor"
              className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={newTeacherName}
              onChange={e => setNewTeacherName(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && newTeacherName.trim()) {
                  addTeacher({ name: newTeacherName.trim() });
                  setNewTeacherName('');
                }
              }}
            />
            <button 
              onClick={() => {
                if (newTeacherName.trim()) {
                  addTeacher({ name: newTeacherName.trim() });
                  setNewTeacherName('');
                }
              }}
              className="bg-zinc-900 text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {teachers.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <UserCheck size={16} className="text-primary-500" />
                  {t.name}
                </div>
                <button 
                  onClick={() => deleteTeacher(t.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {teachers.length === 0 && (
              <p className="text-center text-xs text-zinc-400 py-2">No hay profesores registrados.</p>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Plantillas de Email</h3>
            <p className="text-zinc-500 text-sm">Personaliza los textos de los correos automáticos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">1. Prospección de Empresas (Presentación)</label>
            <textarea 
              className="w-full h-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder="Escribe la plantilla para contactar con nuevas empresas..."
              value={templateProspecting}
              onChange={e => setTemplateProspecting(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">2. Aviso de Inicio de Formación</label>
            <textarea 
              className="w-full h-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder="Escribe la plantilla para avisar del inicio de la formación..."
              value={templateStart}
              onChange={e => setTemplateStart(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">3. Aviso de Finalización de Formación</label>
            <textarea 
              className="w-full h-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder="Escribe la plantilla para avisar del fin de la formación..."
              value={templateEnd}
              onChange={e => setTemplateEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Variables disponibles:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['{studentName}', '{companyName}', '{contactPerson}', '{cycleName}', '{schoolName}', '{tutorName}', '{tutorEmail}', '{startDate}', '{endDate}', '{hours}'].map(v => (
              <code key={v} className="text-[10px] bg-white border border-zinc-200 px-2 py-1 rounded text-primary-600 font-mono">{v}</code>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-full">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <DownloadCloud size={24} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">Exportar Datos (Backup)</h3>
          <p className="text-zinc-500 mb-6 text-sm">
            Descarga un archivo XML con todos los alumnos, empresas, asignaciones y configuraciones de todos los cursos. 
            Es recomendable hacerlo frecuentemente para no perder tu trabajo.
          </p>
          <button 
            onClick={exportToXML}
            className="mt-auto w-full bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3 rounded-xl font-medium transition-colors"
          >
            Descargar archivo XML
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm border-dashed flex flex-col h-full">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
            <UploadCloud size={24} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">Restaurar Datos</h3>
          <p className="text-zinc-500 mb-6 text-sm">
            Carga un archivo XML de una copia de seguridad anterior. <br/><strong className="text-red-500">Atención:</strong> Esta acción sobrescribirá todos los datos actuales del sistema.
          </p>
          
          <input 
            type="file" 
            accept=".xml" 
            ref={fileInputRef}
            onChange={importFromXML}
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="mt-auto w-full bg-white hover:bg-zinc-50 border-2 border-zinc-200 text-zinc-700 px-5 py-3 rounded-xl font-medium transition-colors"
          >
            Seleccionar archivo XML
          </button>
        </div>
      </div>

      <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex items-start gap-4">
        <Database className="text-zinc-400 shrink-0" size={24} />
        <div>
          <h4 className="font-semibold text-zinc-900">Sobre el almacenamiento</h4>
          <p className="text-sm text-zinc-500 mt-1">
            FE Connect utiliza una base de datos profesional local (SQLite). Tus datos están protegidos en tu propio ordenador y no se envían a internet. 
            Aunque ya no dependes de la caché del navegador, te recomendamos usar la herramienta de exportación XML periódicamente como copia de seguridad física de tus datos.
          </p>
        </div>
      </div>
    </div>
  );
};
