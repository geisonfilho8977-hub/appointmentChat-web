export {}; // Marca este arquivo como módulo ES — isola o escopo global

// ─── Auth Guard ───────────────────────────────────────────────────────────────
// Redireciona para login.html se o usuário não estiver autenticado
const _userRaw = sessionStorage.getItem("galeno_user");
if (!_userRaw) {
    window.location.replace("/login.html");
    // Interrompe execução do restante do script enquanto redireciona
    throw new Error("Unauthenticated — redirecting to login");
}
const _currentUser: { login: string; name: string } = JSON.parse(_userRaw);

// ─── Constants ───────────────────────────────────────────────────────────────
const BACKEND_CHAT_URL    = "/api/chat/chat";
const BACKEND_SESSION_URL = "/api/chat/sessions";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

interface SavedChat {
    id: string;
    session_id: string;
    title: string;
    disease: string | null;
    symptom_list: string[];
    history: Array<{ role: string; message: string; timestamp: string }>;
    created_at: string;
    updated_at: string;
}

// ─── SVG icons ────────────────────────────────────────────────────────────────
const botIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  <path d="M12 11v6"/>
  <path d="M8 15h.01"/>
  <path d="M16 15h.01"/>
  <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
</svg>`;

const userIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>`;

const chatIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
</svg>`;

const trashIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14H6L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4h6v2"/>
</svg>`;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const chatContainer    = document.getElementById("chat-container")!;
const chatInput        = document.getElementById("chat-input") as HTMLInputElement;
const sendButton       = document.getElementById("send-button")!;
const typingTemplate   = document.getElementById("typing-indicator-template") as HTMLTemplateElement;
const newChatBtn       = document.getElementById("new-chat-btn")!;
const saveChatBtn      = document.getElementById("save-chat-btn") as HTMLButtonElement;
const sidebarChats     = document.getElementById("sidebar-chats")!;
const sidebarEmpty     = document.getElementById("sidebar-empty")!;
const sidebar          = document.getElementById("sidebar")!;
const sidebarToggle    = document.getElementById("sidebar-toggle")!;
const sidebarOverlay   = document.getElementById("sidebar-overlay")!;
const toast            = document.getElementById("app-toast")!;

// ─── State ────────────────────────────────────────────────────────────────────
let storedId: string | undefined;
let chatMessages: ChatMessage[] = [];
let activeChatId: string | null = null;  // ID do chat salvo atualmente ativo

// ─── Device detection ─────────────────────────────────────────────────────────
const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

function updateDeviceProfile(): boolean {
    const nav = navigator.userAgent || navigator.vendor || "";
    const hasCoarse = typeof window.matchMedia === "function"
        ? window.matchMedia("(pointer: coarse)").matches : false;
    const isMobile = hasCoarse || MOBILE_UA.test(nav);
    document.documentElement.dataset.device = isMobile ? "mobile" : "desktop";
    return isMobile;
}

function initDeviceDetection() {
    let tid: number | undefined;
    const debounce = () => {
        if (tid) window.clearTimeout(tid);
        tid = window.setTimeout(updateDeviceProfile, 200);
    };
    updateDeviceProfile();
    window.addEventListener("resize", debounce);
    window.addEventListener("orientationchange", debounce);
}

// ─── Session ID ───────────────────────────────────────────────────────────────
function generateSessionId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function getSessionId(): string {
    if (storedId) return storedId;
    storedId = generateSessionId();
    return storedId;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message: string, type: "success" | "error" = "success") {
    toast.textContent = message;
    toast.className = `app-toast show ${type}`;
    setTimeout(() => { toast.className = "app-toast"; }, 3000);
}

// ─── Sidebar toggle (mobile) ──────────────────────────────────────────────────
function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("visible");
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("visible");
}

sidebarToggle.addEventListener("click", () => {
    sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
});

sidebarOverlay.addEventListener("click", closeSidebar);

