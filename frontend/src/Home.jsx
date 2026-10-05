import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, ChevronDown, Copy, ExternalLink, QrCode, RefreshCw, X } from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SHORT_BASE = (import.meta.env.VITE_SHORT_BASE_URL || API).replace(/\/$/, "");

export default function Home({ user, onLinkCreated }) {
  const [longUrl, setLongUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [aliasState, setAliasState] = useState({ status: "idle", message: "" });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const length = longUrl.length;
  const rulerWidth = Math.min(length / 150, 1) * 100;

  useEffect(() => {
    if (!alias.trim()) { setAliasState({ status: "idle", message: "" }); return undefined; }
    const timer = setTimeout(async () => {
      const value = alias.trim();
      if (!/^[A-Za-z0-9_-]{3,30}$/.test(value)) { setAliasState({ status: "taken", message: "Use 3–30 letters, numbers, hyphens or underscores." }); return; }
      setAliasState({ status: "checking", message: "Checking…" });
      try {
        const response = await fetch(API + "/api/alias/check?alias=" + encodeURIComponent(value));
        const data = await response.json();
        setAliasState(data.available ? { status: "available", message: "Available" } : { status: "taken", message: data.error || "Taken, try another" });
      } catch { setAliasState({ status: "idle", message: "" }); }
    }, 400);
    return () => clearTimeout(timer);
  }, [alias]);

  const shortUrl = useMemo(() => result ? (result.shortUrl || SHORT_BASE + "/" + result.shortId) : "", [result]);
  const shortening = result ? Math.max(0, result.sourceLength - shortUrl.length) : 0;
  const percent = result?.sourceLength ? Math.max(0, Math.round((shortening / result.sourceLength) * 100)) : 0;

  const handleShorten = async (event) => {
    event.preventDefault();
    if (!longUrl.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = "Bearer " + token;
      const response = await fetch(API + "/api/shorten", {
        method: "POST",
        headers,
        body: JSON.stringify({ originalUrl: longUrl.trim(), customAlias: alias.trim() || undefined, expiresAt: expiresAt || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not shorten this link.");
      const created = { ...data, sourceLength: longUrl.trim().length };
      setResult(created);
      onLinkCreated?.(created);
      setLongUrl(""); setAlias(""); setExpiresAt(""); setOptionsOpen(false); setCopied(false); setQrOpen(false);
    } catch (error) {
      toast.error(error.message || "Could not shorten this link.");
    } finally { setSubmitting(false); }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => { setResult(null); setLongUrl(""); setAlias(""); setExpiresAt(""); setOptionsOpen(false); setQrOpen(false); };

  return (
    <div>
      <section className="mx-auto max-w-[1120px] px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pb-24">
        <div className="max-w-[760px]">
          <p className="mb-4 font-mono text-sm text-slate dark:text-slate-dark">Link shortener</p>
          <h1 className="max-w-2xl text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.02em] text-ink dark:text-text-dark">Long links, cut down to size.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate sm:text-lg dark:text-slate-dark">Paste a link and get a short one. Create a free account to keep, edit and track your links.</p>
        </div>

        <div className="mt-10 max-w-[760px]">
          {!result ? (
            <form onSubmit={handleShorten}>
              <div className="flex flex-col gap-2 rounded-[14px] border border-ink/15 bg-chalk p-1.5 shadow-[0_8px_24px_rgba(16,24,40,0.07)] sm:flex-row sm:items-stretch dark:border-white/10 dark:bg-surface dark:text-text-dark dark:shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
                <label htmlFor="long-url" className="sr-only">Long URL</label>
                <input id="long-url" type="url" required value={longUrl} onChange={(e) => setLongUrl(e.target.value)} placeholder="https://example.com/very/long/path" className="h-[52px] min-w-0 flex-1 bg-transparent px-4 text-[15px] text-ink placeholder:text-slate/70 dark:text-text-dark dark:placeholder:text-slate-dark/70 " />
                <button type="submit" disabled={submitting || !longUrl.trim()} className="h-[52px] rounded-[10px] border-[1.5px] border-ink bg-tape px-6 font-semibold text-ink transition-colors hover:bg-tape-hover disabled:cursor-not-allowed disabled:opacity-50 ">{submitting ? "Shortening…" : "Shorten"}</button>
              </div>

              <div className="mt-2 h-6 overflow-hidden rounded-sm border-y border-ink/10 dark:border-white/10" aria-hidden="true">
                <div className="relative h-full ruler-ticks transition-[width] duration-150 ease-out" style={{ width: Math.max(rulerWidth, length ? 4 : 0) + "%" }}>
                  <div className="absolute inset-y-0 right-0 w-1 bg-tape" />
                </div>
              </div>
              <div className="flex justify-end font-mono text-xs text-slate dark:text-slate-dark">{length} characters</div>

              <div className="mt-5 border-b border-ink/12 pb-5 dark:border-white/14">
                <button type="button" onClick={() => setOptionsOpen((value) => !value)} className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-text-dark"><ChevronDown size={17} className={optionsOpen ? "rotate-180 transition-transform" : "transition-transform"}/> Options</button>
                {optionsOpen && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="alias" className="mb-1.5 block text-sm font-semibold">Custom alias</label>
                      <div className="flex h-12 overflow-hidden rounded-[10px] border border-ink/20 bg-chalk dark:border-white/15 dark:bg-surface">
                        <span className="flex items-center border-r border-ink/10 px-3 font-mono text-xs text-slate dark:border-white/10 dark:text-slate-dark">{SHORT_BASE}/</span>
                        <input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="my-link" className="min-w-0 flex-1 bg-transparent px-3 text-sm" />
                      </div>
                      <p className={"mt-1.5 text-xs " + (aliasState.status === "available" ? "text-go" : aliasState.status === "taken" ? "text-stop" : "text-slate dark:text-slate-dark")}>{aliasState.message}</p>
                    </div>
                    <div>
                      <label htmlFor="expiry" className="mb-1.5 block text-sm font-semibold">Expiry date <span className="font-normal text-slate">(account only)</span></label>
                      <input id="expiry" type="date" value={expiresAt} disabled={!user} onChange={(e) => setExpiresAt(e.target.value)} className="h-12 w-full rounded-[10px] border border-ink/20 bg-chalk px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-surface" />
                    </div>
                    <p className="self-end text-sm leading-6 text-slate dark:text-slate-dark">{user ? "Set an expiry date when you need the link to stop working." : "Sign in to set an expiry date and manage the link later."}</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-slate dark:text-slate-dark">Free. No card needed.</p>
            </form>
          ) : (
            <div className="rounded-[14px] border border-ink/12 bg-chalk p-6 shadow-[0_8px_24px_rgba(16,24,40,0.07)] dark:border-white/10 dark:bg-surface dark:shadow-[0_14px_34px_rgba(0,0,0,0.16)] sm:p-7">
              <p className="text-sm font-semibold text-slate dark:text-slate-dark">Your short link</p>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <a href={shortUrl} target="_blank" rel="noreferrer" className="break-all font-mono text-xl font-medium text-ink underline decoration-tape decoration-2 underline-offset-4 dark:text-text-dark sm:text-[22px]">{shortUrl}</a>
                <div className="flex flex-wrap gap-2">
                  <button onClick={copyLink} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border-[1.5px] border-ink bg-tape px-4 font-semibold text-ink hover:bg-tape-hover">{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? "Copied" : "Copy"}</button>
                  <button onClick={() => setQrOpen((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-ink/20 bg-chalk px-4 font-semibold dark:border-white/15 dark:bg-surface"><QrCode size={17}/> QR</button>
                  <a href={shortUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-ink/20 bg-chalk px-4 font-semibold dark:border-white/15 dark:bg-surface"><ExternalLink size={17}/> Open</a>
                </div>
              </div>
              <p className="mt-5 font-mono text-sm text-slate dark:text-slate-dark">{result.sourceLength} to {shortUrl.length} characters, {percent}% shorter.</p>
              {qrOpen && <div className="mt-5 rounded-[10px] border border-ink/12 p-4 dark:border-white/14"><img src={"https://quickchart.io/qr?text=" + encodeURIComponent(shortUrl) + "&size=160"} alt="QR code for your short link" width="160" height="160" className="h-40 w-40" /><a className="mt-3 inline-block text-sm font-semibold text-signal" href={"https://quickchart.io/qr?text=" + encodeURIComponent(shortUrl) + "&size=600&format=png"} target="_blank" rel="noreferrer">Open QR image</a></div>}
              <button onClick={reset} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark"><RefreshCw size={16}/> Shorten another</button>
            </div>
          )}
        </div>

        {result && !user && <p className="mt-4 max-w-[760px] text-sm text-slate dark:text-slate-dark">You can make 10 links every 15 minutes without an account. <a href="/signup" className="font-semibold text-ink underline decoration-tape underline-offset-2 dark:text-text-dark">Sign up</a> to keep, edit and track them.</p>}
      </section>

      <section className="border-y border-ink/12 bg-chalk dark:border-white/14 dark:bg-surface">
        <div className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-bold">How it works</h2>
              <ol className="mt-6 space-y-5 text-slate dark:text-slate-dark">
                <li><b className="text-ink dark:text-text-dark">01 / Paste.</b> Drop in the long URL.</li>
                <li><b className="text-ink dark:text-text-dark">02 / Shorten.</b> LinkShift cuts it down.</li>
                <li><b className="text-ink dark:text-text-dark">03 / Share.</b> Copy it and track clicks.</li>
              </ol>
            </div>
            <div>
              <h2 className="text-2xl font-bold">FAQ</h2>
              <div className="mt-6 divide-y divide-ink/10 border-y border-ink/10 dark:divide-white/10 dark:border-white/10">
                <details className="py-5"><summary className="cursor-pointer font-semibold text-ink dark:text-text-dark">Are links permanent?</summary><p className="mt-2 max-w-2xl text-sm leading-6 text-slate dark:text-slate-dark">Unused links are subject to the LinkShift retention policy. Active links remain available while they are being used.</p></details>
                <details className="py-5"><summary className="cursor-pointer font-semibold text-ink dark:text-text-dark">Is it free?</summary><p className="mt-2 max-w-2xl text-sm leading-6 text-slate dark:text-slate-dark">Yes. Link creation is available without a paid plan.</p></details>
                <details className="py-5"><summary className="cursor-pointer font-semibold text-ink dark:text-text-dark">What do you store about visitors?</summary><p className="mt-2 max-w-2xl text-sm leading-6 text-slate dark:text-slate-dark">Analytics are designed to count clicks without storing raw IP addresses.</p></details>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
