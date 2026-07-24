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

  // NEW: The Delete Function
  const handleDelete = async (id) => {
    // Add a quick confirmation pop-up
    if (!window.confirm("Are you sure you want to delete this link?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Remove the deleted URL from the React state instantly
        setUrls(urls.filter((url) => url._id !== id));
        toast.success("Link deleted forever!");
      } else {
        toast.error("Failed to delete link.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-slate-500 font-medium">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-12 px-6">
      <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
        Your Dashboard
      </h2>
      <p className="text-slate-600 mb-8">
        Manage, track, and clean up your shortened links.
      </p>

      {urls.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            You haven't shortened any links yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="py-5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Original URL
                  </th>
                  <th className="py-5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Short Link
                  </th>
                  <th className="py-5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500 text-center">
                    Clicks
                  </th>
                  <th className="py-5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urls.map((url) => (
                  <tr
                    key={url._id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td
                      className="py-4 px-6 text-sm text-slate-500 max-w-xs truncate"
                      title={url.originalUrl}
                    >
                      {url.originalUrl}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium">
                      <a
                        href={`http://localhost:8000/${url.shortId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        localhost:8000/{url.shortId}
                      </a>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-900 font-bold text-center">
                      <span className="bg-slate-100 text-slate-700 py-1 px-3 rounded-full text-xs">
                        {url.clicks}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {/* NEW: Delete Button */}
                      <button
                        onClick={() => handleDelete(url._id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-50 group-hover:opacity-100"
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
