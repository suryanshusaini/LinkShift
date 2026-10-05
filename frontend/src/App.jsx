import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Link2, Menu, Moon, Sun, X } from "lucide-react";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Home from "./Home";
import NotFound from "./NotFound";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Legal from "./Legal";

function ThemeToggle({ isDark, onToggle, mobile = false }) {
  return (
    <button
      onClick={onToggle}
      className={
        mobile
          ? "flex w-full items-center gap-2 rounded-xl border border-ink/10 bg-plaster px-3 py-3 text-left font-semibold text-ink hover:border-ink/20 hover:bg-white dark:border-white/10 dark:bg-surface-soft dark:text-text-dark dark:hover:border-white/15 dark:hover:bg-surface-raised"
          : "inline-flex h-10 items-center gap-2 rounded-full border border-ink/10 bg-plaster px-3 text-slate hover:border-ink/20 hover:bg-white hover:text-ink dark:border-white/10 dark:bg-surface-soft dark:text-slate-dark dark:hover:border-white/15 dark:hover:bg-surface-raised dark:hover:text-text-dark"
      }
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
      {mobile && (isDark ? "Light theme" : "Dark theme")}
    </button>
  );
}

function Shell({ user, handleLogout, children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("linkshift_theme") || "light");
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
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("linkshift_theme", theme);
  }, [isDark, theme]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-plaster text-ink transition-colors duration-200 dark:bg-night dark:text-text-dark">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-tape px-4 py-2 font-semibold text-ink shadow-lg focus:not-sr-only"
      >
        Skip to content
      </a>

      <nav className="sticky top-0 z-50 border-b border-ink/10 bg-chalk/95 shadow-[0_1px_0_rgba(16,24,40,0.03)] backdrop-blur-md dark:border-white/10 dark:bg-surface/95 dark:shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="mx-auto flex h-[68px] max-w-[1120px] items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-xl font-bold tracking-tight text-ink dark:text-text-dark"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-tape text-ink shadow-sm transition-transform duration-200 group-hover:rotate-[-3deg] group-hover:scale-[1.03]">
              <Link2 size={19} strokeWidth={2.25} />
            </span>
            <span>LinkShift</span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={
                    "relative rounded-lg px-3 py-2 text-sm font-semibold " +
                    (location.pathname === "/dashboard"
                      ? "text-ink dark:text-text-dark"
                      : "text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark")
                  }
                >
                  My links
                  {location.pathname === "/dashboard" && (
                    <span className="absolute inset-x-3 -bottom-[14px] h-0.5 rounded-full bg-tape" />
                  )}
                </Link>
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
                <button
                  onClick={handleLogout}
                  className="h-10 rounded-full border border-ink/15 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink/25 hover:bg-plaster dark:border-white/12 dark:bg-surface-soft dark:text-text-dark dark:hover:border-white/20 dark:hover:bg-surface-raised"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full border border-ink bg-tape px-5 py-2.5 text-sm font-semibold text-ink shadow-sm hover:border-ink hover:bg-tape-hover hover:shadow-md"
                >
                  Sign up
                </Link>
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              </>
            )}
          </div>

          <button
            className="rounded-xl border border-ink/10 bg-plaster p-2 text-ink hover:border-ink/20 hover:bg-white dark:border-white/10 dark:bg-surface-soft dark:text-text-dark dark:hover:bg-surface-raised md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-ink/10 bg-chalk px-4 py-4 shadow-lg dark:border-white/10 dark:bg-surface md:hidden">
            <div className="mx-auto flex max-w-[1120px] flex-col gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className="rounded-xl px-3 py-3 font-semibold hover:bg-plaster dark:hover:bg-surface-soft"
                >
                  My links
                </Link>
              ) : null}
              {!user && (
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-3 font-semibold hover:bg-plaster dark:hover:bg-surface-soft"
                >
                  Log in
                </Link>
              )}
              {!user && (
                <Link
                  to="/signup"
                  className="rounded-xl border border-ink bg-tape px-3 py-3 text-center font-semibold text-ink hover:bg-tape-hover"
                >
                  Sign up
                </Link>
              )}
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} mobile />
              {user && (
                <button
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-3 text-left font-semibold text-stop hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Log out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <main id="main-content">{children}</main>

      <footer className="border-t border-ink/10 bg-chalk dark:border-white/10 dark:bg-surface">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 py-8 text-sm text-slate sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-dark">
          <p>Built by Suryanshu Saini</p>
          <div className="flex flex-wrap gap-5">
            <Link to="/terms" className="hover:text-ink dark:hover:text-text-dark">Terms</Link>
            <Link to="/privacy" className="hover:text-ink dark:hover:text-text-dark">Privacy</Link>
            <a
              href="mailto:?subject=LinkShift%20-%20Report%20a%20problem&body=Hi%20LinkShift%20team%2C%0A%0AI%20would%20like%20to%20report%20a%20problem.%0A%0AProblem%3A%0A"
              className="hover:text-ink dark:hover:text-text-dark"
            >
              Report a problem
            </a>
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
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--page-text)",
              boxShadow: "0 12px 32px rgba(16, 24, 40, 0.12)",
            },
          }}
        />
        <Shell user={user} handleLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Home user={user} onLinkCreated={(link) => setSavedLinks((prev) => [link, ...prev])} />} />
            <Route path="/login" element={<Auth mode="login" setUser={setUser} />} />
            <Route path="/signup" element={<Auth mode="signup" setUser={setUser} />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Legal type="terms" />} />
            <Route path="/privacy" element={<Legal type="privacy" />} />
            <Route path="/dashboard" element={user ? <Dashboard savedLinks={savedLinks} setSavedLinks={setSavedLinks} onAccountDeleted={handleLogout} /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
