const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8090";

export type AuthSession = {
  accessToken: string;
  userId: number;
  email: string;
  displayName: string;
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  signup: (body: { email: string; password: string; displayName: string }) =>
    request<AuthSession>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthSession>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  feed: (token: string, page = 0, size = 20) =>
    request<any[]>(`/api/feed?page=${page}&size=${size}`, {}, token),
  createPost: (token: string, content: string) =>
    request("/api/posts", { method: "POST", body: JSON.stringify({ content }) }, token),
  like: (token: string, postId: number) =>
    request(`/api/posts/${postId}/likes`, { method: "POST" }, token),
  unlike: (token: string, postId: number) =>
    request(`/api/posts/${postId}/likes`, { method: "DELETE" }, token),
  comment: (token: string, postId: number, content: string) =>
    request(`/api/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) }, token),
  reply: (token: string, postId: number, parentId: number, content: string) =>
    request(
      `/api/posts/${postId}/comments/${parentId}/replies`,
      { method: "POST", body: JSON.stringify({ content }) },
      token
    ),
  comments: (token: string, postId: number, page = 0, size = 20) =>
    request<{ content: any[] }>(`/api/posts/${postId}/comments?page=${page}&size=${size}`, {}, token),
  deleteComment: (token: string, commentId: number) =>
    request(`/api/comments/${commentId}`, { method: "DELETE" }, token)
};
