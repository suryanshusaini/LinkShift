import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "./lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError(""); setDevToken("");
    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not request password recovery.");
      setSubmitted(true); setDevToken(data.devResetToken || "");
      toast.success("If the account exists, recovery instructions will be sent.");
    } catch (err) { setError(err.message || "Could not request password recovery."); }
    finally { setLoading(false); }
  };

  return <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg></div>
      <h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Enter the email associated with your account. If it exists, we'll send a reset link.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {submitted ? <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        If an account exists for that email, recovery instructions will be sent.
        {devToken && import.meta.env.DEV && <p className="mt-3 break-all">Local development reset link: <Link className="font-semibold underline" to={"/reset-password?token=" + encodeURIComponent(devToken)}>Reset password</Link></p>}
      </div> : <form onSubmit={submit} className="mt-6 space-y-4">
        <label htmlFor="recovery-email" className="block text-sm font-medium text-slate-700">Email address</label>
        <input id="recovery-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"/>
        <button disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{loading ? "Sending…" : "Send reset link"}</button>
      </form>}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Back to sign in</Link></p>
    </div>
  </div>;
}
