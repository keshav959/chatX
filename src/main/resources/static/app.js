const state = {
  baseUrl: window.location.origin,
  token: localStorage.getItem("chatx.token") || "",
  userId: localStorage.getItem("chatx.userId") || "",
  email: localStorage.getItem("chatx.email") || "",
  displayName: localStorage.getItem("chatx.displayName") || ""
};

const consoleEl = document.getElementById("console");
const sessionLabel = document.getElementById("sessionLabel");
const logoutBtn = document.getElementById("logoutBtn");

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
    log(`ERROR ${response.status} ${path}`, data);
    throw new Error(data.message || `Request failed (${response.status})`);
  }

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

document.getElementById("signupBtn").addEventListener("click", async () => {
  try {
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
  } catch (e) {
    log("Signup failed", e.message);
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
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
  } catch (e) {
    log("Login failed", e.message);
  }
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  log("Session", "Logged out");
});

document.getElementById("getProfileBtn").addEventListener("click", async () => {
  const userId = document.getElementById("profileUserId").value;
  if (!userId) return;
  try {
    await api(`/api/users/${userId}`);
  } catch (e) {
    log("Get profile failed", e.message);
  }
});

document.getElementById("updateProfileBtn").addEventListener("click", async () => {
  if (!state.userId) return log("Missing session", "Login first");
  try {
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
  } catch (e) {
    log("Update profile failed", e.message);
  }
});

document.getElementById("followBtn").addEventListener("click", async () => {
  const targetId = document.getElementById("targetUserId").value;
  if (!targetId) return;
  try {
    await api(`/api/users/${targetId}/follow`, { method: "POST" });
  } catch (e) {
    log("Follow failed", e.message);
  }
});

document.getElementById("unfollowBtn").addEventListener("click", async () => {
  const targetId = document.getElementById("targetUserId").value;
  if (!targetId) return;
  try {
    await api(`/api/users/${targetId}/follow`, { method: "DELETE" });
  } catch (e) {
    log("Unfollow failed", e.message);
  }
});

document.getElementById("socialStatsBtn").addEventListener("click", async () => {
  const targetId = document.getElementById("socialUserId").value;
  if (!targetId) return;
  try {
    await api(`/api/users/${targetId}/social`);
  } catch (e) {
    log("Social stats failed", e.message);
  }
});

document.getElementById("createPostBtn").addEventListener("click", async () => {
  const content = document.getElementById("postContent").value.trim();
  if (!content) return;
  try {
    await api("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    document.getElementById("postContent").value = "";
  } catch (e) {
    log("Create post failed", e.message);
  }
});

document.getElementById("loadFeedBtn").addEventListener("click", async () => {
  const page = document.getElementById("feedPage").value || "0";
  const size = document.getElementById("feedSize").value || "20";
  try {
    const feed = await api(`/api/feed?page=${page}&size=${size}`);
    renderList("feedList", feed, (p) => `#${p.id} ${p.authorDisplayName}: ${p.content}`);
  } catch (e) {
    log("Load feed failed", e.message);
  }
});

document.getElementById("sendChatBtn").addEventListener("click", async () => {
  const chatId = document.getElementById("chatId").value.trim();
  const content = document.getElementById("chatMessage").value.trim();
  if (!chatId || !content) return;
  try {
    await api(`/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    document.getElementById("chatMessage").value = "";
  } catch (e) {
    log("Send chat failed", e.message);
  }
});

document.getElementById("loadChatBtn").addEventListener("click", async () => {
  const chatId = document.getElementById("chatId").value.trim();
  const size = document.getElementById("chatSize").value || "20";
  if (!chatId) return;
  try {
    const msgs = await api(`/api/chats/${chatId}/messages?size=${size}`);
    renderList("chatList", msgs, (m) => `${m.senderId}: ${m.content}`);
  } catch (e) {
    log("Load chat failed", e.message);
  }
});

renderSession();
log("UI ready", "Use Auth section to start.");
