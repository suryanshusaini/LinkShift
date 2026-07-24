import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUrls(data);
        }
      } catch (err) {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchUrls();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUrls(urls.filter((url) => url._id !== id));
        toast.success("Link deleted successfully!");
      } else {
        toast.error("Failed to delete link.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

  // Helper to check if a link is inactive (e.g. not opened in 30+ days)
  const isLinkActive = (lastOpenedAt) => {
    if (!lastOpenedAt) return true;
    const lastOpened = new Date(lastOpenedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastOpened > thirtyDaysAgo;
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-slate-500 font-medium">
        Loading your links...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 px-6">
      {/* Header section matching reference */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">My Links</h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage, monitor analytics, and track your active shortcuts.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-blue-700 text-sm font-semibold">
          {urls.length} Total Links
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg mb-2">
            No links created yet.
          </p>
          <a href="/" className="text-blue-600 font-semibold hover:underline">
            Create your first short link →
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Status
                  </th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Project / URL
                  </th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500 text-center">
                    Views
                  </th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Last Modified
                  </th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Last Opened
                  </th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urls.map((url) => {
                  const active = isLinkActive(url.lastOpenedAt);
                  return (
                    <tr
                      key={url._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`}
                          ></span>
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <p
                          className="text-sm font-medium text-slate-900 truncate"
                          title={url.originalUrl}
                        >
                          {url.originalUrl}
                        </p>
                        <a
                          href={`http://localhost:8000/${url.shortId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          localhost:8000/{url.shortId}
                        </a>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900 text-center">
                        {url.clicks}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(
                          url.updatedAt || url.createdAt,
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                        {url.lastOpenedAt
                          ? new Date(url.lastOpenedAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(url._id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Delete link"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
