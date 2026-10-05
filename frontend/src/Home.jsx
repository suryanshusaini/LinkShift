import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, ChevronDown, Copy, ExternalLink, QrCode, RefreshCw } from "lucide-react";

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
    if (!alias.trim()) {
      setAliasState({ status: "idle", message: "" });
      return undefined;
    }

    const timer = setTimeout(async () => {
      const value = alias.trim();
      if (!/^[A-Za-z0-9_-]{3,30}$/.test(value)) {
        setAliasState({
          status: "taken",
          message: "Use 3–30 letters, numbers, hyphens or underscores.",
        });
        return;
      }

      setAliasState({ status: "checking", message: "Checking…" });

      try {
        const response = await fetch(
          API + "/api/alias/check?alias=" + encodeURIComponent(value),
        );
        const data = await response.json();
        setAliasState(
          data.available
            ? { status: "available", message: "Available" }
            : { status: "taken", message: data.error || "Taken, try another" },
        );
      } catch {
        setAliasState({ status: "idle", message: "" });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [alias]);

  const shortUrl = useMemo(
    () => (result ? result.shortUrl || SHORT_BASE + "/" + result.shortId : ""),
    [result],
  );

  const shortening = result
    ? Math.max(0, result.sourceLength - shortUrl.length)
    : 0;

  const percent = result?.sourceLength
    ? Math.max(0, Math.round((shortening / result.sourceLength) * 100))
    : 0;

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
        body: JSON.stringify({
          originalUrl: longUrl.trim(),
          customAlias: alias.trim() || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not shorten this link.");
      }

      const created = {
        ...data,
        sourceLength: longUrl.trim().length,
      };

      setResult(created);
      onLinkCreated?.(created);
      setLongUrl("");
      setAlias("");
      setExpiresAt("");
      setOptionsOpen(false);
      setCopied(false);
      setQrOpen(false);
    } catch (error) {
      toast.error(error.message || "Could not shorten this link.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => {
    setResult(null);
    setLongUrl("");
    setAlias("");
    setExpiresAt("");
    setOptionsOpen(false);
    setQrOpen(false);
  };

  return (
    <div>
      <section className="mx-auto max-w-[1180px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:pb-24">
        <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="pb-2">
            <div className="mb-8 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate dark:text-slate-dark">
              <span className="h-2.5 w-2.5 bg-tape" />
              LinkShift / URL shortener
            </div>

            <h1 className="max-w-4xl text-[clamp(3.5rem,8.5vw,7.8rem)] font-black uppercase leading-[0.82] tracking-[-0.055em] text-ink dark:text-text-dark">
              Long links.
              <br />
              Cut down
              <br />
              to size.
            </h1>

            <p className="mt-8 max-w-xl text-base leading-7 text-slate dark:text-slate-dark sm:text-lg">
              A practical URL shortener for links you actually need to share,
              save and track.
            </p>
          </div>

          <div className="relative overflow-hidden border-[1.5px] border-ink bg-ink p-5 text-chalk shadow-[12px_12px_0_rgba(32,26,22,0.16)] dark:border-text-dark dark:bg-surface-raised dark:shadow-[10px_10px_0_rgba(0,0,0,0.3)] sm:p-7">
            <div className="flex items-start justify-between border-b border-chalk/20 pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-chalk/65">
                  Measure before you cut
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight">
                  {length.toString().padStart(3, "0")}
                  <span className="ml-2 text-sm font-medium text-chalk/60">chars</span>
                </p>
              </div>
              <span className="border border-chalk/25 px-2 py-1 font-mono text-[10px] text-chalk/70">
                01 / 01
              </span>
            </div>

            <div className="mt-7">
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-chalk/55">
                <span>Long</span>
                <span>Short</span>
              </div>
              <div className="mt-2 h-8 border-y border-chalk/20">
                <div
                  className="relative h-full bg-tape transition-[width] duration-150 ease-out"
                  style={{ width: Math.max(rulerWidth, length ? 4 : 0) + "%" }}
                >
                  <span className="absolute right-0 top-1/2 h-5 w-px -translate-y-1/2 bg-ink" />
                </div>
              </div>
            </div>

            {!result ? (
              <form onSubmit={handleShorten} className="mt-7">
                <label htmlFor="long-url" className="sr-only">
                  Long URL
                </label>
                <input
                  id="long-url"
                  type="url"
                  required
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  placeholder="Paste your long URL"
                  className="h-14 w-full border border-chalk/25 bg-chalk px-4 text-[15px] text-ink placeholder:text-slate/70 focus:border-chalk dark:bg-[#FFF9F2]"
                />
                <button
                  type="submit"
                  disabled={submitting || !longUrl.trim()}
                  className="mt-2 h-14 w-full border-[1.5px] border-tape bg-tape px-6 font-bold text-ink hover:bg-tape-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Cutting…" : "Cut this link"}
                </button>

                <div className="mt-4 flex items-center justify-between border-t border-chalk/15 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk/55">
                  <span>{user ? "Account mode" : "Guest mode"}</span>
                  <span>{user ? "Trackable" : "10 / 15 min"}</span>
                </div>

                <div className="mt-4 border-t border-chalk/15 pt-4">
                  <button
                    type="button"
                    onClick={() => setOptionsOpen((value) => !value)}
                    className="flex w-full items-center justify-between text-sm font-semibold text-chalk"
                  >
                    <span>Custom alias & expiry</span>
                    <ChevronDown
                      size={17}
                      className={
                        optionsOpen
                          ? "rotate-180 transition-transform"
                          : "transition-transform"
                      }
                    />
                  </button>

                  {optionsOpen && (
                    <div className="mt-5 grid gap-4">
                      <div>
                        <label htmlFor="alias" className="mb-1.5 block text-sm font-semibold">
                          Custom alias
                        </label>
                        <div className="flex h-12 overflow-hidden border border-chalk/20 bg-chalk text-ink">
                          <span className="flex items-center border-r border-ink/10 px-3 font-mono text-xs text-slate">
                            {SHORT_BASE}/
                          </span>
                          <input
                            id="alias"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            placeholder="my-link"
                            className="min-w-0 flex-1 bg-transparent px-3 text-sm"
                          />
                        </div>
                        <p
                          className={
                            "mt-1.5 text-xs " +
                            (aliasState.status === "available"
                              ? "text-go"
                              : aliasState.status === "taken"
                                ? "text-stop"
                                : "text-chalk/60")
                          }
                        >
                          {aliasState.message}
                        </p>
                      </div>

                      <div>
                        <label htmlFor="expiry" className="mb-1.5 block text-sm font-semibold">
                          Expiry date{" "}
                          <span className="font-normal text-chalk/55">(account only)</span>
                        </label>
                        <input
                          id="expiry"
                          type="date"
                          value={expiresAt}
                          disabled={!user}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="h-12 w-full border border-chalk/20 bg-chalk px-3 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      <p className="text-sm leading-6 text-chalk/65">
                        {user
                          ? "Set an expiry date when you need the link to stop working."
                          : "Sign in to set an expiry date and manage the link later."}
                      </p>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <div className="mt-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-chalk/60">
                  Cut complete
                </p>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block break-all font-mono text-xl font-medium text-chalk underline decoration-tape decoration-2 underline-offset-4"
                >
                  {shortUrl}
                </a>
                <p className="mt-4 font-mono text-sm text-chalk/65">
                  {result.sourceLength} → {shortUrl.length} characters · {percent}% shorter
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button
                    onClick={copyLink}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border-[1.5px] border-tape bg-tape px-4 font-semibold text-ink hover:bg-tape-hover"
                  >
                    {copied ? <Check size={17} /> : <Copy size={17} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => setQrOpen((value) => !value)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-chalk/25 bg-transparent px-4 font-semibold text-chalk hover:bg-chalk/10"
                  >
                    <QrCode size={17} /> QR
                  </button>
                </div>

                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-chalk/25 px-4 font-semibold text-chalk hover:bg-chalk/10"
                >
                  <ExternalLink size={17} /> Open short link
                </a>

                {qrOpen && (
                  <div className="mt-5 border border-chalk/20 p-4">
                    <img
                      src={
                        "https://quickchart.io/qr?text=" +
                        encodeURIComponent(shortUrl) +
                        "&size=160"
                      }
                      alt="QR code for your short link"
                      width="160"
                      height="160"
                      className="h-40 w-40 bg-white"
                    />
                    <a
                      className="mt-3 inline-block text-sm font-semibold text-tape"
                      href={
                        "https://quickchart.io/qr?text=" +
                        encodeURIComponent(shortUrl) +
                        "&size=600&format=png"
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open QR image
                    </a>
                  </div>
                )}

                <button
                  onClick={reset}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-chalk/65 hover:text-chalk"
                >
                  <RefreshCw size={16} /> Cut another link
                </button>
              </div>
            )}
          </div>
        </div>

        {result && !user && (
          <p className="mt-5 max-w-[760px] text-sm text-slate dark:text-slate-dark">
            You can make 10 links every 15 minutes without an account.{" "}
            <a
              href="/signup"
              className="font-semibold text-ink underline decoration-tape underline-offset-2 dark:text-text-dark"
            >
              Sign up
            </a>{" "}
            to keep, edit and track them.
          </p>
        )}
      </section>

      <section className="border-y border-ink/15 bg-chalk dark:border-white/10 dark:bg-surface">
        <div className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate dark:text-slate-dark">
                The process
              </p>
              <h2 className="mt-4 max-w-md text-[clamp(2.5rem,5vw,4.5rem)] font-black uppercase leading-[0.88] tracking-[-0.045em]">
                Cut.
                <br />
                Share.
                <br />
                Track.
              </h2>
            </div>

            <ol className="border-t border-ink/15 dark:border-white/10">
              <li className="grid grid-cols-[70px_1fr] gap-5 border-b border-ink/15 py-7 dark:border-white/10">
                <span className="font-mono text-sm text-tape">01</span>
                <div>
                  <h3 className="text-xl font-bold">Paste the long URL.</h3>
                  <p className="mt-2 max-w-xl leading-7 text-slate dark:text-slate-dark">
                    Drop in the link exactly as it is. The ruler measures it in real time.
                  </p>
                </div>
              </li>
              <li className="grid grid-cols-[70px_1fr] gap-5 border-b border-ink/15 py-7 dark:border-white/10">
                <span className="font-mono text-sm text-tape">02</span>
                <div>
                  <h3 className="text-xl font-bold">Cut it down.</h3>
                  <p className="mt-2 max-w-xl leading-7 text-slate dark:text-slate-dark">
                    Get a compact link instantly, with a custom alias when you need one.
                  </p>
                </div>
              </li>
              <li className="grid grid-cols-[70px_1fr] gap-5 border-b border-ink/15 py-7 dark:border-white/10">
                <span className="font-mono text-sm text-tape">03</span>
                <div>
                  <h3 className="text-xl font-bold">Keep an eye on it.</h3>
                  <p className="mt-2 max-w-xl leading-7 text-slate dark:text-slate-dark">
                    Create an account to manage links, control expiry and track clicks.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="border-b border-ink/15 bg-plaster dark:border-white/10 dark:bg-night">
        <div className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate dark:text-slate-dark">
                Questions
              </p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black uppercase leading-none tracking-[-0.04em]">
                Before you cut
              </h2>
            </div>
            <span className="hidden border border-ink/20 px-3 py-2 font-mono text-[10px] text-slate sm:block dark:border-white/15 dark:text-slate-dark">
              03 answers
            </span>
          </div>

          <div className="border-y border-ink/15 dark:border-white/10">
            <details className="border-b border-ink/15 py-6 dark:border-white/10">
              <summary className="cursor-pointer text-lg font-bold">
                Are links permanent?
              </summary>
              <p className="mt-3 max-w-2xl leading-7 text-slate dark:text-slate-dark">
                Unused links are subject to the LinkShift retention policy. Active links remain available while they are being used.
              </p>
            </details>
            <details className="border-b border-ink/15 py-6 dark:border-white/10">
              <summary className="cursor-pointer text-lg font-bold">Is it free?</summary>
              <p className="mt-3 max-w-2xl leading-7 text-slate dark:text-slate-dark">
                Yes. Link creation is available without a paid plan.
              </p>
            </details>
            <details className="py-6">
              <summary className="cursor-pointer text-lg font-bold">
                What do you store about visitors?
              </summary>
              <p className="mt-3 max-w-2xl leading-7 text-slate dark:text-slate-dark">
                Analytics are designed to count clicks without storing raw IP addresses.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
