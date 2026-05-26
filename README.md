# 💈 Sr. Quin Barbearia

> Plataforma de agendamento de alta costura e fidelidade para a barbearia clássica de Rondônia. Desenvolvida em arquitetura Monorepo de alta performance com Next.js, React Native (Expo) e Supabase.

---

## 🎨 O Conceito: Bauhaus & Mid-Century Modern

Diferente de interfaces genéricas de tecnologia (estilo azul financeiro ou neons cibernéticos), a plataforma do **Sr. Quin** foi desenhada seguindo a estética editorial clássica **Mid-Century Modern / Bauhaus**.

*   **Paleta de Cores Orgânica:** Tons terrosos quentes de carvão vegetal (`#11100f`), cinza carbono (`#181615`), divisores em argila (`#2c2826`) e realces em ouro envelhecido (`#d4af37`). **Sem tons roxos, azuis ou neons.**
*   **Tipografia Tradicional:** Serifas sofisticadas para títulos (`Cinzel` no Web, `Didot` / `Georgia` nativas no iOS/Android) contrastando com fontes sans-serif extremamente legíveis e modernas (`Plus Jakarta Sans` no Web, `Avenir Next` no Mobile) para textos corridos.
*   **Elementos Tácteis:** Bordas finas e angulares (`rounded-md` com 6px de raio máximo), cartões sólidos com sombras físicas profundas, e a tela de fidelidade desenhada como cartões físicos com carimbos/moedas de cobre cunhadas.

---

## 📁 Arquitetura do Repositório (Monorepo)

O projeto é estruturado como um monorepo gerenciado com **pnpm workspaces** e **Turborepo** para compilação paralela otimizada.

```
├── apps
│   ├── web          # Painel Administrativo em Next.js 14 (App Router, Tailwind)
│   └── mobile       # App do Cliente em Expo React Native (Navegação nativa, offline-first)
├── packages
│   └── shared       # Tipagens, esquemas de validação Zod e utilitários compartilhados
├── supabase-schema.sql  # Estrutura relacional do banco de dados (tabelas, triggers e RLS)
├── seed-data.sql        # Dados iniciais de teste (barbeiros, expedientes e serviços)
└── start-dev.bat        # Script batch de inicialização rápida em ambiente local
```

---

## ⚡ Tecnologias e Dependências do Ecossistema

### 💻 Painel Administrativo (`apps/web`)
*   **Next.js 14 (App Router):** Painel corporativo otimizado para servidores com Server-Side Rendering (SSR) e layouts estáticos rápidos.
*   **Tailwind CSS:** Estilização utilitária aplicada sob uma camada customizada de tokens (`@layer base`) garantindo fidelidade de design em toda a navegação.
*   **Lucide React:** Ícones minimalistas de traço fino de 1.5px perfeitamente alinhados à identidade clássica.

### 📱 Aplicativo do Cliente (`apps/mobile`)
*   **Expo & React Native:** Compilação nativa para iOS e Android.
*   **Navegação Nativa:** Fluxos fluídos de agendamento divididos em etapas claras.
*   **Luxury Fonts Fallback:** Uso estratégico das fontes do sistema (`Didot` no iOS, `serif` no Android) para carregamento instantâneo de fontes sofisticadas com custo zero de carregamento de bundles.

### ⚙️ Compartilhado (`packages/shared`)
*   **Zod:** Schemas declarativos de validação compartilhados entre formulários front-end (web e mobile) e consultas de banco de dados.
*   **TypeScript:** Definição centralizada de interfaces (ex: `Appointment`, `Barber`, `Service`, `Profile`) garantindo integridade estática no build do Turborepo.

---

## 🗄️ Estrutura de Banco de Dados & Inteligência Relacional (Supabase)

O motor do sistema utiliza recursos avançados do PostgreSQL executado no **Supabase**:

### 🛡️ Restrição Anti-Choque Física (GIST Index)
Para evitar que dois clientes agendem simultaneamente o mesmo barbeiro, o banco utiliza um índice de exclusão geométrica-temporal (`btree_gist`):
```sql
ALTER TABLE public.appointments ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
    barber_id WITH =,
    tstzrange(start_time, end_time) WITH &&
)
WHERE (status != 'cancelled');
```
Qualquer tentativa de sobreposição de horário é bloqueada a nível de banco de dados físicos de forma atômica.