// ─── Chat UI helpers ──────────────────────────────────────────────────────────
function hideWelcome() {
    const welcome = chatContainer.querySelector(".chat-app__welcome");
    if (welcome) welcome.classList.add("hidden");
}

function showWelcome() {
    const welcome = document.getElementById("welcome-msg");
    if (welcome) welcome.classList.remove("hidden");
}

function addMessage(role: string, content: string) {
    hideWelcome();

    const wrapper = document.createElement("div");
    wrapper.classList.add("message-wrapper", role);

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("message-wrapper__avatar");
    avatarDiv.classList.add(role === "user" ? "message-wrapper__avatar--user" : "message-wrapper__avatar--bot");

    const avatarIcon = document.createElement("div");
    avatarIcon.classList.add("message-wrapper__avatar-icon");
    avatarIcon.innerHTML = role === "user" ? userIconSVG : botIconSVG;
    avatarDiv.appendChild(avatarIcon);

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", role);
    messageDiv.textContent = content;

    wrapper.appendChild(avatarDiv);
    wrapper.appendChild(messageDiv);

    chatContainer.appendChild(wrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    hideWelcome();
    const typingNode = typingTemplate.content.cloneNode(true) as DocumentFragment;
    const container = document.createElement("div");
    container.classList.add("typing-wrapper");

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("message-wrapper__avatar", "message-wrapper__avatar--bot");

    const avatarIcon = document.createElement("div");
    avatarIcon.classList.add("message-wrapper__avatar-icon");
    avatarIcon.innerHTML = botIconSVG;
    avatarDiv.appendChild(avatarIcon);

    container.appendChild(avatarDiv);
    container.appendChild(typingNode);
    chatContainer.appendChild(container);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return container;
}

function clearChat() {
    chatContainer.innerHTML = `
        <div class="chat-app__welcome" id="welcome-msg">
            <div class="chat-app__welcome-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V22M2 12H22" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
                </svg>
            </div>
            <h2 class="chat-app__welcome-title">Bem vindo ao Galeno</h2>
            <p class="chat-app__welcome-text">Seu paciente está à sua espera</p>
        </div>`;
    chatMessages = [];
    activeChatId = null;
    updateActiveSidebarItem(null);
}

// ─── Send message ─────────────────────────────────────────────────────────────
async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    chatMessages.push({ role: "user", content: userMessage });
    addMessage("user", userMessage);
    chatInput.value = "";

    const typingIndicator = showTypingIndicator();

    try {
        const payload = { session_id: getSessionId(), message: userMessage };
        const response = await fetch(BACKEND_CHAT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorPayload = await response.text();
            throw new Error(errorPayload || `Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.content ?? data.message;
        if (!assistantMessage) throw new Error("Resposta inválida do backend.");

        chatMessages.push({ role: "assistant", content: assistantMessage });
        addMessage("assistant", assistantMessage);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        addMessage("assistant", `Erro ao conectar ao backend: ${errorMessage}`);
    } finally {
        typingIndicator.remove();
    }
}

// ─── Saved chats (sidebar) ────────────────────────────────────────────────────
async function loadSavedChats() {
    try {
        const res = await fetch(`${BACKEND_SESSION_URL}/${getSessionId()}`);
        if (!res.ok) return;
        const chats: SavedChat[] = await res.json();
        renderSidebarChats(chats);
    } catch {
        // Silently fail — saved chats are optional
    }
}

function renderSidebarChats(chats: SavedChat[]) {
    // Remove items antigos (mantém o sidebarEmpty)
    Array.from(sidebarChats.querySelectorAll(".sidebar__chat-item")).forEach(el => el.remove());

    if (chats.length === 0) {
        sidebarEmpty.classList.remove("hidden");
        return;
    }

    sidebarEmpty.classList.add("hidden");

    chats.forEach((chat) => {
        const item = document.createElement("div");
        item.classList.add("sidebar__chat-item");
        item.dataset.chatId = chat.id;
        if (chat.id === activeChatId) item.classList.add("active");

        item.innerHTML = `
            <span class="sidebar__chat-item__icon">${chatIconSVG}</span>
            <span class="sidebar__chat-item__title" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</span>
            <button class="sidebar__chat-item__delete" data-chat-id="${chat.id}" data-chat-title="${escapeHtml(chat.title)}" aria-label="Deletar chat">
                ${trashIconSVG}
            </button>
        `;

        // Clique no item: carrega o chat
        item.addEventListener("click", (e) => {
            if ((e.target as HTMLElement).closest(".sidebar__chat-item__delete")) return;
            loadChat(chat);
        });

        sidebarChats.insertBefore(item, sidebarEmpty);
    });
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function updateActiveSidebarItem(chatId: string | null) {
    document.querySelectorAll(".sidebar__chat-item").forEach(el => {
        el.classList.toggle("active", (el as HTMLElement).dataset.chatId === chatId);
    });
}

function loadChat(chat: SavedChat) {
    clearChat();
    activeChatId = chat.id;

    // Repopula o histórico visualmente
    for (const entry of chat.history) {
        const role = entry.role === "assistant" ? "assistant" : "user";
        chatMessages.push({ role, content: entry.message });
        addMessage(role, entry.message);
    }

    updateActiveSidebarItem(chat.id);
    closeSidebar();
}

async function saveCurrentChat() {
    if (chatMessages.length === 0) {
        showToast("Nenhuma mensagem para salvar.", "error");
        return;
    }

    saveChatBtn.disabled = true;
    saveChatBtn.style.opacity = "0.6";

    try {
        const res = await fetch(BACKEND_SESSION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: getSessionId() }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || `Erro ${res.status}`);
        }

        const saved: SavedChat = await res.json();
        activeChatId = saved.id;
        showToast("Consulta salva com sucesso!");
        await loadSavedChats();
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`Erro ao salvar: ${msg}`, "error");
    } finally {
        saveChatBtn.disabled = false;
        saveChatBtn.style.opacity = "";
    }
}

async function deleteChat(chatId: string, title: string) {
    if (!confirm(`Deletar a consulta "${title}"? Esta ação não pode ser desfeita.`)) return;

    try {
        const res = await fetch(`${BACKEND_SESSION_URL}/${chatId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Erro ${res.status}`);

        showToast("Consulta deletada.");
        if (activeChatId === chatId) clearChat();
        await loadSavedChats();
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`Erro ao deletar: ${msg}`, "error");
    }
}

// Delegação de eventos para botões de delete na sidebar
sidebarChats.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(".sidebar__chat-item__delete") as HTMLElement | null;
    if (!btn) return;
    const chatId = btn.dataset.chatId!;
    const title = btn.dataset.chatTitle || "consulta";
    deleteChat(chatId, title);
});

// ─── Event listeners ──────────────────────────────────────────────────────────
sendButton.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});

newChatBtn.addEventListener("click", () => {
    // Gera nova session_id e limpa o chat
    storedId = generateSessionId();
    clearChat();
    closeSidebar();
});

saveChatBtn.addEventListener("click", saveCurrentChat);

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
    initDeviceDetection();
    loadSavedChats();

    // Exibir nome do usuário logado no header
    const headerStatus = document.querySelector(".chat-app__header-status") as HTMLElement | null;
    if (headerStatus && _currentUser?.name) {
        headerStatus.textContent = _currentUser.name;
    }

    // Botão de logout na sidebar footer
    const sidebarFooter = document.querySelector(".sidebar__footer") as HTMLElement | null;
    if (sidebarFooter) {
        const logoutBtn = document.createElement("button");
        logoutBtn.className = "sidebar__logout-btn";
        logoutBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair da conta`;
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("galeno_user");
            window.location.replace("/login.html");
        });
        sidebarFooter.prepend(logoutBtn);
    }
}

init();