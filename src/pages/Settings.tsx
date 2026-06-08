import React, { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { Database, UploadCloud, DownloadCloud, AlertTriangle, CheckCircle2, Plus, UserCheck, Trash2, Mail, Lock, ShieldCheck, ShieldAlert, Smartphone, ChevronDown, ChevronUp, Settings as SettingsIcon, Shield, Server, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AccordionItem: React.FC<{ title: string; description: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, description, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full p-6 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors outline-none"
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
            <p className="text-zinc-500 text-sm mt-1">{description}</p>
          </div>
        </div>
        <div className="text-zinc-400 shrink-0 ml-4">
          {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </button>
      {isOpen && (
        <div className="p-6 pt-6 border-t border-zinc-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export const Settings: React.FC = () => {
  const { t } = useLanguage();
  const { 
    allStudents, companies, allPlacements, teachers, schoolName, academicYear, 
    reminderDays, setReminderDays, tutorName, setTutorName, tutorEmail, setTutorEmail, 
    cycleName, setCycleName, importData, addTeacher, deleteTeacher,
    templateProspecting, setTemplateProspecting,
    templateStart, setTemplateStart,
    templateTracking, setTemplateTracking,
    templateEnd, setTemplateEnd,
    cycleHours, setCycleHours,
    twoFactorEnabled, setTwoFactorEnabled,
    originAddress, setOriginAddress
  } = useData();
  const [newTeacherName, setNewTeacherName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpInput, setTotpInput] = useState<string>('');
  const [totpError, setTotpError] = useState<string>('');

  const exportToXML = () => {
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
    xml += `    <templateTracking>${escapeXml(templateTracking)}</templateTracking>\n`;
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
      xml += `      <dailyHours>${p.dailyHours !== undefined ? p.dailyHours : 4}</dailyHours>\n`;
      xml += `      <excludedDates>${escapeXml(p.excludedDates || '[]')}</excludedDates>\n`;
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

        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
          throw new Error(t('settings.xmlFormatError'));
        }

        const backupRoot = xmlDoc.getElementsByTagName("fe_connect_backup")[0];
        if (!backupRoot) {
          throw new Error(t('settings.xmlNotBackupError'));
        }

        const meta = backupRoot.getElementsByTagName("metadata")[0];
        const loadedSchoolName = meta?.getElementsByTagName("schoolName")[0]?.textContent || 'Centro Educativo';
        const loadedAcademicYear = meta?.getElementsByTagName("academicYear")[0]?.textContent || '25/26';
        const loadedReminderDays = Number(meta?.getElementsByTagName("reminderDays")[0]?.textContent) || 14;
        const loadedTutorName = meta?.getElementsByTagName("tutorName")[0]?.textContent || 'Tutor FCT';
        const loadedTutorEmail = meta?.getElementsByTagName("tutorEmail")[0]?.textContent || 'tutor@centro.edu';
        const loadedCycleName = meta?.getElementsByTagName("cycleName")[0]?.textContent || 'Formación Profesional';
        const loadedTemplateProspecting = meta?.getElementsByTagName("templateProspecting")[0]?.textContent || '';
        const loadedTemplateStart = meta?.getElementsByTagName("templateStart")[0]?.textContent || '';
        const loadedTemplateTracking = meta?.getElementsByTagName("templateTracking")[0]?.textContent || '';
        const loadedTemplateEnd = meta?.getElementsByTagName("templateEnd")[0]?.textContent || '';
        const loadedCycleHours = Number(meta?.getElementsByTagName("cycleHours")[0]?.textContent) || 400;

        const studentsList = Array.from(backupRoot.getElementsByTagName("student")).map(node => ({
          id: node.getElementsByTagName("id")[0]?.textContent || '',
          firstName: node.getElementsByTagName("firstName")[0]?.textContent || '',
          lastName: node.getElementsByTagName("lastName")[0]?.textContent || '',
          email: node.getElementsByTagName("email")[0]?.textContent || '',
          academicYear: node.getElementsByTagName("academicYear")[0]?.textContent || undefined,
          photoBase64: node.getElementsByTagName("photoBase64")[0]?.textContent || undefined
        }));

        const companiesList = Array.from(backupRoot.getElementsByTagName("company")).map(node => ({
          id: node.getElementsByTagName("id")[0]?.textContent || '',
          name: node.getElementsByTagName("name")[0]?.textContent || '',
          email: node.getElementsByTagName("email")[0]?.textContent || '',
          location: node.getElementsByTagName("location")[0]?.textContent || '',
          address: node.getElementsByTagName("address")[0]?.textContent || undefined,
          contactPerson: node.getElementsByTagName("contactPerson")[0]?.textContent || ''
        }));

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
          teacherId: node.getElementsByTagName("teacherId")[0]?.textContent || undefined,
          dailyHours: node.getElementsByTagName("dailyHours")[0]?.textContent ? Number(node.getElementsByTagName("dailyHours")[0].textContent) : undefined,
          excludedDates: node.getElementsByTagName("excludedDates")[0]?.textContent || '[]'
        }));

        const teachersList = Array.from(backupRoot.getElementsByTagName("teacher")).map(node => ({
          id: node.getElementsByTagName("id")[0]?.textContent || '',
          name: node.getElementsByTagName("name")[0]?.textContent || ''
        }));

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
          templateTracking: loadedTemplateTracking,
          templateEnd: loadedTemplateEnd,
          cycleHours: loadedCycleHours,
          teachers: teachersList
        });

        setImportStatus({ type: 'success', message: t('settings.importSuccessMessage') });
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (err: any) {
        setImportStatus({ type: 'error', message: err.message || 'Error desconocido al cargar el archivo.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('settings.header')}</h2>
        <p className="text-zinc-500 mt-2">{t('settings.subheader')}</p>
      </div>

      {importStatus && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 mb-6 ${
          importStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertTriangle className="shrink-0 mt-0.5" size={20} />}
          <div>
            <h4 className="font-semibold">{importStatus.type === 'success' ? t('settings.successTitle') : t('settings.errorTitle')}</h4>
            <p className="text-sm mt-1">{importStatus.message}</p>
          </div>
        </div>
      )}

      {/* --- CONFIGURACIÓN GENERAL --- */}
      <AccordionItem 
        title={t('settings.tabGeneral')} 
        description={t('settings.tabGeneralDesc')}
        icon={<SettingsIcon size={24} />}
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900">{t('settings.reminderDaysTitle')}</h3>
              <p className="text-zinc-500 text-sm mt-1">{t('settings.reminderDaysDesc')}</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <input 
                type="number" min="1" max="60"
                className="w-20 px-4 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-lg"
                value={reminderDays}
                onChange={e => setReminderDays(Number(e.target.value))}
              />
              <span className="text-zinc-500 font-medium whitespace-nowrap">{t('settings.daysLabel')}</span>
            </div>
          </div>

          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900">{t('settings.tutorDataTitle')}</h3>
              <p className="text-zinc-500 text-sm mt-1">{t('settings.tutorDataDesc')}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <input 
                type="text" placeholder={t('settings.tutorNamePlaceholder')}
                className="w-full sm:w-48 px-4 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={tutorName} onChange={e => setTutorName(e.target.value)}
              />
              <input 
                type="email" placeholder={t('settings.tutorEmailPlaceholder')}
                className="w-full sm:w-64 px-4 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={tutorEmail} onChange={e => setTutorEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900">{t('settings.cycleDataTitle')}</h3>
              <p className="text-zinc-500 text-sm mt-1">{t('settings.cycleDataDesc')}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <input 
                type="text" placeholder={t('settings.cycleNamePlaceholder')}
                className="w-full sm:w-80 px-4 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={cycleName} onChange={e => setCycleName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <input 
                  type="number" placeholder="Horas"
                  className="w-24 px-4 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={cycleHours} onChange={e => setCycleHours(Number(e.target.value))}
                />
                <span className="text-sm font-medium text-zinc-500">{t('settings.hoursLabel')}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900">{t('settings.teachersManagementTitle')}</h3>
              <p className="text-zinc-500 text-sm mt-1">{t('settings.teachersManagementDesc')}</p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto min-w-[300px]">
              <div className="flex gap-2">
                <input 
                  type="text" placeholder={t('settings.teacherNamePlaceholder')}
                  className="flex-1 px-4 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {teachers.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                      <UserCheck size={16} className="text-indigo-500" />
                      {t.name}
                    </div>
                    <button onClick={() => deleteTeacher(t.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {teachers.length === 0 && (
                  <p className="text-center text-xs text-zinc-400 py-2">{t('settings.noTeachers')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </AccordionItem>

      {/* --- PLANTILLAS DE EMAIL --- */}
      <AccordionItem
        title={t('settings.tabTemplates')}
        description={t('settings.tabTemplatesDesc')}
        icon={<Mail size={24} />}
      >
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">{t('settings.templateProspectingLabel')}</label>
            <textarea 
              className="w-full h-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder={t('settings.templateProspectingPlaceholder')}
              value={templateProspecting} onChange={e => setTemplateProspecting(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">{t('settings.templateStartLabel')}</label>
            <textarea 
              className="w-full h-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder={t('settings.templateStartPlaceholder')}
              value={templateStart} onChange={e => setTemplateStart(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">{t('settings.templateTrackingLabel')}</label>
            <textarea 
              className="w-full h-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder={t('settings.templateTrackingPlaceholder')}
              value={templateTracking} onChange={e => setTemplateTracking(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">{t('settings.templateEndLabel')}</label>
            <textarea 
              className="w-full h-32 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder={t('settings.templateEndPlaceholder')}
              value={templateEnd} onChange={e => setTemplateEnd(e.target.value)}
            />
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">{t('settings.dynamicVariablesTitle')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['{studentName}', '{companyName}', '{contactPerson}', '{cycleName}', '{schoolName}', '{tutorName}', '{tutorEmail}', '{startDate}', '{endDate}', '{hours}'].map(v => (
                <code key={v} className="text-[10px] bg-white border border-indigo-100 px-2 py-1 rounded text-indigo-600 font-mono text-center shadow-sm">{v}</code>
              ))}
            </div>
          </div>
        </div>
      </AccordionItem>

      {/* --- PLANIFICACIÓN DE VISITAS --- */}
      <AccordionItem
        title={t('settings.tabVisitsTitle')}
        description={t('settings.tabVisitsDesc')}
        icon={<MapPin size={24} />}
      >
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
            <h3 className="text-lg font-bold text-zinc-900 mb-2 flex items-center gap-2">
              <MapPin size={20} className="text-indigo-600" /> {t('settings.originAddressTitle')}
            </h3>
            <p className="text-zinc-500 mb-4 text-sm">{t('settings.originAddressDesc')}</p>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder={t('settings.originAddressPlaceholder')}
              value={originAddress} 
              onChange={e => setOriginAddress(e.target.value)}
            />
          </div>
        </div>
      </AccordionItem>

      {/* --- SEGURIDAD Y ACCESO --- */}
      <AccordionItem
        title={t('settings.tabSecurityTitle')}
        description={t('settings.tabSecurityDesc')}
        icon={<Shield size={24} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex flex-col h-full">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('settings.changePasswordTitle')}</h3>
            <p className="text-zinc-500 mb-6 text-sm">{t('settings.changePasswordDesc')}</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const oldPassword = target.oldPassword.value;
              const newPassword = target.newPassword.value;
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/change-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ oldPassword, newPassword })
                });
                if (res.ok) {
                  alert(t('settings.passwordUpdatedAlert'));
                  target.reset();
                } else {
                  const data = await res.json();
                  alert(data.error || t('settings.passwordUpdateErrorAlert'));
                }
              } catch (error) {
                alert(t('settings.connectionErrorAlert'));
              }
            }} className="space-y-4 mt-auto">
              <input type="password" name="oldPassword" placeholder={t('settings.oldPasswordPlaceholder')} required className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input type="password" name="newPassword" placeholder={t('settings.newPasswordPlaceholder')} required className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
                {t('settings.updateButton')}
              </button>
            </form>
          </div>

          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex flex-col h-full">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
              {twoFactorEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('settings.twoFactor')}</h3>
            <p className="text-zinc-500 mb-6 text-sm">
              {t('settings.twoFactorDesc')}
            </p>

            {twoFactorEnabled ? (
              <div className="space-y-4 mt-auto">
                <div className="p-3 bg-emerald-100/50 text-emerald-800 rounded-xl flex items-center gap-3 border border-emerald-200/50">
                  <CheckCircle2 className="shrink-0" size={18} />
                  <p className="text-sm font-medium">{t('settings.twoFactorActivated')}</p>
                </div>
                <button 
                  onClick={async () => {
                    const pwd = prompt(t('settings.twoFactorDisablePrompt'));
                    if (!pwd) return;
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('/api/2fa/disable', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ password: pwd })
                      });
                      if (res.ok) {
                        setTwoFactorEnabled(false);
                        alert(t('settings.twoFactorDisabledAlert'));
                      } else {
                        const data = await res.json();
                        alert(data.error || t('settings.twoFactorDisableErrorAlert'));
                      }
                    } catch (e) {
                      alert(t('settings.connectionErrorAlert'));
                    }
                  }}
                  className="w-full px-5 py-2.5 rounded-xl font-medium transition-colors bg-white border border-red-200 text-red-600 hover:bg-red-50"
                >
                  {t('settings.twoFactorDisabled')}
                </button>
              </div>
            ) : (
              <div className="space-y-4 mt-auto">
                {!qrCodeUrl ? (
                  <button 
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('/api/2fa/generate', { headers: { 'Authorization': `Bearer ${token}` } });
                        const data = await res.json();
                        setQrCodeUrl(data.qrCodeDataUrl);
                        setTotpSecret(data.secret);
                      } catch (e) {
                        alert(t('settings.qrGenerationErrorAlert'));
                      }
                    }}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Smartphone size={18} /> {t('settings.configureAuthenticator')}
                  </button>
                ) : (
                  <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <p className="text-xs text-zinc-500 font-medium">{t('settings.scanQrInstructions')}</p>
                    <div className="flex justify-center bg-zinc-50 p-2 rounded-lg">
                      <img src={qrCodeUrl} alt="QR Code 2FA" className="w-32 h-32" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" maxLength={6} value={totpInput}
                        onChange={e => setTotpInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-[0.5em] font-mono"
                        placeholder="000000"
                      />
                      {totpError && <p className="text-red-500 text-xs text-center">{totpError}</p>}
                      <button 
                        onClick={async () => {
                          setTotpError('');
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch('/api/2fa/enable', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ secret: totpSecret, token: totpInput })
                            });
                            if (res.ok) {
                              setTwoFactorEnabled(true);
                              setQrCodeUrl(null);
                              setTotpSecret(null);
                              setTotpInput('');
                            } else {
                              const data = await res.json();
                              setTotpError(data.error || t('settings.incorrectCodeAlert'));
                            }
                          } catch (e) {
                            setTotpError(t('settings.connectionErrorAlert'));
                          }
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                      >
                        {t('settings.verifyButton')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AccordionItem>

      {/* --- MANTENIMIENTO Y COPIAS --- */}
      <AccordionItem
        title={t('settings.tabMaintenanceTitle')}
        description={t('settings.tabMaintenanceDesc')}
        icon={<Server size={24} />}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex flex-col h-full">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <DownloadCloud size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('settings.exportDataTitle')}</h3>
              <p className="text-zinc-500 mb-6 text-sm">{t('settings.exportDataDesc')}</p>
              <button onClick={exportToXML} className="mt-auto w-full bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
                {t('settings.downloadXmlButton')}
              </button>
            </div>

            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-300 border-dashed flex flex-col h-full">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <UploadCloud size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('settings.restoreDataTitle')}</h3>
              <p className="text-zinc-500 mb-6 text-sm">{t('settings.restoreDataDesc')}</p>
              <input type="file" accept=".xml" ref={fileInputRef} onChange={importFromXML} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="mt-auto w-full bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 px-5 py-2.5 rounded-xl font-medium transition-colors">
                {t('settings.uploadXmlButton')}
              </button>
            </div>
          </div>

          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex items-start gap-4">
            <Database className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900 text-sm">{t('settings.aboutStorageTitle')}</h4>
              <p className="text-xs text-blue-800/80 mt-1">
                {t('settings.aboutStorageDesc')}
              </p>
            </div>
          </div>
        </div>
      </AccordionItem>
    </div>
  );
};
