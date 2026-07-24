import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // 1. Import Toaster
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
      {/* 2. Add Toaster right inside the Router */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#fff",
            borderRadius: "8px",
          },
        }}
      />

      <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="relative z-10">
          <nav className="flex justify-between items-center p-6 max-w-5xl mx-auto">
            <Link
              to="/"
              className="text-2xl font-extrabold tracking-tight text-slate-900"
            >
              LinkShift
            </Link>
            <div>
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-slate-600 hidden sm:block">
                    {user.email}
                  </span>
                  <Link
                    to="/dashboard"
                    className="text-slate-900 font-medium hover:underline transition-all"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-slate-600 hover:text-red-600 font-medium transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 font-medium transition-colors shadow-sm"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </nav>

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
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
