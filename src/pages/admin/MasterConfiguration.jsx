import { useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import api from '../../services/api';
import useUnsavedChanges from '../../hooks/useUnsavedChanges';
const copy = (value) => JSON.parse(JSON.stringify(value));

export default function MasterConfiguration() {
  const [workspace, setWorkspace] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [presetName, setPresetName] = useState('');
  const [client, setClient] = useState({ name: '', phone: '' });
  const actionLock = useRef(false);
  const file = useRef(null);
  const configuration = workspace?.configuration;
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(configuration?.structure);
  const load = async () => { const result = await api.get('/master'); setWorkspace(result); setDraft(copy(result.configuration.structure)); };
  useEffect(() => {
    let alive = true;
    api.get('/master').then((result) => { if (alive) { setWorkspace(result); setDraft(copy(result.configuration.structure)); } }).catch((error) => { if (alive) setMessage(error.message); });
    return () => { alive = false; };
  }, []);
  useUnsavedChanges(dirty, busy);
  const run = async (action) => {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message || 'Unable to save. Your local changes are retained.'); }
    finally { actionLock.current = false; setBusy(false); }
  };
  const accept = (next) => { setWorkspace((current) => ({ ...current, configuration: next })); setDraft(copy(next.structure)); };
  const save = () => run(async () => {
    if (!window.confirm('Save this store structure? Products and orders will not be deleted. Review the storefront before handover.')) return;
    accept(await api.put('/master/configuration', { revision: configuration.revision, structure: draft }));
    setMessage('Structure saved. Review the store, then lock for handover.');
  });
  const toggleLock = () => run(async () => {
    if (dirty) throw new Error('Save or discard edits before changing the lock.');
    if (!window.confirm(configuration.locked ? 'Unlock configuration for Master Owner changes? Clients still cannot edit its structure.' : 'Lock this configuration for client handover?')) return;
    accept(await api.put('/master/configuration', { revision: configuration.revision, locked: !configuration.locked }));
    setMessage(configuration.locked ? 'Unlocked for Master Owner only.' : 'Configuration locked for handover.');
  });
  const applyPreset = (structure) => {
    if (configuration.locked || busy) return;
    setDraft(copy({ ...structure, clientPermissions: structure.clientPermissions || draft.clientPermissions }));
    setMessage('Preset loaded into the editor. Save explicitly to apply; catalog data is untouched.');
  };
  const exportTemplate = () => run(async () => {
    if (dirty) throw new Error('Save your draft first; exports use the saved configuration.');
    const template = await api.get('/master/export');
    const url = URL.createObjectURL(new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'samira-store-template.json'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const importTemplate = async (event) => {
    const selected = event.target.files?.[0]; event.target.value = '';
    if (!selected) return;
    await run(async () => {
      if (selected.size > 64000) throw new Error('Choose a store template under 64 KB.');
      const template = JSON.parse(await selected.text());
      if (!window.confirm('Import structural settings into the unlocked store? Products, orders and credentials are not imported.')) return;
      accept(await api.post('/master/import', { revision: configuration.revision, template }));
      setMessage('Template imported. Review and lock before handover.');
    });
  };
  const editAttribute = (index, key, value) => setDraft((current) => ({ ...current, attributes: current.attributes.map((item, position) => position === index ? { ...item, [key]: value } : item) }));
  if (!workspace) return <section className="admin-card space-y-4 p-6" role="status"><h1 className="text-xl font-bold">Master configuration</h1><p>{message || 'Loading owner workspace…'}</p>{message && <button type="button" onClick={() => run(load)} className="admin-btn">Retry</button>}</section>;
  return <section className="min-w-0 space-y-5">
    <PageHeader title="Master configuration" note="Deployment-owned store structure. Client admins cannot access this workspace or its APIs." />
    <div className="admin-card flex flex-wrap items-center justify-between gap-4 p-5">
      <div><h2 className="text-lg font-bold">{configuration.locked ? 'Configuration locked' : 'Owner editing enabled'}</h2><p className="mt-1 text-xs text-slate-500">Revision {configuration.revision} · {configuration.structure.industry} · {dirty ? 'Unsaved edits' : 'Saved'}</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || dirty} onClick={toggleLock} className="admin-btn-ghost">{configuration.locked ? 'Unlock configuration' : 'Lock for handover'}</button><button type="button" disabled={busy || configuration.locked || !dirty} onClick={save} className="admin-btn">Save structure</button></div>
    </div>
    {message && <p role="status" className="rounded-xl border bg-white p-4 text-sm text-wine">{message}</p>}
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">One client deployment, one separate database. This configures the current installation; it does not provision hosting or isolate multiple client admins inside one database. No existing catalog is converted or deleted automatically.</div>
    <fieldset disabled={busy || configuration.locked} className="admin-card min-w-0 space-y-5 p-5 disabled:opacity-60">
      <legend className="px-2 text-lg font-bold">Industry and product structure</legend>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{workspace.builtins.map((preset) => <button key={preset.id} type="button" className={'rounded-xl border p-4 text-left ' + (draft.industry === preset.industry ? 'border-wine bg-rose-50' : 'bg-white')} onClick={() => applyPreset(preset)}><strong className="block">{preset.name}</strong><span className="mt-1 block text-xs text-slate-500">Load attribute preset</span></button>)}</div>
      <p className="text-xs leading-5 text-slate-500">Clients enter values; only you change definitions. Used definitions cannot be removed until affected products are reviewed. Fashion retains its existing sizing flow.</p>
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Product attributes ({draft.attributes.length}/30)</h2><button type="button" disabled={draft.attributes.length >= 30} onClick={() => setDraft((current) => ({ ...current, attributes: [...current.attributes, { key: '', label: '', unit: '', required: false }] }))} className="admin-btn-ghost">Add attribute</button></div>
      <div className="space-y-3">{draft.attributes.map((attribute, index) => <div key={index} className="grid items-end gap-3 rounded-xl border p-3 sm:grid-cols-2 xl:grid-cols-5">
        <Field label="Field key" value={attribute.key} onChange={(value) => editAttribute(index, 'key', value)} max={40} />
        <Field label="Customer-facing label" value={attribute.label} onChange={(value) => editAttribute(index, 'label', value)} max={80} />
        <Field label="Unit (optional)" value={attribute.unit} onChange={(value) => editAttribute(index, 'unit', value)} max={20} />
        <label className="flex h-10 items-center gap-2 text-xs font-bold"><input type="checkbox" checked={attribute.required} onChange={(event) => editAttribute(index, 'required', event.target.checked)} />Required</label>
        <button type="button" aria-label={'Remove ' + (attribute.label || 'attribute')} onClick={() => setDraft((current) => ({ ...current, attributes: current.attributes.filter((_, position) => position !== index) }))} className="admin-btn-ghost">Remove</button>
      </div>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">{[['content', 'Allow approved content editing'], ['payments', 'Allow payment settings editing']].map(([key, label]) => <label key={key} className="flex gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" checked={draft.clientPermissions[key]} onChange={(event) => setDraft((current) => ({ ...current, clientPermissions: { ...current.clientPermissions, [key]: event.target.checked } }))} />{label}</label>)}</div>
      <p className="text-xs text-slate-500">Feature profile: {draft.features.sizing ? 'Garment sizes and charts' : 'No garment size selection'} · Product specifications. Checkout logic is unchanged.</p>
    </fieldset>
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <div className="admin-card space-y-4 p-5"><h2 className="text-lg font-bold">Owner templates</h2><p className="text-xs leading-5 text-slate-500">Export structure for another isolated installation. Visual themes remain in Website Designer. No customer data or credentials are included.</p>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={exportTemplate} className="admin-btn-ghost">Export structure</button><button type="button" disabled={busy || configuration.locked} onClick={() => file.current?.click()} className="admin-btn-ghost">Import structure</button><input ref={file} aria-label="Import store template" type="file" accept=".json,application/json" hidden onChange={importTemplate} /></div>
        <Field label="New preset name" value={presetName} onChange={setPresetName} max={80} />
        <button type="button" disabled={busy || !presetName.trim()} className="admin-btn" onClick={() => run(async () => { const preset = await api.post('/master/clone', { name: presetName, structure: draft }); setWorkspace((current) => ({ ...current, presets: [preset, ...current.presets] })); setPresetName(''); setMessage('Private preset saved. Store configuration is unchanged.'); })}>Save editor as private preset</button>
        <div className="max-h-72 space-y-2 overflow-y-auto">{workspace.presets.map((preset) => <div key={preset._id} className="flex items-center justify-between gap-2 rounded-lg border p-3"><button type="button" disabled={busy || configuration.locked} onClick={() => applyPreset(preset.structure)} className="min-w-0 truncate text-sm font-bold">{preset.name}</button><button type="button" disabled={busy} aria-label={'Delete preset ' + preset.name} onClick={() => run(async () => { if (!window.confirm('Permanently delete this private preset? The active store is unchanged.')) return; await api.delete('/master/presets/' + preset._id); setWorkspace((current) => ({ ...current, presets: current.presets.filter((item) => item._id !== preset._id) })); })}>Delete</button></div>)}</div>
        <a href="/admin/customization" className="inline-block text-sm font-bold text-wine underline">Open owner-only Website Designer</a>
      </div>
      <div className="admin-card space-y-4 p-5"><h2 className="text-lg font-bold">Client handover</h2><p className="text-xs leading-5 text-slate-500">Lock this installation, then grant its client an admin login. They use their own mobile OTP; no password or owner role is shared.</p>
        <Field label="Client name" value={client.name} onChange={(name) => setClient((current) => ({ ...current, name }))} max={80} />
        <Field label="Client mobile number" value={client.phone} onChange={(phone) => setClient((current) => ({ ...current, phone }))} max={16} />
        <button type="button" disabled={busy || !configuration.locked || dirty} className="admin-btn" onClick={() => run(async () => { if (!window.confirm('Grant this number store admin access on this installation?')) return; await api.post('/master/client-admins', client); await load(); setClient({ name: '', phone: '' }); setMessage('Client access granted. Ask the client to verify their mobile OTP.'); })}>Grant client admin access</button>
        {!configuration.locked && <p className="text-xs text-amber-800">Lock the configuration before granting access.</p>}
        <div className="max-h-60 space-y-2 overflow-y-auto">{workspace.admins.map((admin) => <div key={admin._id} className="rounded-lg border p-3 text-sm"><strong>{admin.name || 'Store admin'}</strong><p className="text-xs text-slate-500">{admin.phone} · {admin.systemRole === 'MASTER_OWNER' ? 'Master Owner' : 'Client admin'}{admin.isBlocked ? ' · Blocked' : ''}</p></div>)}</div>
      </div>
    </div>
    <details className="admin-card p-5"><summary className="cursor-pointer font-bold">Configuration history ({configuration.history.length})</summary><div className="mt-4 space-y-2">{[...configuration.history].reverse().map((entry) => <div key={entry.revision} className="rounded-lg border p-3 text-xs"><strong>Revision {entry.revision}: {entry.note}</strong><p className="mt-1 text-slate-500">{entry.at ? new Date(entry.at).toLocaleString() : ''} · {entry.structure.industry}</p></div>)}</div></details>
    <button type="button" disabled={busy} className="admin-btn-ghost" onClick={() => { if (!dirty || window.confirm('Discard unsaved structural edits and reload?')) run(load); }}>Reload saved configuration</button>
  </section>;
}
function Field({ label, value, onChange, max = 100 }) { return <label className="grid min-w-0 gap-2 text-xs font-bold">{label}<input value={value || ''} maxLength={max} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-0 rounded-lg border bg-white px-3 text-sm font-normal" /></label>; }