### 🕰️ Stored Procedure de Reserva Clássica (`book_appointment`)
A lógica de agendamento executa em uma função PL/pgSQL nativa com tratamento completo do fuso horário de **Rondônia** (`America/Porto_Velho`):
1.  Busca a duração e preço vigentes do serviço.
2.  Valida se o barbeiro trabalha no dia da semana escolhido (segunda a sábado).
3.  Garante que o horário está estritamente dentro da escala de trabalho do barbeiro.
4.  Garante que o horário **não conflita** com a pausa para almoço do barbeiro.
5.  Insere o registro bloqueando transações simultâneas que possam causar conflito.

### 💬 Automação de Notificações via WhatsApp
Gatilhos reativos monitoram inserções e atualizações em `public.appointments` e alimentam automaticamente uma fila de mensagens (`public.pending_notifications`) que conta com uma lógica inteligente de disparos:
1.  **Mensagem de Confirmação:** Gerada imediatamente após a criação do agendamento.
2.  **Mensagem de Lembrete Inteligente:**
    *   *Se o serviço for de manhã (antes de 12:00 local):* O lembrete é agendado automaticamente para a véspera (1 dia antes) às **18:00**.
    *   *Se o serviço for à tarde ou noite (12:00 em diante local):* O lembrete é agendado para o próprio dia às **08:00**.

---

## 🛠️ Como Executar o Projeto em Desenvolvimento

### Pré-requisitos
*   **Node.js 18+**
*   **pnpm** (recomendado para gerenciar monorepos)
*   **Supabase CLI** (para execução local ou sincronização remota)

### Passo 1: Instalação das Dependências
No diretório raiz do projeto, instale as dependências de todos os workspaces de forma centralizada:
```bash
pnpm install
```

### Passo 2: Configuração de Variáveis de Ambiente

Crie um arquivo de ambiente na raiz da aplicação web (`apps/web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

Crie o arquivo correspondente para o app mobile (`apps/mobile/.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### Passo 3: Preparação do Banco de Dados
1.  Acesse o painel do seu projeto no Supabase.
2.  Abra o **SQL Editor**.
3.  Copie e execute o conteúdo de [supabase-schema.sql](file:///c:/Users/blind/Projetos/BarbeariaApp/supabase-schema.sql) para estruturar o banco, configurar as triggers e as políticas de segurança (RLS).
4.  Copie e execute o conteúdo de [seed-data.sql](file:///c:/Users/blind/Projetos/BarbeariaApp/seed-data.sql) para popular o banco de dados com barbeiros iniciais, escalas de trabalho padrão e serviços.

### Passo 4: Rodar o Ambiente
Se você estiver no **Windows**, basta dar dois cliques no arquivo:
```bash
start-dev.bat
```
Ele abrirá automaticamente dois terminais paralelos pré-filtrados executando a Web e o Mobile.

Se estiver no **macOS ou Linux**, você pode rodar os comandos separadamente:
```bash
# Rodar todos os projetos em paralelo
pnpm dev

# Ou rodar especificamente a Web
pnpm --filter web dev

# Ou rodar especificamente o Mobile
pnpm --filter mobile start
```

---

## 📦 Build para Produção

Para validar os tipos, lints de código e construir os bundles otimizados de produção em todas as aplicações com cache inteligente:
```bash
pnpm build
```

---

## 👨‍💻 Convenções do Código e Desenvolvimento
*   **Segurança em Primeiro Lugar:** Toda tabela possui Row Level Security (RLS) habilitada. As políticas só permitem que clientes leiam ou atualizem seus próprios perfis e consultas. Admins têm acesso universal através da função otimizada `public.is_admin()`.
*   **TypeScript Estrito:** Evite o uso de `any`. Tipagens complexas devem ser criadas no pacote `@barbearia/shared` para evitar disparidade entre o aplicativo cliente e o painel administrativo.
*   **Clean CSS:** Estilização orientada a utilitários e variáveis CSS globais de design tokens, mantendo layouts fluidos, responsivos e fiéis ao estilo Mid-Century clássico do Sr. Quin.
