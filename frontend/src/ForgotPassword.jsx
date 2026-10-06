import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState("");

  const submit = async (event) => {
    event.preventDefault(); setLoading(true);
    try {
      const response = await fetch(API + "/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Could not process request.");
      setSent(true); if (data.devResetToken) setDevToken(data.devResetToken); toast.success("Check your inbox for reset instructions.");
    } catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  return <section className="mx-auto flex min-h-[calc(100vh-128px)] max-w-[560px] items-center px-4 py-12 sm:px-6"><div className="w-full rounded-[14px] border border-ink/12 bg-chalk p-6 dark:border-white/14 dark:bg-surface sm:p-9"><p className="font-mono text-xs text-slate dark:text-slate-dark">ACCOUNT / RECOVERY</p><h1 className="mt-2 text-3xl font-bold text-ink dark:text-text-dark">Reset your password</h1>{!sent ? <><p className="mt-3 text-sm leading-6 text-slate dark:text-slate-dark">Enter your account email. If it exists, we’ll send a reset link that expires in 30 minutes.</p><form onSubmit={submit} className="mt-7"><label htmlFor="forgot-email" className="mb-1.5 block text-sm font-semibold">Email</label><input id="forgot-email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="h-12 w-full rounded-[10px] border border-ink/20 bg-chalk px-3 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark"/><button disabled={loading} className="mt-4 h-12 w-full rounded-[10px] border-[1.5px] border-ink bg-tape font-semibold text-ink disabled:opacity-60">{loading?"Sending…":"Send reset link"}</button></form></> : <div className="mt-5 rounded-[10px] border border-go/25 bg-green-50 p-4 text-sm leading-6 text-go">If the account exists, the reset email has been sent. Check your spam folder if you don’t see it.{devToken && <p className="mt-3 break-all font-mono text-xs">Development token: {devToken}</p>}</div>}<p className="mt-7 text-sm text-slate dark:text-slate-dark"><Link to="/login" className="font-semibold text-signal">← Back to sign in</Link></p></div></section>;
}
