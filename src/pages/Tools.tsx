import React, { useState } from 'react';
import { MapPin, CalendarDays, Wrench } from 'lucide-react';
import { Visits } from './Visits';
import { DateCalculator } from '../components/tools/DateCalculator';

type Tab = 'visits' | 'calculator';

export const Tools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('visits');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
          <Wrench className="text-primary-600" size={32} />
          Herramientas
        </h2>
        <p className="text-zinc-500 mt-2">
          Utilidades extra para facilitar la gestión diaria de la formación en centros de trabajo.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('visits')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'visits'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }
            `}
          >
            <MapPin size={18} />
            Rutas y Visitas
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'calculator'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }
            `}
          >
            <CalendarDays size={18} />
            Calculadora de Fechas
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'visits' && <Visits />}
        {activeTab === 'calculator' && <DateCalculator />}
      </div>
    </div>
  );
};
