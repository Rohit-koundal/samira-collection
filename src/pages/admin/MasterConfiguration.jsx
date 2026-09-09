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
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [client, setClient] = useState({ name: '', phone: '' });
  const [projectBuilder, setProjectBuilder] = useState(null);
  const [projectPreview, setProjectPreview] = useState(null);
  const [projectBusy, setProjectBusy] = useState(false);
  const [projectError, setProjectError] = useState('');
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
    const convertingIndustry = draft.industry !== configuration.structure.industry || draft.features?.sizing !== configuration.structure.features?.sizing;
    const question = convertingIndustry
      ? 'Convert this store to the selected industry? Existing products, orders and legacy values will remain stored. Products missing the new required fields must be reviewed before publishing.'
      : 'Save this store structure? Products and orders will not be deleted. Review the storefront before handover.';
    if (!window.confirm(question)) return;
    accept(await api.put('/master/configuration', {
      revision: configuration.revision,
      structure: draft,
      ...(convertingIndustry ? { confirmIndustryChange: true } : {}),
    }));
    setMessage(convertingIndustry ? 'Industry converted safely. Existing catalog data is preserved; review products against the new required fields.' : 'Structure saved. Review the store, then lock for handover.');
  });
  const toggleLock = () => run(async () => {
    if (dirty) throw new Error('Save or discard edits before changing the lock.');
    if (!window.confirm(configuration.locked ? 'Unlock configuration for Master Owner changes? Clients still cannot edit its structure.' : 'Lock this configuration for client handover?')) return;
    accept(await api.put('/master/configuration', { revision: configuration.revision, locked: !configuration.locked }));
    setMessage(configuration.locked ? 'Unlocked for Master Owner only.' : 'Configuration locked for handover.');
  });
  const applyPreset = (structure, presetId = '') => {
    if (configuration.locked || busy) return;
    setDraft(copy({ ...structure, clientPermissions: structure.clientPermissions || draft.clientPermissions }));
    setSelectedPresetId(presetId);
    setMessage('Preset loaded into the editor. Save explicitly to apply; catalog data is untouched.');
  };
  const openProjectBuilder = (preset) => {
    setProjectBuilder({
      industry: preset.industry || preset.id,
      industryName: preset.name,
      companyName: '',
      projectName: '',
      projectSlug: '',
      includeAiWorker: true,
    });
    setProjectPreview(null);
    setProjectError('');
  };
  const updateProjectBuilder = (key, value) => {
    setProjectBuilder((current) => ({ ...current, [key]: value }));
    setProjectPreview(null);
    setProjectError('');
  };
  const projectPayload = () => ({
    industry: projectBuilder.industry,
    companyName: projectBuilder.companyName,
    projectName: projectBuilder.projectName || projectBuilder.companyName,
    projectSlug: projectBuilder.projectSlug,
    includeAiWorker: projectBuilder.includeAiWorker,
  });
  const reviewProject = async () => {
    if (projectBusy) return;
    setProjectBusy(true); setProjectError('');
    try { setProjectPreview(await api.post('/master/projects/preview', projectPayload())); }
    catch (error) { setProjectError(error.message || 'Unable to review this project.'); }
    finally { setProjectBusy(false); }
  };
  const downloadProject = async () => {
    if (projectBusy) return;
    setProjectBusy(true); setProjectError('');
    try {
      const preview = projectPreview || await api.post('/master/projects/preview', projectPayload());
      setProjectPreview(preview);
      const archive = await api.download('/master/projects/generate', projectPayload());
      const url = URL.createObjectURL(archive);
      const link = document.createElement('a');
      link.href = url; link.download = preview.downloadName; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`${preview.projectName} generated as a separate project. Extract ${preview.downloadName} to begin.`);
    } catch (error) { setProjectError(error.message || 'Unable to generate this project.'); }
    finally { setProjectBusy(false); }
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
      const convertingIndustry = template?.structure?.industry && template.structure.industry !== configuration.structure.industry;
      accept(await api.post('/master/import', { revision: configuration.revision, template, ...(convertingIndustry ? { confirmIndustryChange: true } : {}) }));
      setMessage('Template imported. Review and lock before handover.');
    });
  };
  const editAttribute = (index, key, value) => setDraft((current) => ({ ...current, attributes: current.attributes.map((item, position) => position === index ? { ...item, [key]: value } : item) }));
  const editAttributeValidation = (index, key, value) => setDraft((current) => ({ ...current, attributes: current.attributes.map((item, position) => position === index ? { ...item, validation: { ...(item.validation || {}), [key]: value } } : item) }));
  const editCategory = (index, key, value) => setDraft((current) => ({ ...current, categoryDefinitions: (current.categoryDefinitions || []).map((item, position) => position === index ? { ...item, [key]: value } : item) }));
  if (!workspace) return <section className="admin-card space-y-4 p-6" role="status"><h1 className="text-xl font-bold">Master configuration</h1><p>{message || 'Loading owner workspace…'}</p>{message && <button type="button" onClick={() => run(load)} className="admin-btn">Retry</button>}</section>;
  return <section className="min-w-0 space-y-5">
    <PageHeader title="Master configuration" note="Deployment-owned store structure. Client admins cannot access this workspace or its APIs." />
    <div className="admin-card flex flex-wrap items-center justify-between gap-4 p-5">
      <div><h2 className="text-lg font-bold">{configuration.locked ? 'Configuration locked' : 'Owner editing enabled'}</h2><p className="mt-1 text-xs text-slate-500">Revision {configuration.revision} · {configuration.structure.industry} · {dirty ? 'Unsaved edits' : 'Saved'}</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || dirty} onClick={toggleLock} className="admin-btn-ghost">{configuration.locked ? 'Unlock configuration' : 'Lock for handover'}</button><button type="button" disabled={busy || configuration.locked || !dirty} onClick={save} className="admin-btn">Save structure</button></div>
    </div>
    {message && <p role="status" className="rounded-xl border bg-white p-4 text-sm text-wine">{message}</p>}
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">Industry project generation is isolated from this store. It downloads a complete new source project with its own name, folder, environment setup and database placeholder. Samira Collection products, orders and settings are never copied or changed.</div>
    <section className="admin-card min-w-0 space-y-4 p-5" aria-labelledby="project-blueprints-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-wine">New standalone project</p><h2 id="project-blueprints-title" className="mt-1 text-lg font-bold">Choose a business blueprint</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Each option creates a complete independent project ZIP. Extract it into a new folder, connect a new database and deploy it under the client’s own name.</p></div>
        <span className="rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-700">No current-store changes</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{workspace.builtins.map((preset) => <button key={preset.id} type="button" disabled={busy || projectBusy} className="group rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-wine/40 hover:shadow-md disabled:opacity-60" onClick={() => openProjectBuilder(preset)}><span className="flex items-start justify-between gap-3"><strong className="block">{preset.name}</strong><span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f7edf0] text-wine transition group-hover:bg-wine group-hover:text-white">→</span></span><span className="mt-2 block text-xs leading-5 text-slate-500">{preset.attributes?.length || 0} fields · {preset.categoryDefinitions?.length || preset.defaultCategories?.length || 0} categories · {preset.variantConfig?.attributes?.join(' × ') || 'product stock'}</span><span className="mt-3 inline-block text-[10px] font-black uppercase tracking-wider text-wine">Generate new project</span></button>)}</div>
    </section>
    <fieldset disabled={busy || configuration.locked} className="admin-card min-w-0 space-y-5 p-5 disabled:opacity-60">
      <legend className="px-2 text-lg font-bold">Current installation structure</legend>
      <p className="text-xs leading-5 text-slate-500">Clients enter values; only you change definitions. Used definitions cannot be removed until affected products are reviewed. Fashion retains its existing sizing flow.</p>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Product attributes ({draft.attributes.length}/80)</h2><p className="mt-1 text-xs text-slate-500">Fields render automatically in product forms and customer specifications.</p></div><button type="button" disabled={draft.attributes.length >= 80} onClick={() => setDraft((current) => ({ ...current, attributes: [...current.attributes, { key: '', label: '', type: 'text', unit: '', required: false, filterable: false, searchable: true, showOnCard: false, showOnDetail: true, showInSpecifications: true, variant: false, options: [], group: 'Specifications', validation: {} }] }))} className="admin-btn-ghost">Add attribute</button></div>
      <div className="space-y-3">{draft.attributes.map((attribute, index) => <AttributeEditor key={(attribute.key || 'new') + '-' + index} attribute={attribute} index={index} edit={editAttribute} editValidation={editAttributeValidation} remove={() => setDraft((current) => ({ ...current, attributes: current.attributes.filter((_, position) => position !== index) }))} />)}</div>
      <CategoryStructureEditor draft={draft} setDraft={setDraft} edit={editCategory} />
      <StructureSummary draft={draft} />
      <div className="grid gap-3 sm:grid-cols-2">{[['content', 'Allow approved content editing'], ['payments', 'Allow payment settings editing']].map(([key, label]) => <label key={key} className="flex gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" checked={draft.clientPermissions[key]} onChange={(event) => setDraft((current) => ({ ...current, clientPermissions: { ...current.clientPermissions, [key]: event.target.checked } }))} />{label}</label>)}</div>
      <p className="text-xs text-slate-500">Feature profile: {draft.features.sizing ? 'Sizes and charts' : 'No garment size chart'} · {draft.features.technical ? 'Technical specifications' : 'Product specifications'} · {draft.inventory?.mode || 'product'} inventory. Checkout logic remains compatible.</p>
    </fieldset>
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <div className="admin-card space-y-4 p-5"><h2 className="text-lg font-bold">Owner templates</h2><p className="text-xs leading-5 text-slate-500">Export structure for another isolated installation. Visual themes remain in Website Designer. No customer data or credentials are included.</p>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={exportTemplate} className="admin-btn-ghost">Export structure</button><button type="button" disabled={busy || configuration.locked} onClick={() => file.current?.click()} className="admin-btn-ghost">Import structure</button><input ref={file} aria-label="Import store template" type="file" accept=".json,application/json" hidden onChange={importTemplate} /></div>
        <Field label="New preset name" value={presetName} onChange={setPresetName} max={80} />
        <button type="button" disabled={busy || !presetName.trim()} className="admin-btn" onClick={() => run(async () => { const preset = await api.post('/master/clone', { name: presetName, structure: draft }); setWorkspace((current) => ({ ...current, presets: [preset, ...current.presets] })); setSelectedPresetId(preset._id); setPresetName(''); setMessage('Reusable industry preset saved. Store configuration is unchanged.'); })}>Save editor as private preset</button>
        <div className="max-h-[28rem] space-y-2 overflow-y-auto">{workspace.presets.map((preset) => <div key={preset._id} className={`rounded-xl border p-3 ${selectedPresetId === preset._id ? 'border-wine bg-rose-50' : 'bg-white'}`}><div className="flex items-center justify-between gap-2"><button type="button" disabled={busy || configuration.locked} onClick={() => applyPreset(preset.structure, preset._id)} className="min-w-0 truncate text-left text-sm font-bold">{preset.name}<span className="mt-1 block text-[10px] font-semibold text-slate-400">{preset.key || preset.structure?.industry} · {preset.isActive === false ? 'Inactive' : 'Active'}</span></button><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${preset.isActive === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{preset.isActive === false ? 'Off' : 'Live'}</span></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy || configuration.locked} className="text-xs font-bold text-wine underline" onClick={() => applyPreset(preset.structure, preset._id)}>Edit</button><button type="button" disabled={busy || configuration.locked || selectedPresetId !== preset._id} className="text-xs font-bold text-wine underline disabled:text-slate-300" onClick={() => run(async () => { const saved = await api.patch('/master/presets/' + preset._id, { structure: draft }); setWorkspace((current) => ({ ...current, presets: current.presets.map((item) => item._id === preset._id ? saved : item) })); setMessage('Industry definition updated. Active stores remain unchanged until you apply it.'); })}>Save changes</button><button type="button" disabled={busy} className="text-xs font-bold text-wine underline" onClick={() => run(async () => { const duplicated = await api.post(`/master/presets/${preset._id}/duplicate`, {}); setWorkspace((current) => ({ ...current, presets: [duplicated, ...current.presets] })); setMessage('Industry duplicated.'); })}>Duplicate</button><button type="button" disabled={busy} className="text-xs font-bold text-wine underline" onClick={() => run(async () => { const saved = await api.patch('/master/presets/' + preset._id, { isActive: preset.isActive === false }); setWorkspace((current) => ({ ...current, presets: current.presets.map((item) => item._id === preset._id ? saved : item) })); })}>{preset.isActive === false ? 'Activate' : 'Deactivate'}</button><button type="button" disabled={busy} className="text-xs font-bold text-red-600 underline" aria-label={'Delete preset ' + preset.name} onClick={() => run(async () => { if (!window.confirm('Permanently delete this industry preset? Active store data is unchanged.')) return; await api.delete('/master/presets/' + preset._id); setWorkspace((current) => ({ ...current, presets: current.presets.filter((item) => item._id !== preset._id) })); if (selectedPresetId === preset._id) setSelectedPresetId(''); })}>Delete</button></div></div>)}</div>
        <div className="flex flex-wrap gap-4"><a href="/admin/customization" className="inline-block text-sm font-bold text-wine underline">Open owner-only Website Designer</a><a href="/master/stores" className="inline-block text-sm font-bold text-wine underline">Manage store portfolio</a></div>
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
    {projectBuilder && <ProjectGeneratorDialog value={projectBuilder} preview={projectPreview} busy={projectBusy} error={projectError} onChange={updateProjectBuilder} onPreview={reviewProject} onDownload={downloadProject} onClose={() => { if (!projectBusy) setProjectBuilder(null); }} />}
  </section>;
}

