export {}; // ES module — isola escopo

const ADMIN_API = "/api/admin";

// ─── State ───────────────────────────────────────────────────────────────────
let adminKey: string = sessionStorage.getItem("galeno_admin_key") || "";

interface Student {
    id: string;
    name: string;
    login: string;
    created_at: string;
}

// ─── DOM refs ────────────────────────────────────────────────────────────────
const authScreen    = document.getElementById("auth-screen")!;
const dashboard     = document.getElementById("dashboard-screen")!;
const authForm      = document.getElementById("auth-form") as HTMLFormElement;
const keyInput      = document.getElementById("key-input") as HTMLInputElement;
const authBtn       = document.getElementById("auth-btn") as HTMLButtonElement;
const authError     = document.getElementById("auth-error")!;
const logoutBtn     = document.getElementById("logout-btn")!;

const countEl       = document.getElementById("count")!;
const loadingEl     = document.getElementById("loading")!;
const tableWrap     = document.getElementById("table-wrap")!;
const tbody         = document.getElementById("tbody")!;
const emptyEl       = document.getElementById("empty")!;

const fName         = document.getElementById("f-name") as HTMLInputElement;
const fLogin        = document.getElementById("f-login") as HTMLInputElement;
const fPass         = document.getElementById("f-pass") as HTMLInputElement;
const addBtn        = document.getElementById("add-btn") as HTMLButtonElement;

const toastEl       = document.getElementById("toast")!;

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(msg: string, type: "ok" | "err" = "ok") {
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.className = `show ${type}`;
    toastTimer = setTimeout(() => { toastEl.className = ""; }, 3200);
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${ADMIN_API}${path}`, {
        method,
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Erro ${res.status}`);
    }

    return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function tryLogin(key: string): Promise<boolean> {
    try {
        await fetch(`${ADMIN_API}/verify`, { headers: { "X-Admin-Key": key } })
            .then(r => { if (!r.ok) throw new Error(); });
        return true;
    } catch {
        return false;
    }
}

function showDashboard() {
    authScreen.style.display = "none";
    dashboard.classList.add("show");
    loadStudents();
}

function showAuth() {
    dashboard.classList.remove("show");
    authScreen.style.display = "flex";
}

// ─── Students ─────────────────────────────────────────────────────────────────
async function loadStudents() {
    loadingEl.style.display = "block";
    tableWrap.style.display = "none";
    emptyEl.style.display   = "none";

    try {
        const list = await api<Student[]>("GET", "/students");
        renderTable(list);
    } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : "Erro ao carregar alunos.", "err");
    } finally {
        loadingEl.style.display = "none";
    }
}

function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderTable(list: Student[]) {
    countEl.textContent = `${list.length} aluno${list.length !== 1 ? "s" : ""}`;

    if (list.length === 0) {
        emptyEl.style.display   = "block";
        tableWrap.style.display = "none";
        return;
    }

    tbody.innerHTML = "";
    list.forEach(s => {
        const date = new Date(s.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric"
        });
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="td-name">${esc(s.name)}</td>
            <td class="td-login">${esc(s.login)}</td>
            <td class="td-date">${date}</td>
            <td class="td-actions">
                <button class="btn-remove" data-id="${s.id}" data-name="${esc(s.name)}">Remover</button>
            </td>`;
        tbody.appendChild(tr);
    });

    tableWrap.style.display = "block";
    emptyEl.style.display   = "none";
}

async function addStudent() {
    const name  = fName.value.trim();
    const login = fLogin.value.trim();
    const pass  = fPass.value;

    if (!name || !login || !pass) {
        showToast("Preencha todos os campos.", "err"); return;
    }

    if (pass.length < 6) {
        showToast("A senha deve ter ao menos 6 caracteres.", "err"); return;
    }

    addBtn.disabled    = true;
    addBtn.textContent = "Cadastrando…";

    try {
        await api("POST", "/students", { name, login, password: pass });
        fName.value = fLogin.value = fPass.value = "";
        showToast(`Aluno "${name}" cadastrado!`);
        await loadStudents();
    } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : "Erro ao cadastrar.", "err");
    } finally {
        addBtn.disabled    = false;
        addBtn.textContent = "+ Cadastrar";
    }
}

async function removeStudent(id: string, name: string) {
    if (!confirm(`Remover "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
        await api("DELETE", `/students/${id}`);
        showToast(`"${name}" removido.`);
        await loadStudents();
    } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : "Erro ao remover.", "err");
    }
}

// ─── Events ────────────────────────────────────────────────────────────────────
authForm.addEventListener("submit", async e => {
    e.preventDefault();
    const key = keyInput.value.trim();
    if (!key) return;

    authBtn.disabled    = true;
    authBtn.textContent = "Verificando…";
    authError.classList.remove("show");

    const ok = await tryLogin(key);

    if (ok) {
        adminKey = key;
        sessionStorage.setItem("galeno_admin_key", key);
        showDashboard();
    } else {
        authError.classList.add("show");
        keyInput.value = "";
    }

    authBtn.disabled    = false;
    authBtn.textContent = "Acessar Painel";
});

addBtn.addEventListener("click", addStudent);
fPass.addEventListener("keydown", e => { if (e.key === "Enter") addStudent(); });

logoutBtn.addEventListener("click", () => {
    adminKey = "";
    sessionStorage.removeItem("galeno_admin_key");
    showAuth();
});

tbody.addEventListener("click", e => {
    const btn = (e.target as HTMLElement).closest(".btn-remove") as HTMLElement | null;
    if (!btn) return;
    removeStudent(btn.dataset.id!, btn.dataset.name || "aluno");
});

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    if (adminKey) {
        const ok = await tryLogin(adminKey);
        if (ok) { showDashboard(); return; }
        adminKey = "";
        sessionStorage.removeItem("galeno_admin_key");
    }
})();