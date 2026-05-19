# ProsperApp 🚀

**ProsperApp** é um gerenciador de finanças pessoais moderno, focado em privacidade e com arquitetura *local-first*. Desenvolvido com **Tauri**, **React** e **Rust**, ele garante que seus dados financeiros nunca saiam do seu computador, ao mesmo tempo que oferece recursos poderosos como importação de transações via IA.

![ProsperApp Alpha](https://img.shields.io/badge/vers%C3%A3o-0.0.1--alpha-orange)
![Privacidade](https://img.shields.io/badge/privacidade-local--first-blue)
![Seguran%C3%A7a](https://img.shields.io/badge/seguran%C3%A7a-AES--256-green)

## ✨ Funcionalidades

- **🔒 Segurança Local-First:** Seus dados são armazenados localmente em um banco de dados SQLite criptografado (AES-256 via SQLCipher).
- **🤖 Importação via IA:** Utilize o Google Gemini para extrair automaticamente transações de PDFs, imagens, recibos e notas fiscais.
- **📊 Análises Avançadas:** Dashboard com fluxo de caixa, gastos por categoria e gráficos de evolução patrimonial.
- **💳 Multi-contas e Cartões:** Gerencie contas bancárias, cartões de crédito, investimentos e metas em um único lugar.
- **⚙️ Automação:** Transações recorrentes e bloqueio automático do app para maior privacidade.
- **🔍 Paleta de Comandos:** Navegação rápida e busca global usando `Ctrl+K` ou `Cmd+K`.
- **🎨 Experiência Personalizada:** Modos Claro/Escuro com diversas opções de cores de destaque.

## 🛠️ Tecnologias

- **Frontend:** React 19, TypeScript, Tailwind CSS, TanStack Query/Router, Zustand, Recharts, Lucide.
- **Backend:** Rust, Tauri v2.
- **Banco de Dados:** SQLite (SQLCipher) com SQLx.
- **Integração de IA:** API do Google Gemini.

## 🚀 Como Começar

### Pré-requisitos

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (v18+)
- [Dependências do Tauri](https://tauri.app/v1/guides/getting-started/prerequisites)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/prosperapp.git
   cd prosperapp
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute em modo de desenvolvimento:
   ```bash
   npm run tauri dev
   ```

4. Gere o executável para produção:
   ```bash
   npm run tauri build
   ```

## 🛡️ Privacidade e Segurança

O ProsperApp foi projetado com a abordagem "Privacy by Design":
- **Zero Nuvem:** Nenhum dado é enviado para qualquer servidor (exceto para a API do Gemini, caso você opte por usar o recurso de Importação via IA).
- **Criptografia:** Sua senha mestre gera uma chave (Argon2) usada para criptografar todo o banco de dados.
- **Código Aberto:** Transparência total sobre como seus dados financeiros são manipulados.

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---
*Desenvolvido com ❤️ para sua liberdade financeira.*
