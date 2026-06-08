import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { MapPin, Navigation, ChevronUp, ChevronDown, ExternalLink, AlertTriangle, Plus, Trash2, UserCheck } from 'lucide-react';
import type { Placement } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const Visits: React.FC = () => {
  const { placements, companies, students, originAddress } = useData();
  const { t } = useLanguage();
  
  // Filtrar solo las asignaciones activas
  const activePlacements = placements.filter(p => p.status === 'active');
  
  // Estado para la lista de visitas seleccionadas
  const [selectedVisits, setSelectedVisits] = useState<Placement[]>([]);

  // Agregar una visita a la lista
  const addVisit = (placementId: string) => {
    if (selectedVisits.find(v => v.id === placementId)) return;
    const placement = placements.find(p => p.id === placementId);
    if (placement) {
      setSelectedVisits([...selectedVisits, placement]);
    }
  };

  // Quitar una visita
  const removeVisit = (placementId: string) => {
    setSelectedVisits(selectedVisits.filter(v => v.id !== placementId));
  };

  // Mover elemento arriba o abajo (ordenación manual)
  const moveVisit = (index: number, direction: 'up' | 'down') => {
    const newVisits = [...selectedVisits];
    if (direction === 'up' && index > 0) {
      [newVisits[index - 1], newVisits[index]] = [newVisits[index], newVisits[index - 1]];
    } else if (direction === 'down' && index < newVisits.length - 1) {
      [newVisits[index + 1], newVisits[index]] = [newVisits[index], newVisits[index + 1]];
    }
    setSelectedVisits(newVisits);
  };

  // Obtener datos de empresa para un placement
  const getCompanyInfo = (companyId: string) => companies.find(c => c.id === companyId);
  const getStudentInfo = (studentId: string) => students.find(s => s.id === studentId);

  // Generar URL de Google Maps
  const generateMapsUrl = () => {
    if (selectedVisits.length === 0) return '';
    
    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const originParam = originAddress ? `&origin=${encodeURIComponent(originAddress)}` : '';
    
    // Si hay origen, el destino es la última visita. Si no hay origen, el origen es la primera visita y el destino la última.
    let destIndex = selectedVisits.length - 1;
    let originStr = originParam;
    
    let waypointsList = [];
    
    if (!originAddress) {
      const firstC = getCompanyInfo(selectedVisits[0].companyId);
      const firstAddress = `${firstC?.address ? firstC.address + ', ' : ''}${firstC?.location}`;
      originStr = `&origin=${encodeURIComponent(firstAddress)}`;
      // Los waypoints serán desde el índice 1 hasta el penúltimo
      for(let i = 1; i < selectedVisits.length - 1; i++) {
        const c = getCompanyInfo(selectedVisits[i].companyId);
        waypointsList.push(`${c?.address ? c.address + ', ' : ''}${c?.location}`);
      }
    } else {
      // Los waypoints serán todos menos el último
      for(let i = 0; i < selectedVisits.length - 1; i++) {
        const c = getCompanyInfo(selectedVisits[i].companyId);
        waypointsList.push(`${c?.address ? c.address + ', ' : ''}${c?.location}`);
      }
    }

    const lastC = getCompanyInfo(selectedVisits[destIndex].companyId);
    const destAddress = `${lastC?.address ? lastC.address + ', ' : ''}${lastC?.location}`;
    const destParam = `&destination=${encodeURIComponent(destAddress)}`;
    
    const waypointsParam = waypointsList.length > 0 ? `&waypoints=${encodeURIComponent(waypointsList.join('|'))}` : '';
    
    return `${baseUrl}${originStr}${destParam}${waypointsParam}`;
  };

  const openMaps = () => {
    const url = generateMapsUrl();
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!originAddress && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
          <div className="text-amber-500 mt-0.5"><AlertTriangle size={20} /></div>
          <div>
            <h4 className="font-bold text-amber-800">{t('visits.originNotSet')}</h4>
            <p className="text-sm text-amber-700 mt-1">
              {t('visits.originNotSetDesc')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Selección */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-16rem)] min-h-[400px]">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-900">{t('visits.activeStudents')}</h3>
              <p className="text-xs text-zinc-500 mt-1">{t('visits.selectToVisit')}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {activePlacements.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-sm">{t('visits.noActivePlacements')}</div>
              ) : (
                <div className="space-y-2">
                  {activePlacements.map(p => {
                    const student = getStudentInfo(p.studentId);
                    const company = getCompanyInfo(p.companyId);
                    const isSelected = selectedVisits.some(v => v.id === p.id);
                    
                    if (!student || !company) return null;
                    
                    return (
                      <div key={p.id} className={`p-3 rounded-xl border flex justify-between items-center transition-colors ${isSelected ? 'border-indigo-200 bg-indigo-50/30' : 'border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50'}`}>
                        <div className="overflow-hidden">
                          <div className="font-medium text-sm text-zinc-900 truncate">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {company.name}
                          </div>
                        </div>
                        <button 
                          onClick={() => isSelected ? removeVisit(p.id) : addVisit(p.id)}
                          className={`ml-2 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                        >
                          {isSelected ? <Trash2 size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Itinerario */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-16rem)] min-h-[400px]">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-zinc-900">{t('visits.plannedItinerary')}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {t('visits.stops')
                    .replace('{count}', String(selectedVisits.length))
                    .replace('{time}', String(selectedVisits.length * 20))}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Optimización automática deshabilitada por ahora */}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {selectedVisits.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <Navigation size={48} className="mb-4 opacity-20" />
                  <p>{t('visits.emptyStateLine1')}</p>
                  <p className="text-sm mt-1">{t('visits.emptyStateLine2')}</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Línea conectora */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-zinc-200 rounded-full" />
                  
                  {/* Origen (si está configurado) */}
                  {originAddress && (
                    <div className="flex gap-4 mb-6 relative">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm">
                        <MapPin size={14} />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">{t('visits.originDeparture')}</div>
                        <div className="text-sm font-medium text-zinc-800">{originAddress}</div>
                      </div>
                    </div>
                  )}

                  {/* Paradas */}
                  {selectedVisits.map((p, index) => {
                    const student = getStudentInfo(p.studentId);
                    const company = getCompanyInfo(p.companyId);
                    if (!student || !company) return null;

                    return (
                      <div key={p.id} className="flex gap-4 mb-6 relative group">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm font-bold text-xs">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-zinc-900">{company.name}</h4>
                              <p className="text-sm text-zinc-500 mt-1">{company.address ? company.address + ', ' : ''}{company.location}</p>
                              <div className="flex items-center gap-2 mt-3 bg-zinc-50 px-3 py-2 rounded-lg w-fit">
                                <UserCheck size={14} className="text-zinc-400" />
                                <span className="text-sm font-medium text-zinc-700">{student.firstName} {student.lastName}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => moveVisit(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ChevronUp size={18} />
                              </button>
                              <button 
                                onClick={() => moveVisit(index, 'down')}
                                disabled={index === selectedVisits.length - 1}
                                className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ChevronDown size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 bg-white">
              <button
                onClick={openMaps}
                disabled={selectedVisits.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <ExternalLink size={18} />
                {t('visits.openRouteInMaps')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
