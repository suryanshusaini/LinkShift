import { useState } from "react";
import toast from "react-hot-toast"; // 1. Import toast

export default function Home({ user }) {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const handleShorten = async (e) => {
    e.preventDefault();
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
    } catch (error) {
      console.error("Error shortening URL:", error);
      toast.error("Failed to shorten link"); // Optional: Add error toast!
    }
  };

  // 2. Create a handler function for copying
  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    toast.success("Copied to clipboard!");
  };

  return (
    <main className="max-w-3xl mx-auto mt-24 px-6 text-center">
      <h2 className="text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
        Shorten your links, <span className="text-slate-400">simply.</span>
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
              onClick={handleCopy} // 3. Update the button to use the new function
              className="ml-4 text-sm bg-white border border-slate-300 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors font-medium text-slate-700 shadow-sm"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
