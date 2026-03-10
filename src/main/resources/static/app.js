const state = {
  baseUrl: window.location.origin,
  token: localStorage.getItem("chatx.token") || "",
  userId: localStorage.getItem("chatx.userId") || "",
  email: localStorage.getItem("chatx.email") || "",
  displayName: localStorage.getItem("chatx.displayName") || ""
};

const consoleEl = document.getElementById("console");
const sessionLabel = document.getElementById("sessionLabel");
const requestStatusEl = document.getElementById("requestStatus");
const logoutBtn = document.getElementById("logoutBtn");
const toastStackEl = document.getElementById("toastStack");

function setRequestStatus(mode, text) {
  if (!requestStatusEl) return;
  requestStatusEl.className = `status-pill ${mode}`;
  requestStatusEl.textContent = text;
}

function showToast(message, type = "info") {
  if (!toastStackEl) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastStackEl.prepend(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    toast.style.transition = "all 180ms ease";
  }, 2200);

  setTimeout(() => toast.remove(), 2450);
}

function log(title, payload) {
  const now = new Date().toLocaleTimeString();
  const body = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  consoleEl.textContent = `[${now}] ${title}\n${body}\n\n` + consoleEl.textContent;
}

function setSession(auth) {
  state.token = auth.accessToken || "";
  state.userId = auth.userId ? String(auth.userId) : "";
  state.email = auth.email || "";
  state.displayName = auth.displayName || "";

  localStorage.setItem("chatx.token", state.token);
  localStorage.setItem("chatx.userId", state.userId);
  localStorage.setItem("chatx.email", state.email);
  localStorage.setItem("chatx.displayName", state.displayName);

  renderSession();
}

function clearSession() {
  state.token = "";
  state.userId = "";
  state.email = "";
  state.displayName = "";
  localStorage.removeItem("chatx.token");
  localStorage.removeItem("chatx.userId");
  localStorage.removeItem("chatx.email");
  localStorage.removeItem("chatx.displayName");
  renderSession();
}

function renderSession() {
  if (!state.token) {
    sessionLabel.textContent = "No active session";
    logoutBtn.disabled = true;
    return;
  }

  sessionLabel.textContent = `${state.displayName || "User"} (#${state.userId})`;
  logoutBtn.disabled = false;

  const ids = ["profileUserId", "updateName", "targetUserId", "socialUserId"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if ((id === "profileUserId" || id === "socialUserId") && !el.value && state.userId) {
      el.value = state.userId;
    }
    if (id === "updateName" && !el.value && state.displayName) {
      el.value = state.displayName;
    }
  });
}

