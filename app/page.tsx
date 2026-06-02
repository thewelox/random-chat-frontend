"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Bell, Compass, Home, MessageCircle, PlusSquare, Search, Settings, Shield, Sparkles, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api, endpoints } from "@/lib/api";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
  autoConnect: false,
  transports: ["websocket"],
});

type AuthMode = "login" | "signup";

interface FeedPost {
  _id: string;
  content: string;
  likes: string[];
  comments: { _id: string }[];
  createdAt: string;
  userId?: { username: string; nickname: string; avatar?: string; verified?: boolean };
}

export default function HomePage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("vibe_token") || "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [online, setOnline] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [form, setForm] = useState({ username: "", nickname: "", identifier: "", email: "", password: "", rememberMe: true });
  const [newPost, setNewPost] = useState("");

  const navItems = useMemo(
    () => [
      { id: "feed", label: "Home Feed", icon: Home },
      { id: "explore", label: "Explore", icon: Compass },
      { id: "clubs", label: "Clubs", icon: Users },
      { id: "chat", label: "Realtime Chat", icon: MessageCircle },
      { id: "moderation", label: "Safety", icon: Shield },
      { id: "settings", label: "Settings", icon: Settings },
    ],
    []
  );

  useEffect(() => {
    if (!token) return;

    const handleConnect = () => setOnline(true);
    const handleDisconnect = () => setOnline(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.connect();
    socket.emit("presence:online", { userId: token.slice(0, 12) });

    void loadFeed(token);
    void loadNotifications(token);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [token]);

  async function loadFeed(currentToken: string) {
    try {
      const data = await api<{ posts: FeedPost[] }>(endpoints.feed, { token: currentToken });
      setFeed(data.posts || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadNotifications(currentToken: string) {
    try {
      const data = await api<{ notifications: Array<{ isRead: boolean }> }>(endpoints.notifications, { token: currentToken });
      setNotificationsCount((data.notifications || []).filter((n) => !n.isRead).length);
    } catch {
      setNotificationsCount(0);
    }
  }

  async function handleAuth(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload =
        authMode === "signup"
          ? { username: form.username, nickname: form.nickname, email: form.email, password: form.password }
          : { identifier: form.identifier, password: form.password };

      const endpoint = authMode === "signup" ? endpoints.signup : endpoints.login;
      const data = await api<{ token: string }>(endpoint, { method: "POST", body: payload });

      setToken(data.token);
      if (form.rememberMe) localStorage.setItem("vibe_token", data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function createPost() {
    if (!newPost.trim() || !token) return;
    try {
      await api(endpoints.createPost, { method: "POST", token, body: { content: newPost, postType: "text" } });
      setNewPost("");
      await loadFeed(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Post failed");
    }
  }

  function logout() {
    setToken("");
    localStorage.removeItem("vibe_token");
  }

  if (!token) {
    return (
      <main className="min-h-screen px-5 py-10 md:px-10 flex items-center justify-center">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass vibe-shadow w-full max-w-md rounded-3xl p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Created by WELOX & CO</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">VIBE</h1>
          <p className="text-sm text-white/60 mt-2">Meet. Chat. Connect.</p>

          <div className="mt-5 flex gap-2 rounded-2xl bg-black/30 p-1">
            <button className={`flex-1 rounded-xl py-2 text-sm ${authMode === "login" ? "bg-purple-600" : "text-white/70"}`} onClick={() => setAuthMode("login")}>Login</button>
            <button className={`flex-1 rounded-xl py-2 text-sm ${authMode === "signup" ? "bg-purple-600" : "text-white/70"}`} onClick={() => setAuthMode("signup")}>Signup</button>
          </div>

          <form onSubmit={handleAuth} className="mt-5 space-y-3">
            {authMode === "signup" && (
              <>
                <input className="w-full rounded-2xl bg-white/10 px-4 py-3 outline-none" placeholder="@username" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
                <input className="w-full rounded-2xl bg-white/10 px-4 py-3 outline-none" placeholder="Nickname" value={form.nickname} onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} />
                <input className="w-full rounded-2xl bg-white/10 px-4 py-3 outline-none" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </>
            )}
            {authMode === "login" && <input className="w-full rounded-2xl bg-white/10 px-4 py-3 outline-none" placeholder="Email or @username" value={form.identifier} onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))} />}
            <input className="w-full rounded-2xl bg-white/10 px-4 py-3 outline-none" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            <label className="flex items-center gap-2 text-xs text-white/70"><input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm((p) => ({ ...p, rememberMe: e.target.checked }))} /> Remember me</label>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button disabled={loading} className="w-full rounded-2xl bg-purple-600 py-3 font-semibold hover:bg-purple-500 transition">{loading ? "Please wait..." : authMode === "login" ? "Enter VIBE" : "Create account"}</button>
          </form>

          <p className="mt-6 text-[11px] text-white/50">Email verification and password reset endpoints are scaffold-ready.</p>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-[260px_1fr_320px]">
        <aside className="glass rounded-3xl p-4">
          <h2 className="text-2xl font-black">VIBE</h2>
          <p className="text-xs text-white/60">Meet. Chat. Connect.</p>
          <div className="mt-4 space-y-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${activeTab === item.id ? "bg-purple-600" : "hover:bg-white/10"}`}>
                <item.icon size={17} /> {item.label}
              </button>
            ))}
          </div>
          <button onClick={logout} className="mt-6 w-full rounded-2xl bg-white/10 py-2 text-sm hover:bg-white/20">Logout</button>
          <p className="mt-6 text-xs text-white/50">Built with ?? by WELOX & CO</p>
        </aside>

        <section className="space-y-4">
          <header className="glass flex items-center justify-between rounded-3xl p-4">
            <div>
              <h3 className="text-xl font-bold">{activeTab === "feed" ? "Home Feed" : activeTab[0].toUpperCase() + activeTab.slice(1)}</h3>
              <p className="text-xs text-white/60">Premium Gen Z social experience</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400" : "bg-zinc-500"}`} />
              {online ? "Live" : "Offline"}
            </div>
          </header>

          {activeTab === "feed" && (
            <>
              <div className="glass rounded-3xl p-4">
                <div className="flex items-center gap-3 rounded-2xl bg-black/20 px-4 py-3">
                  <PlusSquare size={18} className="text-purple-300" />
                  <input value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Share your vibe... text, image, poll, or moment" className="w-full bg-transparent text-sm outline-none" />
                  <button onClick={createPost} className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs">Post</button>
                </div>
              </div>

              <AnimatePresence>
                {feed.map((post) => (
                  <motion.article key={post._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-4">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <p>@{post.userId?.username || "viber"} ? {post.userId?.nickname || "VIBE User"}</p>
                      <p>{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">{post.content || "No content"}</p>
                    <div className="mt-3 flex gap-4 text-xs text-white/70">
                      <button className="hover:text-white">Like {post.likes?.length || 0}</button>
                      <button className="hover:text-white">Comment {post.comments?.length || 0}</button>
                      <button className="hover:text-white">Share</button>
                      <button className="hover:text-white">Save</button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </>
          )}

          {activeTab !== "feed" && (
            <div className="glass rounded-3xl p-5 text-sm text-white/80">
              <p className="font-semibold">{activeTab} module is scaffolded and ready for deeper feature wiring.</p>
              <p className="mt-2 text-white/60">Includes backend APIs/models/socket channels for chat, clubs, moderation, voice signaling, notifications, and profile systems.</p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="glass rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Notifications</h4>
              <span className="rounded-xl bg-purple-600 px-2 py-0.5 text-xs">{notificationsCount}</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-white/70">
              <li>New follower alerts</li>
              <li>Message mentions</li>
              <li>Club invites and reactions</li>
            </ul>
          </div>

          <div className="glass rounded-3xl p-4">
            <h4 className="font-semibold">Explore</h4>
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-black/20 px-3 py-2">
              <Search size={15} className="text-white/60" />
              <input className="w-full bg-transparent text-xs outline-none" placeholder="Search users, clubs, posts" />
            </div>
            <div className="mt-3 space-y-2 text-xs text-white/70">
              <p className="flex items-center gap-2"><Sparkles size={14} /> Trending posts</p>
              <p className="flex items-center gap-2"><Users size={14} /> Suggested users</p>
              <p className="flex items-center gap-2"><Compass size={14} /> Trending clubs</p>
            </div>
          </div>

          <div className="glass rounded-3xl p-4 text-xs text-white/70">
            <div className="flex items-center gap-2"><Bell size={14} /> Admin + moderation ready</div>
            <p className="mt-2">Reports, block system, and club moderation models/routes are included in this foundation.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
