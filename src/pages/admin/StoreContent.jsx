import { useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import api from '../../services/api';
import useUnsavedChanges from '../../hooks/useUnsavedChanges';
import { useWebsiteCustomization } from '../../context/WebsiteCustomizationContext';
const labels = { websiteName: 'Website name', tagline: 'Tagline', announcement: 'Announcement', footerDescription: 'Footer description', contactEmail: 'Contact email', contactPhone: 'Contact phone', contactAddress: 'Contact address' };
export default function StoreContent() {
  const [data, setData] = useState(null);
  const [savedContent, setSavedContent] = useState('');
  const contentKey = (value) => JSON.stringify([value?.content, value?.sections]);
  const dirty = !!data?.available && contentKey(data) !== savedContent;
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useUnsavedChanges(dirty, busy);
  const lock = useRef(false);
  const { refresh } = useWebsiteCustomization();
  const load = () => api.get('/admin/store-content').then((value) => { setData(value); setSavedContent(contentKey(value)); }).catch((error) => setMessage(error.message));
  useEffect(() => { let alive = true; api.get('/admin/store-content').then((value) => { if (alive) { setData(value); setSavedContent(contentKey(value)); } }).catch((error) => { if (alive) setMessage(error.message); }); return () => { alive = false; }; }, []);
  const save = async () => {
    if (lock.current || !window.confirm('Publish this wording and contact information to your storefront?')) return;
    lock.current = true; setBusy(true); setMessage('');
    try { const result = await api.put('/admin/store-content', { content: data.content, sections: data.sections, revision: data.revision }); setData((current) => ({ ...current, revision: result.revision })); setSavedContent(contentKey(data)); await refresh(); setMessage('Content published. Layout and store structure are unchanged.'); }
    catch (error) { setMessage(error.message); } finally { lock.current = false; setBusy(false); }
  };
  return <section className="space-y-5"><PageHeader title="Store content" note="Update wording and contact information without changing your layouts or shopping flow." />
    {message && <p role="status" className="admin-card p-4 text-sm text-wine">{message}</p>}
    {!data ? <div className="admin-card p-5">{message ? <button type="button" onClick={load} className="admin-btn-ghost">Retry</button> : 'Loading content…'}</div> : !data.available ? <p className="admin-card p-5">Your store configuration is not ready yet. Contact your website provider.</p> : <>
      <fieldset disabled={busy} className="admin-card grid gap-4 p-5 sm:grid-cols-2">{Object.entries(labels).map(([key, label]) => <Field key={key} label={label} value={data.content[key]} onChange={(value) => setData((current) => ({ ...current, content: { ...current.content, [key]: value } }))} />)}</fieldset>
      <div className="admin-card space-y-3 p-5"><h2 className="font-bold">Homepage wording</h2>{data.sections.map((section) => <details key={section.id} className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-bold">{section.label}</summary><fieldset disabled={busy} className="mt-3 grid gap-3 sm:grid-cols-2">{['heading', 'description', 'buttonText'].map((key) => <Field key={key} label={key} value={section[key]} onChange={(value) => setData((current) => ({ ...current, sections: current.sections.map((item) => item.id === section.id ? { ...item, [key]: value } : item) }))} />)}</fieldset></details>)}</div>
      <div className="flex flex-wrap gap-3"><button type="button" disabled={busy || !dirty} className="admin-btn" onClick={save}>{busy ? 'Saving…' : 'Publish content'}</button><button type="button" disabled={busy} className="admin-btn-ghost" onClick={() => { if (window.confirm('Discard local edits and reload?')) load(); }}>Reload saved content</button></div>
    </>}
  </section>;
}
function Field({ label, value, onChange }) { return <label className="grid min-w-0 gap-2 text-xs font-bold capitalize">{label}<textarea value={value || ''} maxLength={1000} onChange={(event) => onChange(event.target.value)} className="min-h-20 min-w-0 rounded-lg border p-3 text-sm font-normal normal-case" /></label>; }
