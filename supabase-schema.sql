-- SCHEMA DE BANCO DE DADOS - BARBEARIA SR. QUIN
-- Este arquivo representa o esquema exato executado no Supabase.

-- 1. PREPARAÇÃO E EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. CRIAÇÃO DAS TABELAS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    commission_rate NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (commission_rate >= 0.00 AND commission_rate <= 1.00),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.barber_work_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    lunch_start TIME WITHOUT TIME ZONE,
    lunch_end TIME WITHOUT TIME ZONE,
    CHECK (start_time < end_time),
    CHECK (lunch_start IS NULL OR lunch_end IS NULL OR lunch_start < lunch_end),
    UNIQUE (barber_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (start_time < end_time)
);

-- 3. SEGURANÇA FÍSICA (RESTRIÇÃO ANTI-CHOQUE)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS no_overlapping_appointments;
ALTER TABLE public.appointments ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
    barber_id WITH =,
    tstzrange(start_time, end_time) WITH &&
)
WHERE (status != 'cancelled');

-- 4. AUTOMAÇÃO DE PERFIL (TRIGGER DO SIGNUP)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'Cliente Novo'),
        new.email,
        new.raw_user_meta_data->>'phone',
        COALESCE(new.raw_user_meta_data->>'role', 'client')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. CONFIGURAÇÃO DE SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_work_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- FUNÇÃO AUXILIAR DE SEGURANÇA (SECURITY DEFINER)
-- Evita recursão infinita (infinite recursion) ao checar perfil admin nas regras de RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para Profiles
DROP POLICY IF EXISTS "Permitir leitura do próprio perfil ou se Admin" ON public.profiles;
CREATE POLICY "Permitir leitura do próprio perfil ou se Admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.profiles;
CREATE POLICY "Permitir atualização do próprio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Políticas para Services
DROP POLICY IF EXISTS "Permitir leitura pública de serviços ativos" ON public.services;
CREATE POLICY "Permitir leitura pública de serviços ativos"
    ON public.services FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Apenas admin pode gerenciar serviços" ON public.services;
CREATE POLICY "Apenas admin pode gerenciar serviços"
    ON public.services FOR ALL
    USING (public.is_admin());

-- Políticas para Barbers
DROP POLICY IF EXISTS "Permitir leitura pública de barbeiros ativos" ON public.barbers;
CREATE POLICY "Permitir leitura pública de barbeiros ativos"
    ON public.barbers FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Apenas admin pode gerenciar barbeiros" ON public.barbers;
CREATE POLICY "Apenas admin pode gerenciar barbeiros"
    ON public.barbers FOR ALL
    USING (public.is_admin());

-- Políticas para Barber Work Hours
DROP POLICY IF EXISTS "Permitir leitura pública de expedientes" ON public.barber_work_hours;
CREATE POLICY "Permitir leitura pública de expedientes"
    ON public.barber_work_hours FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas admin pode gerenciar expedientes" ON public.barber_work_hours;
CREATE POLICY "Apenas admin pode gerenciar expedientes"
    ON public.barber_work_hours FOR ALL
    USING (public.is_admin());

-- Políticas para Appointments
DROP POLICY IF EXISTS "Clientes veem seus próprios agendamentos e Admins veem tudo" ON public.appointments;
CREATE POLICY "Clientes veem seus próprios agendamentos e Admins veem tudo"
    ON public.appointments FOR SELECT
    USING (auth.uid() = client_id OR public.is_admin());

DROP POLICY IF EXISTS "Clientes criam seus próprios agendamentos e Admins criam qualquer" ON public.appointments;
CREATE POLICY "Clientes criam seus próprios agendamentos e Admins criam qualquer"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = client_id OR public.is_admin());

DROP POLICY IF EXISTS "Clientes cancelam seus próprios agendamentos e Admins atualizam qualquer" ON public.appointments;
CREATE POLICY "Clientes cancelam seus próprios agendamentos e Admins atualizam qualquer"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = client_id OR public.is_admin());

-- 6. STORED PROCEDURE (LÓGICA DO AGENDAMENTO COM TZ DE RONDÔNIA)
CREATE OR REPLACE FUNCTION public.book_appointment(
    p_barber_id UUID,
    p_service_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    v_duration_min INTEGER;
    v_service_price NUMERIC(10, 2);
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_new_appointment_id UUID;
    v_day_of_week INTEGER;
    v_work_starts TIME;
    v_work_ends TIME;
    v_client_id UUID;
    v_tz CONSTANT TEXT := 'America/Porto_Velho';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-definindo com o corpo completo
CREATE OR REPLACE FUNCTION public.book_appointment(
    p_barber_id UUID,
    p_service_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    v_duration_min INTEGER;
    v_service_price NUMERIC(10, 2);
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_new_appointment_id UUID;
    v_day_of_week INTEGER;
    v_work_starts TIME;
    v_work_ends TIME;
    v_lunch_starts TIME;
    v_lunch_ends TIME;
    v_client_id UUID;
    v_tz CONSTANT TEXT := 'America/Porto_Velho';
BEGIN
    v_client_id := auth.uid();
    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado. Usuário precisa estar logado.' USING ERRCODE = '42501';
    END IF;

    SELECT price, duration_minutes INTO v_service_price, v_duration_min
    FROM public.services
    WHERE id = p_service_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Serviço indisponível ou inexistente.' USING ERRCODE = 'P0002';
    END IF;

    v_end_time := p_start_time + (v_duration_min * INTERVAL '1 minute');
    v_day_of_week := EXTRACT(DOW FROM p_start_time AT TIME ZONE v_tz);

    SELECT start_time, end_time, lunch_start, lunch_end INTO v_work_starts, v_work_ends, v_lunch_starts, v_lunch_ends
    FROM public.barber_work_hours
    WHERE barber_id = p_barber_id AND day_of_week = v_day_of_week;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'O barbeiro selecionado não trabalha neste dia da semana.' USING ERRCODE = 'ERR01';
    END IF;

    IF ((p_start_time AT TIME ZONE v_tz)::time < v_work_starts) OR 
       ((v_end_time AT TIME ZONE v_tz)::time > v_work_ends) THEN
        RAISE EXCEPTION 'O horário selecionado está fora do expediente do barbeiro (% às %).', v_work_starts, v_work_ends USING ERRCODE = 'ERR02';
    END IF;

    -- Validar horário de almoço
    IF v_lunch_starts IS NOT NULL AND v_lunch_ends IS NOT NULL THEN
        IF NOT (
            (v_end_time AT TIME ZONE v_tz)::time <= v_lunch_starts OR
            (p_start_time AT TIME ZONE v_tz)::time >= v_lunch_ends
        ) THEN
            RAISE EXCEPTION 'O horário selecionado conflita com o horário de almoço do barbeiro (% às %).', v_lunch_starts, v_lunch_ends USING ERRCODE = 'ERR04';
        END IF;
    END IF;

    BEGIN
        INSERT INTO public.appointments (
            client_id,
            barber_id,
            service_id,
            start_time,
            end_time,
            price,
            status
        )
        VALUES (
            v_client_id,
            p_barber_id,
            p_service_id,
            p_start_time,
            v_end_time,
            v_service_price,
            'scheduled'
        )
        RETURNING id INTO v_new_appointment_id;

        RETURN v_new_appointment_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'Este barbeiro já possui um agendamento conflitante neste horário.' USING ERRCODE = 'ERR03';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
