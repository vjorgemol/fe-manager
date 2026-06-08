import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Minus, Trash2, Calendar, Clock, ArrowRight, Edit, Printer, Download, Mail, UserCheck, Search, FileText, CheckCircle2, AlertCircle, FileCheck, UploadCloud, Info, AlertTriangle } from 'lucide-react';
import type { PlacementStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { es, ca } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useSearchParams } from 'react-router-dom';

export const Placements: React.FC = () => {
  const { placements, students, companies, teachers, schoolName, academicYear, tutorName, tutorEmail, addPlacement, deletePlacement, updatePlacement, updateCompany } = useData();
  const { t, language } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [remindA3PlacementId, setRemindA3PlacementId] = useState<string | null>(null);
  const [parsingAlert, setParsingAlert] = useState<{show: boolean, message: string} | null>(null);
  const [parsingConfirm, setParsingConfirm] = useState<{show: boolean, instructorName: string, instructorDni: string, instructorEmail: string, company: any} | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const resetForm = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('edit');
    params.delete('new');
    setSearchParams(params);
  };
  const [formData, setFormData] = useState({
    studentId: '',
    companyId: '',
    hours: 380,
    startDate: '',
    endDate: '',
    status: 'pending' as PlacementStatus,
    teacherId: '',
    anexoA1: '' as string | undefined,
    anexoA2: '' as string | undefined,
    anexoA3: '' as string | undefined,
    allSigned: false,
    dailyHours: 4,
    excludedDates: [] as string[],
    weeklySchedule: { 0: 0, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 0 } as Record<number, number>
  });
  
  // CSV Import States
  const [importResult, setImportResult] = useState<{ count: number, skipped: number, error?: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ placements: any[], skipped: number } | null>(null);
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const getWorkingDaysCount = (startStr: string, endStr: string, schedule: Record<number, number>, fallback: number, excluded: string[] = []): number => {
    if (!startStr || !endStr) return 0;
    try {
      const start = parseLocalDate(startStr);
      const end = parseLocalDate(endStr);
      if (start > end) return 0;
      let count = 0;
      const current = new Date(start);
      while (current <= end) {
        const dayHours = schedule[current.getDay()] ?? fallback;
        if (dayHours > 0) {
          const dateStr = format(current, 'yyyy-MM-dd');
          if (!excluded.includes(dateStr)) count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return count;
    } catch (e) { return 0; }
  };

  // Returns hours for a specific date based on weekday schedule, fallback to dailyHours
  const getDayHours = (date: Date, schedule: Record<number, number>, fallback: number): number => {
    const h = schedule[date.getDay()];
    return h !== undefined ? h : fallback;
  };

  // Total hours: sum of all days where schedule > 0, IGNORING excluded dates (total is fixed)
  const getTotalHoursWithSchedule = (
    startStr: string, endStr: string,
    schedule: Record<number, number>, fallback: number
  ): number => {
    if (!startStr || !endStr) return 0;
    try {
      const start = parseLocalDate(startStr);
      const end = parseLocalDate(endStr);
      if (start > end) return 0;
      let total = 0;
      const current = new Date(start);
      while (current <= end) {
        const h = getDayHours(current, schedule, fallback);
        if (h > 0) total += h;
        current.setDate(current.getDate() + 1);
      }
      return Math.round(total * 10) / 10;
    } catch (e) { return 0; }
  };

  // Completed hours: only past days with schedule > 0, minus excluded (absent) dates
  const getCompletedHoursWithSchedule = (
    startStr: string, endStr: string,
    schedule: Record<number, number>, fallback: number,
    excluded: string[] = []
  ): number => {
    if (!startStr || !endStr) return 0;
    try {
      const start = parseLocalDate(startStr);
      const end = parseLocalDate(endStr);
      if (start > end) return 0;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      if (today < start) return 0;
      const limit = today > end ? end : today;
      let total = 0;
      const current = new Date(start);
      while (current <= limit) {
        const h = getDayHours(current, schedule, fallback);
        if (h > 0) {
          const dateStr = format(current, 'yyyy-MM-dd');
          if (!excluded.includes(dateStr)) total += h;
        }
        current.setDate(current.getDate() + 1);
      }
      return Math.round(total * 10) / 10;
    } catch (e) { return 0; }
  };

  useEffect(() => {
    const handleReset = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.path === '/placements') {
        resetForm();
      }
    };
    window.addEventListener('breadcrumb-click', handleReset);
    return () => {
      window.removeEventListener('breadcrumb-click', handleReset);
      window.dispatchEvent(new CustomEvent('editing-element', { detail: { name: null } }));
    };
  }, [searchParams]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new') === 'true';

    if (editId) {
      if (editId === editingId) return; // Prevent resetting when already editing this placement
      const placement = placements.find(p => p.id === editId);
      if (placement) {
        let excluded: string[] = [];
        try {
          if (placement.excludedDates) {
            excluded = JSON.parse(placement.excludedDates);
            if (!Array.isArray(excluded)) excluded = [];
          }
        } catch (e) {
          excluded = [];
        }

        let weeklySchedule: Record<number, number> = { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 };
        try {
          if (placement.weeklySchedule) {
            const parsed = JSON.parse(placement.weeklySchedule);
            if (parsed && typeof parsed === 'object') {
              weeklySchedule = Object.fromEntries(
                Object.entries(parsed).map(([k, v]) => [Number(k), Number(v)])
              ) as Record<number, number>;
            }
          }
        } catch (e) {}

        const weekdaysCount = getWorkingDaysCount(placement.startDate, placement.endDate, excluded);
        const calculatedDaily = weekdaysCount > 0 ? Math.round((placement.hours / weekdaysCount) * 10) / 10 : 4;
        const currentDailyHours = placement.dailyHours !== undefined ? placement.dailyHours : calculatedDaily;

        // If weeklySchedule was empty (legacy data), populate from dailyHours
        const hasSchedule = placement.weeklySchedule && placement.weeklySchedule !== '{}';
        if (!hasSchedule) {
          weeklySchedule = { 0: 0, 1: currentDailyHours, 2: currentDailyHours, 3: currentDailyHours, 4: currentDailyHours, 5: currentDailyHours, 6: 0 };
        } else {
          // Ensure 0 and 6 exist (backward compat with old data missing sat/sun)
          if (weeklySchedule[0] === undefined) weeklySchedule[0] = 0;
          if (weeklySchedule[6] === undefined) weeklySchedule[6] = 0;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          studentId: placement.studentId,
          companyId: placement.companyId,
          hours: placement.hours,
          startDate: placement.startDate,
          endDate: placement.endDate,
          status: placement.status,
          teacherId: placement.teacherId || '',
          anexoA1: placement.anexoA1 || '',
          anexoA2: placement.anexoA2 || '',
          anexoA3: placement.anexoA3 || '',
          allSigned: !!placement.allSigned,
          dailyHours: currentDailyHours,
          excludedDates: excluded,
          weeklySchedule
        });
        setCompanySearch('');
        setEditingId(editId);
        setIsAdding(true);
        const student = students.find(s => s.id === placement.studentId);
        window.dispatchEvent(new CustomEvent('editing-element', { 
          detail: { name: `Editar: ${student ? `${student.firstName} ${student.lastName}` : 'Asignación'}` } 
        }));
      }
    } else if (isNew) {
      if (isAdding && editingId === null) return; // Prevent resetting when already adding a new placement
      setFormData({
        studentId: '',
        companyId: '',
        hours: 380,
        startDate: '',
        endDate: '',
        status: 'pending' as PlacementStatus,
        teacherId: '',
        anexoA1: '',
        anexoA2: '',
        anexoA3: '',
        allSigned: false,
        dailyHours: 4,
        excludedDates: [],
        weeklySchedule: { 0: 0, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 0 }
      });
      setCompanySearch('');
      setEditingId(null);
      setIsAdding(true);
      window.dispatchEvent(new CustomEvent('editing-element', { detail: { name: 'Nueva Asignación' } }));
    } else {
      if (!isAdding && editingId === null) return; // Prevent resetting when already closed
      setFormData({
        studentId: '',
        companyId: '',
        hours: 380,
        startDate: '',
        endDate: '',
        status: 'pending' as PlacementStatus,
        teacherId: '',
        anexoA1: '',
        anexoA2: '',
        anexoA3: '',
        allSigned: false,
        dailyHours: 4,
        excludedDates: [],
        weeklySchedule: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 }
      });
      setCompanySearch('');
      setEditingId(null);
      setIsAdding(false);
      window.dispatchEvent(new CustomEvent('editing-element', { detail: { name: null } }));
    }
  }, [searchParams, placements, students, editingId, isAdding]);

  React.useEffect(() => {
    if (formData.startDate && formData.endDate) {
      // Total is calculated WITHOUT excluded dates so clicking never changes it
      const calculatedHours = getTotalHoursWithSchedule(
        formData.startDate, formData.endDate,
        formData.weeklySchedule, formData.dailyHours
      );
      if (calculatedHours > 0 && calculatedHours !== formData.hours) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(prev => ({ ...prev, hours: calculatedHours }));
      }
    }
  }, [formData.startDate, formData.endDate, formData.dailyHours, formData.weeklySchedule]);

  const sortedPlacements = [...placements].sort((a, b) => {
    const studentA = students.find(s => s.id === a.studentId);
    const studentB = students.find(s => s.id === b.studentId);
    if (!studentA || !studentB) return 0;
    return studentA.lastName.localeCompare(studentB.lastName);
  });

  const filteredPlacements = sortedPlacements.filter(p => {
    const student = students.find(s => s.id === p.studentId);
    const company = companies.find(c => c.id === p.companyId);
    if (!student || !company) return false;
    
    const searchString = `${student.firstName} ${student.lastName} ${student.email} ${company.name} ${company.location}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  const availableStudents = students.filter(s => 
    !placements.some(p => p.studentId === s.id) || s.id === formData.studentId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId) {
      alert(language === 'val' ? "Per favor, cerca i selecciona una empresa de la llista." : "Por favor, busca y selecciona una empresa de la lista.");
      return;
    }
    const scheduleValues = Object.values(formData.weeklySchedule);
    const avgDailyHours = scheduleValues.length > 0
      ? Math.round((scheduleValues.reduce((a, b) => a + b, 0) / scheduleValues.length) * 10) / 10
      : formData.dailyHours;
    const submissionData = {
      ...formData,
      dailyHours: avgDailyHours,
      excludedDates: JSON.stringify(formData.excludedDates),
      weeklySchedule: JSON.stringify(formData.weeklySchedule)
    };
    if (editingId) {
      const original = placements.find(p => p.id === editingId);
      updatePlacement({ ...original, ...submissionData, id: editingId } as any);
    } else {
      addPlacement(submissionData as any);
    }
    resetForm();
  };

  const handleEdit = (placement: any) => {
    const params = new URLSearchParams(searchParams);
    params.set('edit', placement.id);
    params.delete('new');
    setSearchParams(params);
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'anexoA1' | 'anexoA2' | 'anexoA3') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert(language === 'val' ? 'Per favor, selecciona un arxiu PDF.' : 'Por favor, selecciona un archivo PDF.');
        e.target.value = '';
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, [field]: base64 }));

        if (field === 'anexoA3') {
          try {
            const res = await fetch('/api/parse-a3', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ pdfBase64: base64 })
            });
            const data = await res.json();
            
            if (data.success && (data.instructorName || data.instructorDni || data.instructorEmail)) {
              const company = companies.find(c => c.id === formData.companyId);
              if (company) {
                const nameDiffers = data.instructorName && company.instructorName !== data.instructorName;
                const dniDiffers = data.instructorDni && company.instructorDni !== data.instructorDni;
                const emailDiffers = data.instructorEmail && company.instructorEmail !== data.instructorEmail;

                if (nameDiffers || dniDiffers || emailDiffers) {
                  setParsingConfirm({
                    show: true,
                    instructorName: data.instructorName || 'No encontrado',
                    instructorDni: data.instructorDni || 'No encontrado',
                    instructorEmail: data.instructorEmail || 'No encontrado',
                    company: company
                  });
                }
              }
            } else {
              console.log("Texto extraído:", data.fullText);
              setParsingAlert({
                show: true,
                message: "Se ha procesado el Anexo A3, pero no se ha podido encontrar el nombre ni el email del instructor de forma automática. Por favor, asegúrate de que el documento contiene los campos correspondientes."
              });
            }
          } catch (apiErr) {
            console.error('Error al analizar el A3:', apiErr);
          }
        }
      } catch (err) {
        console.error('Error al procesar el PDF:', err);
      }
    }
  };

  const getStatusBadge = (status: PlacementStatus) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      active: 'bg-emerald-100 text-emerald-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = { pending: 'Pendiente', active: 'En curso', completed: 'Finalizada', cancelled: 'Cancelada' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResult(null);
    setPendingImport(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          setImportResult({ count: 0, skipped: 0, error: 'El archivo está vacío o solo contiene la cabecera.' });
          return;
        }

        const splitCSVLine = (line: string, sep: string) => {
          const result = [];
          let curValue = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === sep && !inQuotes) {
              result.push(curValue.trim());
              curValue = '';
            } else curValue += char;
          }
          result.push(curValue.trim());
          return result;
        };

        const header = lines[0];
        const separator = header.includes(';') ? ';' : ',';
        const headers = splitCSVLine(header, separator).map(h => h.toLowerCase());
        
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo'));
        const companyIdx = headers.findIndex(h => h.includes('empresa'));
        const hoursIdx = headers.findIndex(h => h.includes('horas'));
        const startIdx = headers.findIndex(h => h.includes('inicio') || h.includes('fecha'));
        const endIdx = headers.findIndex(h => h.includes('fin'));
        const statusIdx = headers.findIndex(h => h.includes('estado'));

        if (emailIdx === -1 || companyIdx === -1) {
          setImportResult({ count: 0, skipped: 0, error: 'Formato no reconocido. El CSV debe tener al menos: Email Alumno y Empresa.' });
          return;
        }

        const toImport: any[] = [];
        let skipped = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = splitCSVLine(lines[i], separator);
          if (values.length < 2) continue;

          const email = values[emailIdx];
          const companyName = values[companyIdx];
          const hours = hoursIdx !== -1 && values[hoursIdx] ? parseInt(values[hoursIdx]) : 380;
          const startDate = startIdx !== -1 && values[startIdx] ? values[startIdx] : '';
          const endDate = endIdx !== -1 && values[endIdx] ? values[endIdx] : '';
          const statusStr = statusIdx !== -1 && values[statusIdx] ? values[statusIdx].toLowerCase() : 'pending';
          
          let status: PlacementStatus = 'pending';
          if (statusStr.includes('activa') || statusStr.includes('curso') || statusStr.includes('en curs')) status = 'active';
          if (statusStr.includes('finalizada') || statusStr.includes('completada') || statusStr.includes('finalitzada')) status = 'completed';
          if (statusStr.includes('cancelada') || statusStr.includes('cancel·lada')) status = 'cancelled';

          if (email && companyName) {
            const student = students.find(s => s.email.toLowerCase() === email.toLowerCase());
            const company = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());

            if (student && company) {
              // Check for duplicate placement (same student and company)
              const isDuplicate = placements.some(p => p.studentId === student.id && p.companyId === company.id);

              if (!isDuplicate) {
                toImport.push({
                  studentId: student.id,
                  companyId: company.id,
                  hours: isNaN(hours) ? 380 : hours,
                  startDate,
                  endDate,
                  status,
                  teacherId: '',
                  anexoA1: '',
                  anexoA2: '',
                  anexoA3: '',
                  allSigned: false,
                  a3EmailSent: false
                });
              } else {
                skipped++;
              }
            } else {
              skipped++; // Skip if student or company not found
            }
          }
        }
        
        if (toImport.length > 0 || skipped > 0) {
          setPendingImport({ placements: toImport, skipped });
        } else {
          setImportResult({ count: 0, skipped: 0, error: 'No se encontraron datos válidos en el archivo.' });
        }
      } catch (err: any) {
        setImportResult({ count: 0, skipped: 0, error: `Error: ${err.message}` });
      }

      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    pendingImport.placements.forEach(p => addPlacement(p));
    setImportResult({ count: pendingImport.placements.length, skipped: pendingImport.skipped });
    setPendingImport(null);
  };

  const exportToCSV = () => {
    if (placements.length === 0) return;
    const headers = ['Alumno', 'Email Alumno', 'Teléfono Alumno', 'Profesor Responsable', 'Empresa', 'Localidad', 'Contacto Empresa', 'Email Empresa', 'Horas', 'Inicio', 'Fin', 'Estado'];
    const rows = sortedPlacements.map(p => {
      const student = students.find(s => s.id === p.studentId);
      const company = companies.find(c => c.id === p.companyId);
      return [
        `"${student?.lastName}, ${student?.firstName}"`,
        `"${student?.email}"`,
        `"${student?.phone || ''}"`,
        `"${teachers.find(t => t.id === p.teacherId)?.name || ''}"`,
        `"${company?.name}"`,
        `"${company?.location}"`,
        `"${company?.contactPerson || ''}"`,
        `"${company?.email || ''}"`,
        p.hours,
        p.startDate,
        p.endDate,
        p.status
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `formacion_fe_${academicYear.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNotifyAll = () => {
    const studentEmails = placements
      .map(p => students.find(s => s.id === p.studentId)?.email)
      .filter((email): email is string => !!email);
    
    const uniqueEmails = [...new Set(studentEmails)];
    
    if (uniqueEmails.length === 0) {
      alert(language === 'val'
        ? 'No hi ha alumnes amb correu electrònic en les assignacions actuals.'
        : 'No hay alumnos con correo electrónico en las asignaciones actuales.'
      );
      return;
    }

    const subjectText = language === 'val'
      ? `[FE] Recordatori d'Inici de Formació - Curs ${academicYear}`
      : `[FE] Recordatorio de Inicio de Formación - Curso ${academicYear}`;
    const bodyText = language === 'val'
      ? `Hola a tots/es,\n\nUs escrivim des de ${schoolName} per recordar-vos que el vostre període de Formació en Empreses està a punt de començar.\n\nPer favor, recordeu repassar tota la documentació necessària i presentar-vos a les vostres empreses assignades en la data d'inici acordada.\n\nSi teniu algun dubte o sorgeix alguna incidència d'última hora, podeu respondre directament a aquest correu.\n\n¡Molt d'ànim i aprofiteu l'experiència!\n\nUna salutació,\n${tutorName}\n${schoolName}\n${tutorEmail}`
      : `Hola a todos,\n\nOs escribimos desde ${schoolName} para recordaros que vuestro periodo de Formación en Empresas está a punto de comenzar.\n\nPor favor, recordad repasar toda la documentación necesaria y presentaros en vuestras empresas asignadas en la fecha de inicio acordada.\n\nSi tenéis alguna duda o surge alguna incidencia de última hora, podéis responder directamente a este correo.\n\n¡Mucho ánimo y aprovechad la experiencia!\n\nUn saludo,\n${tutorName}\n${schoolName}\n${tutorEmail}`;

    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(bodyText);

    window.location.href = `mailto:?bcc=${uniqueEmails.join(',')}&subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('placements.title')}</h2>
            <span className="bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">{placements.length}</span>
          </div>
          <p className="text-zinc-500 mt-2">{t('placements.desc')}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button onClick={() => window.print()} className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm" title={t('placements.print')}>
            <Printer size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">{t('placements.print')}</span>
          </button>
          <input type="file" accept=".csv" ref={csvInputRef} className="hidden" onChange={handleCSVImport} />
          <button 
            onClick={() => csvInputRef.current?.click()}
            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm"
            title={t('placements.importCsv')}
          >
            <UploadCloud size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">{t('placements.importCsv')}</span>
          </button>
          <button onClick={exportToCSV} className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm" title={t('placements.exportCsv')}>
            <Download size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">{t('placements.exportCsv')}</span>
          </button>
          <button onClick={handleNotifyAll} disabled={placements.length === 0} className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm" title={t('placements.notify')}>
            <Mail size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">{t('placements.notify')}</span>
          </button>
          <button 
            onClick={() => {
              if (isAdding) {
                resetForm();
              } else {
                const params = new URLSearchParams(searchParams);
                params.set('new', 'true');
                params.delete('edit');
                setSearchParams(params);
                document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            disabled={students.length === 0 || companies.length === 0}
            className={`disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 sm:px-5 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm ${
              isAdding 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20'
            }`}
            title={isAdding ? t('students.cancel') : t('placements.newPlacement')}
          >
            {isAdding ? (
              <Minus size={20} className="sm:mr-2" />
            ) : (
              <Plus size={20} className="sm:mr-2" />
            )}
            <span className="hidden sm:inline">{isAdding ? t('students.cancel') : t('placements.newPlacement')}</span>
          </button>
        </div>
      </div>

      {(students.length === 0 || companies.length === 0) && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
          {t('placements.warningNoData')}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">{editingId ? t('placements.editPlacement') : t('placements.newPlacement')}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('placements.student')}</label>
              <select required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                <option value="">{t('placements.selectStudent')}</option>
                {availableStudents.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('placements.company')}</label>
              <div 
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 outline-none flex items-center"
              >
                <input 
                  type="text" 
                  className="bg-transparent outline-none w-full" 
                  placeholder={t('placements.selectCompany')}
                  value={companySearch || (formData.companyId ? companies.find(c => c.id === formData.companyId)?.name : '') || ''}
                  onChange={e => {
                    setCompanySearch(e.target.value);
                    setFormData({...formData, companyId: ''});
                    setIsCompanyDropdownOpen(true);
                  }}
                  onFocus={() => setIsCompanyDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsCompanyDropdownOpen(false), 200)}
                />
              </div>
              {isCompanyDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {companies
                    .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()) || c.location.toLowerCase().includes(companySearch.toLowerCase()))
                    .map(c => (
                      <div 
                        key={c.id} 
                        className="px-4 py-2 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0"
                        onClick={() => {
                          setFormData({...formData, companyId: c.id});
                          setCompanySearch('');
                          setIsCompanyDropdownOpen(false);
                        }}
                      >
                        <div className="font-medium text-zinc-900">{c.name}</div>
                        <div className="text-xs text-zinc-500">{c.location}</div>
                      </div>
                  ))}
                  {companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()) || c.location.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-zinc-500 text-center font-medium">{t('companies.noCompanies')}</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('placements.startDate')}</label>
              <input required type="date" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('placements.endDate')}</label>
              <input required type="date" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>

            {/* Weekly schedule widget: L M X J V S D */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-zinc-700 mb-2">{t('placements.form.weeklyHours')}</label>
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const weekdaysList = language === 'val'
                    ? [
                        { day: 1, label: 'Dilluns', short: 'Dl' },
                        { day: 2, label: 'Dimarts', short: 'Dt' },
                        { day: 3, label: 'Dimecres', short: 'Dc' },
                        { day: 4, label: 'Dijous', short: 'Dj' },
                        { day: 5, label: 'Divendres', short: 'Dv' },
                        { day: 6, label: 'Dissabte', short: 'Ds' },
                        { day: 0, label: 'Diumenge', short: 'Dg' },
                      ]
                    : [
                        { day: 1, label: 'Lunes', short: 'Lu' },
                        { day: 2, label: 'Martes', short: 'Ma' },
                        { day: 3, label: 'Miércoles', short: 'Mi' },
                        { day: 4, label: 'Jueves', short: 'Ju' },
                        { day: 5, label: 'Viernes', short: 'Vi' },
                        { day: 6, label: 'Sábado', short: 'Sá' },
                        { day: 0, label: 'Domingo', short: 'Do' },
                      ];
                  return weekdaysList.map(({ day, label, short }) => {
                    const isWeekend = day === 0 || day === 6;
                    const val = formData.weeklySchedule[day] ?? 0;
                    return (
                      <div key={day} className="flex flex-col items-center gap-1.5">
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${isWeekend ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {short}
                        </span>
                        <div className="relative w-full">
                          <input
                            type="number" min="0" max="24" step="0.5"
                            className={`w-full px-1 py-2.5 text-center border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold shadow-sm ${
                              val === 0
                                ? 'bg-zinc-100 border-zinc-200 text-zinc-400'
                                : 'bg-white border-zinc-200 text-zinc-800'
                            }`}
                            value={val}
                            title={label}
                            onChange={e => {
                              const newVal = Number(e.target.value);
                              setFormData(prev => ({
                                ...prev,
                                weeklySchedule: { ...prev.weeklySchedule, [day]: newVal }
                              }));
                            }}
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-bold pointer-events-none">h</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('placements.totalHours')}</label>
              <input required type="number" min="1" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.hours} onChange={e => setFormData({...formData, hours: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('placements.status')}</label>
              <select className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PlacementStatus})}>
                <option value="pending">{t('placements.status.pending')}</option>
                <option value="active">{t('placements.status.active')}</option>
                <option value="completed">{t('placements.status.completed')}</option>
                <option value="cancelled">{t('placements.status.cancelled')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('placements.tutor')}</label>
              <select className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})}>
                <option value="">{t('placements.form.noTeacher')}</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="md:col-span-2 lg:col-span-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-zinc-200">
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                      <Calendar size={18} className="text-primary-600" />
                      {t('placements.calendarTitle')}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{t('placements.calendarDesc')}</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-center shadow-sm">
                      <span className="text-[10px] text-zinc-500 block font-semibold uppercase tracking-wider">{t('placements.workingDaysCount')}</span>
                      <span className="text-lg font-bold text-zinc-900">{getWorkingDaysCount(formData.startDate, formData.endDate, formData.weeklySchedule, formData.dailyHours, formData.excludedDates)}</span>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-center shadow-sm">
                      <span className="text-[10px] text-zinc-500 block font-semibold uppercase tracking-wider">{t('placements.totalHours')}</span>
                      <span className="text-lg font-bold text-zinc-900">{getTotalHoursWithSchedule(formData.startDate, formData.endDate, formData.weeklySchedule, formData.dailyHours)}h</span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const totalCalcHours = getTotalHoursWithSchedule(formData.startDate, formData.endDate, formData.weeklySchedule, formData.dailyHours);
                  const completedHours = getCompletedHoursWithSchedule(formData.startDate, formData.endDate, formData.weeklySchedule, formData.dailyHours, formData.excludedDates);
                  const percentage = totalCalcHours > 0 ? Math.round((completedHours / totalCalcHours) * 100) : 0;

                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-zinc-600 flex items-center gap-1.5">
                          <Clock size={15} className="text-zinc-400" />
                          {t('placements.calendar.progress')}{' '}
                          <span className="font-bold text-zinc-900">{completedHours}h {language === 'val' ? 'de' : 'de'} {totalCalcHours}h</span>
                        </span>
                        <span className="text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-lg text-xs">{percentage}% {language === 'val' ? 'completat' : 'completado'}</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-3 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-primary-600 h-full rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                        <span>{language === 'val' ? 'Inici:' : 'Inicio:'} {formData.startDate}</span>
                        <span>{t('placements.calendar.today')}: {format(new Date(), "yyyy-MM-dd")}</span>
                        <span>{language === 'val' ? 'Fi:' : 'Fin:'} {formData.endDate}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Calendar monthly grids */}
                <div className="space-y-6">
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('placements.calendar.monthlyDistribution')}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(() => {
                      const months = [];
                      try {
                        const start = parseLocalDate(formData.startDate);
                        const end = parseLocalDate(formData.endDate);
                        if (start <= end) {
                          const current = new Date(start.getFullYear(), start.getMonth(), 1);
                          const last = new Date(end.getFullYear(), end.getMonth(), 1);
                          while (current <= last) {
                            months.push(new Date(current));
                            current.setMonth(current.getMonth() + 1);
                          }
                        }
                      } catch (e) {}

                      if (months.length === 0) {
                        return <div className="text-sm text-zinc-500 italic">{t('placements.calendar.invalidDates')}</div>;
                      }

                      const start = parseLocalDate(formData.startDate);
                      const end = parseLocalDate(formData.endDate);
                      const today = new Date();
                      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

                      const monthNames = language === 'val'
                        ? [
                            "Gener", "Febrer", "Març", "Abril", "Maig", "Juny",
                            "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"
                          ]
                        : [
                            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                          ];

                      return months.map((monthDate, mIdx) => {
                        const year = monthDate.getFullYear();
                        const month = monthDate.getMonth();
                        const monthName = monthNames[month];

                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const firstDayIndex = new Date(year, month, 1).getDay();
                        // Adjust to start on Monday: Monday = 0, ..., Sunday = 6
                        const startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

                        const cells = [];
                        // Padding cells
                        for (let i = 0; i < startDayOffset; i++) {
                          cells.push(<div key={`pad-${mIdx}-${i}`} className="h-10" />);
                        }

                        // Day cells
                        for (let d = 1; d <= daysInMonth; d++) {
                          const dayDate = new Date(year, month, d, 0, 0, 0, 0);
                          const isInside = dayDate >= start && dayDate <= end;
                          const schedHours = getDayHours(dayDate, formData.weeklySchedule, 0);
                          const isNonWorkingDay = schedHours === 0;
                          const isCompleted = isInside && !isNonWorkingDay && dayDate <= todayMidnight;
                          const isPending = isInside && !isNonWorkingDay && dayDate > todayMidnight;

                          let cellClass = "h-11 rounded-lg border flex flex-col items-center justify-between p-1 text-xs relative transition-all ";
                          let label = "";
                          const dateStr = isInside ? format(dayDate, 'yyyy-MM-dd') : '';
                          const isExcluded = isInside && !isNonWorkingDay && formData.excludedDates.includes(dateStr);

                          if (isInside) {
                            if (isNonWorkingDay) {
                              cellClass += "bg-zinc-100/60 border-zinc-200 text-zinc-400 cursor-not-allowed";
                              label = schedHours === 0 && (dayDate.getDay() === 0 || dayDate.getDay() === 6) ? t('placements.finde') : '0h';
                            } else if (isExcluded) {
                              cellClass += "bg-amber-50 border-amber-200 text-amber-600 shadow-sm cursor-pointer hover:bg-amber-100";
                              label = t('placements.absence');
                            } else if (isCompleted) {
                              cellClass += "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold shadow-sm cursor-pointer hover:opacity-80";
                              label = `+${schedHours}h`;
                            } else if (isPending) {
                              cellClass += "bg-blue-50 border-blue-200 text-blue-800 font-semibold shadow-sm cursor-pointer hover:opacity-80";
                              label = `+${schedHours}h`;
                            }
                          } else {
                            cellClass += "bg-transparent border-transparent text-zinc-300";
                          }

                          const handleDayClick = () => {
                            if (!isInside || isNonWorkingDay) return;
                            setFormData(prev => {
                              const alreadyExcluded = prev.excludedDates.includes(dateStr);
                              const newExcluded = alreadyExcluded
                                ? prev.excludedDates.filter(d => d !== dateStr)
                                : [...prev.excludedDates, dateStr];
                              return { ...prev, excludedDates: newExcluded };
                            });
                          };

                          cells.push(
                            <div 
                              key={`day-${mIdx}-${d}`} 
                              className={cellClass} 
                              onClick={handleDayClick}
                              title={isInside && !isNonWorkingDay ? `${d} ${monthName} - ${
                                isExcluded 
                                  ? (language === 'val' ? 'Absència (clic per revertir)' : 'Ausencia (clic para revertir)') 
                                  : (isCompleted 
                                      ? (language === 'val' ? 'Hores realitzades (clic per marcar absència)' : 'Horas realizadas (clic para marcar ausencia)') 
                                      : (language === 'val' ? 'Hores pendents (clic per marcar absència)' : 'Horas pendientes (clic para marcar ausencia)'))
                              }` : undefined}
                            >
                              <span className="self-start text-[10px] pl-0.5">{d}</span>
                              {label && <span className="text-[8px] font-bold mt-auto leading-none uppercase tracking-wider">{label}</span>}
                            </div>
                          );
                        }

                        return (
                          <div key={`month-${mIdx}`} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-col">
                            <h6 className="text-sm font-bold text-zinc-800 text-center mb-3">
                              {monthName} {year}
                            </h6>
                            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-zinc-400 mb-2">
                              <span>L</span>
                              <span>M</span>
                              <span>{language === 'val' ? 'Dc' : 'X'}</span>
                              <span>J</span>
                              <span>V</span>
                              <span>S</span>
                              <span>D</span>
                            </div>
                            <div className="grid grid-cols-7 gap-1 flex-1">
                              {cells}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-100">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center justify-between">
                  Anexo A1 ({language === 'val' ? 'Opcional' : 'Opcional'})
                  {formData.anexoA1 && <CheckCircle2 size={16} className="text-emerald-500" />}
                </label>
                {formData.anexoA1 ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                    <span className="text-sm text-emerald-700 font-medium flex items-center">
                      <FileCheck size={16} className="mr-2" />
                      {language === 'val' ? 'Document pujat' : 'Documento subido'}
                    </span>
                    <button type="button" onClick={() => setFormData({...formData, anexoA1: ''})} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title={language === 'val' ? 'Eliminar document' : 'Eliminar documento'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all cursor-pointer"
                    onChange={e => handleFileChange(e, 'anexoA1')}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center justify-between">
                  Anexo A2
                  {formData.anexoA2 && <CheckCircle2 size={16} className="text-emerald-500" />}
                </label>
                {formData.anexoA2 ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                    <span className="text-sm text-emerald-700 font-medium flex items-center">
                      <FileCheck size={16} className="mr-2" />
                      {language === 'val' ? 'Document pujat' : 'Documento subido'}
                    </span>
                    <button type="button" onClick={() => setFormData({...formData, anexoA2: ''})} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title={language === 'val' ? 'Eliminar document' : 'Eliminar documento'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all cursor-pointer"
                    onChange={e => handleFileChange(e, 'anexoA2')}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center justify-between">
                  Anexo A3
                  {formData.anexoA3 && <CheckCircle2 size={16} className="text-emerald-500" />}
                </label>
                {formData.anexoA3 ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                    <span className="text-sm text-emerald-700 font-medium flex items-center">
                      <FileCheck size={16} className="mr-2" />
                      {language === 'val' ? 'Document pujat' : 'Documento subido'}
                    </span>
                    <button type="button" onClick={() => setFormData({...formData, anexoA3: ''})} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title={language === 'val' ? 'Eliminar document' : 'Eliminar documento'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all cursor-pointer"
                    onChange={e => handleFileChange(e, 'anexoA3')}
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-3 flex items-center gap-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-zinc-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  checked={formData.allSigned}
                  onChange={e => setFormData({...formData, allSigned: e.target.checked})}
                />
                <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">{t('placements.form.allSigned')}</span>
              </label>
            </div>
            <div className="md:col-span-1 lg:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-xl font-medium transition-colors">
                {editingId ? t('placements.form.updateButton') : t('placements.form.createButton')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Buscador */}
      {placements.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center bg-zinc-50/50 print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder={t('placements.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
      )}

      <div className="space-y-4 print:hidden">
        {placements.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 bg-white rounded-2xl border border-dashed border-zinc-200">
            {t('placements.noPlacements')}
          </div>
        ) : filteredPlacements.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            {t('placements.noSearchResults')}
          </div>
        ) : (
          filteredPlacements.map(p => {
            const student = students.find(s => s.id === p.studentId);
            const company = companies.find(c => c.id === p.companyId);
            
            if (!student || !company) return null;

            return (
              <div 
                key={p.id} 
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-md transition-all relative cursor-pointer"
                onClick={() => handleEdit(p)}
              >
                <div className="md:static flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity md:order-last" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="p-2 text-zinc-400 hover:text-primary-500 transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeletingId(p.id); }} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 w-full">
                  <div className="flex-1 flex items-center gap-4">
                    {student.photoBase64 ? (
                      <img src={student.photoBase64} alt="" className="w-12 h-12 rounded-full object-cover border border-zinc-200 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900">{student.firstName} {student.lastName}</h3>
                      <p className="text-sm text-zinc-500">{schoolName} • {student.email}</p>
                      {p.teacherId && (
                        <p className="text-xs text-primary-600 font-medium flex items-center mt-1">
                          <UserCheck size={12} className="mr-1" />
                          Responsable: {teachers.find(t => t.id === p.teacherId)?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <ArrowRight className="hidden md:block text-zinc-300" />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary-700">{company.name}</h3>
                    <p className="text-sm text-zinc-500">{company.location}</p>
                  </div>
                </div>
                
                {/* Documentation Status */}
                <div className="w-full lg:w-48 flex flex-col gap-2 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">{t('placements.tabDocuments')}</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'A1', file: p.anexoA1 },
                      { label: 'A2', file: p.anexoA2 },
                      { label: 'A3', file: p.anexoA3 }
                    ].map((anexo, i) => (
                      <div key={i} className="group/doc relative">
                        {anexo.file ? (
                          <a 
                            href={anexo.file} 
                            download={`Anexo_${anexo.label}_${student.lastName}.pdf`}
                            className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            title={language === 'val' ? `Descarregar ${anexo.label}` : `Descargar ${anexo.label}`}
                          >
                            <FileText size={14} />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                          </a>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (anexo.label === 'A3') setRemindA3PlacementId(p.id);
                            }}
                            disabled={anexo.label !== 'A3'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${anexo.label === 'A3' ? 'bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200 cursor-pointer' : 'bg-zinc-100 text-zinc-400 border-zinc-200'} ${anexo.label === 'A1' ? 'opacity-50' : ''}`}
                            title={`${anexo.label} ${
                              language === 'val' 
                                ? `pendent${anexo.label === 'A3' ? " - Clic per avisar l'alumne" : ''}` 
                                : `pendiente${anexo.label === 'A3' ? ' - Clic para avisar al alumno' : ''}`
                            }`}
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        <span className="text-[9px] font-bold text-zinc-500 mt-0.5 block text-center">{anexo.label}</span>
                      </div>
                    ))}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${p.allSigned ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`} title={p.allSigned ? (language === 'val' ? 'Signat' : 'Firmado') : (language === 'val' ? 'Pendent de signatura' : 'Pendiente de firma')}>
                        <FileCheck size={14} />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500 mt-0.5 block text-center">{language === 'val' ? 'Signatura' : 'Firma'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full md:w-auto bg-zinc-50 p-4 rounded-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm font-medium text-zinc-700">
                      <Clock size={16} className="mr-2 text-zinc-400" />
                      {p.hours} {language === 'val' ? 'hores' : 'horas'}
                    </div>
                    <div className="flex items-center text-sm font-medium text-zinc-700">
                      <Calendar size={16} className="mr-2 text-zinc-400" />
                      {format(parseISO(p.startDate), "d MMM yyyy", { locale: language === 'val' ? ca : es })} - {format(parseISO(p.endDate), "d MMM yyyy", { locale: language === 'val' ? ca : es })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    {getStatusBadge(p.status)}
                    <select 
                      className="text-xs bg-white border border-zinc-200 rounded px-2 py-1 outline-none focus:border-primary-500"
                      value={p.status === 'cancelled' ? 'cancelled' : 'auto'}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'cancelled') {
                          updatePlacement({...p, status: 'cancelled'});
                        } else {
                          const today = new Date().toISOString().split('T')[0];
                          let autoStatus: PlacementStatus = 'active';
                          if (today < p.startDate) autoStatus = 'pending';
                          if (today > p.endDate) autoStatus = 'completed';
                          updatePlacement({...p, status: autoStatus});
                        }
                      }}
                    >
                      <option value="auto">{t('placements.status.auto')}</option>
                      <option value="cancelled">{t('placements.status.cancelled')}</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Printable Report View */}
      <div className="hidden print:block text-black bg-white">
        <div className="mb-8 border-b-2 border-black pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold mb-1 tracking-tight">
              {language === 'val' ? "Report d'Assignacions de Formació" : 'Reporte de Asignaciones de Formación'}
            </h1>
            <p className="text-xl text-zinc-600 font-medium">{schoolName} - {t('nav.academicYear')} {academicYear}</p>
          </div>
          <div className="text-right text-sm text-zinc-500">
            {language === 'val' ? 'Total assignacions:' : 'Total asignaciones:'} <span className="font-bold text-black">{sortedPlacements.length}</span>
          </div>
        </div>

        <div className="space-y-6">
          {filteredPlacements.map(p => {
            const student = students.find(s => s.id === p.studentId);
            const company = companies.find(c => c.id === p.companyId);
            if (!student || !company) return null;
            
            const statusLabels = { 
              pending: t('placements.status.pending'), 
              active: t('placements.status.active'), 
              completed: t('placements.status.completed'), 
              cancelled: t('placements.status.cancelled') 
            };
            
            return (
              <div key={`print-${p.id}`} className="break-inside-avoid border border-zinc-300 rounded-xl p-5 bg-zinc-50/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t('placements.student')}</div>
                    <div className="font-bold text-lg">{student.lastName}, {student.firstName}</div>
                    <div className="text-sm text-zinc-600">{student.email}{student.phone ? ` • ${student.phone}` : ''}</div>
                    {p.teacherId && (
                      <div className="text-xs text-zinc-500 mt-1 font-medium italic">
                        {t('placements.tutor')}: {teachers.find(t => t.id === p.teacherId)?.name}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-zinc-200 rounded-full text-xs font-bold uppercase tracking-wide">
                      {statusLabels[p.status]}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-zinc-200 pt-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                      {language === 'val' ? 'Empresa Destí' : 'Empresa Destino'}
                    </div>
                    <div className="font-bold text-base">{company.name}</div>
                    <div className="text-sm text-zinc-700">{company.address ? `${company.address}, ` : ''}{company.location}</div>
                    <div className="text-sm text-zinc-600 mt-1">
                      {company.contactPerson ? <span className="font-medium">Att: {company.contactPerson}</span> : ''}
                      {company.contactPerson && company.email ? ' • ' : ''}
                      {company.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                      {language === 'val' ? 'Detalls del Període' : 'Detalles del Periodo'}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-zinc-500 block">{language === 'val' ? 'Inici' : 'Inicio'}</span>
                        <span className="font-medium text-sm">{format(parseISO(p.startDate), "dd/MM/yyyy")}</span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 block">{language === 'val' ? 'Fi Previst' : 'Fin Previsto'}</span>
                        <span className="font-medium text-sm">{format(parseISO(p.endDate), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-xs text-zinc-500 block">{t('placements.totalHours')}</span>
                        <span className="font-bold text-base">{p.hours}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 pt-4 border-t border-zinc-300 text-center text-sm text-zinc-500">
          {language === 'val' 
            ? `Document generat automàticament per FE Connect el ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'a les' HH:mm", { locale: ca })}`
            : `Documento generado automáticamente por FE Connect el ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}`
          }
        </div>
      </div>

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{t('placements.delete.title')}</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {t('placements.delete.desc')}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingId(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                {t('students.cancel')}
              </button>
              <button onClick={() => { deletePlacement(deletingId); setDeletingId(null); }} className="px-5 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors flex items-center">
                {t('placements.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {remindA3PlacementId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setRemindA3PlacementId(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                <Mail size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{t('placements.a3.notifyTitle')}</h3>
            </div>
            {!!placements.find(p => p.id === remindA3PlacementId)?.a3EmailSent && (
              <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle size={20} className="shrink-0 text-blue-600 mt-0.5" />
                <p>
                  <strong>{language === 'val' ? 'Avís:' : 'Aviso:'}</strong>{' '}
                  {language === 'val' 
                    ? "Ja has enviat un recordatori d'Annex A3 a aquest alumne anteriorment." 
                    : 'Ya has enviado un recordatorio de Anexo A3 a este alumno anteriormente.'}
                </p>
              </div>
            )}
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {t('placements.a3.notifyDesc')}
              <br/><br/>
              <span className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 block text-sm">
                {language === 'val' ? (
                  <>
                    <strong>Nota:</strong> S'obrirà el teu client de correu. <strong>Recorda adjuntar l'arxiu PDF de l'Annex A3 manualment</strong> abans d'enviar el missatge. Els navegadors web no permeten adjuntar arxius automàticament per motius de seguretat.
                  </>
                ) : (
                  <>
                    <strong>Nota:</strong> Se abrirá tu client de correo. <strong>Recuerda adjuntar el archivo PDF del Anexo A3 manualmente</strong> antes de enviar el mensaje. Los navegadores web no permiten adjuntar archivos automáticamente por motivos de seguridad.
                  </>
                )}
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRemindA3PlacementId(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                {t('students.cancel')}
              </button>
              <button onClick={() => { 
                const p = placements.find(p => p.id === remindA3PlacementId);
                const student = students.find(s => s.id === p?.studentId);
                if (student?.email) {
                  const subjectText = language === 'val'
                    ? `Signatura de l'Annex A3 - Curs ${academicYear}`
                    : `Firma del Anexo A3 - Curso ${academicYear}`;
                  const bodyText = language === 'val'
                    ? `Hola ${student.firstName},\n\nEt adjunte l'Annex A3 de la teua formació.\n\nPer favor, revisa'l, signa'l i entrega'l el més prompte possible per poder formalitzar la documentació.\n\nUna salutació,\n${tutorName}\n${schoolName}`
                    : `Hola ${student.firstName},\n\nTe adjunto el Anexo A3 de tu formación.\n\nPor favor, revísalo, fírmalo y entrégalo lo antes posible para poder formalizar la documentación.\n\nUn saludo,\n${tutorName}\n${schoolName}`;
                  const subject = encodeURIComponent(subjectText);
                  const body = encodeURIComponent(bodyText);
                  window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
                  if (p) {
                    updatePlacement({...p, a3EmailSent: true});
                  }
                } else {
                  alert(language === 'val'
                    ? "L'alumne no té un correu electrònic configurat."
                    : 'El alumno no tiene un correo electrónico configurado.'
                  );
                }
                setRemindA3PlacementId(null); 
              }} className="px-5 py-2.5 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-colors flex items-center">
                {t('placements.a3.notifyButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Importación (Pre-check) */}
      {pendingImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPendingImport(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shrink-0"><UploadCloud size={24} /></div>
              <h3 className="text-xl font-bold text-zinc-900">{t('placements.import.confirmTitle')}</h3>
            </div>
            <div className="space-y-4 mb-8">
              <p className="text-zinc-600 leading-relaxed">{t('placements.import.confirmDesc')}</p>
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-2">
                <div className="flex justify-between items-center"><span className="text-zinc-500 text-sm">{t('placements.import.newPlacements')}</span><span className="font-bold text-zinc-900 text-lg">{pendingImport.placements.length}</span></div>
                {pendingImport.skipped > 0 && <div className="flex justify-between items-center border-t border-zinc-200 pt-2"><span className="text-zinc-500 text-sm">{t('placements.import.skipped')}</span><span className="font-medium text-zinc-400">{pendingImport.skipped}</span></div>}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPendingImport(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">{t('students.cancel')}</button>
              <button onClick={confirmImport} className="px-6 py-2.5 rounded-xl font-medium bg-primary-600 hover:bg-primary-700 text-white shadow-md transition-colors">{t('placements.import.confirmButton')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resultado Final de Importación */}
      {importResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setImportResult(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${importResult.error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {importResult.error ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{importResult.error ? t('placements.import.resultErrorTitle') : t('placements.import.resultSuccessTitle')}</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {importResult.error || (
                <>
                  {t('placements.import.resultSuccessDesc', { count: importResult.count })}
                  {importResult.skipped > 0 && <span className="block mt-2 text-zinc-500 text-sm italic">{t('placements.import.resultSkipped', { skipped: importResult.skipped })}</span>}
                </>
              )}
            </p>
            <div className="flex justify-end"><button onClick={() => setImportResult(null)} className="px-6 py-2.5 rounded-xl font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-colors">{t('placements.import.understand')}</button></div>
          </div>
        </div>
      )}

      {parsingConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setParsingConfirm(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                <Info size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{t('placements.parsing.instructorTitle')}</h3>
            </div>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              {t('placements.parsing.instructorDesc')}
            </p>
            <div className="bg-zinc-50 p-4 rounded-xl mb-6 border border-zinc-100">
              <div className="mb-2"><span className="font-semibold text-zinc-700">{language === 'val' ? 'Nom:' : 'Nombre:'}</span> {parsingConfirm.instructorName}</div>
              <div className="mb-2"><span className="font-semibold text-zinc-700">DNI/NIE:</span> {parsingConfirm.instructorDni}</div>
              <div><span className="font-semibold text-zinc-700">Email:</span> {parsingConfirm.instructorEmail}</div>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed font-medium">
              {t('placements.parsing.instructorConfirm')}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setParsingConfirm(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                {t('placements.parsing.instructorNo')}
              </button>
              <button onClick={() => { 
                updateCompany({
                  ...parsingConfirm.company,
                  instructorName: parsingConfirm.instructorName === 'No encontrado' ? parsingConfirm.company.instructorName : parsingConfirm.instructorName,
                  instructorDni: parsingConfirm.instructorDni === 'No encontrado' ? parsingConfirm.company.instructorDni : parsingConfirm.instructorDni,
                  instructorEmail: parsingConfirm.instructorEmail === 'No encontrado' ? parsingConfirm.company.instructorEmail : parsingConfirm.instructorEmail
                });
                setParsingConfirm(null); 
              }} className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors flex items-center">
                {t('placements.parsing.instructorYes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {parsingAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setParsingAlert(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{language === 'val' ? 'Avís' : 'Aviso'}</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {parsingAlert.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setParsingAlert(null)} className="px-5 py-2.5 rounded-xl font-medium bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors">
                {t('placements.import.understand')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
