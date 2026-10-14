import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { apiFetch, setCsrfToken } from "./lib/api";


export default function Auth({ mode, setUser }) {
  const isSignup = mode === "signup";
  const [stage, setStage] = useState("credentials");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const passwordScore = Math.min(4, [password.length >= 12, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length);

  const finishAuth = async (data) => {
    setCsrfToken(data.csrfToken);
    setUser(data.user);
    navigate("/dashboard", { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (isSignup && password.length < 12) { setError("Use at least 12 characters for your password."); return; }
    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/" + (isSignup ? "register" : "login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { name: name.trim(), email, password } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.verificationRequired) { setStage("verify"); setError(data.message); return; }
        throw new Error(data.message || "Authentication failed.");
      }
      if (isSignup && data.verificationRequired) {
        setStage("verify");
        setDevOtp(data.devOtp || "");
        toast.success("Check your email for the verification code.");
        return;
      }
      await finishAuth(data);
    } catch (err) { setError(err.message || "Authentication failed."); }
    finally { setLoading(false); }
  };

  const verifyEmail = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not verify this code.");
      await finishAuth(data);
    } catch (err) { setError(err.message || "Could not verify this code."); }
    finally { setLoading(false); }
  };

  const resendCode = async () => {
    setError("");
    try {
      const response = await apiFetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not resend code.");
      setDevOtp(data.devOtp || "");
      toast.success(data.message || "If verification is pending, a new code will be sent.");
    } catch (err) { setError(err.message || "Could not resend code."); }
  };

  const googleSuccess = async ({ credential }) => {
    try {
      const response = await apiFetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google sign-in failed.");
      await finishAuth(data);
    } catch (err) { toast.error(err.message); }
  };

  const verifyStage = stage === "verify";
  return (
    <section className="mx-auto grid min-h-[calc(100vh-128px)] max-w-[1120px] px-4 py-8 sm:px-6 lg:grid-cols-[5fr_7fr] lg:py-12">
      <aside className="relative hidden overflow-hidden rounded-l-[14px] bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div><span className="inline-flex rounded-md bg-tape px-2 py-1 font-mono text-xs font-semibold text-ink">LINKSHIFT</span><h1 className="mt-8 max-w-sm text-4xl font-bold leading-tight">Short links you can measure.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-white/70">Your links, your data, securely managed.</p></div>
        <div className="ruler-ticks h-2 border-y border-white/20 opacity-70" />
      </aside>
      <div className="flex items-center rounded-[14px] border border-ink/10 bg-chalk px-5 py-10 shadow-[0_12px_32px_rgba(32,26,22,0.06)] dark:border-white/10 dark:bg-surface sm:px-10 lg:rounded-l-none">
        <div className="mx-auto w-full max-w-[400px]">
          <p className="font-mono text-xs text-slate dark:text-slate-dark">{verifyStage ? "EMAIL VERIFICATION" : isSignup ? "NEW ACCOUNT" : "WELCOME BACK"}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink dark:text-text-dark">{verifyStage ? "Check your inbox" : isSignup ? "Create an account" : "Sign in"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate dark:text-slate-dark">{verifyStage ? "Enter the six-digit code sent to " + email + ". It expires in 10 minutes." : isSignup ? "Verify your email to manage and track your links." : "Continue managing your shortened links."}</p>
          {error && <div role="alert" aria-live="polite" className="mt-5 rounded-[10px] border border-stop/25 bg-stop/5 px-4 py-3 text-sm font-medium text-stop">{error}</div>}

          {verifyStage ? (
            <form onSubmit={verifyEmail} className="mt-7 space-y-4">
              <label htmlFor="verification-code" className="block text-sm font-semibold">Six-digit code</label>
              <input id="verification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-14 w-full rounded-[10px] border border-ink/20 bg-chalk text-center font-mono text-2xl tracking-[0.4em] text-ink dark:border-white/15 dark:bg-surface dark:text-text-dark" />
              {devOtp && import.meta.env.DEV && <p className="rounded-lg bg-warn p-3 text-xs text-ink">Local development OTP: <strong>{devOtp}</strong></p>}
              <button disabled={loading || code.length !== 6} className="h-12 w-full rounded-[10px] border-[1.5px] border-ink bg-tape font-semibold text-ink disabled:opacity-60">{loading ? "Verifying…" : "Verify email"}</button>
              <button type="button" onClick={resendCode} className="w-full py-2 text-sm font-semibold text-signal hover:underline">Resend code</button>
              <button type="button" onClick={() => { setStage("credentials"); setError(""); }} className="w-full py-2 text-sm text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark">Back to signup</button>
            </form>
          ) : (
            <>
              <form onSubmit={submit} className="mt-7 space-y-4">
                {isSignup && <div><label htmlFor="name" className="mb-1.5 block text-sm font-semibold">Name</label><div className="relative"><UserRound size={18} className="absolute left-3 top-3.5 text-slate"/><input id="name" required maxLength={100} value={name} onChange={(e)=>setName(e.target.value)} className="autofill-fix h-12 w-full rounded-[10px] border border-ink/20 bg-chalk pl-10 pr-3 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark" /></div></div>}
                <div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email</label><div className="relative"><Mail size={18} className="absolute left-3 top-3.5 text-slate"/><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e)=>setEmail(e.target.value)} className="autofill-fix h-12 w-full rounded-[10px] border border-ink/20 bg-chalk pl-10 pr-3 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark" /></div></div>
                <div><label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Password</label><div className="relative"><LockKeyhole size={18} className="absolute left-3 top-3.5 text-slate"/><input id="password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} required minLength={isSignup ? 12 : undefined} maxLength={72} value={password} onChange={(e)=>setPassword(e.target.value)} className="autofill-fix h-12 w-full rounded-[10px] border border-ink/20 bg-chalk pl-10 pr-11 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark" /><button type="button" onClick={()=>setShowPassword((value)=>!value)} className="absolute right-2 top-2 rounded-md p-2 text-slate" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{isSignup && <><div className="mt-2 flex gap-1" aria-label={"Password strength " + passwordScore + " of 4"}>{[0,1,2,3].map((item)=><span key={item} className={"h-1 flex-1 rounded-full " + (item < passwordScore ? "bg-tape" : "bg-ink/10 dark:bg-white/10")}/>)}</div><p className="mt-1 text-xs text-slate dark:text-slate-dark">Use 12+ characters (max 72 UTF-8 bytes).</p></>}</div>
                <button disabled={loading} className="h-12 w-full rounded-[10px] border-[1.5px] border-ink bg-tape font-semibold text-ink hover:bg-tape-hover disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : isSignup ? "Continue to email verification" : "Sign in"}</button>
              </form>
              {!isSignup && <div className="mt-5 text-center"><Link to="/forgot" className="text-sm font-semibold text-signal hover:underline">Forgot your password?</Link></div>}
              <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-ink/10 dark:bg-white/10"/><span className="text-xs text-slate">or</span><span className="h-px flex-1 bg-ink/10 dark:bg-white/10"/></div>
              <div className="flex justify-center"><GoogleLogin onSuccess={googleSuccess} onError={()=>toast.error("Google sign-in failed")} theme="outline" shape="rectangular" size="large" text={isSignup ? "signup_with" : "signin_with"} width="400" /></div>
              <p className="mt-8 border-t border-ink/10 pt-6 text-center text-sm text-slate dark:border-white/10 dark:text-slate-dark">{isSignup ? "Already have an account? " : "Don't have a LinkShift account? "}<Link to={isSignup ? "/login" : "/signup"} className="font-semibold text-ink underline decoration-tape decoration-2 underline-offset-2 dark:text-text-dark">{isSignup ? "Sign in" : "Create an account"}</Link></p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
