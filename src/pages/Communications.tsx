import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Mail, Send, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página de Comunicaciones.
 * Gestiona los avisos automáticos de inicio/fin de formación y la prospección de empresas.
 */
export const Communications: React.FC = () => {
  const { 
    students, companies, placements, schoolName, reminderDays, 
    updatePlacement, updateCompany, tutorName, tutorEmail, cycleName, academicYear,
    templateProspecting, templateStart, templateEnd, cycleHours
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'prospecting' | 'reminders'>('reminders');
  const [selectedCompany, setSelectedCompany] = useState('');

  const today = new Date();

  // Empresas que no han sido contactadas en el curso actual
  const prospectingCompanies = companies.filter(c => 
    !c.prospectingYears?.includes(academicYear) && 
    !c.acceptedYears?.includes(academicYear) && 
    !c.rejectedYears?.includes(academicYear) && 
    !placements.some(p => p.companyId === c.id)
  );

  /**
   * Abre el gestor de correo predeterminado del sistema.
   */
  const openMailTo = (to: string, subject: string, body: string) => {
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  /**
   * Función auxiliar para reemplazar variables en las plantillas de texto.
   */
  const replaceVars = (template: string, data: any) => {
    let result = template;
    const vars: any = {
      '{schoolName}': schoolName,
      '{tutorName}': tutorName,
      '{tutorEmail}': tutorEmail,
      '{cycleName}': cycleName,
      '{studentName}': data.studentName || '',
      '{companyName}': data.companyName || '',
      '{contactPerson}': data.contactPerson || '',
      '{startDate}': data.startDate || '',
      '{endDate}': data.endDate || '',
      '{hours}': data.hours || ''
    };

    Object.keys(vars).forEach(key => {
      result = result.split(key).join(vars[key]);
    });
    return result;
  };

  /**
   * Obtiene las formaciones que comienzan o terminan próximamente.
   */
  const getUpcomingPlacements = () => {
    return placements.filter(p => p.status === 'pending' || p.status === 'active')
      .map(p => {
        const student = students.find(s => s.id === p.studentId);
        const company = companies.find(c => c.id === p.companyId);
        const startDays = differenceInDays(parseISO(p.startDate), today);
        const endDays = differenceInDays(parseISO(p.endDate), today);

        let type = null;
        let days = null;

        if (p.status === 'pending' && startDays > 0 && startDays <= reminderDays && !p.startEmailSent) {
          type = 'start';
          days = startDays;
        } else if (p.status === 'active' && endDays > 0 && endDays <= reminderDays && !p.endEmailSent) {
          type = 'end';
          days = endDays;
        }

        if (type && student && company) {
          return { p, student, company, type, days };
        }
        return null;
      }).filter(Boolean) as any[];
  };

  const upcoming = getUpcomingPlacements();

  /**
   * Genera el contenido del email de prospección usando la plantilla configurable.
   */
  const getProspectingEmail = (companyId: string) => {
    const comp = companies.find(c => c.id === companyId);
    if (!comp) return { to: '', subject: '', body: '' };

    const body = replaceVars(templateProspecting, {
      companyName: comp.name,
      contactPerson: comp.contactPerson || 'responsables',
      hours: cycleHours
    });

    return {
      to: comp.email,
      subject: `Colaboración para formación de Formación Profesional - ${schoolName}`,
      body
    };
  };

  /**
   * Genera el contenido de los emails de aviso (inicio/fin) usando las plantillas configurables.
   */
  const getReminderEmail = (item: any) => {
    const { student, company, type, p } = item;
    
    if (type === 'start') {
      const body = replaceVars(templateStart, {
        studentName: `${student.firstName} ${student.lastName}`,
        companyName: company.name,
        contactPerson: company.contactPerson || 'Hola',
        startDate: format(parseISO(p.startDate), "d 'de' MMMM", { locale: es }),
        hours: p.hours
      });

      return {
        to: `${student.email}, ${company.email}`,
        subject: `[FE] Inicio de Formación: ${student.firstName} ${student.lastName}`,
        body
      };
    } else {
      const body = replaceVars(templateEnd, {
        studentName: `${student.firstName} ${student.lastName}`,
        companyName: company.name,
        contactPerson: company.contactPerson || 'Hola',
        endDate: format(parseISO(p.endDate), "d 'de' MMMM", { locale: es })
      });

      return {
        to: `${student.email}, ${company.email}`,
        subject: `[FE] Finalización de Formación: ${student.firstName} ${student.lastName}`,
        body
      };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Comunicaciones</h2>
        <p className="text-zinc-500 mt-2">Generación automática de correos usando tu cliente de correo (Outlook, Gmail, etc).</p>
      </div>

      {/* Tabs de navegación */}
      <div className="flex bg-zinc-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'reminders' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Avisos Automáticos
          {upcoming.length > 0 && <span className="ml-2 bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full text-xs">{upcoming.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('prospecting')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'prospecting' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Prospección de Empresas
        </button>
      </div>

      {/* Vista de Avisos Automáticos (Inicio/Fin) */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          {upcoming.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-zinc-200">
              <div className="w-16 h-16 bg-zinc-50 text-zinc-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={32} />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-1">Todo al día</h3>
              <p className="text-zinc-500">No hay avisos pendientes de envío para los próximos {reminderDays} días.</p>
            </div>
          ) : (
            upcoming.map((item, i) => {
              const email = getReminderEmail(item);
              return (
                <div key={i} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className={`px-4 sm:px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${item.type === 'start' ? 'bg-emerald-50/50' : 'bg-amber-50/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.type === 'start' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900">
                          {item.type === 'start' ? 'Recordatorio de Inicio' : 'Aviso de Finalización'}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          Faltan {item.days} días - {item.student.firstName} en {item.company.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          if (item.type === 'start') {
                            updatePlacement({ ...item.p, startEmailSent: true });
                          } else {
                            updatePlacement({ ...item.p, endEmailSent: true });
                          }
                        }}
                        className="flex-1 sm:flex-none bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl font-medium transition-colors text-sm shadow-sm whitespace-nowrap"
                      >
                        Marcar enviado
                      </button>
                      <button
                        onClick={() => openMailTo(email.to, email.subject, email.body)}
                        className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-xl font-medium flex items-center justify-center transition-colors shadow-sm whitespace-nowrap"
                      >
                        <ExternalLink size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline">Abrir Correo</span>
                        <span className="sm:hidden">Abrir</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-50/30">
                    <div className="space-y-4">
                      <div className="flex gap-4 items-center">
                        <span className="text-sm font-semibold text-zinc-400 w-16">Para:</span>
                        <div className="text-sm font-medium text-zinc-900">{email.to}</div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="text-sm font-semibold text-zinc-400 w-16">Asunto:</span>
                        <div className="text-sm font-medium text-zinc-900">{email.subject}</div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <span className="text-sm font-semibold text-zinc-400 w-16 pt-1">Mensaje:</span>
                        <div className="text-sm text-zinc-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-zinc-200 w-full shadow-sm">
                          {email.body}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vista de Prospección */}
      {activeTab === 'prospecting' && (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center">
              <Building2 className="mr-3 text-primary-500" />
              Contactar con empresas potenciales
            </h3>

            <div className="mb-8">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Selecciona una empresa del directorio</label>
              <select
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
              >
                <option value="">Seleccionar empresa...</option>
                {prospectingCompanies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>

            {selectedCompany && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                {(() => {
                  const email = getProspectingEmail(selectedCompany);
                  return (
                    <>
                      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
                          <div>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Destinatario</span>
                            <span className="text-sm font-medium text-zinc-900">{email.to}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Asunto</span>
                            <span className="text-sm font-medium text-zinc-900">{email.subject}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">Mensaje Generado</span>
                          <div className="text-sm text-zinc-700 whitespace-pre-wrap">
                            {email.body}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => {
                            const comp = companies.find(c => c.id === selectedCompany);
                            if (comp) {
                              const years = comp.prospectingYears ? comp.prospectingYears.split(',').filter(Boolean) : [];
                              if (!years.includes(academicYear)) {
                                years.push(academicYear);
                              }
                              updateCompany({ ...comp, prospectingYears: years.join(',') });
                              setSelectedCompany('');
                            }
                          }}
                          className="flex-1 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-sm"
                        >
                          Marcar enviado
                        </button>
                        <button
                          onClick={() => openMailTo(email.to, email.subject, email.body)}
                          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5"
                        >
                          <Send size={24} className="mr-3" />
                          <span className="hidden sm:inline">Abrir en mi Correo</span>
                          <span className="sm:hidden">Abrir Correo</span>
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
