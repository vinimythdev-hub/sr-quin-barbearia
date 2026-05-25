# PLAN: Painel Administrativo e Gestão de Serviços/Equipe (Next.js) 💈

Este plano detalha o desenvolvimento do **Painel de Gestão Completo** no **Painel Web (Next.js)** do **BarbeariaApp**, integrando todas as métricas e telas diretamente ao banco de dados live do **Supabase**.

---

## 🎯 Objetivo

Transformar a interface administrativa estática do painel web em um sistema operacional em tempo real, permitindo ao administrador:
1. Visualizar métricas reais do faturamento, agendamentos e no-shows de hoje.
2. Gerenciar o catálogo de **Serviços** (preços, durações, descrições e status ativo).
3. Gerenciar a equipe de **Barbeiros** (cadastro, taxa de comissão e status ativo) e visualizar a escala de horários de trabalho.
4. Controlar e atualizar o status dos agendamentos de hoje (Confirmar, Concluir, Cancelar, Marcar Falta).

---

## 👥 Fluxos de Usuário (Painel Web)

### A. Dashboard Principal (`src/app/page.tsx`)
- **Métricas Live:** O painel faz queries no banco calculando:
  - Faturamento Estimado de Hoje (soma dos preços de agendamentos no estado `'scheduled'` ou `'completed'`).
  - Total de agendamentos para o dia atual.
  - Barbeiros com agenda ativa hoje.
  - Taxa e número de faltas (No-shows) do dia.
- **Agenda em Tempo Real:** Exibe uma tabela premium cronológica de todos os agendamentos de hoje, detalhando o Cliente (nome/telefone), Barbeiro, Serviço, Horário local de Rondônia (UTC-4) e Status.
- **Ações Rápidas:** Botões para concluir, cancelar ou marcar no-show em cada agendamento.

### B. Gestão de Serviços (`src/app/admin/services/page.tsx`)
- **Visualização:** Lista todos os serviços cadastrados na barbearia.
- **Criação [NEW]:** Modal ou formulário elegante para cadastrar novos serviços definindo Nome, Descrição, Preço e Duração.
- **Edição/Status:** Possibilidade de desativar/ativar serviços com um toggle e atualizar valores.

### C. Gestão de Barbeiros (`src/app/admin/barbers/page.tsx`)
- **Visualização:** Lista a equipe de barbeiros, exibindo foto (avatar), biografia e comissão.
- **Criação [NEW]:** Formulário para cadastrar novos barbeiros (Nome, Bio, Comissão) e predefinir suas horas de trabalho diárias.
- **Edição/Status:** Ativar/desativar barbeiros da escala de atendimento.

---

## 🛠️ Mudanças Propostas

### 💻 Painel Web (`apps/web`)

#### [MODIFY] [page.tsx](file:///c:/Users/blind/Projetos/BarbeariaApp/apps/web/src/app/page.tsx)
* Substituir os dados estáticos do painel por buscas reais no Supabase:
  - Buscar agendamentos do dia atual filtrando por fuso de Rondônia (`America/Porto_Velho`).
  - Implementar funções de alteração de status (`concluir_agendamento`, `cancelar_agendamento`, `no_show`) atualizando a tabela `appointments`.
* Adicionar botões de navegação no header para as rotas `/admin/services` e `/admin/barbers`.

#### [NEW] [services/page.tsx](file:///c:/Users/blind/Projetos/BarbeariaApp/apps/web/src/app/admin/services/page.tsx)
* Criar uma página administrativa premium para gerenciar o catálogo de serviços.
* Formulário de inserção integrado ao Supabase insert na tabela `services`.
* Controle de ativação (`is_active`) atualizando em tempo real.

#### [NEW] [barbers/page.tsx](file:///c:/Users/blind/Projetos/BarbeariaApp/apps/web/src/app/admin/barbers/page.tsx)
* Criar a página de gestão da equipe de barbeiros.
* Cadastro de novos barbeiros inserindo na tabela `barbers`.
* Inserção automática de escala de expediente padrão (ex: Segunda a Sábado das 08:00 às 18:00) na tabela `barber_work_hours` para o novo barbeiro cadastrado.

---

## ⚡ Plano de Verificação e Testes

### Testes Automatizados e de Build
1. **Verificação de Compilação:** Garantir que o monorepo compila perfeitamente rodando:
   ```bash
   pnpm build
   ```

### Testes Manuais (Simulação no Navegador)
1. **Criar Serviço:** Cadastrar um serviço (ex: "Corte Degradê", Preço: R$ 45,00, Duração: 30 minutos). Validar no Table Editor do Supabase se o registro foi inserido com sucesso.
2. **Criar Barbeiro:** Cadastrar um novo barbeiro (ex: "Diego Santos", Comissão: 0.50). Validar se a escala de horários padrão foi associada no banco.
3. **Métricas Live:** Simular um agendamento fictício no banco e verificar se o painel atualizou o "Faturamento Estimado" e o contador de "Agendamentos Hoje" instantaneamente na tela.
4. **Modificação de Status:** Clicar em "Concluir" em um agendamento e verificar se o estado no banco de dados mudou para `'completed'` e se os faturamentos foram atualizados de forma dinâmica.
