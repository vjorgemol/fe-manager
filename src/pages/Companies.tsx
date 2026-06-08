import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import { Plus, Minus, Trash2, MapPin, Edit, Search, Phone, Download, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Componente para la gestión del directorio de empresas.
 * Permite realizar el seguimiento de la colaboración por curso académico.
 */
export const Companies: React.FC = () => {
  const { companies, addCompany, deleteCompany, updateCompany, academicYear } = useData();
  const { t } = useLanguage();
  
  // Estados de la interfaz
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    location: '', 
    address: '', 
    contactPerson: '', 
    collaborationStatus: 'none' as 'none' | 'prospecting' | 'accepted' | 'rejected', 
    inactiveEmail: false, 
    phone: '',
    instructorName: '',
    instructorDni: '',
    instructorEmail: ''
  });
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const resetForm = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('edit');
    params.delete('new');
    setSearchParams(params);
  };

  // Estados para la importación CSV
  const [importResult, setImportResult] = useState<{ count: number, skipped: number, error?: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ companies: any[], skipped: number } | null>(null);
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleReset = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.path === '/companies') {
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
      const company = companies.find(c => c.id === editId);
      if (company) {
        let status: 'none' | 'prospecting' | 'accepted' | 'rejected' = 'none';
        if (company.acceptedYears?.includes(academicYear)) status = 'accepted';
        else if (company.rejectedYears?.includes(academicYear)) status = 'rejected';
        else if (company.prospectingYears?.includes(academicYear)) status = 'prospecting';

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({ 
          name: company.name, 
          email: company.email, 
          location: company.location, 
          address: company.address || '', 
          contactPerson: company.contactPerson || '', 
          collaborationStatus: status, 
          inactiveEmail: !!company.inactiveEmail,
          phone: company.phone || '',
          instructorName: company.instructorName || '',
          instructorDni: company.instructorDni || '',
          instructorEmail: company.instructorEmail || ''
        });
        setEditingId(editId);
        setIsAdding(true);
        window.dispatchEvent(new CustomEvent('editing-element', { 
          detail: { name: `Editar: ${company.name}` } 
        }));
      }
    } else if (isNew) {
      setFormData({ name: '', email: '', location: '', address: '', contactPerson: '', collaborationStatus: 'none', inactiveEmail: false, phone: '', instructorName: '', instructorDni: '', instructorEmail: '' });
      setEditingId(null);
      setIsAdding(true);
      window.dispatchEvent(new CustomEvent('editing-element', { detail: { name: 'Nueva Empresa' } }));
    } else {
      setFormData({ name: '', email: '', location: '', address: '', contactPerson: '', collaborationStatus: 'none', inactiveEmail: false, phone: '', instructorName: '', instructorDni: '', instructorEmail: '' });
      setEditingId(null);
      setIsAdding(false);
      window.dispatchEvent(new CustomEvent('editing-element', { detail: { name: null } }));
    }
  }, [searchParams, companies]);

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
        
        const nameIdx = headers.findIndex(h => h.includes('nombre') || h.includes('empresa'));
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo'));
        const locationIdx = headers.findIndex(h => h.includes('localidad') || h.includes('población') || h.includes('poblacion') || h.includes('ciudad') || h.includes('municipio'));
        const addressIdx = headers.findIndex(h => h.includes('dirección') || h.includes('direccion'));
        const contactPersonIdx = headers.findIndex(h => h.includes('contacto') || h.includes('persona'));
        const phoneIdx = headers.findIndex(h => h.includes('teléfono') || h.includes('telefono'));

        if (nameIdx === -1 || locationIdx === -1) {
          setImportResult({ count: 0, skipped: 0, error: 'Formato no reconocido. El CSV debe tener al menos: Nombre y Localidad.' });
          return;
        }

        const toImport: any[] = [];
        let skipped = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = splitCSVLine(lines[i], separator);
          if (values.length < 2) continue;

          const name = values[nameIdx];
          const location = values[locationIdx];
          const email = emailIdx !== -1 ? values[emailIdx] : '';
          const address = addressIdx !== -1 ? values[addressIdx] : '';
          const contactPerson = contactPersonIdx !== -1 ? values[contactPersonIdx] : '';
          const phone = phoneIdx !== -1 ? values[phoneIdx] : '';

          if (name && location) {
            // Check duplicates by exact name or email
            const isDuplicate = companies.some(c => 
              c.name.toLowerCase() === name.toLowerCase() || 
              (email && c.email.toLowerCase() === email.toLowerCase())
            );

            if (!isDuplicate) {
              toImport.push({ 
                name, 
                location, 
                email, 
                address, 
                contactPerson, 
                phone,
                collaborationStatus: 'none',
                inactiveEmail: false
              });
            } else {
              skipped++;
            }
          }
        }
        
        if (toImport.length > 0 || skipped > 0) {
          setPendingImport({ companies: toImport, skipped });
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
    pendingImport.companies.forEach(c => {
      addCompany({
        ...c,
        prospectingYears: '',
        acceptedYears: '',
        rejectedYears: ''
      });
    });
    setImportResult({ count: pendingImport.companies.length, skipped: pendingImport.skipped });
    setPendingImport(null);
  };

  /**
   * Gestiona el envío del formulario.
   * Calcula los históricos de colaboración (prospección, aceptado, rechazado) 
   * concatenando el curso actual a los campos correspondientes en la DB.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const company = companies.find(c => c.id === editingId);
      // Obtener listas actuales de años por cada estado
      let pYears = company?.prospectingYears ? company.prospectingYears.split(',').filter(Boolean) : [];
      let aYears = company?.acceptedYears ? company.acceptedYears.split(',').filter(Boolean) : [];
      let rYears = company?.rejectedYears ? company.rejectedYears.split(',').filter(Boolean) : [];
      
      // Limpiar el curso actual de todas las listas antes de re-asignar el nuevo estado
      pYears = pYears.filter(y => y !== academicYear);
      aYears = aYears.filter(y => y !== academicYear);
      rYears = rYears.filter(y => y !== academicYear);
      
      // Añadir el curso actual a la lista del estado seleccionado
      if (formData.collaborationStatus === 'prospecting') pYears.push(academicYear);
      if (formData.collaborationStatus === 'accepted') aYears.push(academicYear);
      if (formData.collaborationStatus === 'rejected') rYears.push(academicYear);
      
      updateCompany({ 
        ...formData, 
        id: editingId, 
        prospectingYears: pYears.join(','),
        acceptedYears: aYears.join(','),
        rejectedYears: rYears.join(',')
      } as any);
    } else {
      // Nueva empresa: asignar el año académico actual al estado inicial
      const pYears = formData.collaborationStatus === 'prospecting' ? academicYear : '';
      const aYears = formData.collaborationStatus === 'accepted' ? academicYear : '';
      const rYears = formData.collaborationStatus === 'rejected' ? academicYear : '';
      
      addCompany({ 
        ...formData, 
        prospectingYears: pYears,
        acceptedYears: aYears,
        rejectedYears: rYears
      } as any);
    }
    resetForm();
  };

  /**
   * Carga los datos de una empresa en el formulario para editarla.
   * Determina el estado de colaboración buscando el curso académico actual en las listas.
   */
  const handleEdit = (company: any) => {
    const params = new URLSearchParams(searchParams);
    params.set('edit', company.id);
    params.delete('new');
    setSearchParams(params);
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };



  /**
   * Exporta el listado de empresas a CSV.
   * Incluye una columna con el estado de colaboración calculado para el curso actual.
   */
  const exportToCSV = () => {
    if (companies.length === 0) return;
    const headers = ['Nombre', 'Email', 'Teléfono', 'Localidad', 'Dirección', 'Persona de Contacto', 'Email Inactivo', 'Estado'];
    const rows = companies.map(c => {
      let status = 'Sin contactar';
      if (c.acceptedYears?.includes(academicYear)) status = 'Colabora';
      else if (c.rejectedYears?.includes(academicYear)) status = 'No colabora';
      else if (c.prospectingYears?.includes(academicYear)) status = 'Prospección';

      return [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone || ''}"`,
        `"${c.location}"`,
        `"${c.address || ''}"`,
        `"${c.contactPerson || ''}"`,
        c.inactiveEmail ? 'SÍ' : 'NO',
        `"${status}"`
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `empresas_fct_${academicYear.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrado por múltiples campos de texto
  const filtered = companies.filter(c => 
    `${c.name} ${c.location} ${c.address || ''} ${c.email} ${c.contactPerson || ''} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabecera y Exportación */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('companies.title')}</h2>
            <span className="bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">{companies.length}</span>
          </div>
          <p className="text-zinc-500 mt-2">{t('companies.desc')}</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".csv" ref={csvInputRef} className="hidden" onChange={handleCSVImport} />
          <button 
            onClick={() => csvInputRef.current?.click()}
            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm"
          >
            <UploadCloud size={20} className="sm:mr-2" />
            <span className="hidden sm:inline">{t('companies.importCsv')}</span>
          </button>
          <button 
            onClick={exportToCSV}
            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm"
          >
            <Download size={20} className="sm:mr-2" />
            <span className="hidden sm:inline">{t('companies.exportCsv')}</span>
          </button>
          <button 
            onClick={() => {
              if (isAdding) resetForm();
              else {
                const params = new URLSearchParams(searchParams);
                params.set('new', 'true');
                params.delete('edit');
                setSearchParams(params);
                document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`p-2.5 sm:px-5 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm ${
              isAdding 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' 
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
            }`}
          >
            {isAdding ? (
              <Minus size={20} className="sm:mr-2" />
            ) : (
              <Plus size={20} className="sm:mr-2" />
            )}
            <span className="hidden sm:inline">{isAdding ? t('companies.cancel') : t('companies.newCompany')}</span>
          </button>
        </div>
      </div>

      {/* Formulario de Alta/Edición */}
      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">{editingId ? t('companies.editCompany') : t('companies.newCompany')}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.name')}</label>
              <input required type="text" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.email')}</label>
              <input required type="email" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.location')}</label>
              <input required type="text" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.address')}</label>
              <input type="text" placeholder={t('companies.form.addressPlaceholder')} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.contact')}</label>
              <input type="text" placeholder={language === 'val' ? 'Opcional' : 'Opcional'} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.phone')}</label>
              <input type="tel" placeholder={language === 'val' ? 'Opcional' : 'Opcional'} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            
            <div className="md:col-span-3 mt-4 pt-4 border-t border-zinc-100">
              <h4 className="font-semibold text-zinc-800 mb-4">{t('companies.form.instructorTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.instructorName')}</label>
                  <input type="text" placeholder="Ej: Enrique San Valero" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.instructorName} onChange={e => setFormData({...formData, instructorName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.instructorDni')}</label>
                  <input type="text" placeholder="Ej: 12345678A" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.instructorDni} onChange={e => setFormData({...formData, instructorDni: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.instructorEmail')}</label>
                  <input type="email" placeholder="Ej: instructor@empresa.com" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.instructorEmail} onChange={e => setFormData({...formData, instructorEmail: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('companies.form.status', { year: academicYear })}</label>
              <select 
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                value={formData.collaborationStatus}
                onChange={e => setFormData({...formData, collaborationStatus: e.target.value as any})}
              >
                <option value="none">{t('companies.form.status.none')}</option>
                <option value="prospecting">{t('companies.form.status.prospecting')}</option>
                <option value="accepted">{t('companies.form.status.accepted')}</option>
                <option value="rejected">{t('companies.form.status.rejected')}</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl hover:bg-red-100 transition-colors mt-6">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500 bg-white"
                  checked={formData.inactiveEmail}
                  onChange={e => setFormData({...formData, inactiveEmail: e.target.checked})}
                />
                <span className="text-sm font-medium text-red-700" title={t('companies.form.inactiveEmailTooltip')}>{t('companies.form.inactiveEmail')}</span>
              </label>
            </div>
            <div className="md:col-span-3 flex justify-end mt-4 pt-4 border-t border-zinc-100">
              <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-xl font-medium transition-colors">
                {editingId ? t('companies.form.update') : t('companies.form.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-100 flex items-center bg-zinc-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder={t('companies.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-white rounded-2xl border border-dashed border-zinc-200">
            {t('companies.noCompanies')}
          </div>
        ) : (
          filtered.map(c => (
            <div 
              key={c.id} 
              className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 group hover:shadow-md transition-all relative cursor-pointer"
              onClick={() => handleEdit(c)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-bold text-xl uppercase">
                    {c.name.substring(0, 1)}
                  </div>
                  {/* Etiquetas de estado dinámicas */}
                  {c.acceptedYears?.includes(academicYear) && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{t('companies.badge.collab')}</span>
                  )}
                  {c.rejectedYears?.includes(academicYear) && (
                    <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{t('companies.badge.noCollab')}</span>
                  )}
                  {c.prospectingYears?.includes(academicYear) && !c.acceptedYears?.includes(academicYear) && !c.rejectedYears?.includes(academicYear) && (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{t('companies.badge.prospect')}</span>
                  )}
                  {!!c.inactiveEmail && (
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{t('companies.badge.inactive')}</span>
                  )}
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="text-zinc-400 hover:text-primary-500 transition-colors"><Edit size={18} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeletingId(c.id); }} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">{c.name}</h3>
              {c.contactPerson && <p className="text-sm font-medium text-zinc-700 mb-1">Att: {c.contactPerson}</p>}
              <div className="flex flex-col gap-1 mb-4">
                <p className="text-sm text-zinc-500">{c.email}</p>
                {c.phone && (
                  <p className="text-sm text-zinc-500 flex items-center gap-1.5">
                    <Phone size={14} className="text-zinc-400" />
                    <a 
                      href={`tel:${c.phone}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      {c.phone}
                    </a>
                  </p>
                )}
              </div>
              
              {(c.instructorName || c.instructorEmail) && (
                <div className="mb-4 bg-zinc-50 border border-zinc-100 rounded-xl p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t('companies.form.instructorTitle').split(' (')[0]}</div>
                  <div className="text-sm font-medium text-zinc-800">{c.instructorName || 'Nombre no disponible'} {c.instructorDni ? `(${c.instructorDni})` : ''}</div>
                  <div className="text-sm text-zinc-500">{c.instructorEmail || 'Email no disponible'}</div>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center text-xs font-medium text-zinc-600 bg-zinc-50 inline-flex px-3 py-1.5 rounded-lg w-fit">
                  <MapPin size={14} className="mr-1.5 text-zinc-400 shrink-0" />
                  {c.location}
                </div>
                {(c.address || c.location) && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name} ${c.address ? `${c.address}, ${c.location}` : c.location}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center ml-1"
                  >
                    {t('companies.viewMaps')}
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0"><Trash2 size={24} /></div>
              <h3 className="text-xl font-bold text-zinc-900">{t('companies.delete.title')}</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {t('companies.delete.desc')}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingId(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">{t('companies.cancel')}</button>
              <button onClick={() => { deleteCompany(deletingId); setDeletingId(null); }} className="px-5 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors flex items-center">{t('students.delete.confirm')}</button>
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
              <h3 className="text-xl font-bold text-zinc-900">{t('companies.import.confirmTitle')}</h3>
            </div>
            <div className="space-y-4 mb-8">
              <p className="text-zinc-600 leading-relaxed">{t('companies.import.confirmDesc')}</p>
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-2">
                <div className="flex justify-between items-center"><span className="text-zinc-500 text-sm">{t('companies.import.newCompanies')}</span><span className="font-bold text-zinc-900 text-lg">{pendingImport.companies.length}</span></div>
                {pendingImport.skipped > 0 && <div className="flex justify-between items-center border-t border-zinc-200 pt-2"><span className="text-zinc-500 text-sm">{t('companies.import.skipped')}</span><span className="font-medium text-zinc-400">{pendingImport.skipped}</span></div>}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPendingImport(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">{t('companies.cancel')}</button>
              <button onClick={confirmImport} className="px-6 py-2.5 rounded-xl font-medium bg-primary-600 hover:bg-primary-700 text-white shadow-md transition-colors">{t('companies.import.confirmButton')}</button>
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
                {importResult.error ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{importResult.error ? t('companies.import.resultErrorTitle') : t('companies.import.resultSuccessTitle')}</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {importResult.error || (
                <>
                  {t('companies.import.resultSuccessDesc', { count: importResult.count })}
                  {importResult.skipped > 0 && <span className="block mt-2 text-zinc-500 text-sm italic">{t('companies.import.resultSkipped', { skipped: importResult.skipped })}</span>}
                </>
              )}
            </p>
            <div className="flex justify-end"><button onClick={() => setImportResult(null)} className="px-6 py-2.5 rounded-xl font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-colors">{t('companies.import.understand')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
