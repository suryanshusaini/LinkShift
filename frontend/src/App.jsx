import { useState } from "react";

function App() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [user, setUser] = useState(null); // We will use this when we wire up the login

  const handleShorten = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: longUrl }),
      });
      const data = await response.json();
      setShortUrl(`http://localhost:8000/${data.shortId}`);
    } catch (error) {
      console.error("Error shortening URL:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-600">
          LinkShift
        </h1>
        <div>
          {user ? (
            <button className="text-slate-600 hover:text-slate-900 font-medium">
              Dashboard
            </button>
          ) : (
            <div className="space-x-4">
              <button className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Log in
              </button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium transition-colors shadow-sm">
                Sign up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto mt-20 px-6 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight mb-4">
          Shorten your links, simply.
        </h2>
        <p className="text-lg text-slate-600 mb-10">
          Paste your long URL below to create a clean, shareable short link. No
          account required.
        </p>

        <form
          onSubmit={handleShorten}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <input
            type="url"
            placeholder="https://example.com/very-long-link"
            className="w-full sm:w-2/3 px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 transition-colors shadow-sm"
          >
            Shorten URL
          </button>
        </form>

        {/* Result Box */}
        {shortUrl && (
          <div className="mt-10 p-6 bg-white border border-slate-200 rounded-lg shadow-sm max-w-lg mx-auto text-left">
            <p className="text-sm font-medium text-slate-500 mb-2">
              Your short link is ready:
            </p>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-medium hover:underline break-all"
              >
                {shortUrl}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(shortUrl)}
                className="ml-4 text-sm bg-white border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 transition-colors font-medium text-slate-700 shadow-sm"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
