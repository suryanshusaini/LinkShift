import { Link } from "react-router-dom";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

const CONTENT = {
  terms: {
    eyebrow: "LINKSHIFT / TERMS",
    title: "Terms of service",
    intro: "A simple summary of the rules for using LinkShift.",
    sections: [
      ["Use of the service", "Use LinkShift only for lawful purposes. You are responsible for the links you create and the destinations they point to."],
      ["Your links", "Do not use LinkShift to distribute malware, phishing pages, unlawful material, or content that violates the rights of others."],
      ["Availability", "LinkShift is provided on an as-available basis. Service behavior, limits, and features may change as the product evolves."],
      ["Accounts", "Keep your account credentials secure. You are responsible for activity performed through your account."],
    ],
  },
  privacy: {
    eyebrow: "LINKSHIFT / PRIVACY",
    title: "Privacy",
    intro: "LinkShift keeps the data needed to provide shortening, account, and analytics features.",
    sections: [
      ["Account information", "If you create an account, LinkShift stores information such as your name, email address, and authentication data needed to operate the account."],
      ["Link and analytics data", "Created links and aggregate click information are used to provide redirects, link management, and analytics. LinkShift does not intentionally store visitor IP addresses in click events."],
      ["Cookies and local storage", "The web app uses browser storage for session and interface preferences such as your selected theme."],
      ["Contact", "If you have a privacy question or request, use the Report a problem link in the footer to open your email client."],
    ],
  },
};

export default function Legal({ type }) {
  const page = CONTENT[type] || CONTENT.privacy;
  const Icon = type === "privacy" ? ShieldCheck : FileText;

  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-6 sm:py-20">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark"
      >
        <ArrowLeft size={16} /> Back to LinkShift
      </Link>

      <div className="mt-10 rounded-2xl border border-ink/10 bg-chalk p-7 shadow-[0_10px_28px_rgba(16,24,40,0.06)] dark:border-white/10 dark:bg-surface dark:shadow-[0_16px_36px_rgba(0,0,0,0.2)] sm:p-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tape text-ink shadow-sm">
          <Icon size={21} />
        </div>

        <p className="mt-7 font-mono text-xs tracking-[0.12em] text-slate dark:text-slate-dark">
          {page.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink dark:text-text-dark">
          {page.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate dark:text-slate-dark">
          {page.intro}
        </p>

        <div className="mt-10 space-y-8">
          {page.sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-lg font-bold text-ink dark:text-text-dark">{heading}</h2>
              <p className="mt-2 leading-7 text-slate dark:text-slate-dark">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
