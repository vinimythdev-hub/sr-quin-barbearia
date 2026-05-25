/**
 * Utilitários de fuso horário dedicados para a BarbeariaApp (Rondônia - UTC-4)
 */

export const RONDONIA_TIMEZONE = 'America/Porto_Velho';

/**
 * Formata um objeto Date ou string de data para o padrão de exibição em Rondônia.
 * Exemplo de saída: "25/05/2026, 14:30"
 */
export function formatToRondoniaTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: RONDONIA_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(d);
}

/**
 * Obtém a data e hora atual convertida explicitamente na perspectiva de Rondônia.
 */
export function getCurrentRondoniaTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: RONDONIA_TIMEZONE }));
}

/**
 * Converte um timestamp com time zone para um objeto local de Rondônia formatado.
 */
export function getRondoniaDateParts(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: RONDONIA_TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  return {
    year: parseInt(getPart('year'), 10),
    month: parseInt(getPart('month'), 10),
    day: parseInt(getPart('day'), 10),
    hour: parseInt(getPart('hour'), 10),
    minute: parseInt(getPart('minute'), 10),
    second: parseInt(getPart('second'), 10)
  };
}
