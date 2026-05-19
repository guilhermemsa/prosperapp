# 🗺️ ProsperApp — Roadmap

Documento de planejamento com otimizações e novas funcionalidades implementadas.

---

## 🟢 Funcionalidades Implementadas

### 1. SQL Injection no `change_password` (CRÍTICA)
- **Arquivo:** `src-tauri/src/services/auth.rs:80`
- **Problema:** `format!("PRAGMA rekey = '{}';")` usa interpolação direta de string na query SQL. A sanitização com `replace("'", "''")` é insuficiente contra ataques avançados.
- **Solução:** Usar o padrão `pragma("key", safe_password)` do `SqliteConnectOptions` ao invés de query crua, ou validar a senha com regex rejeitando caracteres especiais SQL.

### 2. API Key do Gemini em plaintext no SQLite
- **Arquivo:** `src-tauri/src/commands/import.rs:131-139`
- **Problema:** A chave da API é salva na tabela `settings` sem criptografia em nível de campo. O módulo `encryption/mod.rs` implementa Keyring mas nunca é utilizado.
- **Solução:** Usar `EncryptionService::save_to_keyring()` / `get_from_keyring()` para armazenar a API key no Keychain do sistema operacional.

### 3. Ausência de validação de autenticação nos commands
- **Problema:** Nenhum command Tauri verifica `is_locked` antes de executar. Chamadas IPC diretas executam operações no banco mesmo com o app bloqueado.
- **Solução:** Criar macro ou helper que verifica `is_locked` em todos os commands.

### 4. Senha mínima inconsistente e fraca
- **Problema:** Onboarding aceita 4 caracteres, alteração de senha exige 6. Ambos são insuficientes para proteger AES-256.
- **Solução:** Unificar para mínimo de 8 caracteres com validação de complexidade.

### 5. Sem proteção contra brute-force no login
- **Problema:** Não existe rate limiting no endpoint de login.
- **Solução:** Implementar delay progressivo (1s, 2s, 4s...) ou lockout após N tentativas.

### 6. `delete_account` não limpa transações órfãs
- **Arquivo:** `src-tauri/src/commands/account.rs:61`
- **Problema:** Transações vinculadas ficam com `account_id` apontando para registro inexistente.
- **Solução:** Usar `ON DELETE CASCADE` no schema ou deletar as transações explicitamente na mesma transaction SQL.

---

## 🟡 Otimizações

### 1. Boilerplate de pool extraction
- **Problema:** Todo command repete 4 linhas idênticas para extrair o pool do state.
- **Solução:** Criar método helper `AuthState::get_pool()`.

### 2. Schema sem índices
- **Problema:** Nenhuma tabela tem índices além da primary key. Full table scans em queries frequentes.
- **Solução:** Criar migration com índices em `transactions(account_id)`, `transactions(date DESC)`, `transactions(type)`.

### 3. Dashboard agrega no frontend
- **Problema:** `DashboardPage.tsx` carrega todas as transações e filtra/agrega em JavaScript.
- **Solução:** Criar queries SQL agregadas no backend (`SUM`, `GROUP BY`).

### 4. Sem paginação na listagem de transações
- **Problema:** `get_transactions` retorna todas as transações sem limite.
- **Solução:** Implementar `LIMIT/OFFSET` ou cursor-based pagination.

### 5. `reqwest::Client` recriado a cada importação
- **Arquivo:** `src-tauri/src/commands/import.rs:205`
- **Solução:** Armazenar no state do Tauri e reutilizar.

### 6. Módulo de criptografia não utilizado
- **Arquivo:** `src-tauri/src/encryption/mod.rs`
- **Problema:** Argon2 + Keyring implementados mas marcados com `#![allow(dead_code)]`.
- **Solução:** Usar para armazenar API key ou remover para reduzir binário.

### 7. ✅ Imports não utilizados na ImportPage
- **Arquivo:** `src/modules/import/pages/ImportPage.tsx:3-5`
- **Problema:** `FileUp`, `format`, `ptBR`, `Category` importados mas nunca usados.

---

## 🟢 Novas Funcionalidades

### Prioridade Alta (Core)

- [x] **Edição de transações** — Atualmente só é possível criar e deletar. Falta poder editar valores, categorias, datas e descrições de transações existentes.

- [x] **Transações recorrentes** — O campo `recurring_id` já existe no schema mas não é utilizado. Implementar gastos fixos mensais como aluguel, streaming, salário, etc. com criação automática.

- [x] **Backup e Exportação** — Exportar dados para CSV e PDF. A pasta `backups/` já existe no projeto mas sem funcionalidade. Incluir opção de restauração de backup.

- [x] **Auto-lock por inatividade** — Bloquear automaticamente o app após X minutos sem uso. Essencial para segurança de um app financeiro.

- [x] **Transferência entre contas** — O tipo `transfer` já existe no schema de transações mas não há UI. Implementar movimentação de dinheiro entre contas com lançamento duplo (débito e crédito).

### Prioridade Média (UX)

- [x] **Orçamento mensal por categoria** — Definir limite de gastos por categoria e exibir alertas visuais quando ultrapassar ou se aproximar do limite.

- [x] **Relatórios e gráficos avançados** — Gráfico de pizza por categoria, evolução patrimonial ao longo do tempo, comparativo mês a mês, ranking de maiores gastos.

- [x] **Busca global (Command+K)** — Busca unificada de transações, contas e categorias com atalho de teclado, estilo command palette.

- [x] **Notificações de vencimento** — Alertar sobre datas de vencimento de faturas de cartão (usando `closing_day` e `due_day`) e metas com deadline próximo.

- [x] **Categorias customizáveis** — Permitir ao usuário criar, editar e deletar categorias além das pré-definidas. Hoje são fixas via seed migration.

### Prioridade Baixa (Nice to have)

- [x] **Multi-moeda com conversão** — Cotação automática para quem tem contas em USD/EUR usando API de câmbio.

- [x] **Importação de OFX/QIF** — Suporte a formatos padrão de exportação bancária brasileira, sem depender da API do Gemini.

- [x] **Modo responsivo / sidebar colapsável** — Layout adaptativo para telas menores, sidebar que pode ser recolhida.

- [x] **Tema customizável** — Além de light/dark/system, permitir cores personalizadas e paletas pré-definidas.

- [x] **Atalhos de teclado globais** — Ctrl+N para nova transação, Ctrl+F para buscar, Ctrl+, para configurações, etc.

---

## 📋 Ordem de Priorização Recomendada

1. ✅ Corrigir SQL injection no `change_password`
2. ✅ Adicionar auth guard em todos os commands
3. ✅ Mover API key para OS Keyring
4. ✅ Criar índices no banco de dados
5. ✅ Implementar edição de transações
6. ✅ Implementar transações recorrentes
7. ✅ Implementar paginação de transações
8. ✅ Transferência entre contas
9. ✅ Backup/Exportação CSV
10. ✅ Auto-lock por inatividade
