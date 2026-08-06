import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function Dashboard({ user }) {
  const [savedLinks, setSavedLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        toast.success("Link deleted successfully.");
        fetchSavedLinks();
      } else {
        toast.error("Failed to delete link.");
      }
    } catch (error) {
      toast.error("Failed to delete link.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-16 px-6 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Links</h1>
          <p className="text-slate-500">
            Manage, monitor analytics, and track your active shortcuts.
          </p>
        </div>
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold border border-blue-100">
          {savedLinks.length} Total Links
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-slate-500 text-lg">Loading your links...</p>
        </div>
      ) : savedLinks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <p className="text-slate-500 mb-4 text-lg">No links created yet.</p>
          <a
            href="/"
            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Create your first short link →
          </a>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
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
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Status is now the first column */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </td>

                    {/* Original URL is now the second column */}
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        {link.originalUrl}
                      </a>
                    </td>

                    <td className="px-6 py-4">
                      <a
                        href={`${import.meta.env.VITE_API_URL}/${link.shortId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {import.meta.env.VITE_API_URL}/{link.shortId}
                      </a>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {link.createdAt
                        ? new Date(link.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-sm">
                        {link.clicks || 0}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() =>
                          handleCopy(
                            `${import.meta.env.VITE_API_URL}/${link.shortId}`,
                          )
                        }
                        className="text-slate-400 hover:text-blue-600 transition-colors"
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
                        className="text-slate-400 hover:text-red-500 transition-colors"
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