function ProjectGeneratorDialog({ value, preview, busy, error, onChange, onPreview, onDownload, onClose }) {
  const ready = value.companyName.trim().length >= 2 && (value.projectName.trim().length >= 2 || value.companyName.trim().length >= 2);
  return <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="project-generator-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-[#fffaf5] shadow-2xl sm:max-w-2xl sm:rounded-[1.75rem]">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-wine">{value.industryName} blueprint</p><h2 id="project-generator-title" className="mt-1 text-xl font-bold">Generate a separate project</h2><p className="mt-1 text-xs text-slate-500">A new folder package; the active store stays unchanged.</p></div>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Close project generator" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-white text-xl">×</button>
      </header>
      <div className="space-y-5 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company / store name" value={value.companyName} onChange={(next) => onChange('companyName', next)} max={80} placeholder="Example: Rohit Mobiles" />
          <Field label="Project display name" value={value.projectName} onChange={(next) => onChange('projectName', next)} max={80} placeholder="Defaults to company name" />
          <div className="sm:col-span-2"><Field label="Folder name (optional)" value={value.projectSlug} onChange={(next) => onChange('projectSlug', next.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} max={60} placeholder="Automatically generated, e.g. rohit-mobiles" /></div>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border bg-white p-4 text-sm"><input type="checkbox" className="mt-1" checked={value.includeAiWorker} onChange={(event) => onChange('includeAiWorker', event.target.checked)} /><span><strong className="block">Include smart reel worker</strong><span className="mt-1 block text-xs leading-5 text-slate-500">Adds the optional video analysis service source. API keys and uploaded media are never copied.</span></span></label>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><strong>Separate data and managed access:</strong> use a new MongoDB URL, storage and service credentials for this client. Generation creates a unique 30-day-trial installation. Transfer the one-time <code>client-installation.json</code> values to the backend environment, then delete that file before committing or sharing the project.</div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {preview && <div className="rounded-2xl border bg-white p-4" role="status"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{preview.downloadName}</strong><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">Ready to generate</span></div><p className="mt-2 text-xs text-slate-500">{preview.sourceFiles} source files · {(preview.approximateSourceBytes / 1048576).toFixed(1)} MB before compression</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><strong className="text-xs">Included</strong><ul className="mt-2 space-y-1 text-xs text-slate-600">{preview.includes.map((item) => <li key={item}>✓ {item}</li>)}</ul></div><div><strong className="text-xs">Kept out for safety</strong><ul className="mt-2 space-y-1 text-xs text-slate-600">{preview.excludes.map((item) => <li key={item}>— {item}</li>)}</ul></div></div></div>}
      </div>
      <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t bg-white/95 p-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
        <button type="button" disabled={busy} onClick={onClose} className="admin-btn-ghost">Cancel</button>
        <button type="button" disabled={busy || !ready} onClick={onPreview} className="admin-btn-ghost">{busy ? 'Preparing…' : 'Review package'}</button>
        <button type="button" disabled={busy || !ready} onClick={onDownload} className="admin-btn">{busy ? 'Generating…' : 'Generate project ZIP'}</button>
      </footer>
    </section>
  </div>;
}
const ATTRIBUTE_TYPES = [['text', 'Text'], ['number', 'Number'], ['dropdown', 'Dropdown'], ['multi_select', 'Multi select'], ['boolean', 'Yes / No'], ['color', 'Colour'], ['date', 'Date'], ['textarea', 'Long text'], ['measurement', 'Measurement'], ['range', 'Range'], ['image', 'Image']];

