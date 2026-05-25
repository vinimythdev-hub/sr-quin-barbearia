import { z } from 'zod';

/**
 * Schema de validação para criação de agendamentos compartilhado entre o app móvel e painel admin.
 */
export const createAppointmentSchema = z.object({
  barber_id: z.string().uuid({ message: 'Selecione um barbeiro válido' }),
  service_id: z.string().uuid({ message: 'Selecione um serviço válido' }),
  start_time: z.string().datetime({ message: 'Data e hora de início inválidas' }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
