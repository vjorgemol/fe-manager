import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Briefcase, Info, CalendarCheck } from 'lucide-react';
import { calculateEndDate } from '../../utils/holidays';
import { format, parseISO } from 'date-fns';
import { es, ca } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';

export const DateCalculator: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [totalHours, setTotalHours] = useState<number>(400);
  const [dailyHours, setDailyHours] = useState<number>(8);
  const [result, setResult] = useState<{ endDate: string, workDays: number } | null>(null);
  const { t, language } = useLanguage();
  const locale = language === 'val' ? ca : es;

  useEffect(() => {
    if (startDate && totalHours > 0 && dailyHours > 0) {
      const calcResult = calculateEndDate(startDate, totalHours, dailyHours);
      setResult(calcResult);
    } else {
      setResult(null);
    }
  }, [startDate, totalHours, dailyHours]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
            <CalendarIcon size={20} className="text-primary-600" />
            {t('calc.header')}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {t('calc.subheader')}
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulario */}
            <div className="md:col-span-2 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon size={16} className="text-zinc-400" /> {t('calc.startDate')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-zinc-50/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase size={16} className="text-zinc-400" /> {t('calc.totalHours')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalHours || ''}
                    onChange={(e) => setTotalHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-zinc-50/50"
                    placeholder="Ej. 400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Clock size={16} className="text-zinc-400" /> {t('calc.hoursPerDay')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={dailyHours || ''}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-zinc-50/50"
                    placeholder="Ej. 8"
                  />
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 mt-4 text-sm border border-blue-100">
                <Info size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">{t('calc.aboutTitle')}</p>
                  <p className="text-blue-700">{t('calc.aboutDesc')}</p>
                </div>
              </div>
            </div>

            {/* Resultado */}
            <div className="md:col-span-1">
              <div className={`h-full rounded-2xl border-2 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${result ? 'border-primary-200 bg-primary-50/30' : 'border-dashed border-zinc-200 bg-zinc-50/50'}`}>
                {result ? (
                  <>
                    <CalendarCheck size={40} className="text-primary-600 mb-3" />
                    <h4 className="text-sm font-bold text-primary-800 uppercase tracking-wider mb-2">{t('calc.estimatedEnd')}</h4>
                    <p className="text-3xl font-black text-zinc-900 mb-2">
                      {format(parseISO(result.endDate), "d 'de' MMMM", { locale })}
                    </p>
                    <p className="text-sm font-medium text-zinc-500">
                      de {format(parseISO(result.endDate), "yyyy")}
                    </p>
                    
                    <div className="w-full h-px bg-primary-200 my-4"></div>
                    
                    <div className="flex items-center justify-center gap-2 text-zinc-600 font-medium">
                      <Clock size={16} />
                      {result.workDays} {t('calc.workDaysLabel')}
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-400">
                    <CalendarIcon size={40} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">{t('calc.fillData')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
