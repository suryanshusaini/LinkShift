import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Link2, Menu, Moon, Sun, X } from "lucide-react";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Home from "./Home";
import NotFound from "./NotFound";

function Shell({ user, setUser, handleLogout, children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("linkshift_theme") || "system");
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isDark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("linkshift_theme", theme);
  }, [isDark, theme]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const initials = (user?.name || user?.email || "U").split(/[ @]/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-plaster text-ink dark:bg-night dark:text-text-dark">
      <a href="#main-content" className="sr-only focus:not-sr-only fixed left-4 top-4 z-[100] rounded-md bg-tape px-4 py-2 font-semibold text-ink">Skip to content</a>
      <nav className="sticky top-0 z-50 h-16 border-b border-ink/12 bg-chalk dark:border-white/14 dark:bg-surface">
        <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-ink dark:text-text-dark">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-tape text-ink"><Link2 size={19} strokeWidth={2} /></span>
            LinkShift
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {user ? (
              <>
                <Link to="/dashboard" className={"border-b-2 py-5 text-sm font-semibold " + (location.pathname === "/dashboard" ? "border-tape text-ink dark:text-text-dark" : "border-transparent text-slate dark:text-slate-dark")}>My links</Link>
                <button onClick={() => setTheme(isDark ? "light" : "dark")} className="rounded-md p-2 text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark" aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}>{isDark ? <Sun size={19}/> : <Moon size={19}/>}</button>
                <button onClick={handleLogout} className="rounded-[10px] border border-ink/20 bg-chalk px-4 py-2 text-sm font-semibold text-ink hover:bg-plaster dark:border-white/15 dark:bg-surface dark:text-text-dark dark:hover:bg-night">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark">Log in</Link>
                <Link to="/signup" className="rounded-[10px] border-[1.5px] border-ink bg-tape px-4 py-2.5 text-sm font-semibold text-ink hover:bg-tape-hover">Sign up</Link>
                <button onClick={() => setTheme(isDark ? "light" : "dark")} className="rounded-md p-2 text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark" aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}>{isDark ? <Sun size={19}/> : <Moon size={19}/>}</button>
              </>
            )}
          </div>

          <button className="rounded-md p-2 md:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Open navigation menu" aria-expanded={mobileOpen}>{mobileOpen ? <X/> : <Menu/>}</button>
        </div>
        {mobileOpen && (
          <div className="border-b border-ink/12 bg-chalk px-4 py-4 dark:border-white/14 dark:bg-surface md:hidden">
            <div className="mx-auto flex max-w-[1120px] flex-col gap-2">
              {user ? <Link to="/dashboard" className="rounded-lg px-3 py-3 font-semibold">My links</Link> : null}
              <Link to="/login" className="rounded-lg px-3 py-3 font-semibold">Log in</Link>
              {!user && <Link to="/signup" className="rounded-[10px] border-[1.5px] border-ink bg-tape px-3 py-3 text-center font-semibold">Sign up</Link>}
              <button onClick={() => setTheme(isDark ? "light" : "dark")} className="flex items-center gap-2 rounded-lg px-3 py-3 text-left font-semibold">{isDark ? <Sun size={18}/> : <Moon size={18}/>} {isDark ? "Light theme" : "Dark theme"}</button>
              {user && <button onClick={handleLogout} className="rounded-lg px-3 py-3 text-left font-semibold text-stop">Log out</button>}
            </div>
          </div>
        )}
      </nav>

      <main id="main-content">{children}</main>

      <footer className="border-t border-ink/12 bg-chalk dark:border-white/14 dark:bg-surface">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 py-7 text-sm text-slate sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-dark">
          <p>Built by Suryanshu Saini</p>
          <div className="flex flex-wrap gap-5">
            <a href="https://github.com/suryanshusaini/LinkShift" target="_blank" rel="noreferrer" className="hover:text-ink dark:hover:text-text-dark">GitHub</a>
            <Link to="/terms" className="hover:text-ink dark:hover:text-text-dark">Terms</Link>
            <Link to="/privacy" className="hover:text-ink dark:hover:text-text-dark">Privacy</Link>
            <Link to="/report" className="hover:text-ink dark:hover:text-text-dark">Report a problem</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    return token && email ? { email, name: localStorage.getItem("name") || "" } : null;
  });
  const [savedLinks, setSavedLinks] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    setUser(null);
    setSavedLinks([]);
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <BrowserRouter>
        <Toaster position="bottom-center" toastOptions={{ duration: 4000 }} />
        <Shell user={user} setUser={setUser} handleLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Home user={user} onLinkCreated={(link) => setSavedLinks((prev) => [link, ...prev])} />} />
            <Route path="/login" element={<Auth mode="login" setUser={setUser} />} />
            <Route path="/signup" element={<Auth mode="signup" setUser={setUser} />} />
            <Route path="/dashboard" element={user ? <Dashboard savedLinks={savedLinks} setSavedLinks={setSavedLinks} onAccountDeleted={handleLogout} /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
