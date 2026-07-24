import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import Home from "./Home";

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    if (token && email) {
      return { email };
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: "#0f172a", color: "#fff", borderRadius: "8px" },
        }}
      />

      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative selection:bg-indigo-100 flex flex-col justify-between">
        <div>
          <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-slate-200/50 to-transparent -z-10"></div>

          {/* Sticky Navbar */}
          <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200 shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
              <Link
                to="/"
                className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 transition-transform hover:scale-[1.02]"
              >
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    ></path>
                  </svg>
                </div>
                LinkShift
              </Link>

              <div>
                {user ? (
                  <div className="flex items-center space-x-6">
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Logged in as
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {user.email}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                    <Link
                      to="/dashboard"
                      className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      My Links
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="space-x-3">
                    <Link
                      to="/login"
                      className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Routes */}
          <main className="pb-20">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route
                path="/login"
                element={<Auth mode="login" setUser={setUser} />}
              />
              <Route
                path="/signup"
                element={<Auth mode="signup" setUser={setUser} />}
              />
              <Route
                path="/dashboard"
                element={user ? <Dashboard /> : <Navigate to="/login" />}
              />
            </Routes>
          </main>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-20">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2026 LinkShift. Made with passion by Suryanshu Saini.</p>
            <div className="flex items-center space-x-6">
              <a
                href="mailto:suryanshusaini2009@gmail.com"
                className="hover:text-slate-900 transition-colors"
              >
                Report Bug / Feedback
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
