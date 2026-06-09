import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Student, Company, Placement, Teacher, PlacementStatus } from '../types';
import { useAuth } from './AuthContext';

// URL base para las peticiones al servidor backend (Node.js/Express)
const API_URL = '/api';

/**
 * Definición de la estructura del contexto global de datos.
 * Incluye todos los estados y funciones de manipulación de datos.
 */
interface DataContextType {
  students: Student[];
  companies: Company[];
  placements: Placement[];
  teachers: Teacher[];
  schoolName: string;
  setSchoolName: (name: string) => void;
  academicYear: string;
  setAcademicYear: (year: string) => void;
  reminderDays: number;
  setReminderDays: (days: number) => void;
  tutorName: string;
  setTutorName: (name: string) => void;
  tutorEmail: string;
  setTutorEmail: (email: string) => void;
  cycleName: string;
  setCycleName: (name: string) => void;
  allStudents: Student[];
  allPlacements: Placement[];
  importData: (data: { students: Student[], companies: Company[], placements: Placement[], teachers?: Teacher[], schoolName: string, academicYear: string, reminderDays?: number, tutorName?: string, tutorEmail?: string, cycleName?: string, templateProspecting?: string, templateStart?: string, templateTracking?: string, templateEnd?: string, cycleHours?: number }) => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  addCompany: (company: Omit<Company, 'id'>) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  deleteTeacher: (id: string) => void;
  addPlacement: (placement: Omit<Placement, 'id'>) => void;
  updatePlacement: (placement: Placement) => void;
  deletePlacement: (id: string) => void;
  templateProspecting: string;
  setTemplateProspecting: (template: string) => void;
  templateStart: string;
  setTemplateStart: (template: string) => void;
  templateTracking: string;
  setTemplateTracking: (template: string) => void;
  templateEnd: string;
  setTemplateEnd: (template: string) => void;
  cycleHours: number;
  setCycleHours: (hours: number) => void;
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => void;
  originAddress: string;
  setOriginAddress: (address: string) => void;
  googleMapsApiKey: string;
  setGoogleMapsApiKey: (key: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Proveedor de Datos (DataProvider).
 * Encargado de la persistencia de datos (API) y la distribución del estado a toda la app.
 */
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, logout } = useAuth();

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) return Promise.reject(new Error('No token'));
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    return response;
  };

  // --- Estados de Configuración ---
  const [academicYear, setAcademicYear] = useState<string>('25/26');
  const [schoolName, setSchoolName] = useState<string>('Centro Educativo');
  const [reminderDays, setReminderDays] = useState<number>(14);
  const [tutorName, setTutorName] = useState<string>('Tutor FCT');
  const [tutorEmail, setTutorEmail] = useState<string>('tutor@centro.edu');
  const [cycleName, setCycleName] = useState<string>('Formación Profesional');
  const [templateProspecting, setTemplateProspecting] = useState<string>(`Estimados responsables de {companyName},\n\nMe pongo en contacto con ustedes desde {schoolName} para ofrecerles la posibilidad de acoger a nuestros alumnos del ciclo de {cycleName} para realizar la Formación en Empresas (FE) de {hours} horas.\n\nNuestros alumnos cuentan con una sólida base teórica y práctica, y están listos para integrarse en un entorno laboral real para complementar su aprendizaje. La acogida de alumnos en formación no supone ninguna relación laboral ni coste para la empresa.\n\nEstaríamos encantados de poder organizar una breve llamada o reunión para detallarles el proceso y las fechas en las que los alumnos podrían incorporarse.\n\nQuedo a su entera disposición.\n\nAtentamente,\n{tutorName}\n{schoolName}\n{tutorEmail}`);
  const [templateStart, setTemplateStart] = useState<string>(`Hola {contactPerson},\n\nEste es un correo recordatorio de que la formación de {cycleName} comenzará en breve.\n\nAlumno/a: {studentName}\nCentro Educativo: {schoolName}\nEmpresa: {companyName}\nFecha de Inicio: {startDate}\nHoras Totales: {hours}\n\nPara cualquier duda, estoy a su disposición.\n\nUn saludo,\n{tutorName}\n{tutorEmail}`);
  const [templateTracking, setTemplateTracking] = useState<string>(`Hola {contactPerson},\n\nMe pongo en contacto con ustedes para realizar el seguimiento semanal de la formación de {studentName}.\n\nPor favor, ¿podrían confirmarme si el alumno está respondiendo de manera adecuada a las tareas asignadas y si su evolución está siendo positiva?\n\nUn saludo y gracias por su colaboración,\n{tutorName}\n{tutorEmail}`);
  const [templateEnd, setTemplateEnd] = useState<string>(`Hola {contactPerson},\n\nLes escribo para recordarles que el periodo de Formación en Centros de Trabajo de {studentName} está próximo a su finalización ({endDate}).\n\nEs necesario que vayamos preparando la documentación de evaluación final. Me pondré en contacto con la empresa en los próximos días para concretar la visita de seguimiento y evaluación.\n\nUn saludo y gracias por su colaboración,\n{tutorName}\n{tutorEmail}`);
  const [cycleHours, setCycleHours] = useState<number>(400);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [originAddress, setOriginAddress] = useState<string>('');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');

  // --- Estados de Datos ---
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  /**
   * Efecto inicial: Carga todos los datos desde el servidor al arrancar la aplicación.
   */
  useEffect(() => {
    if (!token) return;
    // Cargar ajustes generales
    apiFetch(`/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.schoolName) setSchoolName(data.schoolName);
        if (data.academicYear) setAcademicYear(data.academicYear);
        if (data.reminderDays) setReminderDays(Number(data.reminderDays));
        if (data.tutorName) setTutorName(data.tutorName);
        if (data.tutorEmail) setTutorEmail(data.tutorEmail);
        if (data.cycleName) setCycleName(data.cycleName);
        if (data.templateProspecting) setTemplateProspecting(data.templateProspecting);
        if (data.templateStart) setTemplateStart(data.templateStart);
        if (data.templateTracking) setTemplateTracking(data.templateTracking);
        if (data.templateEnd) setTemplateEnd(data.templateEnd);
        if (data.cycleHours) setCycleHours(Number(data.cycleHours));
        if (data.twoFactorEnabled !== undefined) setTwoFactorEnabled(data.twoFactorEnabled === true || data.twoFactorEnabled === 'true');
        if (data.originAddress !== undefined) setOriginAddress(data.originAddress);
        if (data.googleMapsApiKey !== undefined) setGoogleMapsApiKey(data.googleMapsApiKey);
      })
      .catch(console.error);

    // Cargar colecciones de datos
    apiFetch(`/students`).then(res => res.json()).then(setStudents).catch(console.error);
    apiFetch(`/companies`).then(res => res.json()).then(setCompanies).catch(console.error);
    apiFetch(`/placements`).then(res => res.json()).then((data: Placement[]) => {
      setPlacements(data.map(p => ({ ...p, status: getComputedStatus(p) })));
    }).catch(console.error);
    apiFetch(`/teachers`).then(res => res.json()).then(setTeachers).catch(console.error);
  }, [token]);

  /**
   * Sincroniza un ajuste específico con la base de datos.
   */


  const updateSettings = (key: string, value: string) => {
    apiFetch(`/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    }).catch(console.error);
  };

  // Handlers para actualizar ajustes tanto en estado como en DB
  const handleSetSchoolName = (name: string) => { setSchoolName(name); updateSettings('schoolName', name); };
  const handleSetAcademicYear = (year: string) => { setAcademicYear(year); updateSettings('academicYear', year); };
  const handleSetReminderDays = (days: number) => { setReminderDays(days); updateSettings('reminderDays', days.toString()); };
  const handleSetTutorName = (name: string) => { setTutorName(name); updateSettings('tutorName', name); };
  const handleSetTutorEmail = (email: string) => { setTutorEmail(email); updateSettings('tutorEmail', email); };
  const handleSetCycleName = (name: string) => { setCycleName(name); updateSettings('cycleName', name); };

  const handleSetTemplateProspecting = (template: string) => { setTemplateProspecting(template); updateSettings('templateProspecting', template); };
  const handleSetTemplateStart = (template: string) => { setTemplateStart(template); updateSettings('templateStart', template); };
  const handleSetTemplateTracking = (template: string) => { setTemplateTracking(template); updateSettings('templateTracking', template); };
  const handleSetTemplateEnd = (template: string) => { setTemplateEnd(template); updateSettings('templateEnd', template); };
  const handleSetCycleHours = (hours: number) => { setCycleHours(hours); updateSettings('cycleHours', hours.toString()); };
  const handleSetTwoFactorEnabled = (enabled: boolean) => { setTwoFactorEnabled(enabled); updateSettings('twoFactorEnabled', enabled.toString()); };
  const handleSetOriginAddress = (address: string) => { setOriginAddress(address); updateSettings('originAddress', address); };
  const handleSetGoogleMapsApiKey = (key: string) => { setGoogleMapsApiKey(key); updateSettings('googleMapsApiKey', key); };

  /**
   * Calcula el curso académico anterior basándose en el actual (ej: "25/26" -> "24/25").
   */
  const getPreviousYear = (year: string) => {
    if (!year || !year.includes('/')) return year;
    const parts = year.split('/');
    const prev1 = parseInt(parts[0], 10) - 1;
    const prev2 = parseInt(parts[1], 10) - 1;
    return `${prev1}/${prev2}`;
  };

  // --- CRUD Alumnos ---
  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = { ...student, id: crypto.randomUUID(), academicYear };
    setStudents(prev => [...prev, newStudent]);
    apiFetch(`/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStudent) }).catch(console.error);
  };

  const updateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    apiFetch(`/students/${updated.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(console.error);
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setPlacements(prev => prev.filter(p => p.studentId !== id)); // Limpiar asignaciones huérfanas
    apiFetch(`/students/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // --- CRUD Empresas ---
  const addCompany = (company: Omit<Company, 'id'>) => {
    const newCompany = { ...company, id: crypto.randomUUID() };
    setCompanies(prev => [...prev, newCompany]);
    apiFetch(`/companies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCompany) }).catch(console.error);
  };

  const updateCompany = (updated: Company) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
    apiFetch(`/companies/${updated.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(console.error);
  };

  const deleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    setPlacements(prev => prev.filter(p => p.companyId !== id)); // Limpiar asignaciones huérfanas
    apiFetch(`/companies/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // Helper to compute completed hours for status
  const getCompletedHours = (p: Placement): number => {
    if (!p.startDate || !p.endDate) return 0;
    try {
      const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      };
      const start = parseLocalDate(p.startDate);
      const end = parseLocalDate(p.endDate);
      if (start > end) return 0;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      if (today < start) return 0;
      
      const limit = today > end ? end : today;
      let total = 0;
      const current = new Date(start);
      
      const schedule = p.weeklySchedule ? JSON.parse(p.weeklySchedule) : { 1:4, 2:4, 3:4, 4:4, 5:4 };
      const fallback = p.dailyHours !== undefined ? p.dailyHours : 4;
      const excluded = p.excludedDates ? (typeof p.excludedDates === 'string' ? JSON.parse(p.excludedDates) : p.excludedDates) : [];
      
      while (current <= limit) {
        const h = schedule[current.getDay()];
        const dayHours = h !== undefined ? h : fallback;
        
        if (dayHours > 0) {
          const dateStr = [
            current.getFullYear(),
            String(current.getMonth() + 1).padStart(2, '0'),
            String(current.getDate()).padStart(2, '0')
          ].join('-');
          if (!excluded.includes(dateStr)) total += dayHours;
        }
        current.setDate(current.getDate() + 1);
      }
      return Math.round(total * 10) / 10;
    } catch (e) {
      return 0;
    }
  };

  // Helper to compute automatic status
  const getComputedStatus = (p: Placement): PlacementStatus => {
    if (p.status === 'cancelled') return 'cancelled';
    const today = new Date().toISOString().split('T')[0];
    if (today < p.startDate) return 'pending';
    
    const completed = getCompletedHours(p);
    if (completed >= p.hours) return 'completed';
    
    return 'active';
  };

  // --- CRUD Profesores ---
  const addTeacher = (teacher: Omit<Teacher, 'id'>) => {
    const newTeacher = { ...teacher, id: crypto.randomUUID() };
    setTeachers(prev => [...prev, newTeacher]);
    apiFetch(`/teachers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTeacher) }).catch(console.error);
  };

  const deleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
    setPlacements(prev => prev.map(p => p.teacherId === id ? { ...p, teacherId: undefined } : p));
    apiFetch(`/teachers/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // --- CRUD Asignaciones (Placements) ---
  const addPlacement = (placement: Omit<Placement, 'id'>) => {
    const newPlacement = { ...placement, id: crypto.randomUUID(), academicYear, status: getComputedStatus(placement as Placement) };
    setPlacements(prev => [...prev, newPlacement]);
    apiFetch(`/placements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPlacement) }).catch(console.error);
  };

  const updatePlacement = (updated: Placement) => {
    const computedUpdated = { ...updated, status: getComputedStatus(updated) };
    setPlacements(prev => prev.map(p => p.id === computedUpdated.id ? computedUpdated : p));
    apiFetch(`/placements/${computedUpdated.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(computedUpdated) }).catch(console.error);
  };

  const deletePlacement = (id: string) => {
    setPlacements(prev => prev.filter(p => p.id !== id));
    apiFetch(`/placements/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  /**
   * Filtrado inteligente de datos según el curso académico seleccionado.
   * - Alumnos: Se muestran los del curso actual y el anterior (para facilitar re-asignaciones).
   * - Asignaciones: Solo se muestran las del curso actual.
   */
  const filteredStudents = students.filter(s => 
    s.academicYear === academicYear || s.academicYear === getPreviousYear(academicYear)
  );
  const filteredPlacements = placements.filter(p => p.academicYear === academicYear);

  /**
   * Importación masiva de datos (usada por la restauración de Backup XML).
   */
  const importData = (data: { students: Student[], companies: Company[], placements: Placement[], teachers?: Teacher[], schoolName: string, academicYear: string, reminderDays?: number, tutorName?: string, tutorEmail?: string, cycleName?: string, templateProspecting?: string, templateStart?: string, templateTracking?: string, templateEnd?: string, cycleHours?: number }) => {
    setStudents(data.students || []);
    setCompanies(data.companies || []);
    setPlacements(data.placements || []);
    setTeachers(data.teachers || []);
    setSchoolName(data.schoolName || 'Centro Educativo');
    setAcademicYear(data.academicYear || '25/26');
    if (data.reminderDays) setReminderDays(data.reminderDays);
    if (data.tutorName) setTutorName(data.tutorName);
    if (data.tutorEmail) setTutorEmail(data.tutorEmail);
    if (data.cycleName) setCycleName(data.cycleName);
    if (data.templateProspecting) setTemplateProspecting(data.templateProspecting);
    if (data.templateStart) setTemplateStart(data.templateStart);
    if (data.templateTracking) setTemplateTracking(data.templateTracking);
    if (data.templateEnd) setTemplateEnd(data.templateEnd);
    if (data.cycleHours) setCycleHours(data.cycleHours);
    
    // Enviar todo el paquete de importación al servidor para sobrescribir DB
    apiFetch(`/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(console.error);
  };

  return (
    <DataContext.Provider value={{
      students: filteredStudents, 
      allStudents: students,
      companies, 
      placements: filteredPlacements, 
      allPlacements: placements,
      teachers,
      schoolName, setSchoolName: handleSetSchoolName,
      academicYear, setAcademicYear: handleSetAcademicYear,
      reminderDays, setReminderDays: handleSetReminderDays,
      tutorName, setTutorName: handleSetTutorName,
      tutorEmail, setTutorEmail: handleSetTutorEmail,
      cycleName, setCycleName: handleSetCycleName,
      importData,
      addStudent, updateStudent, deleteStudent,
      addCompany, updateCompany, deleteCompany,
      addTeacher, deleteTeacher,
      addPlacement, updatePlacement, deletePlacement,
      templateProspecting, setTemplateProspecting: handleSetTemplateProspecting,
      templateStart, setTemplateStart: handleSetTemplateStart,
      templateTracking, setTemplateTracking: handleSetTemplateTracking,
      templateEnd, setTemplateEnd: handleSetTemplateEnd,
      cycleHours, setCycleHours: handleSetCycleHours,
      twoFactorEnabled, setTwoFactorEnabled: handleSetTwoFactorEnabled,
      originAddress, setOriginAddress: handleSetOriginAddress,
      googleMapsApiKey, setGoogleMapsApiKey: handleSetGoogleMapsApiKey
    }}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * Hook personalizado para acceder fácilmente a los datos en cualquier componente.
 */
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData debe usarse dentro de un DataProvider');
  return context;
};
