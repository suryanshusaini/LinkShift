import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function Auth({ mode, setUser }) {
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordScore = Math.min(4, [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (isSignup && password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const response = await fetch(API + "/api/auth/" + (isSignup ? "register" : "login"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { name: name.trim(), email, password } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Authentication failed.");
      localStorage.setItem("token", data.token); localStorage.setItem("email", data.email); localStorage.setItem("name", data.name || "");
      setUser({ email: data.email, name: data.name || "" });
      navigate("/dashboard", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const googleSuccess = async ({ credential }) => {
    try {
      const response = await fetch(API + "/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google sign-in failed.");
      localStorage.setItem("token", data.token); localStorage.setItem("email", data.email); localStorage.setItem("name", data.name || "");
      setUser({ email: data.email, name: data.name || "" });
      navigate("/dashboard", { replace: true });
    } catch (err) { toast.error(err.message); }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100vh-128px)] max-w-[1120px] px-4 py-8 sm:px-6 lg:grid-cols-[5fr_7fr] lg:py-12">
      <aside className="relative hidden overflow-hidden rounded-l-[14px] bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div><span className="inline-flex rounded-md bg-tape px-2 py-1 font-mono text-xs font-semibold text-ink">LINKSHIFT</span><h1 className="mt-8 max-w-sm text-4xl font-bold leading-tight">Short links you can measure.</h1></div>
        <div className="ruler-ticks h-2 border-y border-white/20 opacity-70" />
      </aside>
      <div className="flex items-center rounded-[14px] border border-ink/12 bg-chalk px-5 py-10 dark:border-white/14 dark:bg-surface sm:px-10 lg:rounded-l-none">
        <div className="mx-auto w-full max-w-[400px]">
          <p className="font-mono text-xs text-slate dark:text-slate-dark">{isSignup ? "NEW ACCOUNT" : "WELCOME BACK"}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink dark:text-text-dark">{isSignup ? "Create an account" : "Sign in"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate dark:text-slate-dark">{isSignup ? "Keep your links, edit destinations and see who clicks." : "Continue managing your shortened links."}</p>

          {error && <div role="alert" aria-live="polite" className="mt-6 rounded-[10px] border border-stop/30 bg-red-50 px-4 py-3 text-sm font-medium text-stop">{error}</div>}

          <form onSubmit={submit} className="mt-7 space-y-4">
            {isSignup && <div><label htmlFor="name" className="mb-1.5 block text-sm font-semibold">Name</label><div className="relative"><UserRound size={18} className="absolute left-3 top-3.5 text-slate"/><input id="name" required value={name} onChange={(e)=>setName(e.target.value)} className="autofill-fix h-12 w-full rounded-[10px] border border-ink/20 bg-chalk pl-10 pr-3 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark" /></div></div>}
            <div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email</label><div className="relative"><Mail size={18} className="absolute left-3 top-3.5 text-slate"/><input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="autofill-fix h-12 w-full rounded-[10px] border border-ink/20 bg-chalk pl-10 pr-3 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark" /></div></div>
            <div><label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Password</label><div className="relative"><LockKeyhole size={18} className="absolute left-3 top-3.5 text-slate"/><input id="password" type={showPassword ? "text" : "password"} required minLength={isSignup ? 8 : undefined} value={password} onChange={(e)=>setPassword(e.target.value)} className="autofill-fix h-12 w-full rounded-[10px] border border-ink/20 bg-chalk pl-10 pr-11 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark" /><button type="button" onClick={()=>setShowPassword((value)=>!value)} className="absolute right-2 top-2 rounded-md p-2 text-slate" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{isSignup && <><div className="mt-2 flex gap-1" aria-label={"Password strength " + passwordScore + " of 4"}>{[0,1,2,3].map((item)=><span key={item} className={"h-1 flex-1 rounded-full " + (item < passwordScore ? "bg-tape" : "bg-ink/10 dark:bg-white/10")}/>)}</div><p className="mt-1 text-xs text-slate dark:text-slate-dark">8 characters or more</p></>}</div>
            <button disabled={loading} className="h-12 w-full rounded-[10px] border-[1.5px] border-ink bg-tape font-semibold text-ink hover:bg-tape-hover disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}</button>
          </form>

          <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-ink/10 dark:bg-white/10"/><span className="text-xs text-slate">or</span><span className="h-px flex-1 bg-ink/10 dark:bg-white/10"/></div>
          <div className="flex justify-center"><GoogleLogin onSuccess={googleSuccess} onError={()=>toast.error("Google sign-in failed")} theme="outline" shape="rectangular" size="large" text={isSignup ? "signup_with" : "signin_with"} width="400" /></div>
          {!isSignup && <div className="mt-5 text-center"><Link to="/forgot" className="text-sm font-semibold text-signal hover:underline">Forgot your password?</Link></div>}
          <p className="mt-8 border-t border-ink/10 pt-6 text-center text-sm text-slate dark:border-white/10 dark:text-slate-dark">{isSignup ? "Already have an account? " : "Don't have a LinkShift account? "}<Link to={isSignup ? "/login" : "/signup"} className="font-semibold text-ink underline decoration-tape decoration-2 underline-offset-2 dark:text-text-dark">{isSignup ? "Sign in" : "Create an account"}</Link></p>
        </div>
      </div>
    </section>
  );
}
