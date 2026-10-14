import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const finishAuth = (data) => {
    setCsrfToken(data.csrfToken);
    setUser(data.user);
    navigate("/dashboard", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(""); setIsLoading(true);
    try {
      const response = await apiFetch("/api/auth/" + (isSignup ? "register" : "login"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { name: name.trim(), email, password } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.verificationRequired) { setEmail(data.email || email); setStage("verify"); setError(data.message); return; }
        throw new Error(data.message || "Authentication failed.");
      }
      if (data.verificationRequired) {
        setStage("verify"); setEmail(data.email || email); setDevOtp(data.devOtp || "");
        toast.success("Check your email for the verification code."); return;
      }
      finishAuth(data);
    } catch (err) { setError(err.message || "Authentication failed."); }
    finally { setIsLoading(false); }
  };

  const verifyEmail = async (event) => {
    event.preventDefault(); setError(""); setIsLoading(true);
    try {
      const response = await apiFetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not verify the code.");
      finishAuth(data);
    } catch (err) { setError(err.message || "Could not verify the code."); }
    finally { setIsLoading(false); }
  };

  const resendCode = async () => {
    setError("");
    try {
      const response = await apiFetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not resend the code.");
      setDevOtp(data.devOtp || ""); toast.success(data.message || "If verification is pending, a new code will be sent.");
    } catch (err) { setError(err.message || "Could not resend the code."); }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    try {
      const response = await apiFetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google sign-in failed.");
      finishAuth(data); toast.success("Signed in with Google!");
    } catch (err) { toast.error(err.message || "Google sign-in failed."); }
  };

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      </div>
      <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">{stage === "verify" ? "Verify your email" : isSignup ? "Create an account" : "Sign in"}</h2>
      <p className="mb-8 max-w-sm text-center text-sm leading-6 text-slate-500">{stage === "verify" ? "Enter the six-digit code sent to " + email + ". It expires in 10 minutes." : isSignup ? "Create your free account to manage your links." : "Welcome back. Continue managing your links."}</p>
      <div className="w-full max-w-sm">
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {stage === "verify" ? (
          <form onSubmit={verifyEmail} className="flex flex-col gap-4">
            <label htmlFor="verification-code" className="text-sm font-medium text-slate-700">Six-digit verification code</label>
            <input id="verification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputClass + " text-center font-mono text-2xl tracking-[0.35em]"} />
            {devOtp && import.meta.env.DEV && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Development OTP: <strong>{devOtp}</strong></p>}
            <button disabled={isLoading || code.length !== 6} className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{isLoading ? "Verifying…" : "Verify email"}</button>
            <button type="button" onClick={resendCode} className="py-2 text-sm font-semibold text-blue-600 hover:text-blue-700">Resend code</button>
            <button type="button" onClick={() => { setStage("credentials"); setError(""); }} className="py-1 text-sm text-slate-500 hover:text-slate-800">Back</button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mb-5 flex flex-col gap-4">
              {isSignup && <input type="text" placeholder="Your name" autoComplete="name" maxLength={100} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />}
              <input type="email" placeholder="Email address" autoComplete="email" maxLength={254} className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder={isSignup ? "Password (12+ characters)" : "Password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 12 : undefined} maxLength={72} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
              {!isSignup && <div className="-mt-1 text-right"><Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</Link></div>}
              <button type="submit" disabled={isLoading} className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? "Please wait…" : isSignup ? "Continue to verification" : "Sign in"}</button>
            </form>
            <div className="mb-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200"/><span className="text-xs text-slate-400">or</span><span className="h-px flex-1 bg-slate-200"/></div>
            <div className="flex justify-center"><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error("Google sign-in failed.")} theme="outline" shape="rectangular" size="large" text={isSignup ? "signup_with" : "signin_with"} /></div>
            <p className="mt-7 text-center text-sm text-slate-500">{isSignup ? "Already have an account? " : "Don't have an account? "}<Link to={isSignup ? "/login" : "/signup"} className="font-semibold text-blue-600 hover:text-blue-700">{isSignup ? "Sign in" : "Sign up"}</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
