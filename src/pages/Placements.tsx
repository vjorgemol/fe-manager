import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Minus, Trash2, Calendar, Clock, ArrowRight, Edit, Printer, Download, Mail, UserCheck, Search, FileText, CheckCircle2, AlertCircle, FileCheck, UploadCloud, Info, AlertTriangle } from 'lucide-react';
import type { PlacementStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';

export const Placements: React.FC = () => {
  const { placements, students, companies, teachers, schoolName, academicYear, tutorName, tutorEmail, addPlacement, deletePlacement, updatePlacement, updateCompany } = useData();
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
  
  // CSV Import States
  const [importResult, setImportResult] = useState<{ count: number, skipped: number, error?: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ placements: any[], skipped: number } | null>(null);
  const csvInputRef = React.useRef<HTMLInputElement>(null);

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
      const placement = placements.find(p => p.id === editId);
      if (placement) {
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
          allSigned: !!placement.allSigned
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
        allSigned: false
      });
      setCompanySearch('');
      setEditingId(null);
      setIsAdding(true);
      window.dispatchEvent(new CustomEvent('editing-element', { detail: { name: 'Nueva Asignación' } }));
    } else {
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
        allSigned: false
      });
      setCompanySearch('');
      setEditingId(null);
      setIsAdding(false);
      window.dispatchEvent(new CustomEvent('editing-element', { detail: { name: null } }));
    }
  }, [searchParams, placements, students]);
  
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
    allSigned: false
  });

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
      alert("Por favor, busca y selecciona una empresa de la lista.");
      return;
    }
    if (editingId) {
      const original = placements.find(p => p.id === editingId);
      updatePlacement({ ...original, ...formData, id: editingId } as any);
    } else {
      addPlacement(formData);
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

  const resetForm = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('edit');
    params.delete('new');
    setSearchParams(params);
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
        alert('Por favor, selecciona un archivo PDF.');
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
          let statusStr = statusIdx !== -1 && values[statusIdx] ? values[statusIdx].toLowerCase() : 'pending';
          
          let status: PlacementStatus = 'pending';
          if (statusStr.includes('activa') || statusStr.includes('curso')) status = 'active';
          if (statusStr.includes('finalizada') || statusStr.includes('completada')) status = 'completed';
          if (statusStr.includes('cancelada')) status = 'cancelled';

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
      alert('No hay alumnos con correo electrónico en las asignaciones actuales.');
      return;
    }

    const subject = encodeURIComponent(`[FE] Recordatorio de Inicio de Formación - Curso ${academicYear}`);
    const body = encodeURIComponent(`Hola a todos,\n\nOs escribimos desde ${schoolName} para recordaros que vuestro periodo de Formación en Empresas está a punto de comenzar.\n\nPor favor, recordad repasar toda la documentación necesaria y presentaros en vuestras empresas asignadas en la fecha de inicio acordada.\n\nSi tenéis alguna duda o surge alguna incidencia de última hora, podéis responder directamente a este correo.\n\n¡Mucho ánimo y aprovechad la experiencia!\n\nUn saludo,\n${tutorName}\n${schoolName}\n${tutorEmail}`);

    window.location.href = `mailto:?bcc=${uniqueEmails.join(',')}&subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Asignación de Formación</h2>
            <span className="bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">{placements.length}</span>
          </div>
          <p className="text-zinc-500 mt-2">Gestiona la relación entre alumnos y empresas.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button onClick={() => window.print()} className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm" title="Imprimir">
            <Printer size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <input type="file" accept=".csv" ref={csvInputRef} className="hidden" onChange={handleCSVImport} />
          <button 
            onClick={() => csvInputRef.current?.click()}
            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm"
            title="Importar CSV"
          >
            <UploadCloud size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">Importar CSV</span>
          </button>
          <button onClick={exportToCSV} className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm" title="CSV">
            <Download size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={handleNotifyAll} disabled={placements.length === 0} className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm" title="Avisar a Todos">
            <Mail size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">Avisar</span>
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
            title={isAdding ? 'Cancelar' : 'Nueva Asignación'}
          >
            {isAdding ? (
              <Minus size={20} className="sm:mr-2" />
            ) : (
              <Plus size={20} className="sm:mr-2" />
            )}
            <span className="hidden sm:inline">{isAdding ? 'Cancelar' : 'Nueva Asignación'}</span>
          </button>
        </div>
      </div>

      {(students.length === 0 || companies.length === 0) && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
          Debes añadir al menos un alumno y una empresa antes de crear asignaciones.
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">{editingId ? 'Editar Formación' : 'Nueva Formación'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Alumno</label>
              <select required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                <option value="">Seleccionar alumno...</option>
                {availableStudents.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Empresa</label>
              <div 
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 outline-none flex items-center"
              >
                <input 
                  type="text" 
                  className="bg-transparent outline-none w-full" 
                  placeholder="Buscar empresa..." 
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
                    <div className="px-4 py-3 text-sm text-zinc-500 text-center">No se encontraron empresas</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Horas Totales</label>
              <input required type="number" min="1" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.hours} onChange={e => setFormData({...formData, hours: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha de Inicio</label>
              <input required type="date" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha de Fin</label>
              <input required type="date" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Estado</label>
              <select className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PlacementStatus})}>
                <option value="pending">Pendiente de inicio</option>
                <option value="active">En curso</option>
                <option value="completed">Finalizada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Profesor Responsable</label>
              <select className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})}>
                <option value="">No asignado</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-100">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center justify-between">
                  Anexo A1 (Opcional)
                  {formData.anexoA1 && <CheckCircle2 size={16} className="text-emerald-500" />}
                </label>
                {formData.anexoA1 ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                    <span className="text-sm text-emerald-700 font-medium flex items-center">
                      <FileCheck size={16} className="mr-2" />
                      Documento subido
                    </span>
                    <button type="button" onClick={() => setFormData({...formData, anexoA1: ''})} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Eliminar documento">
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
                      Documento subido
                    </span>
                    <button type="button" onClick={() => setFormData({...formData, anexoA2: ''})} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Eliminar documento">
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
                      Documento subido
                    </span>
                    <button type="button" onClick={() => setFormData({...formData, anexoA3: ''})} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Eliminar documento">
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
                <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">¿Están todos los anexos firmados?</span>
              </label>
            </div>
            <div className="md:col-span-1 lg:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-xl font-medium transition-colors">
                {editingId ? 'Actualizar Asignación' : 'Crear Asignación'}
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
              placeholder="Buscar por alumno, empresa o localidad..." 
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
            No hay formación asignada todavía.
          </div>
        ) : filteredPlacements.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            No se han encontrado resultados para tu búsqueda.
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
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">Documentación</span>
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
                              title={`Descargar ${anexo.label}`}
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
                              title={`${anexo.label} pendiente${anexo.label === 'A3' ? ' - Clic para avisar al alumno' : ''}`}
                            >
                              <FileText size={14} />
                            </button>
                          )}
                          <span className="text-[9px] font-bold text-zinc-500 mt-0.5 block text-center">{anexo.label}</span>
                        </div>
                      ))}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${p.allSigned ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`} title={p.allSigned ? 'Firmado' : 'Pendiente de firma'}>
                          <FileCheck size={14} />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-500 mt-0.5 block text-center">Firma</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full md:w-auto bg-zinc-50 p-4 rounded-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm font-medium text-zinc-700">
                      <Clock size={16} className="mr-2 text-zinc-400" />
                      {p.hours} horas
                    </div>
                    <div className="flex items-center text-sm font-medium text-zinc-700">
                      <Calendar size={16} className="mr-2 text-zinc-400" />
                      {format(parseISO(p.startDate), "d MMM yyyy", { locale: es })} - {format(parseISO(p.endDate), "d MMM yyyy", { locale: es })}
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
                      <option value="auto">Estado Automático</option>
                      <option value="cancelled">Cancelada</option>
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
            <h1 className="text-3xl font-bold mb-1 tracking-tight">Reporte de Asignaciones de Formación</h1>
            <p className="text-xl text-zinc-600 font-medium">{schoolName} - Curso {academicYear}</p>
          </div>
          <div className="text-right text-sm text-zinc-500">
            Total asignaciones: <span className="font-bold text-black">{sortedPlacements.length}</span>
          </div>
        </div>

        <div className="space-y-6">
          {filteredPlacements.map(p => {
            const student = students.find(s => s.id === p.studentId);
            const company = companies.find(c => c.id === p.companyId);
            if (!student || !company) return null;
            
            const statusLabels = { pending: 'Pendiente', active: 'En curso', completed: 'Finalizada', cancelled: 'Cancelada' };
            
            return (
              <div key={`print-${p.id}`} className="break-inside-avoid border border-zinc-300 rounded-xl p-5 bg-zinc-50/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Alumno</div>
                    <div className="font-bold text-lg">{student.lastName}, {student.firstName}</div>
                    <div className="text-sm text-zinc-600">{student.email}{student.phone ? ` • ${student.phone}` : ''}</div>
                    {p.teacherId && (
                      <div className="text-xs text-zinc-500 mt-1 font-medium italic">
                        Profesor Responsable: {teachers.find(t => t.id === p.teacherId)?.name}
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
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Empresa Destino</div>
                    <div className="font-bold text-base">{company.name}</div>
                    <div className="text-sm text-zinc-700">{company.address ? `${company.address}, ` : ''}{company.location}</div>
                    <div className="text-sm text-zinc-600 mt-1">
                      {company.contactPerson ? <span className="font-medium">Att: {company.contactPerson}</span> : ''}
                      {company.contactPerson && company.email ? ' • ' : ''}
                      {company.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Detalles del Periodo</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-zinc-500 block">Inicio</span>
                        <span className="font-medium text-sm">{format(parseISO(p.startDate), "dd/MM/yyyy")}</span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 block">Fin Previsto</span>
                        <span className="font-medium text-sm">{format(parseISO(p.endDate), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-xs text-zinc-500 block">Total Horas</span>
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
          Documento generado automáticamente por FE Connect el {format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
        </div>
      </div>

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Eliminar asignación</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              ¿Estás seguro de que deseas eliminar esta asignación de formación? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingId(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                Cancelar
              </button>
              <button onClick={() => { deletePlacement(deletingId); setDeletingId(null); }} className="px-5 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors flex items-center">
                Sí, eliminar
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
              <h3 className="text-xl font-bold text-zinc-900">Avisar al alumno</h3>
            </div>
            {!!placements.find(p => p.id === remindA3PlacementId)?.a3EmailSent && (
              <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle size={20} className="shrink-0 text-blue-600 mt-0.5" />
                <p><strong>Aviso:</strong> Ya has enviado un recordatorio de Anexo A3 a este alumno anteriormente.</p>
              </div>
            )}
            <p className="text-zinc-600 mb-8 leading-relaxed">
              ¿Deseas enviar un correo electrónico al alumno para enviarle el Anexo A3 y solicitar su firma?
              <br/><br/>
              <span className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 block text-sm">
                <strong>Nota:</strong> Se abrirá tu cliente de correo. <strong>Recuerda adjuntar el archivo PDF del Anexo A3 manualmente</strong> antes de enviar el mensaje. Los navegadores web no permiten adjuntar archivos automáticamente por motivos de seguridad.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRemindA3PlacementId(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                Cancelar
              </button>
              <button onClick={() => { 
                const p = placements.find(p => p.id === remindA3PlacementId);
                const student = students.find(s => s.id === p?.studentId);
                if (student?.email) {
                  const subject = encodeURIComponent(`Firma del Anexo A3 - Curso ${academicYear}`);
                  const body = encodeURIComponent(`Hola ${student.firstName},\n\nTe adjunto el Anexo A3 de tu formación.\n\nPor favor, revísalo, fírmalo y entrégalo lo antes posible para poder formalizar la documentación.\n\nUn saludo,\n${tutorName}\n${schoolName}`);
                  window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
                  if (p) {
                    updatePlacement({...p, a3EmailSent: true});
                  }
                } else {
                  alert('El alumno no tiene un correo electrónico configurado.');
                }
                setRemindA3PlacementId(null); 
              }} className="px-5 py-2.5 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-colors flex items-center">
                Sí, enviar aviso
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
              <h3 className="text-xl font-bold text-zinc-900">Confirmar importación</h3>
            </div>
            <div className="space-y-4 mb-8">
              <p className="text-zinc-600 leading-relaxed">Se han analizado los datos del archivo y esto es lo que se va a procesar:</p>
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-2">
                <div className="flex justify-between items-center"><span className="text-zinc-500 text-sm">Formaciones nuevas:</span><span className="font-bold text-zinc-900 text-lg">{pendingImport.placements.length}</span></div>
                {pendingImport.skipped > 0 && <div className="flex justify-between items-center border-t border-zinc-200 pt-2"><span className="text-zinc-500 text-sm">Omitidas (Ya registradas / Alumno o Empresa no encontrados):</span><span className="font-medium text-zinc-400">{pendingImport.skipped}</span></div>}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPendingImport(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">Cancelar</button>
              <button onClick={confirmImport} className="px-6 py-2.5 rounded-xl font-medium bg-primary-600 hover:bg-primary-700 text-white shadow-md transition-colors">Sí, importar todo</button>
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
              <h3 className="text-xl font-bold text-zinc-900">{importResult.error ? 'Error en la importación' : 'Importación completada'}</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {importResult.error || (
                <>
                  Se han importado <strong>{importResult.count}</strong> {importResult.count === 1 ? 'formación' : 'formaciones'} correctamente.
                  {importResult.skipped > 0 && <span className="block mt-2 text-zinc-500 text-sm italic">({importResult.skipped} omitidas)</span>}
                </>
              )}
            </p>
            <div className="flex justify-end"><button onClick={() => setImportResult(null)} className="px-6 py-2.5 rounded-xl font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-colors">Entendido</button></div>
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
              <h3 className="text-xl font-bold text-zinc-900">Instructor detectado</h3>
            </div>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              Se ha detectado la siguiente información en el Anexo A3:
            </p>
            <div className="bg-zinc-50 p-4 rounded-xl mb-6 border border-zinc-100">
              <div className="mb-2"><span className="font-semibold text-zinc-700">Nombre:</span> {parsingConfirm.instructorName}</div>
              <div className="mb-2"><span className="font-semibold text-zinc-700">DNI/NIE:</span> {parsingConfirm.instructorDni}</div>
              <div><span className="font-semibold text-zinc-700">Email:</span> {parsingConfirm.instructorEmail}</div>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed font-medium">
              ¿Quieres guardar estos datos como el instructor asignado en la ficha de la empresa?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setParsingConfirm(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
                No, mantener
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
                Sí, actualizar
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
              <h3 className="text-xl font-bold text-zinc-900">Aviso</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {parsingAlert.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setParsingAlert(null)} className="px-5 py-2.5 rounded-xl font-medium bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
