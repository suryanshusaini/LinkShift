import { useState } from "react";
import Auth from "./Auth";

function App() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const handleShorten = async (e) => {
    e.preventDefault();
    try {
      // 1. Grab the token from localStorage
      const token = localStorage.getItem("token");

      // 2. Set up the basic headers
      const headers = {
        "Content-Type": "application/json",
      };

      // 3. If a token exists, attach it as a Bearer token
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:8000/api/shorten", {
        method: "POST",
        headers: headers, // Pass the dynamic headers here
        body: JSON.stringify({ originalUrl: longUrl }),
      });

      const data = await response.json();
      setShortUrl(`http://localhost:8000/${data.shortId}`);
    } catch (error) {
      console.error("Error shortening URL:", error);
    }
  };

  const handleAuthSuccess = (data) => {
    localStorage.setItem("token", data.token);
    setUser({ email: data.email });
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans relative overflow-hidden">
      {/* Subtle SaaS Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="flex justify-between items-center p-6 max-w-5xl mx-auto">
          <h1
            className="text-2xl font-extrabold tracking-tight text-slate-900 cursor-pointer"
            onClick={() => setShowAuth(false)}
          >
            LinkShift
          </h1>
          <div>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-slate-600 hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-red-600 font-medium transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setShowAuth(true);
                  }}
                  className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setShowAuth(true);
                  }}
                  className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 font-medium transition-colors shadow-sm"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content vs Auth View */}
        {showAuth ? (
          <Auth
            mode={authMode}
            setMode={setAuthMode}
            onAuthSuccess={handleAuthSuccess}
          />
        ) : (
          <main className="max-w-3xl mx-auto mt-24 px-6 text-center">
            <h2 className="text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
              Shorten your links,{" "}
              <span className="text-slate-400">simply.</span>
            </h2>
            <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
              Paste your long URL below to create a clean, shareable short link.
              {!user && " No account required."}
            </p>

            <form
              onSubmit={handleShorten}
              className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto"
            >
              <input
                type="url"
                placeholder="https://example.com/very-long-link"
                className="w-full sm:w-2/3 px-5 py-4 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow text-lg"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-semibold text-lg rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
              >
                Shorten
              </button>
            </form>

            {/* Result Box */}
            {shortUrl && (
              <div className="mt-12 p-6 bg-white border border-slate-200 rounded-xl shadow-sm max-w-lg mx-auto text-left">
                <p className="text-sm font-medium text-slate-500 mb-3">
                  Your short link is ready
                </p>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 font-medium hover:underline break-all"
                  >
                    {shortUrl}
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(shortUrl)}
                    className="ml-4 text-sm bg-white border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium text-slate-700 shadow-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
