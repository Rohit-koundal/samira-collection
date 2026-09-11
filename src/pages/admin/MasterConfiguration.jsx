import { useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/admin/PageHeader';
import MasterCategoryStructureEditor from '../../components/admin/MasterCategoryStructureEditor';
import api from '../../services/api';
import useUnsavedChanges from '../../hooks/useUnsavedChanges';
const copy = (value) => JSON.parse(JSON.stringify(value));

export default function MasterConfiguration() {
  const [workspace, setWorkspace] = useState(null);
  const [draft, setDraftState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('info');
  const [activeSection, setActiveSection] = useState('overview');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [impact, setImpact] = useState(null);
  const [publishNote, setPublishNote] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [recovery, setRecovery] = useState(null);
  const [history, setHistory] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [historyQuery, setHistoryQuery] = useState('');
  const [presetUsage, setPresetUsage] = useState(null);
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [client, setClient] = useState({ name: '', phone: '' });
  const [projectBuilder, setProjectBuilder] = useState(null);
  const [projectPreview, setProjectPreview] = useState(null);
  const [projectBusy, setProjectBusy] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [pricingDraft, setPricingDraft] = useState(null);
  const [pricingReason, setPricingReason] = useState('');
  const actionLock = useRef(false);
  const file = useRef(null);
  const configuration = workspace?.configuration;
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(configuration?.structure);
  const pricingDirty = !!pricingDraft && JSON.stringify(pricingForm(pricingDraft)) !== JSON.stringify(pricingForm(workspace?.planPricing));
  const setDraft = (updater, record = true) => setDraftState((current) => {
    const next = typeof updater === 'function' ? updater(current) : updater;
    if (record && current && JSON.stringify(current) !== JSON.stringify(next)) {
      setPast((items) => [...items.slice(-29), copy(current)]);
      setFuture([]);
    }
    return next;
  });
  const loadHistory = async (page = 1, query = historyQuery) => {
    const result = await api.get(`/master/configuration/history?page=${page}&limit=12&query=${encodeURIComponent(query)}`, { silent: true });
    setHistory(result);
  };
  const load = async () => {
    const result = await api.get('/master?view=configuration');
    setWorkspace(result);
    setDraftState(copy(result.configuration.structure)); setPast([]); setFuture([]); setImpact(null);
    setPricingDraft(editablePricing(result.planPricing)); setPricingReason('');
    const saved = localStorage.getItem('samira_master_configuration_draft_v2');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      setRecovery(parsed?.revision === result.configuration.revision && JSON.stringify(parsed.structure) !== JSON.stringify(result.configuration.structure) ? parsed : null);
    } catch { localStorage.removeItem('samira_master_configuration_draft_v2'); }
    await loadHistory(1, '').catch(() => {});
  };
  useEffect(() => {
    let alive = true;
    api.get('/master?view=configuration').then((result) => { if (alive) {
      setWorkspace(result); setDraftState(copy(result.configuration.structure));
      setPricingDraft(editablePricing(result.planPricing));
      const saved = localStorage.getItem('samira_master_configuration_draft_v2');
      try { const parsed = saved ? JSON.parse(saved) : null; if (parsed?.revision === result.configuration.revision && JSON.stringify(parsed.structure) !== JSON.stringify(result.configuration.structure)) setRecovery(parsed); } catch { localStorage.removeItem('samira_master_configuration_draft_v2'); }
      api.get('/master/configuration/history?page=1&limit=12&query=', { silent: true }).then((rows) => { if (alive) setHistory(rows); }).catch(() => {});
    } }).catch((error) => { if (alive) { setMessage(error.message); setMessageTone('error'); } });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!configuration || !draft) return undefined;
    const timer = window.setTimeout(() => {
      if (dirty) localStorage.setItem('samira_master_configuration_draft_v2', JSON.stringify({ revision: configuration.revision, structure: draft, savedAt: new Date().toISOString() }));
      else localStorage.removeItem('samira_master_configuration_draft_v2');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [configuration, draft, dirty]);
  useUnsavedChanges(dirty || pricingDirty, busy);
  const run = async (action) => {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message || 'Unable to save. Your local changes are retained.'); setMessageTone('error'); }
    finally { actionLock.current = false; setBusy(false); }
  };
  const accept = (next) => { setWorkspace((current) => ({ ...current, configuration: next })); setDraftState(copy(next.structure)); setPast([]); setFuture([]); setImpact(null); setRecovery(null); localStorage.removeItem('samira_master_configuration_draft_v2'); };
  const reviewChanges = (structure = draft, kind = 'PUBLISH') => run(async () => {
    const result = await api.post('/master/configuration/impact', { structure });
    setImpact({ ...result, kind }); setPublishNote(kind === 'ROLLBACK' ? publishNote : ''); setMessageTone('info');
  });
  const publish = () => run(async () => {
    if (!impact) throw new Error('Review the current impact before publishing.');
    const convertingIndustry = impact.proposed.industry !== configuration.structure.industry || impact.proposed.features?.sizing !== configuration.structure.features?.sizing;
    const next = await api.put('/master/configuration', {
      revision: configuration.revision, structure: impact.proposed, impactToken: impact.token,
      confirmIndustryChange: convertingIndustry, note: publishNote.trim(), versionKind: impact.kind || 'PUBLISH',
    });
    accept(next); await loadHistory(1, '');
    setMessage('Configuration published safely. Review the storefront, then lock it for handover.'); setMessageTone('success');
  });
  const savePricing = () => run(async () => {
    const payload = pricingForm(pricingDraft);
    const saved = await api.put('/master/plan-pricing', { ...payload, revision: pricingDraft.revision, reason: pricingReason.trim() });
    setWorkspace((current) => ({ ...current, planPricing: saved, plans: saved.plans }));
    setPricingDraft(editablePricing(saved)); setPricingReason(''); setConfirmation(null);
    setMessage('Subscription pricing saved. New checkout orders now use these backend-controlled amounts.'); setMessageTone('success');
  });
  const requestPricingSave = () => setConfirmation({
    title: 'Publish new subscription prices?',
    body: 'The updated amounts will apply to new monthly, yearly and lifetime checkout orders. Existing payment records remain unchanged.',
    confirmLabel: 'Save plan pricing', onConfirm: savePricing,
  });
  const toggleLock = () => run(async () => {
    if (dirty) throw new Error('Save or discard edits before changing the lock.');
    accept(await api.put('/master/configuration', { revision: configuration.revision, locked: !configuration.locked }));
    await loadHistory(1, '');
    setMessage(configuration.locked ? 'Unlocked for Master Owner only.' : 'Configuration locked for handover.'); setMessageTone('success');
  });
  const requestLockToggle = () => setConfirmation({
    title: configuration.locked ? 'Unlock configuration?' : 'Lock for client handover?',
    body: configuration.locked ? 'Only the Master Owner will be able to change structural definitions.' : 'The saved structure becomes protected. You can unlock it again as Master Owner.',
    confirmLabel: configuration.locked ? 'Unlock configuration' : 'Lock configuration', onConfirm: toggleLock,
  });
  const undo = () => { if (!past.length) return; const previous = past[past.length - 1]; setPast((items) => items.slice(0, -1)); setFuture((items) => [copy(draft), ...items].slice(0, 30)); setDraftState(copy(previous)); setImpact(null); };
  const redo = () => { if (!future.length) return; const next = future[0]; setFuture((items) => items.slice(1)); setPast((items) => [...items.slice(-29), copy(draft)]); setDraftState(copy(next)); setImpact(null); };
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
      if (template?.format !== 'samira-store-template' || template?.version !== 1 || !template?.structure) throw new Error('Choose a supported Samira store template.');
      const reviewed = await api.post('/master/configuration/impact', { structure: template.structure });
      setDraft(reviewed.proposed); setImpact(null); setActiveSection('overview');
      setMessage('Template loaded into your private draft. Review its impact and publish explicitly.'); setMessageTone('success');
    });
  };
  const editAttribute = (index, key, value) => setDraft((current) => ({ ...current, attributes: current.attributes.map((item, position) => position === index ? { ...item, [key]: value } : item) }));
  const editAttributeValidation = (index, key, value) => setDraft((current) => ({ ...current, attributes: current.attributes.map((item, position) => position === index ? { ...item, validation: { ...(item.validation || {}), [key]: value } } : item) }));
  const editCategory = (index, key, value) => setDraft((current) => ({ ...current, categoryDefinitions: (current.categoryDefinitions || []).map((item, position) => position === index ? { ...item, [key]: value } : item) }));
  const moveAttribute = (index, direction) => setDraft((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.attributes.length) return current;
    const attributes = [...current.attributes]; [attributes[index], attributes[target]] = [attributes[target], attributes[index]];
    return { ...current, attributes: attributes.map((item, position) => ({ ...item, sortOrder: position + 1 })) };
  });
  const duplicateAttribute = (index) => setDraft((current) => {
    const source = current.attributes[index];
    const attributes = [...current.attributes]; attributes.splice(index + 1, 0, { ...copy(source), key: `${source.key || 'field'}_copy`, label: `${source.label || 'Field'} copy` });
    return { ...current, attributes: attributes.map((item, position) => ({ ...item, sortOrder: position + 1 })) };
  });
  const restoreVersionDraft = (entry) => run(async () => {
    if (configuration.locked) throw new Error('Unlock the configuration before restoring a version.');
    const version = await api.get(`/master/configuration/history/${entry.revision}`);
    setDraft(version.structure); setActiveSection('overview'); setImpact(null);
    setMessage(`Revision ${entry.revision} loaded as an editable draft. Review its impact before publishing.`); setMessageTone('success');
  });
  const inspectPresetUsage = (preset) => run(async () => setPresetUsage(await api.get(`/master/presets/${preset._id}/usage`, { silent: true })));
  const archivePreset = (preset) => run(async () => {
    const result = await api.delete('/master/presets/' + preset._id);
    setWorkspace((current) => ({ ...current, presets: current.presets.map((item) => item._id === preset._id ? result.preset : item) }));
    setPresetUsage({ preset: { id: preset._id, key: preset.key, name: preset.name }, usage: result.usage });
    if (selectedPresetId === preset._id) setSelectedPresetId('');
    setMessage('Preset archived safely. Existing store copies remain unchanged.'); setMessageTone('success');
  });
  const restorePreset = (preset) => run(async () => {
    const saved = await api.patch('/master/presets/' + preset._id, { revision: preset.revision, archived: false, isActive: true });
    setWorkspace((current) => ({ ...current, presets: current.presets.map((item) => item._id === preset._id ? saved : item) }));
    setMessage('Preset restored and activated.'); setMessageTone('success');
  });
  if (!workspace) return <section className="admin-card space-y-4 p-6" role="status"><h1 className="text-xl font-bold">Master configuration</h1><p>{message || 'Loading owner workspace…'}</p>{message && <button type="button" onClick={() => run(load)} className="admin-btn">Retry</button>}</section>;
  return <section className="min-w-0 space-y-5">
    <PageHeader title="Master Governance Studio" note="Design, validate, publish and protect the commerce structure used by this installation." />
    <nav className="admin-card grid grid-cols-2 gap-2 p-2 sm:flex sm:overflow-x-auto" aria-label="Master configuration sections">{[
      ['overview', 'Overview'], ['schema', 'Product schema'], ['categories', 'Categories'], ['commerce', 'Commerce'], ['pricing', 'Plan pricing'],
      ['permissions', 'Permissions'], ['presets', 'Presets'], ['history', `History (${history.total || 0})`],
    ].map(([key, label]) => <button key={key} type="button" onClick={() => setActiveSection(key)} className={`min-h-10 whitespace-nowrap rounded-xl px-3 text-xs font-black transition ${activeSection === key ? 'bg-wine text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-rose-50'}`} aria-current={activeSection === key ? 'page' : undefined}>{label}</button>)}</nav>
    <div className="admin-card sticky top-2 z-30 flex flex-wrap items-center justify-between gap-4 border-wine/10 bg-white/95 p-4 shadow-sm backdrop-blur sm:p-5">
      <div><h2 className="text-lg font-bold">{configuration.locked ? 'Configuration locked' : 'Owner editing enabled'}</h2><p className="mt-1 text-xs text-slate-500">Revision {configuration.revision} · {configuration.structure.industry} · {dirty ? 'Unsaved edits' : 'Saved'}</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || configuration.locked || !past.length} onClick={undo} className="admin-btn-ghost">Undo</button><button type="button" disabled={busy || configuration.locked || !future.length} onClick={redo} className="admin-btn-ghost">Redo</button><button type="button" disabled={busy || dirty} onClick={requestLockToggle} className="admin-btn-ghost">{configuration.locked ? 'Unlock configuration' : 'Lock for handover'}</button><button type="button" disabled={busy || configuration.locked || !dirty} onClick={() => reviewChanges()} className="admin-btn">Review &amp; publish</button></div>
    </div>
    {message && <p role={messageTone === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-4 text-sm ${messageTone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : messageTone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-wine'}`}>{message}</p>}
    {recovery && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div><strong>Recovered browser draft available</strong><p className="mt-1 text-xs">Saved {recovery.savedAt ? new Date(recovery.savedAt).toLocaleString() : 'recently'} from revision {recovery.revision}.</p></div><div className="flex gap-2"><button type="button" className="admin-btn-ghost" onClick={() => { localStorage.removeItem('samira_master_configuration_draft_v2'); setRecovery(null); }}>Discard</button><button type="button" className="admin-btn" disabled={configuration.locked} onClick={() => { setDraft(recovery.structure); setRecovery(null); }}>Restore draft</button></div></div>}
    <div className={activeSection === 'overview' ? 'space-y-5' : 'hidden'}>
    <GovernanceOverview configuration={configuration} draft={draft} dirty={dirty} onNavigate={setActiveSection} />
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">Industry project generation is isolated from this store. It downloads a complete new source project with its own name, folder, environment setup and database placeholder. Store products, orders, settings and all Master Control source remain outside the generated package.</div>
    <section className="admin-card min-w-0 space-y-4 p-5" aria-labelledby="project-blueprints-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-wine">New standalone project</p><h2 id="project-blueprints-title" className="mt-1 text-lg font-bold">Choose a business blueprint</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Each option creates a complete independent project ZIP. Extract it into a new folder, connect a new database and deploy it under the client’s own name.</p></div>
        <span className="rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-700">No current-store changes</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{workspace.builtins.map((preset) => <button key={preset.id} type="button" disabled={busy || projectBusy} className="group rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-wine/40 hover:shadow-md disabled:opacity-60" onClick={() => openProjectBuilder(preset)}><span className="flex items-start justify-between gap-3"><strong className="block">{preset.name}</strong><span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f7edf0] text-wine transition group-hover:bg-wine group-hover:text-white">→</span></span><span className="mt-2 block text-xs leading-5 text-slate-500">{preset.attributes?.length || 0} fields · {preset.categoryDefinitions?.length || preset.defaultCategories?.length || 0} categories · {preset.variantConfig?.attributes?.join(' × ') || 'product stock'}</span><span className="mt-3 inline-block text-[10px] font-black uppercase tracking-wider text-wine">Generate new project</span></button>)}</div>
    </section>
    </div>
    {activeSection === 'pricing' && <PricingEditor value={pricingDraft} onChange={setPricingDraft} dirty={pricingDirty} busy={busy} reason={pricingReason} setReason={setPricingReason} onSave={requestPricingSave} />}
    <fieldset hidden={!['schema', 'categories', 'commerce', 'permissions'].includes(activeSection)} disabled={busy || configuration.locked} className="admin-card min-w-0 space-y-5 p-5 disabled:opacity-60">
      <legend className="px-2 text-lg font-bold">Current installation structure</legend>
      <p className="text-xs leading-5 text-slate-500">Clients enter values; only you change definitions. Used definitions cannot be removed until affected products are reviewed. Fashion retains its existing sizing flow.</p>
      {activeSection === 'schema' && <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-bold">Product attributes ({draft.attributes.length}/80)</h2><p className="mt-1 text-xs text-slate-500">Fields render automatically in product forms and customer specifications.</p></div><div className="flex w-full gap-2 sm:w-auto"><input aria-label="Search product attributes" value={schemaSearch} onChange={(event) => setSchemaSearch(event.target.value)} placeholder="Search fields…" className="h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm sm:w-56" /><button type="button" disabled={draft.attributes.length >= 80} onClick={() => setDraft((current) => ({ ...current, attributes: [...current.attributes, { key: '', label: '', type: 'text', unit: '', required: false, filterable: false, searchable: true, showOnCard: false, showOnDetail: true, showInSpecifications: true, variant: false, options: [], defaultValue: '', group: 'Specifications', validation: {} }] }))} className="admin-btn-ghost">Add attribute</button></div></div>
      <div className="flex flex-wrap gap-2"><button type="button" className="admin-btn-ghost" onClick={() => document.querySelectorAll('[data-master-attribute]').forEach((item) => { item.open = true; })}>Expand all</button><button type="button" className="admin-btn-ghost" onClick={() => document.querySelectorAll('[data-master-attribute]').forEach((item) => { item.open = false; })}>Collapse all</button></div><div className="space-y-3">{draft.attributes.map((attribute, index) => ({ attribute, index })).filter(({ attribute }) => !schemaSearch.trim() || `${attribute.label} ${attribute.key} ${attribute.group}`.toLowerCase().includes(schemaSearch.trim().toLowerCase())).map(({ attribute, index }) => <AttributeEditor key={(attribute.key || 'new') + '-' + index} attribute={attribute} saved={(configuration.structure.attributes || []).some((item) => item.key === attribute.key)} index={index} total={draft.attributes.length} edit={editAttribute} editValidation={editAttributeValidation} duplicate={() => duplicateAttribute(index)} move={(direction) => moveAttribute(index, direction)} remove={() => setDraft((current) => ({ ...current, attributes: current.attributes.filter((_, position) => position !== index) }))} />)}</div></section>}
      {activeSection === 'categories' && <MasterCategoryStructureEditor draft={draft} setDraft={setDraft} edit={editCategory} />}
      {activeSection === 'commerce' && <CommerceEditor draft={draft} setDraft={setDraft} />}
      {activeSection === 'permissions' && <PermissionsEditor draft={draft} setDraft={setDraft} />}
    </fieldset>
    <div className={activeSection === 'presets' ? 'grid min-w-0 gap-5 xl:grid-cols-2' : 'hidden'}>
      <div className="admin-card space-y-4 p-5"><h2 className="text-lg font-bold">Owner templates</h2><p className="text-xs leading-5 text-slate-500">Export structure for another isolated installation. Visual themes remain in Website Designer. No customer data or credentials are included.</p>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={exportTemplate} className="admin-btn-ghost">Export structure</button><button type="button" disabled={busy || configuration.locked} onClick={() => file.current?.click()} className="admin-btn-ghost">Import structure</button><input ref={file} aria-label="Import store template" type="file" accept=".json,application/json" hidden onChange={importTemplate} /></div>
        <Field label="New preset name" value={presetName} onChange={setPresetName} max={80} />
        <button type="button" disabled={busy || !presetName.trim()} className="admin-btn" onClick={() => run(async () => { const preset = await api.post('/master/clone', { name: presetName, structure: draft }); setWorkspace((current) => ({ ...current, presets: [preset, ...current.presets] })); setSelectedPresetId(preset._id); setPresetName(''); setMessage('Reusable industry preset saved. Store configuration is unchanged.'); })}>Save editor as private preset</button>
        <div className="max-h-[32rem] space-y-2 overflow-y-auto">{workspace.presets.map((preset) => <div key={preset._id} className={`rounded-xl border p-3 ${selectedPresetId === preset._id ? 'border-wine bg-rose-50' : preset.archivedAt ? 'border-dashed bg-slate-50 opacity-80' : 'bg-white'}`}><div className="flex items-center justify-between gap-2"><button type="button" disabled={busy || configuration.locked || Boolean(preset.archivedAt)} onClick={() => applyPreset(preset.structure, preset._id)} className="min-w-0 truncate text-left text-sm font-bold">{preset.name}<span className="mt-1 block text-[10px] font-semibold text-slate-400">{preset.key || preset.structure?.industry} · revision {preset.revision || 1}</span></button><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${preset.archivedAt ? 'bg-slate-200 text-slate-600' : preset.isActive === false ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{preset.archivedAt ? 'Archived' : preset.isActive === false ? 'Inactive' : 'Live'}</span></div><div className="mt-3 flex flex-wrap gap-2">{preset.archivedAt ? <button type="button" disabled={busy} className="text-xs font-bold text-wine underline" onClick={() => restorePreset(preset)}>Restore preset</button> : <><button type="button" disabled={busy || configuration.locked} className="text-xs font-bold text-wine underline" onClick={() => applyPreset(preset.structure, preset._id)}>Edit</button><button type="button" disabled={busy || configuration.locked || selectedPresetId !== preset._id} className="text-xs font-bold text-wine underline disabled:text-slate-300" onClick={() => run(async () => { const saved = await api.patch('/master/presets/' + preset._id, { revision: preset.revision, structure: draft }); setWorkspace((current) => ({ ...current, presets: current.presets.map((item) => item._id === preset._id ? saved : item) })); setMessage('Preset version saved. Active stores remain unchanged until explicitly converted.'); setMessageTone('success'); })}>Save changes</button><button type="button" disabled={busy} className="text-xs font-bold text-wine underline" onClick={() => run(async () => { const duplicated = await api.post(`/master/presets/${preset._id}/duplicate`, {}); setWorkspace((current) => ({ ...current, presets: [duplicated, ...current.presets] })); setMessage('Industry preset duplicated.'); setMessageTone('success'); })}>Duplicate</button><button type="button" disabled={busy} className="text-xs font-bold text-wine underline" onClick={() => run(async () => { const saved = await api.patch('/master/presets/' + preset._id, { revision: preset.revision, isActive: preset.isActive === false }); setWorkspace((current) => ({ ...current, presets: current.presets.map((item) => item._id === preset._id ? saved : item) })); })}>{preset.isActive === false ? 'Activate' : 'Deactivate'}</button><button type="button" disabled={busy} className="text-xs font-bold text-slate-600 underline" onClick={() => inspectPresetUsage(preset)}>View usage</button><button type="button" disabled={busy} className="text-xs font-bold text-red-600 underline" aria-label={'Archive preset ' + preset.name} onClick={() => setConfirmation({ title: `Archive ${preset.name}?`, body: 'The preset will stop appearing for new stores. Existing stores keep their copied configuration and usage references remain available.', confirmLabel: 'Archive preset', danger: true, onConfirm: () => archivePreset(preset) })}>Archive</button></>}</div></div>)}</div>
        {presetUsage && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950"><strong>{presetUsage.preset.name} usage</strong><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><SmallMetric label="Active stores" value={presetUsage.usage.activeStores} /><SmallMetric label="Saved copies" value={presetUsage.usage.savedConfigurations} /><SmallMetric label="Installations" value={presetUsage.usage.installations} /><SmallMetric label="History" value={presetUsage.usage.historyReferences} /></div></div>}
        <div className="flex flex-wrap gap-4"><a href="/admin/customization" className="inline-block text-sm font-bold text-wine underline">Open owner-only Website Designer</a><a href="/master/stores" className="inline-block text-sm font-bold text-wine underline">Manage store portfolio</a></div>
      </div>
      <div className="admin-card space-y-4 p-5"><h2 className="text-lg font-bold">Single-installation handover</h2><p className="text-xs leading-5 text-slate-500">Use this only when the complete deployment belongs to one client. Multi-store owners and subscriptions are managed through Store Portfolio and Client Control.</p>
        <Field label="Client name" value={client.name} onChange={(name) => setClient((current) => ({ ...current, name }))} max={80} />
        <Field label="Client mobile number" value={client.phone} onChange={(phone) => setClient((current) => ({ ...current, phone }))} max={16} />
        <button type="button" disabled={busy || !configuration.locked || dirty || client.name.trim().length < 2 || client.phone.replace(/\D/g, '').length < 10} className="admin-btn" onClick={() => setConfirmation({ title: 'Grant installation admin access?', body: `${client.name} will receive admin access for this single installation using mobile ${client.phone}. Master Owner access is never shared.`, confirmLabel: 'Grant admin access', onConfirm: () => run(async () => { await api.post('/master/client-admins', client); await load(); setClient({ name: '', phone: '' }); setMessage('Client access granted. Ask the client to verify their mobile OTP.'); setMessageTone('success'); }) })}>Grant client admin access</button>
        {!configuration.locked && <p className="text-xs text-amber-800">Lock the configuration before granting access.</p>}
        <div className="max-h-60 space-y-2 overflow-y-auto">{workspace.admins.map((admin) => <div key={admin._id} className="rounded-lg border p-3 text-sm"><strong>{admin.name || 'Store admin'}</strong><p className="text-xs text-slate-500">{admin.phone} · {admin.systemRole === 'MASTER_OWNER' ? 'Master Owner' : 'Installation admin'}{admin.isBlocked ? ' · Blocked' : ''}</p></div>)}</div>
        <div className="flex flex-wrap gap-3 border-t pt-3 text-xs font-bold text-wine"><a href="/master/stores" className="underline">Open Store Portfolio</a><a href="/master/clients" className="underline">Open Client Control</a></div>
      </div>
    </div>
    {activeSection === 'history' && <HistoryPanel value={history} query={historyQuery} setQuery={setHistoryQuery} busy={busy} locked={configuration.locked} onSearch={() => run(() => loadHistory(1, historyQuery))} onPage={(page) => run(() => loadHistory(page, historyQuery))} onRestore={restoreVersionDraft} />}
    <button type="button" disabled={busy} className="admin-btn-ghost" onClick={() => dirty ? setConfirmation({ title: 'Discard browser draft?', body: 'All unsaved structural edits in this browser will be removed and the latest server revision will be loaded.', confirmLabel: 'Discard and reload', danger: true, onConfirm: () => run(load) }) : run(load)}>Reload saved configuration</button>
    {projectBuilder && <ProjectGeneratorDialog value={projectBuilder} preview={projectPreview} busy={projectBusy} error={projectError} onChange={updateProjectBuilder} onPreview={reviewProject} onDownload={downloadProject} onClose={() => { if (!projectBusy) setProjectBuilder(null); }} />}
    {impact && <ImpactDialog impact={impact} note={publishNote} setNote={setPublishNote} busy={busy} onClose={() => !busy && setImpact(null)} onPublish={publish} />}
    {confirmation && <ConfirmDialog value={confirmation} busy={busy} onClose={() => !busy && setConfirmation(null)} onConfirm={async () => { const action = confirmation.onConfirm; setConfirmation(null); await action(); }} />}
  </section>;
}

function ProjectGeneratorDialog({ value, preview, busy, error, onChange, onPreview, onDownload, onClose }) {
  const ready = value.companyName.trim().length >= 2 && (value.projectName.trim().length >= 2 || value.companyName.trim().length >= 2);
  const dialogRef = useRef(null);
  useDialogFocusTrap(dialogRef, onClose, busy);
  return <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="project-generator-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-[#fffaf5] shadow-2xl sm:max-w-2xl sm:rounded-[1.75rem]">
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

function AttributeEditor({ attribute, saved, index, total, edit, editValidation, duplicate, move, remove }) {
  const numeric = ['number', 'measurement', 'range'].includes(attribute.type);
  return <details data-master-attribute className="rounded-2xl border bg-white" open={index < 2}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4"><span className="min-w-0"><strong className="block truncate text-sm">{attribute.label || 'New attribute'}</strong><span className="mt-1 block truncate text-[11px] text-slate-500">{attribute.key || 'field_key'} · {attribute.type || 'text'}{attribute.variant ? ' · variant' : ''}{attribute.required ? ' · required' : ''}</span></span><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${saved ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{saved ? 'Existing · review impact' : 'New · safe addition'}</span></summary>
    <div className="grid gap-3 border-t p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Field key" value={attribute.key} onChange={(value) => edit(index, 'key', value)} max={40} />
      <Field label="Customer-facing label" value={attribute.label} onChange={(value) => edit(index, 'label', value)} max={80} />
      <label className="grid min-w-0 gap-2 text-xs font-bold">Field type<select value={attribute.type || 'text'} onChange={(event) => edit(index, 'type', event.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm font-normal">{ATTRIBUTE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <Field label="Group / section" value={attribute.group || ''} onChange={(value) => edit(index, 'group', value)} max={60} />
      <Field label="Unit" value={attribute.unit || ''} onChange={(value) => edit(index, 'unit', value)} max={20} />
      <Field label="Default value" value={attribute.defaultValue ?? ''} onChange={(value) => edit(index, 'defaultValue', value)} max={500} />
      {['dropdown', 'multi_select'].includes(attribute.type) && <div className="sm:col-span-2 lg:col-span-3"><TokenField label="Options" values={attribute.options || []} onChange={(values) => edit(index, 'options', values)} limit={100} /></div>}
      {numeric && <><Field label="Minimum" value={attribute.validation?.min ?? ''} onChange={(value) => editValidation(index, 'min', value === '' ? undefined : Number(value))} /><Field label="Maximum" value={attribute.validation?.max ?? ''} onChange={(value) => editValidation(index, 'max', value === '' ? undefined : Number(value))} /></>}
      {!numeric && !['boolean', 'date', 'image'].includes(attribute.type) && <><Field label="Minimum length" value={attribute.validation?.minLength ?? ''} onChange={(value) => editValidation(index, 'minLength', value === '' ? undefined : Number(value))} /><Field label="Maximum length" value={attribute.validation?.maxLength ?? ''} onChange={(value) => editValidation(index, 'maxLength', value === '' ? undefined : Number(value))} /></>}
           <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-4">{[
        ['required', 'Required'], ['filterable', 'Filter'], ['searchable', 'Search'], ['showOnCard', 'Product card'],
        ['showOnDetail', 'Product detail'], ['showInSpecifications', 'Specification table'], ['variant', 'Variant option'],
      ].map(([key, label]) => <label key={key} className="flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold"><input type="checkbox" checked={attribute[key] === true || (['searchable', 'showOnDetail', 'showInSpecifications'].includes(key) && attribute[key] !== false)} onChange={(event) => edit(index, key, event.target.checked)} />{label}</label>)}</div>
      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4"><button type="button" disabled={index === 0} onClick={() => move(-1)} className="admin-btn-ghost">Move up</button><button type="button" disabled={index >= total - 1} onClick={() => move(1)} className="admin-btn-ghost">Move down</button><button type="button" onClick={duplicate} className="admin-btn-ghost">Duplicate</button><button type="button" aria-label={'Remove ' + (attribute.label || 'attribute')} onClick={remove} className="admin-btn-ghost text-red-700">Deactivate / remove from draft</button></div>
    </div>
  </details>;
}

function StructureSummary({ draft }) {
  const items = [
    ['Variants', draft.variantConfig?.attributes?.join(' × ') || 'Product level'], ['Inventory', draft.inventory?.mode || 'Product'],
    ['Product page', `${draft.productSections?.length || 0} sections`], ['Filters', `${draft.filters?.length || 0} configured`],
    ['Comparison', draft.features?.comparison ? 'Enabled' : 'Disabled'], ['Perishable stock', draft.features?.perishable ? 'Enabled' : 'Disabled'],
  ];
  return <section><h2 className="mb-3 font-bold">Store behaviour</h2><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{items.map(([label, value]) => <div key={label} className="rounded-2xl border bg-white p-4"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>)}</div></section>;
}

function GovernanceOverview({ configuration, draft, dirty, onNavigate }) {
  const required = draft.attributes?.filter((item) => item.required).length || 0;
  const variants = draft.attributes?.filter((item) => item.variant).length || 0;
  const steps = [
    ['Draft', dirty || !configuration.locked, dirty ? 'Local changes ready for review' : 'No unpublished changes'],
    ['Validate', !dirty, dirty ? 'Run impact review before publish' : 'Latest structure is validated'],
    ['Publish', !dirty, `Active revision ${configuration.revision}`],
    ['Protect', configuration.locked, configuration.locked ? 'Locked for handover' : 'Owner editing is enabled'],
  ];
  return <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><section className="admin-card overflow-hidden"><div className="bg-gradient-to-br from-[#64152f] via-[#821f41] to-[#a13f62] p-6 text-white sm:p-8"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-100">Active commerce blueprint</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-3xl font-black capitalize">{draft.name || draft.industry}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-rose-50">One governed source for catalog fields, variants, commerce behavior and client editing boundaries.</p></div><span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">Structure v{draft.version || 2}</span></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><SmallMetric label="Attributes" value={draft.attributes?.length || 0} dark /><SmallMetric label="Required" value={required} dark /><SmallMetric label="Categories" value={draft.categoryDefinitions?.length || 0} dark /><SmallMetric label="Variant fields" value={variants} dark /></div></div><div className="grid gap-3 p-5 sm:grid-cols-4">{steps.map(([label, complete, note], index) => <div key={label} className={`rounded-2xl border p-4 ${complete ? 'border-emerald-200 bg-emerald-50' : 'bg-white'}`}><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{index + 1}. {label}</span><strong className="mt-2 block text-sm">{complete ? 'Ready' : 'Pending'}</strong><p className="mt-1 text-[11px] leading-4 text-slate-500">{note}</p></div>)}</div></section><aside className="admin-card p-5"><h2 className="text-lg font-black">Configuration health</h2><StructureSummary draft={draft} /><div className="mt-5 grid gap-2"><button type="button" onClick={() => onNavigate('schema')} className="admin-btn-ghost justify-between">Review product schema <span>→</span></button><button type="button" onClick={() => onNavigate('commerce')} className="admin-btn-ghost justify-between">Review commerce rules <span>→</span></button><button type="button" onClick={() => onNavigate('permissions')} className="admin-btn-ghost justify-between">Review client access <span>→</span></button></div></aside></div>;
}

const FEATURE_OPTIONS = [
  ['sizing', 'Sizes and size charts', 'Adds garment or footwear size selection.'],
  ['specifications', 'Product specifications', 'Keeps configured product facts available.'],
  ['comparison', 'Product comparison', 'Allows compatible products to be compared.'],
  ['perishable', 'Perishable products', 'Enables expiry and batch-aware catalog behavior.'],
  ['customization', 'Product customization', 'Supports made-to-order product choices.'],
  ['technical', 'Technical specifications', 'Optimizes product details for technical data.'],
];
const CORE_CARD_FIELDS = [['name', 'Product name'], ['price', 'Selling price'], ['originalPrice', 'Original price'], ['discountPercentage', 'Discount'], ['rating', 'Rating'], ['stock', 'Stock'], ['category', 'Category'], ['shortDescription', 'Short description']];

function CommerceEditor({ draft, setDraft }) {
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const changeObject = (section, key, value) => setDraft((current) => ({ ...current, [section]: { ...(current[section] || {}), [key]: value } }));
  const allAttributes = [...(draft.attributes || []), ...(draft.categoryDefinitions || []).flatMap((category) => (category.attributes || []).filter((item) => typeof item === 'object'))];
  const filterCandidates = [{ key: 'category', label: 'Category' }, { key: 'price', label: 'Price' }, { key: 'availability', label: 'Availability' }, { key: 'rating', label: 'Rating' }, ...allAttributes.filter((item) => item.filterable).map((item) => ({ key: item.key, label: item.label }))].filter((item, index, rows) => rows.findIndex((row) => row.key === item.key) === index);
  const selectedFilters = new Set((draft.filters || []).map((item) => typeof item === 'string' ? item : item.key));
  const toggleFilter = (candidate) => setDraft((current) => {
    const filters = current.filters || [];
    const exists = filters.some((item) => (typeof item === 'string' ? item : item.key) === candidate.key);
    return { ...current, filters: exists ? filters.filter((item) => (typeof item === 'string' ? item : item.key) !== candidate.key) : [...filters, { key: candidate.key, label: candidate.label, type: candidate.key === 'price' ? 'range' : 'value', enabled: true }] };
  });
  const updateSort = (index, key, value) => setDraft((current) => ({ ...current, sortingOptions: (current.sortingOptions || []).map((item, position) => position === index ? { ...item, [key]: value } : item) }));
  return <div className="space-y-5"><section className="rounded-2xl border bg-[#fbf8f4] p-4 sm:p-5"><SectionTitle title="Feature profile" note="Switches control which catalog and product-detail capabilities are generated." /><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{FEATURE_OPTIONS.map(([key, label, note]) => <ToggleCard key={key} label={label} note={note} checked={draft.features?.[key] === true} disabled={key === 'specifications'} onChange={(checked) => changeObject('features', key, checked)} />)}</div></section>
    <section className="grid gap-5 xl:grid-cols-2"><ConfigPanel title="Variants and SKU" note="Choose fields already marked as variant options in Product schema."><ToggleCard label="Enable structured variants" note="Track stock per valid option combination." checked={draft.variantConfig?.enabled === true} onChange={(checked) => changeObject('variantConfig', 'enabled', checked)} /><div className="mt-4"><TokenField label="Variant attribute keys" values={draft.variantConfig?.attributes || []} suggestions={allAttributes.filter((item) => item.variant).map((item) => item.key)} onChange={(values) => changeObject('variantConfig', 'attributes', values)} limit={6} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Maximum combinations" value={draft.variantConfig?.maxCombinations ?? 120} onChange={(value) => changeObject('variantConfig', 'maxCombinations', Number(value))} /><Field label="SKU pattern" value={draft.variantConfig?.skuPattern || '{base}-{options}'} onChange={(value) => changeObject('variantConfig', 'skuPattern', value)} max={80} /></div></ConfigPanel>
      <ConfigPanel title="Inventory policy" note="Defaults used by product and inventory workflows."><label className="grid gap-2 text-xs font-bold">Stock tracking level<select value={draft.inventory?.mode || 'product'} onChange={(event) => changeObject('inventory', 'mode', event.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm font-normal"><option value="product">Product</option><option value="variant">Variant</option><option value="batch">Batch</option></select></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><ToggleCard label="Track expiry" checked={draft.inventory?.trackExpiry === true} onChange={(checked) => changeObject('inventory', 'trackExpiry', checked)} /><ToggleCard label="Allow backorders" checked={draft.inventory?.allowBackorder === true} onChange={(checked) => changeObject('inventory', 'allowBackorder', checked)} /><Field label="Default low-stock threshold" value={draft.inventory?.lowStockDefault ?? 5} onChange={(value) => changeObject('inventory', 'lowStockDefault', Number(value))} /></div></ConfigPanel></section>
    <section className="grid gap-5 xl:grid-cols-2"><ConfigPanel title="Delivery behavior"><div className="grid gap-3">{[['requiresWeight', 'Require shipping weight'], ['supportsScheduledDelivery', 'Scheduled delivery'], ['supportsLocalOnly', 'Local-delivery mode']].map(([key, label]) => <ToggleCard key={key} label={label} checked={draft.delivery?.[key] === true} onChange={(checked) => changeObject('delivery', key, checked)} />)}</div></ConfigPanel><ConfigPanel title="Returns behavior"><label className="grid gap-2 text-xs font-bold">Default return mode<select value={draft.returns?.mode || 'return'} onChange={(event) => changeObject('returns', 'mode', event.target.value)} className="h-10 rounded-xl border bg-white px-3 text-sm font-normal"><option value="return">Return and refund</option><option value="replacement">Replacement only</option><option value="non-returnable">Non-returnable</option></select></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Default window (days)" value={draft.returns?.defaultWindowDays ?? 7} onChange={(value) => changeObject('returns', 'defaultWindowDays', Number(value))} /><ToggleCard label="Customized items non-returnable" checked={draft.returns?.nonReturnableWhenCustomized === true} onChange={(checked) => changeObject('returns', 'nonReturnableWhenCustomized', checked)} /></div></ConfigPanel></section>
    <ConfigPanel title="Catalog discovery" note="Only configured fields can be selected. Broken filter references are rejected by the backend."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{filterCandidates.map((item) => <label key={item.key} className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${selectedFilters.has(item.key) ? 'border-wine bg-rose-50 text-wine' : 'bg-white'}`}><input type="checkbox" checked={selectedFilters.has(item.key)} onChange={() => toggleFilter(item)} />{item.label}</label>)}</div><div className="mt-5"><SectionTitle title="Sorting choices" note="Labels appear in the storefront sort menu." /><div className="mt-3 grid gap-2">{(draft.sortingOptions || []).map((item, index) => <div key={`${item.key}-${index}`} className="grid gap-2 rounded-xl border bg-white p-3 sm:grid-cols-[1fr_1fr_auto]"><Field label="Key" value={item.key} onChange={(value) => updateSort(index, 'key', value)} max={40} /><Field label="Customer label" value={item.label} onChange={(value) => updateSort(index, 'label', value)} max={80} /><button type="button" className="self-end text-xs font-bold text-red-700 underline" onClick={() => setDraft((current) => ({ ...current, sortingOptions: current.sortingOptions.filter((_, position) => position !== index) }))}>Remove</button></div>)}<button type="button" className="admin-btn-ghost w-fit" disabled={(draft.sortingOptions || []).length >= 12} onClick={() => setDraft((current) => ({ ...current, sortingOptions: [...(current.sortingOptions || []), { key: '', label: '' }] }))}>Add sorting choice</button></div></div></ConfigPanel>
    <section className="grid gap-5 xl:grid-cols-2"><ConfigPanel title="Product card"><div className="grid grid-cols-2 gap-2">{CORE_CARD_FIELDS.map(([key, label]) => <CheckChip key={key} label={label} checked={(draft.productCard?.fields || []).includes(key)} onChange={() => changeObject('productCard', 'fields', toggleValue(draft.productCard?.fields || [], key))} />)}</div><div className="mt-4"><TokenField label="Attribute keys on card" values={draft.productCard?.attributeKeys || []} suggestions={(draft.attributes || []).map((item) => item.key)} onChange={(values) => changeObject('productCard', 'attributeKeys', values)} limit={4} /></div><ProductCardPreview draft={draft} /></ConfigPanel><ConfigPanel title="Search and SEO"><Field label="Product title pattern" value={draft.seo?.titlePattern || '{product} | {store}'} onChange={(value) => changeObject('seo', 'titlePattern', value)} max={120} /><div className="mt-4"><TokenField label="Description attribute keys" values={draft.seo?.descriptionAttributes || []} suggestions={(draft.attributes || []).map((item) => item.key)} onChange={(values) => changeObject('seo', 'descriptionAttributes', values)} limit={10} /></div></ConfigPanel></section>
    <section className="grid gap-5 xl:grid-cols-2"><ConfigPanel title="Storefront sections"><div className="space-y-4"><TokenField label="Product detail sections" values={draft.productSections || []} onChange={(values) => setDraft((current) => ({ ...current, productSections: values }))} limit={30} /><TokenField label="Homepage sections" values={draft.homepageSections || []} onChange={(values) => setDraft((current) => ({ ...current, homepageSections: values }))} limit={30} /></div></ConfigPanel><ConfigPanel title="Merchandising"><div className="space-y-4"><TokenField label="Recommendation groups" values={draft.recommendationGroups || []} onChange={(values) => setDraft((current) => ({ ...current, recommendationGroups: values }))} limit={30} /><TokenField label="Product badges" values={draft.badges || []} onChange={(values) => setDraft((current) => ({ ...current, badges: values }))} limit={30} /><TokenField label="Measurement units" values={draft.measurementUnits || []} onChange={(values) => setDraft((current) => ({ ...current, measurementUnits: values }))} limit={30} /></div></ConfigPanel></section>
    <ConfigPanel title="Generated product-form preview" note="Preview how configured fields group on desktop and mobile before publishing."><div className="mb-4 flex gap-2" role="group" aria-label="Preview device"><button type="button" className={previewDevice === 'desktop' ? 'admin-btn' : 'admin-btn-ghost'} onClick={() => setPreviewDevice('desktop')}>Desktop</button><button type="button" className={previewDevice === 'mobile' ? 'admin-btn' : 'admin-btn-ghost'} onClick={() => setPreviewDevice('mobile')}>Mobile</button></div><ProductFormPreview draft={draft} device={previewDevice} /></ConfigPanel>
  </div>;
}

const PERMISSIONS = [
  ['branding', 'Brand identity', 'Logo, company name and store contact details.'], ['websiteDesign', 'Website Designer', 'Layout, theme and storefront appearance.'],
  ['content', 'Store Content', 'Homepage and page wording approved for the client.'], ['catalog', 'Catalog values', 'Products, categories, drafts and inventory values.'],
  ['pricing', 'Pricing', 'Selling prices, MRP and product-level commercial values.'], ['inventory', 'Inventory operations', 'Stock adjustments, purchase orders and exports.'],
  ['orders', 'Order operations', 'Order details, status updates, labels and fulfilment.'], ['returns', 'Returns and exchanges', 'Review, pickup, quality checks and refunds.'],
  ['reviews', 'Review moderation', 'Replies, moderation, reports and review exports.'], ['discounts', 'Discounts and campaigns', 'Coupons, banners and campaign offers.'],
  ['payments', 'Payment settings', 'Payment methods and gateway settings.'], ['shipping', 'Shipping settings', 'Courier and delivery configuration.'],
  ['social', 'Social workspace', 'Social imports, messages and publishing.'], ['reports', 'Reports and exports', 'Business reporting and file exports.'],
  ['customers', 'Customer data', 'Customer profiles and operational notes.'], ['staff', 'Staff management', 'Team members, roles and access.'],
  ['integrations', 'Integrations', 'Provider connections and protected integration settings.'],
];
function PermissionsEditor({ draft, setDraft }) {
  const permissions = draft.clientPermissions || {};
  const setAll = (value) => setDraft((current) => ({ ...current, clientPermissions: Object.fromEntries(PERMISSIONS.map(([key]) => [key, value])) }));
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><SectionTitle title="Client capability boundaries" note="These permissions control delegated administration. Subscription plan entitlements remain separate." /><div className="flex gap-2"><button type="button" className="admin-btn-ghost" onClick={() => setAll(false)}>Disable all</button><button type="button" className="admin-btn-ghost" onClick={() => setAll(true)}>Enable all</button></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{PERMISSIONS.map(([key, label, note]) => <ToggleCard key={key} label={label} note={note} checked={permissions[key] !== false} onChange={(checked) => setDraft((current) => ({ ...current, clientPermissions: { ...(current.clientPermissions || {}), [key]: checked } }))} />)}</div><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-950"><strong>Server enforced:</strong> hiding a browser button is never treated as authorization. Every sensitive route must continue checking the signed user, store membership and applicable permission on the backend.</div></div>;
}

function HistoryPanel({ value, query, setQuery, busy, locked, onSearch, onPage, onRestore }) {
  return <section className="admin-card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><SectionTitle title="Configuration releases" note="Immutable snapshots show what changed, who published it and how to prepare a rollback." /><form className="flex w-full gap-2 sm:w-auto" onSubmit={(event) => { event.preventDefault(); onSearch(); }}><input aria-label="Search configuration history" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search note or type" className="h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm sm:w-56" /><button className="admin-btn-ghost" type="submit">Search</button></form></div><div className="mt-5 space-y-3">{value.items?.length ? value.items.map((entry) => <article key={entry.id || entry.revision} className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><strong>Revision {entry.revision}</strong><span className="rounded-full bg-[#f7edf0] px-2 py-1 text-[9px] font-black uppercase text-wine">{entry.kind || 'Publish'}</span>{entry.locked && <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase">Locked</span>}</div><p className="mt-1 text-xs text-slate-600">{entry.note || 'Configuration updated'}</p><p className="mt-1 text-[11px] text-slate-400">{entry.publishedBy?.name || 'Master owner'} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</p></div><button type="button" disabled={busy || locked} className="admin-btn-ghost" onClick={() => onRestore(entry)}>Restore as draft</button></div>{entry.changes?.length ? <details className="mt-3 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-black">View {entry.changes.length} change(s)</summary><div className="mt-3 space-y-2">{entry.changes.slice(0, 20).map((change, index) => <div key={`${change.path}-${index}`} className="grid gap-1 border-t pt-2 text-[11px] sm:grid-cols-[1fr_auto]"><span className="font-bold">{change.path}</span><span className={`font-black ${change.risk === 'BREAKING' ? 'text-red-700' : change.risk === 'REVIEW' ? 'text-amber-700' : 'text-emerald-700'}`}>{change.kind} · {change.risk}</span></div>)}</div></details> : null}</article>) : <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No matching configuration releases yet.</p>}</div><div className="mt-5 flex items-center justify-between"><p className="text-xs text-slate-500">Page {value.page || 1} of {value.pages || 1} · {value.total || 0} releases</p><div className="flex gap-2"><button type="button" className="admin-btn-ghost" disabled={busy || value.page <= 1} onClick={() => onPage(value.page - 1)}>Previous</button><button type="button" className="admin-btn-ghost" disabled={busy || value.page >= value.pages} onClick={() => onPage(value.page + 1)}>Next</button></div></div>{locked && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Unlock configuration before loading an older release as a draft.</p>}</section>;
}

function ImpactDialog({ impact, note, setNote, busy, onClose, onPublish }) {
  const [typed, setTyped] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const dialogRef = useRef(null);
  useDialogFocusTrap(dialogRef, onClose, busy);
  const requiresWord = impact.risk === 'BREAKING';
  const ready = (!requiresWord || typed === 'PUBLISH') && (impact.risk === 'SAFE' || note.trim().length >= 3);
  const download = () => { const { token: _token, proposed: _proposed, ...safe } = impact; const url = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = `configuration-impact-r${impact.revision}.json`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const downloadAffectedProducts = async () => {
    setExporting(true); setExportError('');
    try {
      const result = await api.post('/master/configuration/impact/products', { structure: impact.proposed, impactToken: impact.token, page: 1, limit: 10000 });
      const report = { revision: impact.revision, generatedAt: new Date().toISOString(), total: result.total, truncated: result.truncated, products: result.items };
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `configuration-products-to-review-r${impact.revision}.json`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setExportError(error.message || 'Unable to export affected products.'); }
    finally { setExporting(false); }
  };
  return <div className="fixed inset-0 z-[140] flex items-end bg-slate-950/55 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="impact-title" className="max-h-[94vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-[#fffaf5] shadow-2xl sm:max-w-4xl sm:rounded-[1.75rem]"><header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 p-5 backdrop-blur sm:px-7"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-wine">Validation complete · {impact.risk}</p><h2 id="impact-title" className="mt-1 text-2xl font-black">Review configuration impact</h2><p className="mt-1 text-xs text-slate-500">Based on active server revision {impact.revision}. Publishing preserves all existing records.</p></div><button type="button" onClick={onClose} disabled={busy || exporting} aria-label="Close impact review" className="grid h-10 w-10 place-items-center rounded-full border bg-white text-xl">×</button></header><div className="space-y-5 p-5 sm:p-7"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><SmallMetric label="Active products" value={impact.counts.products} /><SmallMetric label="Need review" value={impact.counts.productsNeedingReview} /><SmallMetric label="Drafts" value={impact.counts.drafts} /><SmallMetric label="Active orders" value={impact.counts.activeOrders} /></div>{impact.warnings?.length ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Review required</strong><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">{impact.warnings.map((item) => <li key={item}>{item}</li>)}</ul></div> : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Safe to publish.</strong> No catalog migration blockers were detected.</div>}<div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><ConfigPanel title={`Change summary (${impact.changes.length})`}><div className="max-h-72 space-y-2 overflow-y-auto">{impact.changes.length ? impact.changes.map((change, index) => <div key={`${change.path}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-xs"><span className="min-w-0 truncate font-bold">{change.path}</span><span className={`shrink-0 font-black ${change.risk === 'BREAKING' ? 'text-red-700' : change.risk === 'REVIEW' ? 'text-amber-700' : 'text-emerald-700'}`}>{change.kind} · {change.risk}</span></div>) : <p className="text-sm text-slate-500">No structural changes found.</p>}</div></ConfigPanel><ConfigPanel title="Release controls"><Field label="Publish note" value={note} onChange={setNote} max={240} placeholder="Reason for this change" />{requiresWord && <div className="mt-4"><Field label="Type PUBLISH to confirm breaking changes" value={typed} onChange={setTyped} max={20} /></div>}<div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong>{impact.estimatedMinutes} minute review estimate.</strong>{impact.maintenanceRecommended ? ' A maintenance window is recommended because variants or carts may be affected.' : ' The storefront can remain available.'}</div></ConfigPanel></div>{impact.examples?.length ? <details className="rounded-2xl border bg-white p-4"><summary className="cursor-pointer text-sm font-black">Example products to review ({impact.examples.length})</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{impact.examples.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-xs"><strong>{item.name}</strong><p className="mt-1 text-slate-500">{item.sku || 'No SKU'} · {item.categoryDefinitionKey || 'No category definition'}</p></div>)}</div></details> : null}{exportError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{exportError}</p>}<div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><button type="button" className="admin-btn-ghost" onClick={download}>Download impact report</button>{impact.counts.productsNeedingReview > 0 && <button type="button" className="admin-btn-ghost" disabled={exporting} onClick={downloadAffectedProducts}>{exporting ? 'Exporting…' : 'Export affected products'}</button>}</div><a href="/admin/products" className="text-xs font-black text-wine underline">Open catalog review</a></div></div><footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t bg-white/95 p-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7"><button type="button" className="admin-btn-ghost" disabled={busy || exporting} onClick={onClose}>Keep editing</button><button type="button" className="admin-btn" disabled={busy || exporting || !ready || !impact.changes.length} onClick={onPublish}>{busy ? 'Publishing…' : impact.kind === 'ROLLBACK' ? 'Publish restored version' : 'Publish configuration'}</button></footer></section></div>;
}

function ConfirmDialog({ value, busy, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  useDialogFocusTrap(dialogRef, onClose, busy);
  return <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 id="confirm-title" className="text-xl font-black">{value.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{value.body}</p><div className="mt-6 flex justify-end gap-2"><button type="button" disabled={busy} className="admin-btn-ghost" onClick={onClose}>Cancel</button><button type="button" autoFocus disabled={busy} className={`admin-btn ${value.danger ? 'bg-red-700' : ''}`} onClick={onConfirm}>{value.confirmLabel || 'Confirm'}</button></div></section></div>;
}

function useDialogFocusTrap(ref, onClose, busy) {
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const focusable = () => [...(dialog?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]') || [])];
    focusable()[0]?.focus();
    const handle = (event) => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable(); if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('keydown', handle); previous?.focus?.(); };
  }, [ref]);
}

function editablePricing(value) {
  if (!value) return null;
  return {
    revision: Number(value.revision || 0), currency: value.currency || 'INR', taxMode: value.taxMode || 'INCLUSIVE',
    gstPercent: Number(value.gstPercent ?? 18), updatedAt: value.updatedAt || null,
    plans: (value.plans || []).map((plan) => ({ ...plan, prices: {
      monthly: plan.prices?.monthly ?? '', yearly: plan.prices?.yearly ?? '', lifetime: plan.prices?.lifetime ?? '',
    } })),
  };
}

function pricingForm(value) {
  if (!value) return null;
  return {
    currency: 'INR', taxMode: value.taxMode || 'INCLUSIVE', gstPercent: Number(value.gstPercent),
    prices: Object.fromEntries((value.plans || []).map((plan) => [plan.id, {
      monthly: Number(plan.prices?.monthly), yearly: Number(plan.prices?.yearly), lifetime: Number(plan.prices?.lifetime),
    }])),
  };
}

function PricingEditor({ value, onChange, dirty, busy, reason, setReason, onSave }) {
  if (!value) return <section className="admin-card p-6" role="status">Loading plan pricing…</section>;
  const updatePrice = (planId, cycle, amount) => onChange((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === planId ? { ...plan, prices: { ...plan.prices, [cycle]: amount } } : plan) }));
  const amountsValid = value.plans.length > 0 && value.plans.every((plan) => ['monthly', 'yearly', 'lifetime'].every((cycle) => {
    const amount = Number(plan.prices?.[cycle]);
    return Number.isSafeInteger(amount) && amount >= 1 && amount <= 10000000;
  }));
  const gstValid = Number.isFinite(Number(value.gstPercent)) && Number(value.gstPercent) >= 0 && Number(value.gstPercent) <= 28;
  return <section className="admin-card min-w-0 space-y-5 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-wine">Platform owner pricing</p><h2 className="mt-1 text-2xl font-black">Subscription price book</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Set the official monthly, yearly and one-time lifetime prices. Seller checkout reads these amounts from the backend, so a browser cannot replace the payable amount.</p></div><span className="rounded-full bg-[#f7edf0] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-wine">Revision {value.revision}</span></div>
    <div className="grid gap-3 sm:grid-cols-3">{value.plans.map((plan) => {
      const saving = Math.max(0, Number(plan.prices?.monthly || 0) * 12 - Number(plan.prices?.yearly || 0));
      return <article key={plan.id} className="rounded-2xl border border-[#eadfd5] bg-white p-4 shadow-sm"><div className="min-h-16"><h3 className="text-lg font-black">{plan.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{plan.description}</p></div><div className="mt-4 grid gap-3">{['monthly', 'yearly', 'lifetime'].map((cycle) => <label key={cycle} className="grid gap-1.5 text-xs font-black capitalize">{cycle === 'lifetime' ? 'One-time lifetime' : cycle}<span className="flex h-11 items-center overflow-hidden rounded-xl border bg-white focus-within:border-wine"><span className="grid h-full w-11 shrink-0 place-items-center border-r bg-[#fbf8f4] text-slate-500">₹</span><input aria-label={`${plan.name} ${cycle} price`} type="number" min="1" max="10000000" step="1" inputMode="numeric" value={plan.prices?.[cycle] ?? ''} onChange={(event) => updatePrice(plan.id, cycle, event.target.value)} className="h-full min-w-0 flex-1 px-3 text-sm font-semibold outline-none" /></span></label>)}</div><p className={`mt-3 rounded-xl px-3 py-2 text-[11px] font-bold ${saving > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-500'}`}>{saving > 0 ? `Yearly saves ₹${saving.toLocaleString('en-IN')} against 12 monthly payments` : 'Yearly price has no saving against 12 monthly payments'}</p></article>;
    })}</div>
    <ConfigPanel title="Tax treatment" note="This controls the final Razorpay order amount for every new subscription checkout."><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2 text-xs font-bold">Currency<select aria-label="Subscription currency" disabled value={value.currency} className="h-11 rounded-xl border bg-slate-50 px-3 text-sm"><option value="INR">INR — Indian Rupee</option></select></label><label className="grid gap-2 text-xs font-bold">GST treatment<select aria-label="GST treatment" value={value.taxMode} onChange={(event) => onChange((current) => ({ ...current, taxMode: event.target.value }))} className="h-11 rounded-xl border bg-white px-3 text-sm"><option value="INCLUSIVE">Included in displayed price</option><option value="EXCLUSIVE">Added at checkout</option></select></label><label className="grid gap-2 text-xs font-bold">GST percentage<input aria-label="GST percentage" type="number" min="0" max="28" step="0.01" value={value.gstPercent} onChange={(event) => onChange((current) => ({ ...current, gstPercent: event.target.value }))} className="h-11 rounded-xl border bg-white px-3 text-sm" /></label></div></ConfigPanel>
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><strong>Price changes affect new checkout orders only.</strong> Active subscriptions and completed payment records retain their original amount. Manual access grants do not create a payment.</div>
    <div className="flex flex-col gap-4 rounded-2xl border bg-white p-4 sm:flex-row sm:items-end sm:justify-between"><label className="grid min-w-0 flex-1 gap-2 text-xs font-bold">Reason for pricing change<input aria-label="Reason for pricing change" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for the audit log" className="h-11 min-w-0 rounded-xl border px-3 text-sm font-normal" /></label><button type="button" className="admin-btn min-h-11" disabled={busy || !dirty || reason.trim().length < 3 || !amountsValid || !gstValid} onClick={onSave}>Review &amp; save prices</button></div>
    {!amountsValid && <p role="alert" className="text-xs font-bold text-red-700">Every plan needs a whole-rupee monthly, yearly and lifetime price.</p>}
    {value.updatedAt && <p className="text-right text-[10px] text-slate-400">Last updated {new Date(value.updatedAt).toLocaleString('en-IN')}</p>}
  </section>;
}

function ConfigPanel({ title, note, children }) { return <section className="rounded-2xl border bg-[#fbf8f4] p-4 sm:p-5"><SectionTitle title={title} note={note} /><div className="mt-4">{children}</div></section>; }
function SectionTitle({ title, note }) { return <div><h2 className="text-lg font-black">{title}</h2>{note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}</div>; }
function ToggleCard({ label, note, checked, disabled, onChange }) { return <label className={`flex min-h-16 items-start justify-between gap-3 rounded-2xl border bg-white p-4 ${checked ? 'border-wine/40 shadow-sm' : ''}`}><span><strong className="block text-sm">{label}</strong>{note && <span className="mt-1 block text-[11px] leading-4 text-slate-500">{note}</span>}</span><input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>; }
function CheckChip({ label, checked, onChange }) { return <label className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${checked ? 'border-wine bg-rose-50 text-wine' : 'bg-white'}`}><input type="checkbox" checked={checked} onChange={onChange} />{label}</label>; }
function TokenField({ label, values = [], suggestions = [], onChange, limit = 30 }) { const [entry, setEntry] = useState(''); const add = (raw) => { const next = String(raw || '').trim(); if (!next || values.includes(next) || values.length >= limit) return; onChange([...values, next]); setEntry(''); }; return <label className="grid gap-2 text-xs font-bold"><span>{label} <span className="font-normal text-slate-400">({values.length}/{limit})</span></span><span className="rounded-xl border bg-white p-2"><span className="flex flex-wrap gap-1.5">{values.map((value) => <span key={value} className="inline-flex items-center gap-1 rounded-full bg-[#f7edf0] px-2.5 py-1 text-[11px] font-bold text-wine">{value}<button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}>×</button></span>)}</span><input list={suggestions.length ? `${label.replace(/\W/g, '-')}-options` : undefined} value={entry} disabled={values.length >= limit} onChange={(event) => setEntry(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(entry); } }} onBlur={() => add(entry)} placeholder="Type and press Enter" className="mt-2 h-9 w-full border-0 bg-transparent px-1 text-sm font-normal outline-none" />{suggestions.length ? <datalist id={`${label.replace(/\W/g, '-')}-options`}>{suggestions.filter((item) => !values.includes(item)).map((item) => <option key={item} value={item} />)}</datalist> : null}</span></label>; }
function ProductCardPreview({ draft }) { return <div className="mt-4 overflow-hidden rounded-2xl border bg-white"><div className="aspect-[16/7] bg-gradient-to-br from-[#f4e2dc] via-[#fff8f2] to-[#ead3dd]" /><div className="p-4"><p className="truncate text-sm font-black">Example product name</p><p className="mt-1 text-xs text-slate-500">{(draft.productCard?.attributeKeys || []).slice(0, 2).join(' · ') || 'Configured catalog attributes'}</p><strong className="mt-2 block text-sm">₹1,299 <span className="text-xs text-emerald-700">20% OFF</span></strong></div></div>; }
function ProductFormPreview({ draft, device }) { const fields = (draft.attributes || []).slice(0, 8); return <div className={`mx-auto overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${device === 'mobile' ? 'max-w-sm' : 'w-full'}`}><div className="border-b bg-[#fff8f4] p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-wine">{device} preview</p><h3 className="mt-1 font-black">Add {draft.name || 'catalog'} product</h3></div><div className={`grid gap-3 p-4 ${device === 'desktop' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>{fields.map((field) => <label key={field.key} className="grid gap-1 text-[10px] font-black text-slate-600"><span>{field.label}{field.required ? ' *' : ''}</span><span className="flex h-9 items-center rounded-lg border bg-slate-50 px-3 text-xs font-normal text-slate-400">{field.type === 'dropdown' ? field.options?.[0] || 'Choose option' : field.defaultValue || `Enter ${field.label.toLowerCase()}`}</span></label>)}</div><div className="flex justify-end border-t p-3"><span className="rounded-lg bg-wine px-4 py-2 text-xs font-black text-white">Save product</span></div></div>; }
function SmallMetric({ label, value, dark = false }) { return <div className={`rounded-xl p-3 ${dark ? 'bg-white/10' : 'border bg-white'}`}><p className={`text-[9px] font-black uppercase tracking-wider ${dark ? 'text-rose-100' : 'text-slate-400'}`}>{label}</p><strong className="mt-1 block truncate text-sm">{value ?? 0}</strong></div>; }
function toggleValue(values, value) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }

function Field({ label, value, onChange, max = 100, placeholder = '' }) { return <label className="grid min-w-0 gap-2 text-xs font-bold">{label}<input value={value ?? ''} maxLength={max} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-0 rounded-lg border bg-white px-3 text-sm font-normal" /></label>; }
