# Galeno Chat — Frontend

Interface web moderna do simulador de consultas médicas **Galeno**, construída com **TypeScript** + **HTML5/CSS3** e servida via **Nginx** ou **lite-server**.

---

## 🌟 Visão Geral

O frontend oferece uma experiência de usuário rica e responsiva para estudantes de medicina:
- **Simulação de Anamnese em Tempo Real**: Chat com respostas humanas, variação de hábitos e perfil comportamental.
- **Autenticação de Alunos**: Sistema de Login com sessão individual no `localStorage`.
- **Gerenciamento de Consultas**:
  - Salvar consultas ativas.
  - Carregar histórico de consultas anteriores.
  - **Renomeação Instantânea de Chat**: Modal padronizado de alteração de nome ao lado da lixeira.
  - **Deleção Direta**: Exclusão imediata de sessões no ícone de lixeira.
  - **Aviso de Salvamento Personalizável**: Preferência *"Não exibir aviso novamente"* salva por usuário no `localStorage`.
- **Painel Administrativo (`/admin.html`)**: Gerenciamento de alunos e relatório de consumo total de tokens acumulados em tempo real.

---

## 🛠️ Pré-requisitos

| Ferramenta | Versão mínima |
| ---------- | ------------- |
| Node.js    | 18+           |
| npm        | 9+            |
| Docker     | (opcional)    |

---

## ⚡ Instalação e Execução Local

```bash
# 1. Entre no diretório do projeto web
cd appointmentChat-web/web

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento com hot-reload e proxy reverso
npm start
```

O servidor iniciará em `http://localhost:3000` com proxy reverso automático para o backend na porta 8000.

---

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos TypeScript compilados serão salvos em `dist/`.

---

## 📁 Estrutura do Projeto

```
appointmentChat-web/
├── Dockerfile                  # Multi-stage build com Nginx
├── nginx.conf                  # Servidor de arquivos estáticos e Proxy Reverso (/api/)
└── web/
    ├── package.json
    ├── tsconfig.json
    ├── bs-config.js              # Configuração do lite-server em desenvolvimento
    ├── public/                   # HTMLs estáticos e Design System
    │   ├── index.html            # Tela principal de chat
    │   ├── login.html            # Tela de login do aluno
    │   ├── admin.html            # Painel administrativo
    │   └── styles.css            # CSS moderno com variáveis e glassmorphism
    └── src/                      # Código-fonte TypeScript
        ├── main.ts               # Lógica do chat e estado da sessão
        └── admin.ts              # Lógica do painel de administração
```

---

## 🐳 Conteinerização com Docker

O frontend está pronto para rodar conteinerizado via `docker-compose.yml` na raiz do projeto.