function AttributeEditor({ attribute, index, edit, editValidation, remove }) {
  const choices = (attribute.options || []).join(', ');
  const numeric = ['number', 'measurement', 'range'].includes(attribute.type);
  return <details className="rounded-2xl border bg-white" open={index < 2}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4"><span className="min-w-0"><strong className="block truncate text-sm">{attribute.label || 'New attribute'}</strong><span className="mt-1 block truncate text-[11px] text-slate-500">{attribute.key || 'field_key'} · {attribute.type || 'text'}{attribute.variant ? ' · variant' : ''}{attribute.required ? ' · required' : ''}</span></span><span className="rounded-full bg-[#f7edf0] px-3 py-1 text-[10px] font-black uppercase text-wine">Configure</span></summary>
    <div className="grid gap-3 border-t p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Field key" value={attribute.key} onChange={(value) => edit(index, 'key', value)} max={40} />
      <Field label="Customer-facing label" value={attribute.label} onChange={(value) => edit(index, 'label', value)} max={80} />
      <label className="grid min-w-0 gap-2 text-xs font-bold">Field type<select value={attribute.type || 'text'} onChange={(event) => edit(index, 'type', event.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm font-normal">{ATTRIBUTE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <Field label="Group / section" value={attribute.group || ''} onChange={(value) => edit(index, 'group', value)} max={60} />
      <Field label="Unit" value={attribute.unit || ''} onChange={(value) => edit(index, 'unit', value)} max={20} />
      {['dropdown', 'multi_select'].includes(attribute.type) && <label className="grid gap-2 text-xs font-bold sm:col-span-2 lg:col-span-3">Options, separated by comma<input value={choices} onChange={(event) => edit(index, 'options', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} className="h-10 rounded-lg border px-3 text-sm font-normal" /></label>}
      {numeric && <><Field label="Minimum" value={attribute.validation?.min ?? ''} onChange={(value) => editValidation(index, 'min', value === '' ? undefined : Number(value))} /><Field label="Maximum" value={attribute.validation?.max ?? ''} onChange={(value) => editValidation(index, 'max', value === '' ? undefined : Number(value))} /></>}
           <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-4">{[
        ['required', 'Required'], ['filterable', 'Filter'], ['searchable', 'Search'], ['showOnCard', 'Product card'],
        ['showOnDetail', 'Product detail'], ['showInSpecifications', 'Specification table'], ['variant', 'Variant option'],
      ].map(([key, label]) => <label key={key} className="flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold"><input type="checkbox" checked={attribute[key] === true || (['searchable', 'showOnDetail', 'showInSpecifications'].includes(key) && attribute[key] !== false)} onChange={(event) => edit(index, key, event.target.checked)} />{label}</label>)}</div>
      <button type="button" aria-label={'Remove ' + (attribute.label || 'attribute')} onClick={remove} className="admin-btn-ghost sm:col-span-2 lg:col-span-4">Deactivate / remove from draft</button>
    </div>
  </details>;
}

function CategoryStructureEditor({ draft, setDraft, edit }) {
  const definitions = draft.categoryDefinitions || [];
  const editLocalAttribute = (categoryIndex, attributeIndex, key, value) => setDraft((current) => ({ ...current, categoryDefinitions: current.categoryDefinitions.map((category, currentCategoryIndex) => currentCategoryIndex !== categoryIndex ? category : { ...category, attributes: (category.attributes || []).map((attribute, currentAttributeIndex) => currentAttributeIndex === attributeIndex ? { ...attribute, [key]: value } : attribute) }) }));
  return <section className="rounded-2xl border bg-[#fbf8f4] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Categories and inheritance ({definitions.length}/150)</h2><p className="mt-1 text-xs text-slate-500">A parent supplies common fields; a category can add attributes and choose variant keys.</p></div><button type="button" className="admin-btn-ghost" disabled={definitions.length >= 150} onClick={() => setDraft((current) => ({ ...current, categoryDefinitions: [...(current.categoryDefinitions || []), { key: '', name: '', parentKey: '', active: true, attributes: [], variantAttributes: [], filters: [] }] }))}>Add category</button></div>
    <div className="mt-4 grid gap-3 lg:grid-cols-2">{definitions.map((item, index) => <div key={(item.key || 'category') + index} className="rounded-2xl border bg-white p-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Category name" value={item.name} onChange={(value) => edit(index, 'name', value)} max={80} /><Field label="Category key" value={item.key} onChange={(value) => edit(index, 'key', value)} max={50} /><label className="grid gap-2 text-xs font-bold">Parent category<select value={item.parentKey || ''} onChange={(event) => edit(index, 'parentKey', event.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm font-normal"><option value="">Top level</option>{definitions.filter((_, position) => position !== index).map((parent) => <option key={parent.key} value={parent.key}>{parent.name || parent.key}</option>)}</select></label><Field label="Variant keys" value={(item.variantAttributes || []).join(', ')} onChange={(value) => edit(index, 'variantAttributes', value.split(',').map((part) => part.trim()).filter(Boolean))} max={180} /><Field label="Category filter keys" value={(item.filters || []).join(', ')} onChange={(value) => edit(index, 'filters', value.split(',').map((part) => part.trim()).filter(Boolean))} max={240} /></div><details className="mt-4 rounded-xl border bg-[#fffaf6]"><summary className="cursor-pointer p-3 text-xs font-bold">Category-specific fields ({item.attributes?.filter((attribute) => typeof attribute === 'object').length || 0})</summary><div className="space-y-3 border-t p-3">{(item.attributes || []).map((attribute, attributeIndex) => typeof attribute === 'string' ? <p key={attribute} className="text-xs text-slate-500">Inherited field: {attribute}</p> : <div key={(attribute.key || 'field') + attributeIndex} className="rounded-xl border bg-white p-3"><div className="grid gap-2 sm:grid-cols-2"><Field label="Field key" value={attribute.key} onChange={(value) => editLocalAttribute(index, attributeIndex, 'key', value)} max={40} /><Field label="Label" value={attribute.label} onChange={(value) => editLocalAttribute(index, attributeIndex, 'label', value)} max={80} /><label className="grid gap-2 text-xs font-bold">Type<select value={attribute.type || 'text'} onChange={(event) => editLocalAttribute(index, attributeIndex, 'type', event.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm font-normal">{ATTRIBUTE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Field label="Unit" value={attribute.unit || ''} onChange={(value) => editLocalAttribute(index, attributeIndex, 'unit', value)} max={20} />{['dropdown', 'multi_select'].includes(attribute.type) ? <Field label="Options" value={(attribute.options || []).join(', ')} onChange={(value) => editLocalAttribute(index, attributeIndex, 'options', value.split(',').map((part) => part.trim()).filter(Boolean))} max={400} /> : null}</div><div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">{[['required', 'Required'], ['filterable', 'Filter'], ['searchable', 'Search'], ['variant', 'Variant'], ['showOnDetail', 'Product detail']].map(([key, label]) => <label key={key} className="flex items-center gap-1"><input type="checkbox" checked={attribute[key] === true || (['searchable', 'showOnDetail'].includes(key) && attribute[key] !== false)} onChange={(event) => editLocalAttribute(index, attributeIndex, key, event.target.checked)} />{label}</label>)}<button type="button" className="ml-auto font-bold text-red-600 underline" onClick={() => setDraft((current) => ({ ...current, categoryDefinitions: current.categoryDefinitions.map((category, categoryIndex) => categoryIndex !== index ? category : { ...category, attributes: category.attributes.filter((_, fieldIndex) => fieldIndex !== attributeIndex) }) }))}>Remove</button></div></div>)}<button type="button" className="admin-btn-ghost" onClick={() => setDraft((current) => ({ ...current, categoryDefinitions: current.categoryDefinitions.map((category, categoryIndex) => categoryIndex !== index ? category : { ...category, attributes: [...(category.attributes || []), { key: '', label: '', type: 'text', unit: '', required: false, filterable: false, searchable: true, showOnDetail: true, showInSpecifications: true, variant: false, options: [], group: 'Specifications', validation: {} }] }) }))}>Add category field</button></div></details><div className="mt-3 flex items-center justify-between"><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={item.active !== false} onChange={(event) => edit(index, 'active', event.target.checked)} />Active</label><button type="button" className="text-xs font-black text-wine underline" onClick={() => setDraft((current) => ({ ...current, categoryDefinitions: current.categoryDefinitions.filter((_, position) => position !== index) }))}>Remove from draft</button></div></div>)}</div>
  </section>;
}

function StructureSummary({ draft }) {
  const items = [
    ['Variants', draft.variantConfig?.attributes?.join(' × ') || 'Product level'], ['Inventory', draft.inventory?.mode || 'Product'],
    ['Product page', `${draft.productSections?.length || 0} sections`], ['Filters', `${draft.filters?.length || 0} configured`],
    ['Comparison', draft.features?.comparison ? 'Enabled' : 'Disabled'], ['Perishable stock', draft.features?.perishable ? 'Enabled' : 'Disabled'],
  ];
  return <section><h2 className="mb-3 font-bold">Store behaviour</h2><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{items.map(([label, value]) => <div key={label} className="rounded-2xl border bg-white p-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>)}</div></section>;
}

function Field({ label, value, onChange, max = 100, placeholder = '' }) { return <label className="grid min-w-0 gap-2 text-xs font-bold">{label}<input value={value ?? ''} maxLength={max} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-0 rounded-lg border bg-white px-3 text-sm font-normal" /></label>; }
