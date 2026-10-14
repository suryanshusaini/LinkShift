import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "./lib/api";

export default function ResetPassword() {
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("token") || "";
    window.history.replaceState({}, document.title, window.location.pathname);
    return value;
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault(); setError("");
    if (password.length < 12 || new TextEncoder().encode(password).length > 72) { setError("Use at least 12 characters and no more than 72 UTF-8 bytes."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!token) { setError("This reset link is missing its token. Request a new link."); return; }
    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not reset password.");
      setComplete(true); toast.success("Password updated.");
    } catch (err) { setError(err.message || "Could not reset password."); }
    finally { setLoading(false); }
  };

  return <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2"/></svg></div>
      <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Use at least 12 characters. Reset links can only be used once.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {complete ? <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">Your password has been updated. Please sign in again.<div className="mt-3"><button onClick={() => navigate("/login")} className="font-semibold underline">Go to sign in</button></div></div> : <form onSubmit={submit} className="mt-6 space-y-4">
        <input aria-label="New password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"/>
        <input aria-label="Confirm new password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"/>
        <button disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{loading ? "Updating…" : "Reset password"}</button>
      </form>}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Back to sign in</Link></p>
    </div>
  </div>;
}
