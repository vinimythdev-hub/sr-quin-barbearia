# PLAN: Implementação do Fluxo de Autenticação (Supabase Auth) 🔐

Este plano detalha as etapas para implementar o fluxo completo de autenticação e gerenciamento de sessões do usuário no ecossistema **BarbeariaApp**, englobando o aplicativo **Mobile (Expo)** e consolidando as validações do **Painel Web (Next.js)**.

---

## 🎯 Objetivo

Garantir que clientes (no Mobile) e administradores (na Web) possam se cadastrar, fazer login e manter suas sessões salvas de forma segura e criptografada, utilizando o **Supabase Auth** e persistindo os perfis automaticamente no banco de dados através da trigger PostgreSQL já configurada.

---

## 👥 Fluxos de Usuário

### A. Aplicativo Mobile (Cliente)
1. O usuário abre o app. A sessão é verificada no armazenamento criptografado do dispositivo (`expo-secure-store`).
2. Se **não autenticado**: é direcionado à tela de autenticação premium (`AuthScreen`).
   - O usuário pode realizar **Login** com e-mail e senha.
   - O usuário pode realizar **Cadastro** preenchendo Nome, Celular, E-mail e Senha (com validação estrita).
3. Se **autenticado**: é direcionado diretamente para a área logada do app (Home).

### B. Painel Web (Administrador/Gerente)
1. O administrador acessa a URL do painel.
2. Se **não autenticado**: é redirecionado para a tela `/login` (que possui um design premium dark e dourado).
3. Se **autenticado**: acessa o painel completo de métricas e controle.

---

## 🛠️ Mudanças Propostas

### 1. Pacote Compartilhado (`packages/shared`)
Nenhuma alteração estrutural imediata é necessária, pois a tipagem do banco (`database.types.ts`) e o validador Zod já estão no lugar.

---

### 2. Aplicativo Mobile (`apps/mobile`)

#### [MODIFY] [package.json](file:///c:/Users/blind/Projetos/BarbeariaApp/apps/mobile/package.json)
* Adicionar a dependência `react-native-url-polyfill` para garantir a conformidade com as especificações de URL que o cliente Javascript do Supabase exige em ambientes React Native.

#### [NEW] [supabase.ts](file:///c:/Users/blind/Projetos/BarbeariaApp/apps/mobile/src/lib/supabase.ts)
* Inicializar o cliente Supabase tipado.
* Configurar o adaptador de armazenamento criptografado seguro usando `expo-secure-store` para persistência segura dos tokens JWT (Access Token e Refresh Token).

#### [NEW] [AuthScreen.tsx](file:///c:/Users/blind/Projetos/BarbeariaApp/apps/mobile/src/screens/AuthScreen.tsx)
* Criar uma tela de login e cadastro sofisticada seguindo a identidade clássica da barbearia:
  - Paleta com fundo preto profundo (`#0a0a0c`), textos em tons ardósia e botões com gradientes dourados (`#d4af37`).
  - Inputs elegantes e customizados com feedbacks visuais em tempo real.
  - Alternador suave entre modo "Login" e "Cadastro".
  - Validação de formulário robusta com Zod para o cadastro (nome obrigatório, e-mail válido, celular formatado e senha de no mínimo 6 caracteres).

#### [MODIFY] [App.tsx](file:///c:/Users/blind/Projetos/BarbeariaApp/apps/mobile/App.tsx)
* Adicionar gerenciamento de estado da sessão (`session`) e estado de carregamento (`loading`).
* Ouvir alterações no estado de autenticação em tempo real utilizando `supabase.auth.onAuthStateChange`.
* Chavear a renderização da aplicação: se `session` for nula, renderiza `<AuthScreen />`; se existir, exibe o painel logado com opção de logout funcional.

---

### 3. Painel Web (`apps/web`)

#### [MODIFY] [page.tsx](file:///c:/Users/blind/Projetos/BarbeariaApp/apps/web/src/app/page.tsx)
* Garantir o redirecionamento imediato caso a sessão expire, tratando os retornos do Supabase localmente de forma resiliente.

---

## ⚡ Plano de Verificação e Testes

### Testes Automatizados e de Build
1. **Verificação de Compilação:** Garantir que o monorepo compila de forma limpa rodando:
   ```bash
   pnpm build
   ```
2. **Validação de Tipagem:** Garantir que as chamadas de autenticação e busca de perfil não gerem erros no TypeScript em nenhum dos ambientes.

### Testes Manuais (Simulação no Dispositivo e Navegador)
* **Mobile (Expo):**
  1. Abrir o app e validar se a tela de login premium abre por padrão.
  2. Tentar cadastrar um usuário com dados inválidos (ex: e-mail inválido, senha curta) e ver se os alertas aparecem de forma estilosa.
  3. Cadastrar um usuário real. Validar na tabela `auth.users` e na tabela `public.profiles` do Supabase se o registro foi inserido perfeitamente com a trigger.
  4. Fazer logout e garantir que o app volta para a tela de autenticação.
  5. Fechar o app (Metro/Expo) e reabrir para validar se a sessão continua salva de forma transparente via SecureStore.
* **Web (Next.js):**
  1. Acessar a raiz da aplicação e validar o redirecionamento automático para `/login`.
  2. Logar como administrador e validar a renderização das métricas personalizadas.
