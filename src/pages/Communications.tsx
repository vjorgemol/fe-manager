import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Mail, Send, ExternalLink, Calendar, Building2, AlertTriangle, Search, X } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es, ca } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';

/**
 * Página de Comunicaciones.
 * Gestiona los avisos automáticos de inicio/fin de formación y la prospección de empresas.
 */
export const Communications: React.FC = () => {
  const { 
    students, companies, placements, schoolName, reminderDays, 
    updatePlacement, updateCompany, tutorName, tutorEmail, cycleName, academicYear,
    templateProspecting, templateStart, templateTracking, templateEnd, cycleHours
  } = useData();
  const { t, language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'prospecting' | 'reminders'>('reminders');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const today = new Date();

  // Empresas que no han sido contactadas en el curso actual, ordenadas alfabéticamente
  const prospectingCompanies = companies
    .filter(c => 
      !c.prospectingYears?.includes(academicYear) && 
      !c.acceptedYears?.includes(academicYear) && 
      !c.rejectedYears?.includes(academicYear) && 
      !placements.some(p => p.companyId === c.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

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
        } else if (p.status === 'active') {
          const startDaysPassed = differenceInDays(today, parseISO(p.startDate));
          const targetDays = (p.trackingCount || 0) === 0 ? 3 : 3 + (7 * (p.trackingCount || 0));
          if (startDaysPassed >= targetDays) {
            type = 'tracking';
            days = 0; // Not applicable for tracking, just an immediate reminder
          }
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
      subject: language === 'val'
        ? `Col·laboració per a formació de Formación Profesional - ${schoolName}`
        : `Colaboración para formación de Formación Profesional - ${schoolName}`,
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
        startDate: format(parseISO(p.startDate), "d 'de' MMMM", { locale: language === 'val' ? ca : es }),
        hours: p.hours
      });

      return {
        to: `${student.email}, ${company.email}`,
        subject: language === 'val'
          ? `[FE] Inici de Formació: ${student.firstName} ${student.lastName}`
          : `[FE] Inicio de Formación: ${student.firstName} ${student.lastName}`,
        body
      };
    } else if (type === 'tracking') {
      const body = replaceVars(templateTracking, {
        studentName: `${student.firstName} ${student.lastName}`,
        companyName: company.name,
        contactPerson: company.instructorName || company.contactPerson || 'Hola'
      });

      return {
        to: company.instructorEmail || company.email,
        subject: language === 'val'
          ? `[FE] Seguiment Setmanal: ${student.firstName} ${student.lastName}`
          : `[FE] Seguimiento Semanal: ${student.firstName} ${student.lastName}`,
        body
      };
    } else {
      const body = replaceVars(templateEnd, {
        studentName: `${student.firstName} ${student.lastName}`,
        companyName: company.name,
        contactPerson: company.contactPerson || 'Hola',
        endDate: format(parseISO(p.endDate), "d 'de' MMMM", { locale: language === 'val' ? ca : es })
      });

      return {
        to: `${student.email}, ${company.email}`,
        subject: language === 'val'
          ? `[FE] Finalització de Formació: ${student.firstName} ${student.lastName}`
          : `[FE] Finalización de Formación: ${student.firstName} ${student.lastName}`,
        body
      };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('comms.title')}</h2>
        <p className="text-zinc-500 mt-2">{t('comms.desc')}</p>
      </div>

      {/* Tabs de navegación */}
      <div className="flex bg-zinc-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'reminders' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          {language === 'val' ? 'Avisos Automàtics' : 'Avisos Automáticos'}
          {upcoming.length > 0 && <span className="ml-2 bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full text-xs">{upcoming.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('prospecting')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'prospecting' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          {language === 'val' ? 'Prospecció d\'Empreses' : 'Prospección de Empresas'}
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
              <h3 className="text-lg font-medium text-zinc-900 mb-1">{language === 'val' ? 'Tot al dia' : 'Todo al día'}</h3>
              <p className="text-zinc-500">
                {language === 'val' 
                  ? `No hi ha avisos pendents d'enviament per als pròxims ${reminderDays} dies.` 
                  : `No hay avisos pendientes de envío para los próximos ${reminderDays} días.`}
              </p>
            </div>
          ) : (
            upcoming.map((item, i) => {
              const email = getReminderEmail(item);
              return (
                <div key={i} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className={`px-4 sm:px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${item.type === 'start' ? 'bg-emerald-50/50' : item.type === 'tracking' ? 'bg-blue-50/50' : 'bg-amber-50/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.type === 'start' ? 'bg-emerald-100 text-emerald-600' : item.type === 'tracking' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900">
                          {item.type === 'start' 
                            ? (language === 'val' ? "Recordatori d'Inici" : 'Recordatorio de Inicio') 
                            : item.type === 'tracking' 
                              ? (language === 'val' ? 'Seguiment Setmanal' : 'Seguimiento Semanal') 
                              : (language === 'val' ? 'Avís de Finalització' : 'Aviso de Finalización')}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {item.type === 'tracking' 
                            ? (language === 'val' ? `Seguiment ${(item.p.trackingCount || 0) + 1} - ` : `Seguimiento ${(item.p.trackingCount || 0) + 1} - `) 
                            : (language === 'val' 
                                ? (item.days === 1 ? `Falta 1 dia - ` : `Falten ${item.days} dies - `)
                                : `Faltan ${item.days} días - `)
                          }{item.student.firstName} en {item.company.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          if (item.type === 'start') {
                            updatePlacement({ ...item.p, startEmailSent: true });
                          } else if (item.type === 'tracking') {
                            updatePlacement({ ...item.p, trackingCount: (item.p.trackingCount || 0) + 1 });
                          } else {
                            updatePlacement({ ...item.p, endEmailSent: true });
                          }
                        }}
                        className="flex-1 sm:flex-none bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl font-medium transition-colors text-sm shadow-sm whitespace-nowrap"
                      >
                        {language === 'val' ? 'Marcar com a enviat' : 'Marcar enviado'}
                      </button>
                      <button
                        onClick={() => openMailTo(email.to, email.subject, email.body)}
                        className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-xl font-medium flex items-center justify-center transition-colors shadow-sm whitespace-nowrap"
                      >
                        <ExternalLink size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline">{language === 'val' ? 'Obrir Correu' : 'Abrir Correo'}</span>
                        <span className="sm:hidden">{language === 'val' ? 'Obrir' : 'Abrir'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-50/30">
                    <div className="space-y-4">
                      <div className="flex gap-4 items-center">
                        <span className="text-sm font-semibold text-zinc-400 w-16">{language === 'val' ? 'Per a:' : 'Para:'}</span>
                        <div className="text-sm font-medium text-zinc-900">{email.to}</div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="text-sm font-semibold text-zinc-400 w-16">{language === 'val' ? 'Assumpte:' : 'Asunto:'}</span>
                        <div className="text-sm font-medium text-zinc-900">{email.subject}</div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <span className="text-sm font-semibold text-zinc-400 w-16 pt-1">{language === 'val' ? 'Missatge:' : 'Mensaje:'}</span>
                        <div className="w-full">
                          {item.type === 'end' && (
                            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2 font-medium">
                              <AlertTriangle size={16} />
                              {language === 'val' 
                                ? '⚠️ Recorda adjuntar l\'Annex A5 en aquest correu de forma manual abans d\'enviar-lo.' 
                                : '⚠️ Recuerda adjuntar el Anexo A5 en este correo de forma manual antes de enviarlo.'}
                            </div>
                          )}
                          <div className="text-sm text-zinc-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                            {email.body}
                          </div>
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
              {language === 'val' ? 'Contactar amb empreses potencials' : 'Contactar con empresas potenciales'}
            </h3>

            <div className="mb-8 relative">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                {language === 'val' ? 'Buscar empresa potencial del directori' : 'Buscar empresa potencial del directorio'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  className="w-full pl-11 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-zinc-900"
                  placeholder={
                    language === 'val' 
                      ? 'Cercar per nom, correu o localitat...' 
                      : 'Buscar por nombre, correo o localidad...'
                  }
                  value={companySearch || (selectedCompany ? companies.find(c => c.id === selectedCompany)?.name : '') || ''}
                  onChange={e => {
                    setCompanySearch(e.target.value);
                    if (selectedCompany) setSelectedCompany('');
                    setIsCompanyDropdownOpen(true);
                  }}
                  onFocus={() => setIsCompanyDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsCompanyDropdownOpen(false), 200)}
                />
                {(companySearch || selectedCompany) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanySearch('');
                      setSelectedCompany('');
                      setIsCompanyDropdownOpen(false);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {isCompanyDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {prospectingCompanies
                    .filter(c => 
                      c.name.toLowerCase().includes(companySearch.toLowerCase()) || 
                      c.location.toLowerCase().includes(companySearch.toLowerCase()) ||
                      c.email.toLowerCase().includes(companySearch.toLowerCase())
                    )
                    .map(c => (
                      <div
                        key={c.id}
                        className="px-4 py-3 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0 transition-colors flex justify-between items-center"
                        onMouseDown={() => {
                          setSelectedCompany(c.id);
                          setCompanySearch(c.name);
                          setIsCompanyDropdownOpen(false);
                        }}
                      >
                        <div>
                          <div className="font-medium text-zinc-900">{c.name}</div>
                          <div className="text-xs text-zinc-500">{c.location} • {c.email}</div>
                        </div>
                      </div>
                    ))}
                  {prospectingCompanies.filter(c => 
                    c.name.toLowerCase().includes(companySearch.toLowerCase()) || 
                    c.location.toLowerCase().includes(companySearch.toLowerCase()) ||
                    c.email.toLowerCase().includes(companySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-4 text-sm text-zinc-500 text-center font-medium">
                      {language === 'val' 
                        ? 'No es van trobar empreses pendents de prospecció.' 
                        : 'No se encontraron empresas pendientes de prospección.'}
                    </div>
                  )}
                </div>
              )}
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
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">{language === 'val' ? 'Destinatari' : 'Destinatario'}</span>
                            <span className="text-sm font-medium text-zinc-900">{email.to}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">{language === 'val' ? 'Assumpte' : 'Asunto'}</span>
                            <span className="text-sm font-medium text-zinc-900">{email.subject}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">{language === 'val' ? 'Missatge Generat' : 'Mensaje Generado'}</span>
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
                              setCompanySearch('');
                            }
                          }}
                          className="flex-1 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-sm"
                        >
                          {language === 'val' ? 'Marcar com a enviat' : 'Marcar enviado'}
                        </button>
                        <button
                          onClick={() => openMailTo(email.to, email.subject, email.body)}
                          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5"
                        >
                          <Send size={24} className="mr-3" />
                          <span className="hidden sm:inline">{language === 'val' ? 'Obrir en el meu Correu' : 'Abrir en mi Correo'}</span>
                          <span className="sm:hidden">{language === 'val' ? 'Obrir Correu' : 'Abrir Correo'}</span>
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
