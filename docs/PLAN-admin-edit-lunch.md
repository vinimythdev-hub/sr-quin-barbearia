# PLAN: Edição de Serviços, Equipe e Horário de Almoço 💈

Este plano detalha o design, arquitetura e passos de implementação para permitir a edição de registros de serviços, barbeiros e a configuração do horário de almoço (escala com intervalo) no Painel Administrativo do **Barbearia Sr. Quin**:
1. ✏️ **Edição de Serviços (Nome, Preço, Duração e Descrição)**
2. ✏️ **Edição de Barbeiros (Nome, Bio, Comissão e Foto)**
3. ⏰ **Configuração de Horário de Almoço (Início/Fim do Almoço na escala de expediente)**
4. 🔏 **Validação de Conflito de Almoço no Banco (Supabase SQL)**
5. 📅 **Visualização Gráfica do Almoço na Linha do Tempo Visual**

---

## 🎯 Objetivo

Oferecer flexibilidade completa de gestão para o gerente da barbearia, permitindo ajustar preços, perfis dos profissionais e, crucialmente, definir horários de intervalo (almoço) para cada barbeiro que impeçam automaticamente qualquer marcação de cliente pelo app mobile naquele horário.

---

## 🔏 Mudanças no Banco de Dados (Supabase Migration)

Como o banco atualmente não possui campos de intervalo, realizaremos as seguintes migrações:

### 1. Colunas de Almoço em `barber_work_hours`
Adicionaremos `lunch_start` e `lunch_end` à tabela `barber_work_hours`.
```sql
ALTER TABLE public.barber_work_hours 
ADD COLUMN IF NOT EXISTS lunch_start TIME WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS lunch_end TIME WITHOUT TIME ZONE;

-- Garantir consistência lógica (início < fim)
ALTER TABLE public.barber_work_hours 
DROP CONSTRAINT IF EXISTS check_lunch_times;

ALTER TABLE public.barber_work_hours 
ADD CONSTRAINT check_lunch_times 
CHECK (lunch_start IS NULL OR lunch_end IS NULL OR lunch_start < lunch_end);
```

### 2. Atualização da Stored Procedure `book_appointment`
Modificar a função de agendamento automático para checar se o agendamento coincide com a faixa de almoço da escala do barbeiro:
```sql
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

    SELECT start_time, end_time, lunch_start, lunch_end 
    INTO v_work_starts, v_work_ends, v_lunch_starts, v_lunch_ends
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
```

---

## 🏗️ Mudanças na Estrutura de Arquivos (Painel Web)

### ✏️ Arquivos Modificados (MODIFY)
* `apps/web/src/app/admin/services/page.tsx` — Adicionar modal de edição de serviço.
* `apps/web/src/app/admin/barbers/page.tsx` — Adicionar modal de edição de dados do barbeiro e adicionar inputs de almoço (`lunch_start`, `lunch_end`) no modal de expediente.
* `apps/web/src/app/admin/calendar/page.tsx` — Carregar e renderizar visualmente a faixa cinza/tracejada de almoço na linha do tempo para evitar confusão visual.

---

## 📋 Detalhamento dos Fluxos de Usuário

### 1. Edição de Serviços (`/admin/services`)
* **Interface:** Um botão elegante de edição (lápis) no card de cada serviço.
* **Modal de Edição:** Abre com os dados atuais preenchidos nos campos. Permite alterar Nome, Descrição, Preço e Duração.
* **Lógica:** Roda um `update` simples no Supabase para salvar.

### 2. Edição de Dados de Barbeiros (`/admin/barbers`)
* **Interface:** Um botão de edição (lápis) no topo de cada card de barbeiro.
* **Modal de Edição:** Permite alterar Nome, Biografia, Taxa de Comissão e URL do Avatar.
* **Lógica:** Roda um `update` simples no Supabase para salvar.

