import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      const response = await fetch(API + "/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Could not reset password.");
      setDone(true); toast.success("Password updated."); setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  return <section className="mx-auto flex min-h-[calc(100vh-128px)] max-w-[560px] items-center px-4 py-12 sm:px-6"><div className="w-full rounded-[14px] border border-ink/12 bg-chalk p-6 dark:border-white/14 dark:bg-surface sm:p-9"><p className="font-mono text-xs text-slate dark:text-slate-dark">ACCOUNT / RECOVERY</p><h1 className="mt-2 text-3xl font-bold text-ink dark:text-text-dark">Choose a new password</h1>{done ? <div className="mt-6 rounded-[10px] border border-go/25 bg-green-50 p-4 text-sm text-go">Password updated. Redirecting to sign in…</div> : !token ? <div className="mt-6 rounded-[10px] border border-stop/25 bg-red-50 p-4 text-sm text-stop">This reset link is missing a token. <Link to="/forgot" className="font-semibold underline">Request a new one.</Link></div> : <form onSubmit={submit} className="mt-7 space-y-4"><div><label className="mb-1.5 block text-sm font-semibold">New password</label><input type="password" required minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} className="h-12 w-full rounded-[10px] border border-ink/20 bg-chalk px-3 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark"/></div><div><label className="mb-1.5 block text-sm font-semibold">Confirm password</label><input type="password" required minLength={8} value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="h-12 w-full rounded-[10px] border border-ink/20 bg-chalk px-3 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark"/></div><button disabled={loading} className="h-12 w-full rounded-[10px] border-[1.5px] border-ink bg-tape font-semibold text-ink disabled:opacity-60">{loading?"Updating…":"Update password"}</button></form>}</div></section>;
}
