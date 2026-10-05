import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 h-2 w-48 ruler-ticks border-y border-ink/20" aria-hidden="true" />
      <p className="font-mono text-sm text-slate">404</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink dark:text-text-dark">This page doesn’t exist.</h1>
      <p className="mt-4 max-w-md text-base leading-7 text-slate dark:text-slate-dark">Check the address or head back to LinkShift and shorten a new link.</p>
      <Link to="/" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-[10px] border-[1.5px] border-ink bg-tape px-5 font-semibold text-ink hover:bg-tape-hover">Home <ArrowLeft size={18} /></Link>
    </section>
  );
}
