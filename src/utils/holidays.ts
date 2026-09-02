// src/utils/holidays.ts

// Festivos y periodos no lectivos de la Comunidad Valenciana para el curso 2025/2026
export const HOLIDAYS_25_26 = [
  '2025-10-09', // Día de la Comunitat Valenciana
  '2025-10-12', // Fiesta Nacional de España (Cae en domingo, pero se incluye por completitud)
  '2025-11-01', // Todos los Santos (Sábado)
  '2025-12-06', // Día de la Constitución (Sábado)
  '2025-12-08', // Inmaculada Concepción
  // Vacaciones de Navidad (23 Dic al 6 Ene)
  '2025-12-23', '2025-12-24', '2025-12-25', '2025-12-26', '2025-12-29', '2025-12-30', '2025-12-31',
  '2026-01-01', '2026-01-02', '2026-01-05', '2026-01-06',
  // Fallas (Aproximación días no lectivos 17 al 19)
  '2026-03-17', '2026-03-18', '2026-03-19',
  // Vacaciones de Pascua / Semana Santa (Aprox. Jueves Santo al Lunes de San Vicente: 2 abril - 13 abril)
  '2026-04-02', '2026-04-03', '2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10', '2026-04-13',
  '2026-05-01', // Fiesta del Trabajo
];

/**
 * Comprueba si una fecha es un día laborable y lectivo.
 */
export const isWorkableDay = (date: Date): boolean => {
  const day = date.getDay();
  // Fines de semana (0 = Domingo, 6 = Sábado)
  if (day === 0 || day === 6) return false;

  // Comprobar festivos
  const dateString = date.toISOString().split('T')[0];
  if (HOLIDAYS_25_26.includes(dateString)) return false;

  return true;
};

/**
 * Calcula la fecha de finalización dadas una fecha de inicio, horas totales y horas diarias.
 */
export const calculateEndDate = (startDateStr: string, totalHours: number, dailyHours: number): { endDate: string, workDays: number } | null => {
  if (!startDateStr || totalHours <= 0 || dailyHours <= 0) return null;

  const currentDate = new Date(startDateStr);
  let accumulatedHours = 0;
  let workDays = 0;

  // Limite de seguridad para evitar bucles infinitos (ej. si pide 10000 horas)
  let iterations = 0;
  const MAX_ITERATIONS = 365 * 3; // Máximo 3 años de búsqueda

  while (accumulatedHours < totalHours && iterations < MAX_ITERATIONS) {
    if (isWorkableDay(currentDate)) {
      accumulatedHours += dailyHours;
      workDays++;
    }
    
    // Si hemos alcanzado el total, esta es la fecha de fin (no sumamos un día más)
    if (accumulatedHours >= totalHours) {
      break;
    }

    // Avanzar un día
    currentDate.setDate(currentDate.getDate() + 1);
    iterations++;
  }

  if (iterations >= MAX_ITERATIONS) {
    return null; // Demasiados días, error en cálculo o valores no realistas
  }

  return {
    endDate: currentDate.toISOString().split('T')[0],
    workDays
  };
};
