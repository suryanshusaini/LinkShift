import { useState } from "react";

// ─── Icons ───────────────────────────────────────────────────────────────────
function LinkIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleShorten(e) {
    e.preventDefault();
    setError("");
    setShortUrl("");

    if (!url.trim()) {
      setError("Please enter a URL before shortening.");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError(
        "That doesn't look like a valid URL. Make sure it starts with http:// or https://",
      );
      return;
    }

    setLoading(true);
    try {
      // 🔌 Hitting the live local backend using the relative path so Vite's proxy catches it
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalUrl: url.trim() }),
      });

      if (!response.ok) {
        throw new Error(
          "Failed to shorten URL. Please check your backend connection.",
        );
      }

      const data = await response.json();

      // Combine the local backend URL with the returned shortId (Updated to port 8000)
      setShortUrl(`http://localhost:8000/${data.shortId}`);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        backgroundColor: "#F0F5DF",
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Card */}
      <div
        className="w-full max-w-xl rounded-2xl p-10 flex flex-col gap-8"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.07)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Badge */}
          <div
            className="flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full mb-1"
            style={{ backgroundColor: "#dbe8d8", color: "#01949a" }}
          >
            <LinkIcon />
            <span>URL Shortener</span>
          </div>

          <h1
            className="text-5xl font-extrabold tracking-tight"
            style={{ color: "#01949a" }}
          >
            LinkShift
          </h1>

          <p className="text-base" style={{ color: "#4b5563" }}>
            Paste any long link and get a clean, shareable short URL instantly.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleShorten}
          className="flex flex-col gap-4"
          noValidate
        >
          {/* URL Input */}
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "#01949a" }}
            >
              <LinkIcon />
            </span>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="https://your-very-long-url.com/goes/here"
              aria-label="Long URL input"
              className="w-full pl-12 pr-4 py-4 rounded-xl text-sm outline-none transition-all duration-150"
              style={{
                backgroundColor: "#dbe8d8",
                border: "1.5px solid #dbe8d8",
                color: "#1f2937",
              }}
              onFocus={(e) => {
                e.target.style.border = "1.5px solid #01949a";
                e.target.style.backgroundColor = "#ffffff";
              }}
              onBlur={(e) => {
                e.target.style.border = "1.5px solid #dbe8d8";
                e.target.style.backgroundColor = "#dbe8d8";
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              id="error-message"
              role="alert"
              className="flex items-start gap-2 text-sm rounded-xl px-4 py-3"
              style={{
                backgroundColor: "#fef2f2",
                border: "1.5px solid #fca5a5",
                color: "#b91c1c",
              }}
            >
              <svg
                className="w-4 h-4 mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            id="shorten-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#01949a" }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = "#017f84";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#01949a";
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Shortening…
              </span>
            ) : (
              "Shorten URL"
            )}
          </button>
        </form>

        {/* Result */}
        {shortUrl && (
          <div id="result-box" className="flex flex-col gap-3">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#6b7280" }}
            >
              Your short link
            </p>
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                backgroundColor: "#F0F5DF",
                border: "1.5px solid #dbe8d8",
              }}
            >
              <input
                id="short-url-output"
                type="text"
                readOnly
                value={shortUrl}
                aria-label="Shortened URL"
                className="flex-1 bg-transparent font-mono text-sm outline-none select-all"
                style={{ color: "#01949a" }}
              />
              <button
                id="copy-btn"
                onClick={handleCopy}
                title="Copy to clipboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                style={
                  copied
                    ? { backgroundColor: "#01949a", color: "#ffffff" }
                    : { backgroundColor: "#dbe8d8", color: "#01949a" }
                }
                onMouseEnter={(e) => {
                  if (!copied) {
                    e.currentTarget.style.backgroundColor = "#c3d9bf";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copied) {
                    e.currentTarget.style.backgroundColor = "#dbe8d8";
                  }
                }}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs" style={{ color: "#9ca3af" }}>
        © {new Date().getFullYear()} LinkShift — Fast, clean URL shortening.
      </p>
    </div>
  );
}
