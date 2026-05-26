-- SCRIPT DE INSERÇÃO DE DADOS DE TESTE (SEED)
-- BARBEARIA SR. QUIN
-- Cole estes comandos no "SQL Editor" do seu painel do Supabase para popular o banco.

-- 1. LIMPEZA DE DADOS EXISTENTES (Opcional - Descomente para resetar)
-- DELETE FROM public.barber_work_hours;
-- DELETE FROM public.appointments;
-- DELETE FROM public.barbers;

-- 2. CADASTRO DE BARBEIROS (public.barbers)
INSERT INTO public.barbers (id, name, bio, avatar_url, commission_rate, is_active) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Carlos "Navalha" Silva',
    'Especialista em cortes clássicos e barboterapia tradicional com mais de 10 anos de experiência.',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200&h=200',
    0.50,
    true
),
(
    '22222222-2222-2222-2222-222222222222',
    'Diego "Fade" Santos',
    'Jovem talento focado em degradês modernos, freestyle e tendências urbanas de visual masculino.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    0.45,
    true
),
(
    '33333333-3333-3333-3333-333333333333',
    'Quin "O Mestre" Albuquerque',
    'Fundador da barbearia. Especialista em visagismo e na experiência clássica de cavalheiros.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    0.60,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    commission_rate = EXCLUDED.commission_rate,
    is_active = EXCLUDED.is_active;

-- 4. ESCALA DE TRABALHO DOS BARBEIROS (public.barber_work_hours)
-- Segunda (1) a Sábado (6)
-- Expediente das 09:00 às 19:00. Almoço das 12:00 às 13:30.

-- Escala para Carlos (11111111-1111-1111-1111-111111111111)
INSERT INTO public.barber_work_hours (barber_id, day_of_week, start_time, end_time, lunch_start, lunch_end) VALUES
('11111111-1111-1111-1111-111111111111', 1, '09:00:00', '19:00:00', '12:00:00', '13:30:00'),
('11111111-1111-1111-1111-111111111111', 2, '09:00:00', '19:00:00', '12:00:00', '13:30:00'),
('11111111-1111-1111-1111-111111111111', 3, '09:00:00', '19:00:00', '12:00:00', '13:30:00'),
('11111111-1111-1111-1111-111111111111', 4, '09:00:00', '19:00:00', '12:00:00', '13:30:00'),
('11111111-1111-1111-1111-111111111111', 5, '09:00:00', '19:00:00', '12:00:00', '13:30:00'),
('11111111-1111-1111-1111-111111111111', 6, '09:00:00', '18:00:00', '12:00:00', '13:30:00')
ON CONFLICT (barber_id, day_of_week) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end;

-- Escala para Diego (22222222-2222-2222-2222-222222222222)
INSERT INTO public.barber_work_hours (barber_id, day_of_week, start_time, end_time, lunch_start, lunch_end) VALUES
('22222222-2222-2222-2222-222222222222', 1, '09:00:00', '19:00:00', '13:00:00', '14:30:00'),
('22222222-2222-2222-2222-222222222222', 2, '09:00:00', '19:00:00', '13:00:00', '14:30:00'),
('22222222-2222-2222-2222-222222222222', 3, '09:00:00', '19:00:00', '13:00:00', '14:30:00'),
('22222222-2222-2222-2222-222222222222', 4, '09:00:00', '19:00:00', '13:00:00', '14:30:00'),
('22222222-2222-2222-2222-222222222222', 5, '09:00:00', '19:00:00', '13:00:00', '14:30:00'),
('22222222-2222-2222-2222-222222222222', 6, '09:00:00', '18:00:00', '12:00:00', '13:30:00')
ON CONFLICT (barber_id, day_of_week) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end;

-- Escala para Quin (33333333-3333-3333-3333-333333333333)
INSERT INTO public.barber_work_hours (barber_id, day_of_week, start_time, end_time, lunch_start, lunch_end) VALUES
('33333333-3333-3333-3333-333333333333', 1, '10:00:00', '19:00:00', '12:30:00', '14:00:00'),
('33333333-3333-3333-3333-333333333333', 2, '10:00:00', '19:00:00', '12:30:00', '14:00:00'),
('33333333-3333-3333-3333-333333333333', 3, '10:00:00', '19:00:00', '12:30:00', '14:00:00'),
('33333333-3333-3333-3333-333333333333', 4, '10:00:00', '19:00:00', '12:30:00', '14:00:00'),
('33333333-3333-3333-3333-333333333333', 5, '10:00:00', '19:00:00', '12:30:00', '14:00:00'),
('33333333-3333-3333-3333-333333333333', 6, '09:00:00', '16:00:00', '12:00:00', '13:00:00')
ON CONFLICT (barber_id, day_of_week) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    lunch_start = EXCLUDED.lunch_start,
    lunch_end = EXCLUDED.lunch_end;
