import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Format a date string as "Aug 6, 2026" using the native Intl API
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
};

export default function Dashboard({ savedLinks, setSavedLinks, onAccountDeleted }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const navigate = useNavigate();

  const fetchSavedLinks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/urls`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedLinks(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedLinks();

    const intervalId = setInterval(() => {
      fetchSavedLinks();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Optimistic update — remove immediately without waiting for re-fetch
        setSavedLinks((prev) => prev.filter((link) => link._id !== id));
        toast.success("Link deleted successfully.");
      } else {
        toast.error("Failed to delete link.");
      }
    } catch (error) {
      toast.error("Failed to delete link.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you absolutely sure? This will permanently delete your account and all your shortened links. This action cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/account`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        toast.success("Account deleted. Sorry to see you go!");
        // Clear all session data from localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("name");
        // Notify App.jsx to reset user + savedLinks state
        if (onAccountDeleted) onAccountDeleted();
        navigate("/");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete account.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-16 px-6 pb-24">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Links</h1>
          <p className="text-slate-500">
            Manage, monitor analytics, and track your active shortcuts.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold border border-blue-100">
            {savedLinks.length} Total Links
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="text-red-500 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Permanently delete your account and all links"
          >
            {isDeletingAccount ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>

      {/* ── Retention Policy Notice ──────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 text-amber-700 text-sm px-4 py-3 rounded-xl mb-8 leading-relaxed">
        <span className="text-base shrink-0 mt-0.5">💡</span>
        <p>
          <span className="font-semibold">Data Retention Policy:</span> Links
          with zero clicks for <span className="font-semibold">30 days</span>{" "}
          are automatically removed to keep your dashboard clean. Every click
          resets the timer.
        </p>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-slate-500 text-lg">Loading your links...</p>
        </div>
      ) : savedLinks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <p className="text-slate-500 mb-4 text-lg">No links created yet.</p>
          <a
            href="/"
            className="text-blue-600 font-semibold hover:text-blue-700 transition-all duration-300 ease-in-out"
          >
            Create your first short link →
          </a>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="px-6 py-4 font-medium w-32">Status</th>
                  <th className="px-6 py-4 font-medium">Original URL</th>
                  <th className="px-6 py-4 font-medium">Short Link</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium">Clicks</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedLinks.map((link) => (
                  <tr
                    key={link._id}
                    className="hover:bg-slate-50 hover:-translate-y-[1px] transition-all duration-200"
                  >
                    {/* Status — pulsing dot */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        {/* Outer ping layer for pulse animation */}
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Active
                      </span>
                    </td>

                    {/* Original URL */}
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-600 transition-all duration-300 ease-in-out"
                      >
                        {link.originalUrl}
                      </a>
                    </td>

                    {/* Short link */}
                    <td className="px-6 py-4">
                      <a
                        href={`${import.meta.env.VITE_API_URL}/${link.shortId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700 transition-all duration-300 ease-in-out"
                      >
                        {import.meta.env.VITE_API_URL}/{link.shortId}
                      </a>
                    </td>

                    {/* Created date — human-readable via Intl */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(link.createdAt)}
                    </td>

                    {/* Click count */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-sm">
                        {link.clicks || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() =>
                          handleCopy(
                            `${import.meta.env.VITE_API_URL}/${link.shortId}`,
                          )
                        }
                        className="text-slate-400 hover:text-blue-600 hover:scale-110 transition-all duration-300 ease-in-out"
                        title="Copy"
                      >
                        <svg
                          className="w-5 h-5 inline"
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
                      </button>
                      <button
                        onClick={() => handleDelete(link._id)}
                        className="text-slate-400 hover:text-red-500 hover:scale-110 transition-all duration-300 ease-in-out"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5 inline"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

