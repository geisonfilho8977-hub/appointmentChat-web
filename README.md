# Galeno Chat — Frontend

Interface web do simulador de consultas médicas **Galeno**, construída com **TypeScript** + **HTML/CSS** puro, servida via `lite-server` com proxy reverso para o backend.

---

## Visão Geral

O frontend oferece:
- **Chat em tempo real** com o paciente virtual (IA)
- **Sidebar de consultas salvas** — salve, carregue e delete históricos de consulta
- **Nova consulta** — gera uma nova sessão com paciente e doença aleatórios
- **Painel Administrativo** em `/admin` — gerenciamento de alunos (protegido por chave secreta)

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|-----------|--------------|
| Node.js   | 18+          |
| npm       | 9+           |

---

## Instalação

```bash
# Entre na pasta do projeto web
cd appointmentChat-web/web

# Instale as dependências de desenvolvimento
npm install
```

---

## Executando em Desenvolvimento

> ⚠️ O backend deve estar rodando em `http://localhost:8000` antes de iniciar o frontend.

```bash
npm start
```

Este comando:
1. Compila o TypeScript (`tsc`)
2. Inicia o `lite-server` na porta **3000** com proxy para o backend

Acesse: `http://localhost:3000`

---

## Build (produção)

```bash
npm run build
```

Os arquivos JS compilados ficam em `dist/`. Para servir em produção, use um servidor web como **nginx** ou **Caddy** apontando para a pasta `public/` e `dist/`.

---

## Estrutura do Projeto

```
appointmentChat-web/
└── web/
    ├── package.json
    ├── tsconfig.json
    ├── bs-config.js              # Configuração do lite-server + proxy
    ├── public/                   # Arquivos estáticos servidos diretamente
    │   ├── index.html            # Página principal do chat
    │   ├── admin.html            # Painel administrativo (acesso via /admin.html)
    │   └── styles.css            # Design system global
    └── src/                      # TypeScript source
        ├── main.ts               # Lógica do chat + gerenciamento de sessões
        └── admin.ts              # Lógica do painel admin
```

---

## Proxy de API

O `lite-server` está configurado para redirecionar todas as requisições `/api/*` para `http://localhost:8000`. Isso permite que o frontend chame `/api/chat/chat` sem se preocupar com CORS em desenvolvimento.

Configuração em [`bs-config.js`](./web/bs-config.js):
```js
"/api" → "http://localhost:8000"
// (o prefixo /api é removido antes de repassar ao backend)
```

---

## Painel Admin (Cadastro de Alunos)

O painel administrativo para cadastrar novos alunos (definindo login e senha) pode ser acessado das seguintes formas:

1. **Diretamente pela URL:** `http://localhost:3000/admin` ou `http://localhost:3000/admin.html`
2. **Através do link na tela de login:** Há um atalho no rodapé da página de login (`http://localhost:3000/login.html`).

**Como usar:**
1. Acesse `http://localhost:3000/admin`
2. Insira a `ADMIN_SECRET_KEY` configurada no `.env` do backend
3. Gerencie os alunos cadastrados (definindo Nome, Login e Senha)

---

## Funcionalidades

### Chat Principal (`/`)
- Envie mensagens ao paciente virtual e tente descobrir o diagnóstico
- **Salvar consulta**: clique no botão "Salvar consulta" na sidebar para persistir o histórico
- **Nova consulta**: inicia uma nova sessão com paciente aleatório diferente
- **Carregar consulta salva**: clique em qualquer item na sidebar para revistar uma consulta anterior
- **Deletar consulta**: passe o mouse sobre um item salvo e clique no ícone de lixeira

### Sidebar
- Aparece automaticamente em desktop
- Em mobile: abra clicando no ícone ☰ no header

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Compila TS + inicia servidor de desenvolvimento |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run watch` | Modo watch — recompila ao salvar |

---

## Configuração do Proxy (produção com nginx)

Para servir em produção com nginx, use a seguinte configuração como base:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    root /path/to/appointmentChat-web/web/public;
    index index.html;

    # Servir JS compilado
    location ~* \.js$ {
        root /path/to/appointmentChat-web/web;
        try_files /dist$uri =404;
    }

    # Proxy para o backend FastAPI
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
