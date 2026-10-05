import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Edit3, ExternalLink, Filter, MoreHorizontal, QrCode, RotateCcw, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SHORT_BASE = (import.meta.env.VITE_SHORT_BASE_URL || API).replace(/\/$/, "");
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "—";
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={title}>
    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[16px] border border-ink/15 bg-chalk p-5 dark:border-white/15 dark:bg-surface sm:rounded-[16px] sm:p-7">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-ink dark:text-text-dark">{title}</h2><button onClick={onClose} className="rounded-md p-2 text-slate hover:text-ink dark:text-slate-dark dark:hover:text-text-dark" aria-label="Close"><X size={20}/></button></div>
      {children}
    </div>
  </div>;
}

export default function Dashboard({ savedLinks, setSavedLinks, onAccountDeleted }) {
  const [items, setItems] = useState(savedLinks || []);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [qr, setQr] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fetchLinks = useCallback(async (requestedPage = page) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(requestedPage), limit: "10", q: query, status, sort });
      const response = await fetch(API + "/api/urls?" + params.toString(), { headers: { Authorization: "Bearer " + token } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load links.");
      setItems(data.items || []); setTotal(data.total || 0); setPages(Math.max(data.pages || 1, 1)); setPage(data.page || requestedPage);
      setSavedLinks(data.items || []);
    } catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  }, [page, query, status, sort, setSavedLinks]);

  useEffect(() => { const timer = setTimeout(() => fetchLinks(1), 250); return () => clearTimeout(timer); }, [query, status, sort, fetchLinks]);
  useEffect(() => { fetchLinks(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = useMemo(() => items.filter((link) => link.isActive && (!link.expiresAt || new Date(link.expiresAt) > new Date())).length, [items]);
  const totalClicks = useMemo(() => items.reduce((sum, link) => sum + (link.clicks || 0), 0), [items]);

  const copy = async (link) => { await navigator.clipboard.writeText(SHORT_BASE + "/" + link.shortId); toast.success("Short link copied."); };

  const toggle = async (link) => {
    try {
      const response = await fetch(API + "/api/urls/" + link._id, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") }, body: JSON.stringify({ isActive: !link.isActive }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not update link.");
      setItems((current) => current.map((item) => item._id === link._id ? data : item));
      toast.success(data.isActive ? "Link enabled." : "Link disabled.");
    } catch (error) { toast.error(error.message); }
  };

  const remove = async () => {
    const link = deleteTarget; if (!link) return;
    setDeleteTarget(null);
    try {
      const response = await fetch(API + "/api/urls/" + link._id, { method: "DELETE", headers: { Authorization: "Bearer " + localStorage.getItem("token") } });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not delete link.");
      setItems((current) => current.filter((item) => item._id !== link._id)); setTotal((value) => Math.max(0, value - 1));
      toast((t) => <span className="flex items-center gap-3"><span>Link moved to trash.</span><button onClick={async () => { toast.dismiss(t.id); try { const r = await fetch(API + "/api/urls/" + link._id + "/restore", { method: "POST", headers: { Authorization: "Bearer " + localStorage.getItem("token") } }); const restored = await r.json(); if (!r.ok) throw new Error(restored.error); setItems((current) => [restored, ...current]); setTotal((value) => value + 1); toast.success("Link restored."); } catch (error) { toast.error(error.message); } }} className="font-semibold text-signal">Undo</button></span>, { duration: 7000 });
    } catch (error) { toast.error(error.message); }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { originalUrl: form.get("originalUrl"), customAlias: form.get("customAlias"), expiresAt: form.get("expiresAt") || null };
    try {
      const response = await fetch(API + "/api/urls/" + editing._id, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") }, body: JSON.stringify(body) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not save changes.");
      setItems((current) => current.map((item) => item._id === editing._id ? data : item)); setEditing(null); toast.success("Link updated.");
    } catch (error) { toast.error(error.message); }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account and every LinkShift link permanently? This cannot be undone.")) return;
    setDeletingAccount(true);
    try {
      const response = await fetch(API + "/api/auth/account", { method: "DELETE", headers: { Authorization: "Bearer " + localStorage.getItem("token") } });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Could not delete account.");
      onAccountDeleted(); toast.success("Account deleted.");
    } catch (error) { toast.error(error.message); }
    finally { setDeletingAccount(false); }
  };

  return <section className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 lg:py-14">
    <div className="flex flex-col gap-7 border-b border-ink/12 pb-7 dark:border-white/14 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="font-mono text-xs text-slate dark:text-slate-dark">DASHBOARD / MY LINKS</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-ink dark:text-text-dark">Your links.</h1><p className="mt-2 text-slate dark:text-slate-dark">Manage destinations, status, expiry and clicks.</p></div>
      <Link to="/" className="inline-flex h-11 items-center justify-center rounded-[10px] border-[1.5px] border-ink bg-tape px-5 font-semibold text-ink hover:bg-tape-hover">Create link</Link>
    </div>

    <div className="mt-7 grid gap-px overflow-hidden rounded-[12px] border border-ink/12 bg-ink/12 dark:border-white/14 dark:bg-white/10 sm:grid-cols-3">
      {[{label:"Total links",value:total},{label:"Active on this page",value:activeCount},{label:"Clicks on this page",value:totalClicks}].map((stat)=><div key={stat.label} className="bg-chalk px-5 py-5 dark:bg-surface"><p className="text-sm text-slate dark:text-slate-dark">{stat.label}</p><p className="mt-1 font-mono text-2xl font-semibold text-ink dark:text-text-dark">{stat.value}</p></div>)}
    </div>

    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1"><Search size={18} className="absolute left-3 top-3.5 text-slate"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search URL or alias" className="h-12 w-full rounded-[10px] border border-ink/20 bg-chalk pl-10 pr-3 text-sm dark:border-white/15 dark:bg-surface dark:text-text-dark" /></label>
      <label className="flex h-12 items-center gap-2 rounded-[10px] border border-ink/20 bg-chalk px-3 dark:border-white/15 dark:bg-surface"><Filter size={17}/><select value={status} onChange={(e)=>{setStatus(e.target.value);setPage(1)}} className="bg-transparent text-sm"><option value="all">All status</option><option value="active">Active</option><option value="disabled">Disabled</option><option value="expiring">Expiring soon</option><option value="expired">Expired</option></select></label>
      <select value={sort} onChange={(e)=>{setSort(e.target.value);setPage(1)}} className="h-12 rounded-[10px] border border-ink/20 bg-chalk px-3 text-sm dark:border-white/15 dark:bg-surface"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="clicks">Most clicks</option><option value="updated">Recently updated</option></select>
    </div>

    <div className="mt-5 overflow-hidden rounded-[12px] border border-ink/12 bg-chalk dark:border-white/14 dark:bg-surface">
      {loading ? <div className="px-6 py-16 text-center text-slate dark:text-slate-dark">Loading links…</div> : items.length === 0 ? <div className="px-6 py-16 text-center"><p className="font-semibold text-ink dark:text-text-dark">No links match these filters.</p><Link to="/" className="mt-2 inline-block text-sm font-semibold text-signal">Create a new link →</Link></div> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left"><thead className="border-b border-ink/10 bg-plaster/70 dark:border-white/10 dark:bg-night/30"><tr className="text-xs uppercase tracking-wide text-slate dark:text-slate-dark"><th className="px-5 py-4">Link</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Clicks</th><th className="px-5 py-4">Expiry</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-ink/10 dark:divide-white/10">{items.map((link)=><tr key={link._id} className="align-top hover:bg-plaster/50 dark:hover:bg-night/30">
          <td className="max-w-[360px] px-5 py-5"><a href={SHORT_BASE+"/"+link.shortId} target="_blank" rel="noreferrer" className="font-mono font-semibold text-signal hover:underline">{SHORT_BASE}/{link.shortId}</a><p className="mt-1 truncate text-sm text-slate dark:text-slate-dark" title={link.originalUrl}>{link.originalUrl}</p></td>
          <td className="px-5 py-5"><button onClick={()=>toggle(link)} className="inline-flex items-center gap-2 text-sm font-semibold"><span className={"h-2 w-2 rounded-full "+(link.isActive ? "bg-go" : "bg-slate")}/>{link.isActive ? "Active" : "Disabled"}</button></td>
          <td className="px-5 py-5 text-sm text-slate dark:text-slate-dark">{formatDate(link.createdAt)}</td>
          <td className="px-5 py-5 font-mono text-sm font-semibold">{link.clicks || 0}</td>
          <td className="px-5 py-5 text-sm text-slate dark:text-slate-dark">{link.expiresAt ? formatDate(link.expiresAt) : "Never"}</td>
          <td className="px-5 py-5"><div className="flex justify-end gap-1"><button onClick={()=>copy(link)} className="rounded-md p-2 hover:bg-plaster dark:hover:bg-night" title="Copy"><Copy size={17}/></button><button onClick={()=>setQr(link)} className="rounded-md p-2 hover:bg-plaster dark:hover:bg-night" title="QR code"><QrCode size={17}/></button><button onClick={()=>setEditing(link)} className="rounded-md p-2 hover:bg-plaster dark:hover:bg-night" title="Edit"><Edit3 size={17}/></button><button onClick={()=>setDeleteTarget(link)} className="rounded-md p-2 text-stop hover:bg-red-50 dark:hover:bg-red-950/20" title="Delete"><Trash2 size={17}/></button></div></td>
        </tr>)}</tbody></table></div>
        <div className="divide-y divide-ink/10 md:hidden dark:divide-white/10">{items.map((link)=><article key={link._id} className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><a href={SHORT_BASE+"/"+link.shortId} target="_blank" rel="noreferrer" className="break-all font-mono font-semibold text-signal">{SHORT_BASE}/{link.shortId}</a><p className="mt-1 truncate text-sm text-slate dark:text-slate-dark">{link.originalUrl}</p></div><button onClick={()=>setEditing(link)} aria-label="Edit link" className="shrink-0 rounded-md p-2"><MoreHorizontal size={19}/></button></div><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate dark:text-slate-dark"><button onClick={()=>toggle(link)} className="font-semibold text-ink dark:text-text-dark"><span className={"mr-1.5 inline-block h-2 w-2 rounded-full "+(link.isActive ? "bg-go":"bg-slate")}/>{link.isActive?"Active":"Disabled"}</button><span>{link.clicks||0} clicks</span><span>Created {formatDate(link.createdAt)}</span></div><div className="mt-4 flex gap-2"><button onClick={()=>copy(link)} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-ink/15 px-3 text-sm font-semibold dark:border-white/15"><Copy size={15}/>Copy</button><button onClick={()=>setQr(link)} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-ink/15 px-3 text-sm font-semibold dark:border-white/15"><QrCode size={15}/>QR</button><button onClick={()=>setDeleteTarget(link)} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-stop/25 px-3 text-sm font-semibold text-stop"><Trash2 size={15}/>Delete</button></div></article>)}</div>
      </>}
    </div>

    <div className="mt-5 flex items-center justify-between"><p className="font-mono text-xs text-slate dark:text-slate-dark">PAGE {page} / {pages}</p><div className="flex gap-2"><button disabled={page<=1} onClick={()=>setPage((value)=>value-1)} className="h-10 rounded-[8px] border border-ink/15 px-4 text-sm font-semibold disabled:opacity-40 dark:border-white/15">Previous</button><button disabled={page>=pages} onClick={()=>setPage((value)=>value+1)} className="h-10 rounded-[8px] border border-ink/15 px-4 text-sm font-semibold disabled:opacity-40 dark:border-white/15">Next</button></div></div>

    <div className="mt-16 border-t border-stop/20 pt-7"><p className="font-mono text-xs text-stop">DANGER ZONE</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-ink dark:text-text-dark">Delete your account</h2><p className="mt-1 text-sm text-slate dark:text-slate-dark">Permanently removes your account and all links.</p></div><button disabled={deletingAccount} onClick={deleteAccount} className="h-11 rounded-[10px] border border-stop/40 px-4 font-semibold text-stop disabled:opacity-50">{deletingAccount?"Deleting…":"Delete account"}</button></div></div>

    {editing && <Modal title="Edit link" onClose={()=>setEditing(null)}><form onSubmit={saveEdit} className="mt-6 space-y-4"><div><label className="mb-1.5 block text-sm font-semibold">Destination URL</label><input name="originalUrl" type="url" required defaultValue={editing.originalUrl} className="h-12 w-full rounded-[10px] border border-ink/20 bg-chalk px-3 text-sm dark:border-white/15 dark:bg-surface"/></div><div><label className="mb-1.5 block text-sm font-semibold">Custom alias</label><div className="flex h-12 overflow-hidden rounded-[10px] border border-ink/20 dark:border-white/15"><span className="flex items-center border-r border-ink/10 px-3 font-mono text-xs text-slate dark:border-white/10 dark:text-slate-dark">{SHORT_BASE}/</span><input name="customAlias" required defaultValue={editing.shortId} className="min-w-0 flex-1 bg-transparent px-3 text-sm"/></div></div><div><label className="mb-1.5 block text-sm font-semibold">Expiry</label><input name="expiresAt" type="date" defaultValue={dateInput(editing.expiresAt)} className="h-12 w-full rounded-[10px] border border-ink/20 bg-chalk px-3 text-sm dark:border-white/15 dark:bg-surface"/></div><div className="flex justify-end gap-2 pt-3"><button type="button" onClick={()=>setEditing(null)} className="h-11 rounded-[10px] border border-ink/15 px-4 font-semibold dark:border-white/15">Cancel</button><button className="h-11 rounded-[10px] border-[1.5px] border-ink bg-tape px-5 font-semibold text-ink">Save changes</button></div></form></Modal>}
    {qr && <Modal title="QR code" onClose={()=>setQr(null)}><div className="mt-6 flex flex-col items-center"><img src={"https://quickchart.io/qr?text="+encodeURIComponent(SHORT_BASE+"/"+qr.shortId)+"&size=320"} width="320" height="320" alt="QR code" className="h-64 w-64 rounded-md border border-ink/10"/><p className="mt-4 break-all text-center font-mono text-sm text-slate dark:text-slate-dark">{SHORT_BASE}/{qr.shortId}</p><a target="_blank" rel="noreferrer" href={"https://quickchart.io/qr?text="+encodeURIComponent(SHORT_BASE+"/"+qr.shortId)+"&size=800&format=png"} className="mt-4 inline-flex h-11 items-center gap-2 rounded-[10px] border-[1.5px] border-ink bg-tape px-5 font-semibold text-ink">Open QR image <ExternalLink size={16}/></a></div></Modal>}
    {deleteTarget && <Modal title="Delete this link?" onClose={()=>setDeleteTarget(null)}><p className="mt-4 text-sm leading-6 text-slate dark:text-slate-dark">The link will stop redirecting immediately and move to trash. You can undo the deletion for a short time.</p><div className="mt-6 flex justify-end gap-2"><button onClick={()=>setDeleteTarget(null)} className="h-11 rounded-[10px] border border-ink/15 px-4 font-semibold dark:border-white/15">Cancel</button><button onClick={remove} className="h-11 rounded-[10px] border-[1.5px] border-stop bg-white px-5 font-semibold text-stop">Move to trash</button></div></Modal>}
  </section>;
}