### 3. Configuração de Almoço na Escala (`/admin/barbers`)
* **Interface:** No modal de expediência atual (onde se ativam os dias de trabalho), se o dia estiver ativo, além de "Entrada" e "Saída", exibe uma linha adicional: **"Intervalo Almoço"** (com dois inputs de hora: Início e Fim).
* **Lógica:** Ao salvar a escala, a aplicação monta o objeto e insere os campos `lunch_start` e `lunch_end` no banco de dados.

### 4. Desenho de Almoço no Calendário (`/admin/calendar`)
* **Visualização:** A rota da Agenda Visual buscará a escala de expedientes e adicionará um cartão cinza estático com o texto **"INTERVALO ALMOÇO"** no horário configurado na coluna de cada barbeiro.
* **Posição:** Utiliza a mesma lógica de posicionamento absolute baseada no topo e altura.

---

## 🚀 Cronograma e Divisão de Tarefas

### Fase 1: Atualização de Banco e Procedimento (Prioridade Alta)
- [ ] **Tarefa 1.1:** Rodar o script SQL de migração no painel do Supabase para criar as colunas de almoço.
- [ ] **Tarefa 1.2:** Rodar o SQL atualizado do `book_appointment` com a nova regra de validação `ERR04`.
  * *Verificação:* Executar as queries de alteração com sucesso.

### Fase 2: Edição de Serviços (Prioridade Alta)
- [ ] **Tarefa 2.1:** Adicionar o botão de lápis no card de cada serviço na tela `/admin/services`.
- [ ] **Tarefa 2.2:** Desenvolver o modal de edição preenchido com os dados atuais do serviço selecionado.
- [ ] **Tarefa 2.3:** Ligar a ação de salvar a um `update` no Supabase and recarregar a lista.
  * *Verificação:* Editar o valor de um corte e confirmar que a alteração reflete imediatamente na tela.

### Fase 3: Edição de Barbeiros e Horário de Almoço (Prioridade Alta)
- [ ] **Tarefa 3.1:** Adicionar o botão de lápis de edição cadastral nos cards na tela `/admin/barbers`.
- [ ] **Tarefa 3.2:** Desenvolver o modal de edição cadastral para alterar Nome, Bio, Comissão e Avatar.
- [ ] **Tarefa 3.3:** Modificar o modal de expediente existente (`handleOpenHoursModal`) para puxar as colunas `lunch_start` e `lunch_end` da tabela.
- [ ] **Tarefa 3.4:** Adicionar inputs de hora para o almoço no modal de expedientes.
- [ ] **Tarefa 3.5:** Atualizar a função `handleSaveHours` para enviar `lunch_start` e `lunch_end` no formato `HH:MM:00` no `insert` atômico.
  * *Verificação:* Definir o almoço de um barbeiro das 12h às 13h, salvar, e conferir no Supabase se as colunas foram devidamente preenchidas.

### Fase 4: Agenda Visual e Verificação (Prioridade Média)
- [ ] **Tarefa 4.1:** Atualizar `/admin/calendar` para fazer a busca das escalas junto dos barbeiros ativos.
- [ ] **Tarefa 4.2:** Desenhar o bloco absolute cinza tracejado de Almoço no calendário com base em `lunch_start` e `lunch_end`.
  * *Verificação:* Confirmar que o bloco de almoço aparece perfeitamente posicionado na agenda do respectivo profissional.

---

## ⚡ Plano de Verificação (Fase X)

### 1. Verificações de Qualidade
* Correr lint e build:
  ```bash
  pnpm build
  ```

### 2. Manual Test Cases (Roteiro)
* **Teste 1:** Configurar almoço das 12:00 às 13:00 para o Barbeiro A. Tentar fazer uma marcação de corte das 12:15 às 12:45 e validar se o sistema retorna o erro `'O horário selecionado conflita com o horário de almoço do barbeiro (12:00 às 13:00)'`.
* **Teste 2:** Tentar agendar um corte que inicia às 11:45 e dura 30 minutos (portanto, termina às 12:15) e validar se o banco impede o agendamento por conflitar com o início do almoço às 12:00.
* **Teste 3:** Modificar a descrição de um serviço e confirmar se ela atualiza dinamicamente nos cards.
