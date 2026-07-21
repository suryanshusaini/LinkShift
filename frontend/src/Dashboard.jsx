import { useState, useEffect } from "react";

export default function Dashboard() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8000/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch URLs");
        }

        const data = await response.json();
        setUrls(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUrls();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-20 text-slate-500 font-medium">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 px-6">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Dashboard</h2>
      <p className="text-slate-600 mb-8">
        Manage and track your shortened links.
      </p>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {urls.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-sm">
          <p className="text-slate-500 font-medium">
            You haven't shortened any links yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-sm font-semibold text-slate-600">
                  Original URL
                </th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-600">
                  Short Link
                </th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-center">
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody>
              {urls.map((url) => (
                <tr
                  key={url._id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td
                    className="py-4 px-6 text-sm text-slate-600 max-w-xs truncate"
                    title={url.originalUrl}
                  >
                    {url.originalUrl}
                  </td>
                  <td className="py-4 px-6 text-sm font-medium">
                    <a
                      href={`http://localhost:8000/${url.shortId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 hover:underline"
                    >
                      localhost:8000/{url.shortId}
                    </a>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-900 font-semibold text-center">
                    {url.clicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