async function api(path, options = {}) {
  const headers = Object.assign({}, options.headers || {});
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  setRequestStatus("loading", "Request in progress...");

  const response = await fetch(`${state.baseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    setRequestStatus("error", `Failed (${response.status})`);
    log(`ERROR ${response.status} ${path}`, data);
    showToast(data.message || `Request failed (${response.status})`, "error");
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  setRequestStatus("ok", `Success (${response.status})`);
  log(`OK ${response.status} ${path}`, data);
  return data;
}

function renderList(containerId, items, formatter) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="list-item">No items</div>';
    return;
  }
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = formatter(item);
    container.appendChild(div);
  });
}

function bindAction(buttonId, handler) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (btn.disabled) return;
    btn.classList.add("is-busy");
    btn.disabled = true;
    try {
      await handler();
      if (buttonId !== "loadFeedBtn" && buttonId !== "loadChatBtn") {
        showToast("Done", "ok");
      }
    } catch (e) {
      log("Action failed", e.message);
    } finally {
      btn.classList.remove("is-busy");
      btn.disabled = false;
      setTimeout(() => {
        if (requestStatusEl?.classList.contains("ok")) {
          setRequestStatus("idle", "Idle");
        }
      }, 1300);
    }
  });
}

function prefillUser(email, displayName) {
  document.getElementById("signupEmail").value = email;
  document.getElementById("signupName").value = displayName;
  document.getElementById("loginEmail").value = email;
  document.getElementById("signupPassword").value = "password123";
  document.getElementById("loginPassword").value = "password123";
  showToast(`Prefilled ${displayName}`, "info");
}

bindAction("signupBtn", async () => {
  const body = {
    email: document.getElementById("signupEmail").value.trim(),
    password: document.getElementById("signupPassword").value,
    displayName: document.getElementById("signupName").value.trim()
  };
  const data = await api("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  setSession(data);
});

bindAction("loginBtn", async () => {
  const body = {
    email: document.getElementById("loginEmail").value.trim(),
    password: document.getElementById("loginPassword").value
  };
  const data = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  setSession(data);
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  log("Session", "Logged out");
  showToast("Logged out", "info");
  setRequestStatus("idle", "Idle");
});

bindAction("getProfileBtn", async () => {
  const userId = document.getElementById("profileUserId").value;
  if (!userId) throw new Error("Provide user id");
  await api(`/api/users/${userId}`);
});

bindAction("updateProfileBtn", async () => {
  if (!state.userId) throw new Error("Login first");
  const body = {
    displayName: document.getElementById("updateName").value.trim(),
    bio: document.getElementById("updateBio").value.trim()
  };
  const data = await api(`/api/users/${state.userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  state.displayName = data.displayName || state.displayName;
  localStorage.setItem("chatx.displayName", state.displayName);
  renderSession();
});

bindAction("followBtn", async () => {
  const targetId = document.getElementById("targetUserId").value;
  if (!targetId) throw new Error("Provide target user id");
  await api(`/api/users/${targetId}/follow`, { method: "POST" });
});

bindAction("unfollowBtn", async () => {
  const targetId = document.getElementById("targetUserId").value;
  if (!targetId) throw new Error("Provide target user id");
  await api(`/api/users/${targetId}/follow`, { method: "DELETE" });
});

bindAction("socialStatsBtn", async () => {
  const targetId = document.getElementById("socialUserId").value;
  if (!targetId) throw new Error("Provide user id");
  await api(`/api/users/${targetId}/social`);
});

bindAction("createPostBtn", async () => {
  const content = document.getElementById("postContent").value.trim();
  if (!content) throw new Error("Post content is empty");
  await api("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  document.getElementById("postContent").value = "";
});

bindAction("loadFeedBtn", async () => {
  const page = document.getElementById("feedPage").value || "0";
  const size = document.getElementById("feedSize").value || "20";
  const feed = await api(`/api/feed?page=${page}&size=${size}`);
  renderList("feedList", feed, (p) => `#${p.id} ${p.authorDisplayName}: ${p.content}`);
});

bindAction("sendChatBtn", async () => {
  const chatId = document.getElementById("chatId").value.trim();
  const content = document.getElementById("chatMessage").value.trim();
  if (!chatId || !content) throw new Error("Enter chat id and message");
  await api(`/api/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  document.getElementById("chatMessage").value = "";
});

bindAction("loadChatBtn", async () => {
  const chatId = document.getElementById("chatId").value.trim();
  const size = document.getElementById("chatSize").value || "20";
  if (!chatId) throw new Error("Enter chat id");
  const msgs = await api(`/api/chats/${chatId}/messages?size=${size}`);
  renderList("chatList", msgs, (m) => `${m.senderId}: ${m.content}`);
});

document.getElementById("prefillUserABtn")?.addEventListener("click", () => prefillUser("a@test.com", "User A"));
document.getElementById("prefillUserBBtn")?.addEventListener("click", () => prefillUser("b@test.com", "User B"));
document.getElementById("clearConsoleBtn")?.addEventListener("click", () => {
  consoleEl.textContent = "";
  showToast("Console cleared", "info");
});

renderSession();
setRequestStatus("idle", "Idle");
log("UI ready", "Use quick actions and auth section to start.");
