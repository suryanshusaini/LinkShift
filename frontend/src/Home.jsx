import { useState } from "react";
import toast from "react-hot-toast";

export default function Home({ user }) {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!longUrl) return;

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("http://localhost:8000/api/shorten", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ originalUrl: longUrl }),
      });

      const data = await response.json();
      setShortUrl(`http://localhost:8000/${data.shortId}`);
      toast.success("Link shortened successfully!");
    } catch (error) {
      console.error("Error shortening URL:", error);
      toast.error("Failed to shorten link");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    toast.success("Copied to clipboard!");
  };

  return (
    <main className="max-w-6xl mx-auto mt-16 px-6 lg:mt-24">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Copywriting */}
        <div className="max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-sm font-medium text-slate-600 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
            LinkShift v1.0
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Meet Your New <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              URL Shortcut!
            </span>
          </h1>

          <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Take control of your links with LinkShift, the all-in-one platform
            designed to simplify link management, track analytics, and drive
            engagement.
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="/signup"
                className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Simplify Your Links
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </a>
              <p className="text-sm text-slate-400 self-center">
                Start for Free! No Card Required
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Card Widget */}
        <div className="relative">
          {/* Decorative background blobs */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2.5rem] blur-xl opacity-20"></div>

          <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 sm:p-10 rounded-[2rem] shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center lg:text-left">
              Create Short Link
            </h3>

            <form onSubmit={handleShorten} className="mb-6">
              {/* Nested Input & Button Design */}
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all">
                <div className="pl-4 text-slate-400">
                  <svg
                    className="w-5 h-5"
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
                <input
                  type="url"
                  placeholder="Paste a link to shorten it!"
                  className="w-full bg-transparent px-3 py-3 text-slate-700 placeholder-slate-400 focus:outline-none"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm whitespace-nowrap"
                >
                  Shorten
                </button>
              </div>
            </form>

            {/* Result Area */}
            {shortUrl && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        ></path>
                      </svg>
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-slate-900 font-bold truncate text-lg">
                        {shortUrl}
                      </p>
                      <p className="text-slate-400 text-sm truncate">
                        {longUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        ></path>
                      </svg>
                      Copy link
                    </button>
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-slate-900 text-white font-medium py-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      Test Link
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        ></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 text-center text-sm font-medium text-slate-400">
              <p>Free • Fast • Secure • Long Term Links</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
