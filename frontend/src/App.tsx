import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, AuthSession } from "./api";
import type { Comment, Post } from "./types";

type Toast = { id: number; text: string; tone: "ok" | "error" | "info" };

const STORAGE_KEY = "chatx.session";

function useSession() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  });

  const save = (next: AuthSession | null) => {
    setSession(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  };

  return { session, setSession: save };
}

function App() {
  const { session, setSession } = useSession();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onSession={setSession} />} />
      <Route
        path="/"
        element={
          session ? (
            <HomePage session={session} onLogout={() => setSession(null)} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function LoginPage({ onSession }: { onSession: (s: AuthSession) => void }) {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("a@test.com");
  const [password, setPassword] = useState("password123");
  const [displayName, setDisplayName] = useState("User A");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const session =
        mode === "login"
          ? await api.login({ email, password })
          : await api.signup({ email, password, displayName });
      onSession(session);
      nav("/", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <h1>ChatX</h1>
          <p>Real-time conversations, community energy, and a feed that stays alive.</p>
          <div className="auth-badges">
            <span>Live chat</span>
            <span>Social feed</span>
            <span>Fast API</span>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Login
            </button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
              Sign up
            </button>
          </div>
          <div className="auth-form">
            {mode === "signup" && (
              <label>
                Display name
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </label>
            )}
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary" disabled={busy} onClick={submit}>
              {mode === "login" ? "Log in" : "Create account"}
            </button>
            <p className="muted">Use the demo credentials or create a new user.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const token = session.accessToken;
  const [feed, setFeed] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [composer, setComposer] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busy, setBusy] = useState(false);

  const pushToast = (text: string, tone: Toast["tone"] = "info") => {
    const toast = { id: Date.now(), text, tone };
    setToasts((t) => [toast, ...t].slice(0, 4));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== toast.id)), 2800);
  };

  const loadFeed = async () => {
    const res = await api.feed(token, 0, 30);
    setFeed(res as Post[]);
  };

  const loadComments = async (postId: number) => {
    const res = await api.comments(token, postId, 0, 20);
    const list = Array.isArray(res) ? res : res.content;
    setComments(list as Comment[]);
    setActivePostId(postId);
  };

  const refreshActive = async () => {
    await loadFeed();
    if (activePostId) await loadComments(activePostId);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const selectedPost = useMemo(() => feed.find((p) => p.id === activePostId), [feed, activePostId]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="logo">ChatX</div>
        <div className="search">
          <input placeholder="Search posts, people..." />
        </div>
        <div className="user-pill">
          <span>{session.displayName}</span>
          <button className="ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <h3>Navigation</h3>
          <button className="nav-item active">Home</button>
          <button className="nav-item">Explore</button>
          <button className="nav-item">Messages</button>
          <button className="nav-item">Profile</button>
          <div className="sidebar-card">
            <h4>Quick stats</h4>
            <p>Likes + comments update instantly from the API.</p>
          </div>
        </aside>

        <section className="feed">
          <div className="composer">
            <textarea
              placeholder="Share an update with your community..."
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              rows={3}
            />
            <div className="row">
              <button
                className="primary"
                disabled={!composer.trim() || busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api.createPost(token, composer.trim());
                    setComposer("");
                    await loadFeed();
                    pushToast("Post published", "ok");
                  } catch (e) {
                    pushToast((e as Error).message, "error");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Post
              </button>
              <span className="muted">Signed in as {session.displayName}</span>
            </div>
          </div>

          <div className="feed-list">
            {feed.map((post) => (
              <article key={post.id} className="post-card">
                <div className="post-header">
                  <div>
                    <strong>{post.authorDisplayName}</strong>
                    <span className="muted">· #{post.id}</span>
                  </div>
                  <span className="muted">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <p>{post.content}</p>
                <div className="post-actions">
                  <button
                    className={post.likedByMe ? "liked" : "ghost"}
                    onClick={async () => {
                      try {
                        post.likedByMe ? await api.unlike(token, post.id) : await api.like(token, post.id);
                        await loadFeed();
                      } catch (e) {
                        pushToast((e as Error).message, "error");
                      }
                    }}
                  >
                    {post.likedByMe ? "Liked" : "Like"} · {post.likeCount}
                  </button>
                  <button className="ghost" onClick={() => loadComments(post.id)}>
                    Comments · {post.commentCount}
                  </button>
                  <button className="ghost" onClick={() => pushToast("Share link copied", "info")}>
                    Share
                  </button>
                </div>
                {post.topComments?.length ? (
                  <div className="post-preview">
                    {post.topComments.map((c) => (
                      <div key={c.id} className="preview-item">
                        <strong>{c.authorDisplayName}</strong> {c.content}
                        {c.children?.[0] && (
                          <div className="preview-reply">
                            ↳ {c.children[0].authorDisplayName}: {c.children[0].content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="right-rail">
          <div className="rail-card">
            <h3>Active thread</h3>
            {selectedPost ? (
              <div className="muted">#{selectedPost.id} · {selectedPost.authorDisplayName}</div>
            ) : (
              <div className="muted">Select a post to view comments.</div>
            )}
          </div>

          <div className="rail-card">
            <h4>Write a comment</h4>
            <textarea
              placeholder="Add a comment..."
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
            />
            <button
              className="primary"
              disabled={!activePostId || !commentDraft.trim()}
              onClick={async () => {
                if (!activePostId) return;
                try {
                  await api.comment(token, activePostId, commentDraft.trim());
                  setCommentDraft("");
                  await refreshActive();
                } catch (e) {
                  pushToast((e as Error).message, "error");
                }
              }}
            >
              Comment
            </button>
          </div>

          <div className="rail-card">
            <h4>Comments</h4>
            {comments.length === 0 ? (
              <div className="muted">No comments loaded.</div>
            ) : (
              <div className="comment-list">
                {comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      <strong>{c.authorDisplayName}</strong>
                      <span className="muted">{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p>{c.content}</p>
                    <button
                      className="ghost"
                      onClick={async () => {
                        try {
                          await api.deleteComment(token, c.id);
                          await refreshActive();
                        } catch (e) {
                          pushToast((e as Error).message, "error");
                        }
                      }}
                    >
                      Delete
                    </button>
                    {c.children?.[0] && (
                      <div className="comment-reply">
                        ↳ {c.children[0].authorDisplayName}: {c.children[0].content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
