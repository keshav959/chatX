import { useEffect, useMemo, useState } from "react";
import { api, AuthSession } from "./api";
import type { Post, Comment } from "./types";

type Toast = { id: number; text: string; kind: "ok" | "error" | "info" };

function useStoredSession() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const raw = localStorage.getItem("chatx.session");
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  });

  const save = (next: AuthSession | null) => {
    setSession(next);
    if (next) localStorage.setItem("chatx.session", JSON.stringify(next));
    else localStorage.removeItem("chatx.session");
  };
  return { session, setSession: save };
}

function App() {
  const { session, setSession } = useStoredSession();
  const token = session?.accessToken || "";
  const [feed, setFeed] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (text: string, kind: Toast["kind"] = "info") => {
    const toast = { id: Date.now(), text, kind };
    setToasts((t) => [toast, ...t].slice(0, 4));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== toast.id)), 2800);
  };

  const logLine = (title: string, payload: unknown) => {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    setLog((l) => [`${new Date().toLocaleTimeString()} ${title}: ${body}`, ...l].slice(0, 80));
  };

  const disabled = useMemo(() => !session, [session]);

  const handleSignup = async (email: string, password: string, displayName: string) => {
    const res = await api.signup({ email, password, displayName });
    setSession(res);
    pushToast("Signed up", "ok");
    logLine("signup", res);
  };

  const handleLogin = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setSession(res);
    pushToast("Logged in", "ok");
    logLine("login", res);
  };

  const loadFeed = async (page = 0, size = 20) => {
    if (!token) return;
    const res = await api.feed(token, page, size);
    setFeed(res as Post[]);
    logLine("feed", res);
  };

  const createPost = async (content: string) => {
    if (!token) return;
    await api.createPost(token, content);
    pushToast("Posted", "ok");
    await loadFeed();
  };

  const like = async (postId: number) => {
    await api.like(token, postId);
    await loadFeed();
  };

  const unlike = async (postId: number) => {
    await api.unlike(token, postId);
    await loadFeed();
  };

  const comment = async (postId: number, content: string) => {
    await api.comment(token, postId, content);
    await loadComments(postId);
    await loadFeed();
  };

  const reply = async (postId: number, parentId: number, content: string) => {
    await api.reply(token, postId, parentId, content);
    await loadComments(postId);
    await loadFeed();
  };

  const loadComments = async (postId: number) => {
    const res = await api.comments(token, postId, 0, 20);
    const list = Array.isArray(res) ? res : res.content;
    setComments(list as Comment[]);
    logLine("comments", res);
  };

  const deleteComment = async (commentId: number, postId: number) => {
    await api.deleteComment(token, commentId);
    await loadComments(postId);
    await loadFeed();
  };

  useEffect(() => {
    if (token) loadFeed();
  }, [token]);

  return (
    <div className="app-shell">
      <header className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p className="pill">React Client</p>
          <h1>ChatX</h1>
          <p className="sub">Auth, feed, likes, and comments against the Spring Boot API.</p>
        </div>
        <div className="column" style={{ alignItems: "flex-end" }}>
          <div className="pill">{session ? `Signed in as ${session.displayName}` : "Not signed in"}</div>
          <div className="row">
            {session && (
              <button className="ghost" onClick={() => setSession(null)}>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid">
        <AuthCard onSignup={handleSignup} onLogin={handleLogin} />
        <PostCard disabled={disabled} onCreate={createPost} />
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <FeedCard feed={feed} onLike={like} onUnlike={unlike} onLoadFeed={loadFeed} />
        <CommentsCard onLoad={loadComments} onComment={comment} onReply={reply} onDelete={deleteComment} comments={comments} />
      </div>

      <ConsoleCard log={log} />

      <div style={{ position: "fixed", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} className="pill" style={{ background: toastColor(t.kind) }}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function toastColor(kind: Toast["kind"]) {
  if (kind === "ok") return "linear-gradient(135deg,#72efdd,#3494e6)";
  if (kind === "error") return "linear-gradient(135deg,#f83600,#fe8c00)";
  return "rgba(255,255,255,0.12)";
}

function AuthCard({
  onSignup,
  onLogin
}: {
  onSignup: (email: string, password: string, displayName: string) => Promise<void>;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("a@test.com");
  const [name, setName] = useState("User A");
  const [password, setPassword] = useState("password123");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card column">
      <div className="section-title">
        <h2>Auth</h2>
      </div>
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="display name" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="row">
        <button disabled={busy} onClick={() => run(() => onSignup(email, password, name))}>
          Signup
        </button>
        <button className="ghost" disabled={busy} onClick={() => run(() => onLogin(email, password))}>
          Login
        </button>
      </div>
    </div>
  );
}

function PostCard({ onCreate, disabled }: { onCreate: (content: string) => Promise<void>; disabled: boolean }) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="card column">
      <div className="section-title">
        <h2>Post</h2>
      </div>
      <textarea
        placeholder="What are you building?"
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        disabled={busy || disabled || !content.trim()}
        onClick={async () => {
          setBusy(true);
          try {
            await onCreate(content.trim());
            setContent("");
          } finally {
            setBusy(false);
          }
        }}
      >
        Publish
      </button>
    </div>
  );
}

function FeedCard({
  feed,
  onLike,
  onUnlike,
  onLoadFeed
}: {
  feed: Post[];
  onLike: (id: number) => Promise<void>;
  onUnlike: (id: number) => Promise<void>;
  onLoadFeed: (page?: number, size?: number) => Promise<void>;
}) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  return (
    <div className="card column">
      <div className="section-title">
        <h2>Feed</h2>
      </div>
      <div className="row">
        <input type="number" value={page} onChange={(e) => setPage(Number(e.target.value))} />
        <input type="number" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        <button className="ghost" onClick={() => onLoadFeed(page, size)}>
          Load
        </button>
      </div>
      <div className="list">
        {feed.map((p) => (
          <div key={p.id} className="list-item column">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>#{p.id} {p.authorDisplayName}</strong>
              <span className="meta">{new Date(p.createdAt).toLocaleString()}</span>
            </div>
            <div>{p.content}</div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="meta">
                ❤️ {p.likeCount} {p.likedByMe ? "(you)" : ""} · 💬 {p.commentCount}
              </div>
              <div className="row">
                <button className="ghost" onClick={() => onLike(p.id)}>Like</button>
                <button className="ghost" onClick={() => onUnlike(p.id)}>Unlike</button>
              </div>
            </div>
            <div className="column meta">
              {(p.topComments || []).length === 0 && <span>No comments yet</span>}
              {(p.topComments || []).map((c) => (
                <div key={c.id}>
                  {c.authorDisplayName}: {c.content}
                  {c.children?.[0] ? <div className="sub">↳ {c.children[0].authorDisplayName}: {c.children[0].content}</div> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
        {feed.length === 0 && <div className="meta">No posts</div>}
      </div>
    </div>
  );
}

function CommentsCard({
  onLoad,
  onComment,
  onReply,
  onDelete,
  comments
}: {
  onLoad: (postId: number) => Promise<void>;
  onComment: (postId: number, content: string) => Promise<void>;
  onReply: (postId: number, parentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number, postId: number) => Promise<void>;
  comments: Comment[];
}) {
  const [postId, setPostId] = useState<number | "">("");
  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [deleteId, setDeleteId] = useState<number | "">("");

  return (
    <div className="card column">
      <div className="section-title">
        <h2>Comments</h2>
      </div>
      <div className="row">
        <input type="number" placeholder="post id" value={postId} onChange={(e) => setPostId(Number(e.target.value))} />
        <button className="ghost" onClick={() => postId && onLoad(Number(postId))}>
          Load
        </button>
      </div>
      <textarea placeholder="comment" value={content} onChange={(e) => setContent(e.target.value)} />
      <button disabled={!postId || !content.trim()} onClick={() => postId && onComment(Number(postId), content.trim())}>
        Comment
      </button>

      <div className="row">
        <input type="number" placeholder="reply post id" value={postId} onChange={(e) => setPostId(Number(e.target.value))} />
        <input type="number" placeholder="parent comment id" value={parentId} onChange={(e) => setParentId(Number(e.target.value))} />
      </div>
      <textarea placeholder="reply" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} />
      <button
        className="ghost"
        disabled={!postId || !parentId || !replyContent.trim()}
        onClick={() => postId && parentId && onReply(Number(postId), Number(parentId), replyContent.trim())}
      >
        Reply
      </button>

      <div className="row">
        <input type="number" placeholder="delete comment id" value={deleteId} onChange={(e) => setDeleteId(Number(e.target.value))} />
        <button className="ghost" disabled={!deleteId || !postId} onClick={() => deleteId && postId && onDelete(Number(deleteId), Number(postId))}>
          Delete
        </button>
      </div>

      <div className="list">
        {comments.map((c) => (
          <div key={c.id} className="list-item column">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>#{c.id} {c.authorDisplayName}</strong>
              <span className="meta">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <div>{c.content}</div>
            {(c.children || []).map((child) => (
              <div key={child.id} className="meta">↳ {child.authorDisplayName}: {child.content}</div>
            ))}
          </div>
        ))}
        {comments.length === 0 && <div className="meta">No comments loaded</div>}
      </div>
    </div>
  );
}

function ConsoleCard({ log }: { log: string[] }) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="section-title">
        <h2>Console</h2>
      </div>
      <pre>{log.join("\n")}</pre>
    </div>
  );
}

export default App;
