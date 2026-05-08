import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Search, Edit, Mail, X, UploadCloud, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import type { Student } from '../types';

/**
 * Componente principal para la gestión de alumnos.
 * Permite listar, añadir, editar, eliminar e importar/exportar alumnos desde CSV.
 */
export const Students: React.FC = () => {
  // Acceso al estado global de la aplicación a través del contexto
  const { students, addStudent, deleteStudent, updateStudent, academicYear } = useData();

  // Estados locales para la gestión de la interfaz
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', photoBase64: '', notes: '' });
  
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  
  // Estados para la lógica de importación/exportación
  const [importResult, setImportResult] = useState<{ count: number, skipped: number, error?: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ students: any[], skipped: number } | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Referencia al input de archivo oculto
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  /**
   * Procesa la lectura del archivo CSV seleccionado por el usuario.
   * Detecta automáticamente el separador y las columnas necesarias.
   */
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resetear estados de importación previos
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

        /**
         * Función interna para dividir una línea de CSV respetando las comillas.
         * Crucial para importar imágenes (Base64) que pueden contener comas.
         */
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
        const headers = splitCSVLine(header, separator);
        
        // Mapeo dinámico de índices de columnas por nombre
        const nameIdx = headers.findIndex(h => h.toLowerCase() === 'nombre');
        const lastNameIdx = headers.findIndex(h => h.toLowerCase().includes('apellido'));
        const emailIdx = headers.findIndex(h => h.toLowerCase().includes('correo') || h.toLowerCase() === 'email');
        const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('teléfono') || h.toLowerCase() === 'telefono');
        const photoIdx = headers.findIndex(h => h.toLowerCase().includes('foto') || h.toLowerCase().includes('image') || h.toLowerCase().includes('photo'));

        if (nameIdx === -1 || lastNameIdx === -1 || emailIdx === -1) {
          setImportResult({ count: 0, skipped: 0, error: 'Formato no reconocido. El CSV debe tener: Nombre, Apellidos, Email.' });
          return;
        }

        const toImport: any[] = [];
        let skipped = 0;

        // Procesar cada línea de datos
        for (let i = 1; i < lines.length; i++) {
          const values = splitCSVLine(lines[i], separator);
          if (values.length < 3) continue;

          const firstName = values[nameIdx];
          const lastName = values[lastNameIdx];
          const email = values[emailIdx];
          const phone = phoneIdx !== -1 ? values[phoneIdx] : '';
          const photoBase64 = photoIdx !== -1 ? values[photoIdx] : '';

          if (firstName && lastName && email) {
            // Comprobar duplicados por email antes de añadir a la lista pendiente
            if (!students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
              toImport.push({ firstName, lastName, email, phone: phone || '', photoBase64: photoBase64 || '' });
            } else {
              skipped++;
            }
          }
        }
        
        // Mostrar modal de confirmación si hay datos válidos
        if (toImport.length > 0 || skipped > 0) {
          setPendingImport({ students: toImport, skipped });
        } else {
          setImportResult({ count: 0, skipped: 0, error: 'No se encontraron datos válidos en el archivo.' });
        }
      } catch (err: any) {
        setImportResult({ count: 0, skipped: 0, error: `Error: ${err.message}` });
      }

      // Limpiar el input para permitir volver a seleccionar el mismo archivo
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  /**
   * Ejecuta la inserción definitiva de los alumnos pendientes tras la confirmación del usuario.
   */
  const confirmImport = () => {
    if (!pendingImport) return;
    pendingImport.students.forEach(s => addStudent(s));
    setImportResult({ count: pendingImport.students.length, skipped: pendingImport.skipped });
    setPendingImport(null);
  };

  /**
   * Genera y descarga un archivo CSV con el listado actual de alumnos.
   * @param includeImages Indica si se debe incluir la columna Base64 con las fotos.
   */
  const exportToCSV = (includeImages: boolean) => {
    if (students.length === 0) return;
    const headers = ['Nombre', 'Apellidos', 'Email', 'Teléfono'];
    if (includeImages) headers.push('Foto');

    const rows = students.map(s => {
      const row = [
        `"${s.firstName}"`,
        `"${s.lastName}"`,
        `"${s.email}"`,
        `"${s.phone || ''}"`
      ];
      if (includeImages) row.push(`"${s.photoBase64 || ''}"`);
      return row.join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `alumnos_fct_${academicYear.replace('/', '_')}${includeImages ? '_con_fotos' : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
  };

  /**
   * Gestiona la carga de imágenes, redimensionándolas para optimizar el almacenamiento.
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFormData(prev => ({ ...prev, photoBase64: dataUrl }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Gestiona el envío del formulario de creación/edición manual.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const original = students.find(s => s.id === editingId);
      updateStudent({ ...original, ...formData, id: editingId } as any);
    } else {
      addStudent(formData);
    }
    resetForm();
  };

  /**
   * Prepara el formulario para editar un alumno existente.
   */
  const handleEdit = (student: any) => {
    setFormData({ firstName: student.firstName, lastName: student.lastName, email: student.email, phone: student.phone || '', photoBase64: student.photoBase64 || '', notes: student.notes || '' });
    setEditingId(student.id);
    setIsAdding(true);
    // Scroll suave hacia arriba para ver el formulario
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Resetea el formulario y limpia estados de edición.
   */
  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', photoBase64: '', notes: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  // Filtrado y ordenación de la lista mostrada en tiempo real
  const filtered = students.filter(s => 
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabecera y Botones de Acción */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Alumnos</h2>
            <span className="bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">{students.length}</span>
          </div>
          <p className="text-zinc-500 mt-2">Gestiona el listado de alumnos para prácticas.</p>
        </div>
        <div className="flex gap-3">
          {/* Input de archivo oculto activado por el botón */}
          <input type="file" accept=".csv" ref={csvInputRef} className="hidden" onChange={handleCSVImport} />
          <button 
            onClick={() => csvInputRef.current?.click()}
            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm"
          >
            <UploadCloud size={20} className="sm:mr-2" />
            <span className="hidden sm:inline">Importar Aules/FE Connect</span>
          </button>
          <button 
            onClick={() => setShowExportOptions(true)}
            className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm"
          >
            <Download size={20} className="sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button 
            onClick={() => {
              if (isAdding) resetForm();
              else {
                setIsAdding(true);
                document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 sm:px-5 sm:py-2.5 rounded-xl font-medium flex items-center transition-colors shadow-sm shadow-primary-500/20"
          >
            <Plus size={20} className="sm:mr-2" />
            <span className="hidden sm:inline">{isAdding ? 'Cancelar' : 'Añadir Alumno'}</span>
          </button>
        </div>
      </div>

      {/* Formulario de Alta/Edición */}
      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">{editingId ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre</label>
              <input required type="text" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Apellidos</label>
              <input required type="text" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <input required type="email" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Teléfono Móvil</label>
              <input type="tel" placeholder="Opcional" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Foto del Alumno (Opcional)</label>
              <div className="flex items-center gap-4">
                {formData.photoBase64 && <img src={formData.photoBase64} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-zinc-200 shadow-sm" />}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all cursor-pointer" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Notas / Indicaciones (Opcional)</label>
              <textarea 
                rows={3} 
                placeholder="Añade cualquier observación relevante sobre el alumno..." 
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-y" 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
              />
            </div>
            <div className="md:col-span-3 flex justify-end mt-2">
              <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-xl font-medium transition-colors">{editingId ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Listado de Alumnos */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        {/* Buscador */}
        <div className="p-4 border-b border-zinc-100 flex items-center bg-zinc-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input type="text" placeholder="Buscar alumno..." className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Vista de Tabla (Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nombre Completo</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No se encontraron alumnos.</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer" onDoubleClick={() => setViewingStudent(s as Student)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {s.photoBase64 ? <img src={s.photoBase64} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-200 shadow-sm" /> : <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">{s.firstName.charAt(0)}{s.lastName.charAt(0)}</div>}
                        <div className="font-medium text-zinc-900">{s.lastName}, {s.firstName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{s.email}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(s)} title="Editar" className="p-2 text-zinc-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"><Edit size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeletingId(s.id); }} title="Eliminar" className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista de Tarjetas (Mobile) */}
        <div className="md:hidden divide-y divide-zinc-100">
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-500">No se encontraron alumnos.</div>
          ) : (
            filtered.map(s => (
              <div key={s.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors" onClick={() => setViewingStudent(s as Student)}>
                <div className="flex items-center gap-3">
                  {s.photoBase64 ? <img src={s.photoBase64} alt="" className="w-10 h-10 rounded-full object-cover border border-zinc-200 shadow-sm" /> : <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm uppercase shadow-sm">{s.firstName.charAt(0)}{s.lastName.charAt(0)}</div>}
                  <div>
                    <div className="font-bold text-zinc-900 leading-tight">{s.lastName}, {s.firstName}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{s.email}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(s); }} className="p-2 text-zinc-400 hover:text-primary-500"><Edit size={18} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeletingId(s.id); }} className="p-2 text-zinc-400 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Vista Detallada del Alumno */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingStudent(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 pb-6 flex flex-col items-center text-center border-b border-zinc-100 relative">
              <button onClick={() => setViewingStudent(null)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors"><X size={20} /></button>
              {viewingStudent.photoBase64 ? <img src={viewingStudent.photoBase64} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-4" /> : <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-3xl uppercase shadow-lg border-4 border-white mb-4">{viewingStudent.firstName.charAt(0)}{viewingStudent.lastName.charAt(0)}</div>}
              <h3 className="text-2xl font-bold text-zinc-900">{viewingStudent.firstName} {viewingStudent.lastName}</h3>
              <p className="text-zinc-500 font-medium mt-1">{viewingStudent.email}</p>
              {viewingStudent.phone && <p className="text-zinc-500 font-medium mt-1 flex items-center justify-center gap-2"><span className="text-zinc-400">Tel:</span><a href={`tel:${viewingStudent.phone}`} className="text-primary-600 hover:underline">{viewingStudent.phone}</a></p>}
              {viewingStudent.notes && (
                <div className="mt-4 w-full text-left bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Notas</span>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{viewingStudent.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-zinc-50/50 flex flex-col gap-3">
              <a href={`mailto:${viewingStudent.email}`} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3.5 rounded-xl font-medium flex items-center justify-center shadow-md"><Mail size={20} className="mr-2" /> Enviar Correo</a>
              <button onClick={() => { setViewingStudent(null); handleEdit(viewingStudent); }} className="w-full bg-white border-2 border-zinc-200 hover:border-zinc-300 text-zinc-700 px-5 py-3.5 rounded-xl font-medium flex items-center justify-center"><Edit size={20} className="mr-2" /> Editar Datos</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Eliminación */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeletingId(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0"><Trash2 size={24} /></div>
              <h3 className="text-xl font-bold text-zinc-900">Eliminar alumno</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">¿Estás seguro de que deseas eliminar este alumno? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingId(null)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">Cancelar</button>
              <button onClick={() => { deleteStudent(deletingId); setDeletingId(null); }} className="px-5 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white shadow-md flex items-center">Sí, eliminar</button>
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
                <div className="flex justify-between items-center"><span className="text-zinc-500 text-sm">Alumnos nuevos:</span><span className="font-bold text-zinc-900 text-lg">{pendingImport.students.length}</span></div>
                {pendingImport.skipped > 0 && <div className="flex justify-between items-center border-t border-zinc-200 pt-2"><span className="text-zinc-500 text-sm">Ya registrados (se omitirán):</span><span className="font-medium text-zinc-400">{pendingImport.skipped}</span></div>}
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
                {importResult.error ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <h3 className="text-xl font-bold text-zinc-900">{importResult.error ? 'Error en la importación' : 'Importación completada'}</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {importResult.error || (
                <>
                  Se han importado <strong>{importResult.count}</strong> {importResult.count === 1 ? 'alumno' : 'alumnos'} correctamente.
                  {importResult.skipped > 0 && <span className="block mt-2 text-zinc-500 text-sm italic">({importResult.skipped} omitidos por estar ya registrados)</span>}
                </>
              )}
            </p>
            <div className="flex justify-end"><button onClick={() => setImportResult(null)} className="px-6 py-2.5 rounded-xl font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-colors">Entendido</button></div>
          </div>
        </div>
      )}

      {/* Modal: Opciones de Exportación */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowExportOptions(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shrink-0">
                <Download size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Exportar Alumnos</h3>
            </div>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              ¿Deseas incluir las fotos de los alumnos en el archivo CSV? 
              <span className="block mt-2 text-sm text-zinc-500 italic">Nota: Incluir imágenes aumentará significativamente el tamaño del archivo.</span>
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => exportToCSV(true)} 
                className="w-full px-6 py-3 rounded-xl font-medium bg-white border-2 border-primary-100 hover:border-primary-200 text-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <UploadCloud size={20} />
                Sí, incluir imágenes (CSV pesado)
              </button>
              <button 
                onClick={() => exportToCSV(false)} 
                className="w-full px-6 py-3 rounded-xl font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-colors"
              >
                No, solo texto (Recomendado)
              </button>
              <button 
                onClick={() => setShowExportOptions(false)} 
                className="w-full px-6 py-3 rounded-xl font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
