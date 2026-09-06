import { lazy, Suspense, memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Copy, Download, History, Monitor, Palette, Plus, Redo2, RotateCcw, Save, Smartphone, Tablet, Trash2, Undo2, UploadCloud } from 'lucide-react';
import PageHeader from '../../components/admin/PageHeader';
import ImageUploader from '../../components/admin/ImageUploader';
import DeferredMount from '../../components/ui/DeferredMount';
import LazyBoundary from '../../components/ui/LazyBoundary';
import api from '../../services/api';
import { mergeWebsiteConfig } from '../../config/websiteCustomization';
import { applyAppearancePreset, changedConfigGroups, exportThemeFile, parseThemeFile, validateDesignerConfig } from '../../config/websiteDesigner';
import { useWebsiteCustomization } from '../../context/WebsiteCustomizationContext';
import { designerReducer, initialDesignerState } from '../../config/websiteDesignerState';
import { BEFORE_ROUTE_CHANGE_EVENT } from '../../utils/routing';

const StorefrontPreview = lazy(() => import('../../components/admin/StorefrontPreview'));
const editorTabs = [
  ['presets', 'Presets'], ['branding', 'Branding'], ['colors', 'Colors'], ['header', 'Desktop header'],
  ['homepage', 'Desktop home'], ['typography', 'Typography'], ['buttons', 'Buttons'],
  ['cards', 'Desktop cards'], ['footer', 'Footer'], ['layout', 'Desktop layout'], ['mobile', 'Mobile'], ['tablet', 'Tablet'],
];

export default function WebsiteCustomizer() {
  const { refresh: refreshPublishedConfig } = useWebsiteCustomization();
  const [workspace, setWorkspace] = useState({ themes: [], presets: [] });
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [{ draft, undoStack, redoStack }, dispatchDraft] = useReducer(designerReducer, initialDesignerState);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('presets');
  const [device, setDevice] = useState(previewDeviceForViewport);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [newThemeName, setNewThemeName] = useState('');
  const [newPreset, setNewPreset] = useState('default');
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogWarning, setCatalogWarning] = useState('');
  const [catalogStatus, setCatalogStatus] = useState('idle');
  const catalogRequest = useRef(false);
  const mounted = useRef(false);
  const [historyWarning, setHistoryWarning] = useState('');
  const [publishReview, setPublishReview] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [previewOpen, setPreviewOpen] = useState(true);
  const lock = useRef(false);
  const requestId = useRef(0);
  const savedName = useRef('');
  const historyRequest = useRef(0);
  const importInput = useRef(null);
  const savedFingerprint = useMemo(() => JSON.stringify(mergeWebsiteConfig(selectedTheme?.draftConfig)), [selectedTheme?.draftConfig]);
  const draftFingerprint = useMemo(() => JSON.stringify(draft), [draft]);
  const dirty = !!draft && (selectedTheme?.name !== savedName.current || draftFingerprint !== savedFingerprint);
  const issues = useMemo(() => draft ? validateDesignerConfig(draft) : [], [draft]);
  const changedGroups = useMemo(() => publishReview && draft ? changedConfigGroups(draft, selectedTheme?.publishedConfig) : [], [publishReview, draft, selectedTheme?.publishedConfig]);

  const acceptTheme = useCallback((theme) => {
    setSelectedTheme(theme);
    savedName.current = theme.name;
    dispatchDraft({ type: 'reset', draft: mergeWebsiteConfig(theme.draftConfig) });
    setPublishReview(false);
  }, []);

  const loadHistory = useCallback(async (id) => {
    const sequence = ++historyRequest.current;
    setHistoryWarning(''); setHistory([]);
    try {
      const versions = await api.get(`/admin/customization/themes/${id}/history?summary=true`);
      if (mounted.current && sequence === historyRequest.current) setHistory(versions);
    } catch {
      if (mounted.current && sequence === historyRequest.current) {
        setHistory([]); setHistoryWarning('Version history could not be loaded. Reload the theme to try again.');
      }
    }
  }, []);

  const loadWorkspace = useCallback(async (preferredId) => {
    const sequence = ++requestId.current;
    setLoading(true);
    try {
      const data = await api.get('/admin/customization');
      const target = preferredId || data.selectedTheme?._id || data.themes?.[0]?._id;
      if (!target) throw new Error('No theme was returned. Please retry.');
      const theme = data.selectedTheme?._id === target ? data.selectedTheme : await api.get(`/admin/customization/themes/${target}`);
      if (sequence !== requestId.current) return;
      setWorkspace(data); acceptTheme(theme);
      // The editor is usable immediately; history must not hold the page loader.
      loadHistory(target);

    } catch (error) { if (sequence === requestId.current) setMessage(error.message); }
    finally { if (sequence === requestId.current) setLoading(false); }
  }, [acceptTheme, loadHistory]);

  useEffect(() => { mounted.current = true; loadWorkspace(); return () => { mounted.current = false; requestId.current += 1; }; }, [loadWorkspace]);
  const loadCatalog = useCallback(async () => {
    if (catalogRequest.current) return;
    catalogRequest.current = true; setCatalogStatus('loading'); setCatalogWarning('');
    try {
      const [productResult, categoryResult] = await Promise.allSettled([api.get('/admin/products?customizationOptions=true'), api.get('/admin/categories')]);
      if (!mounted.current) return;
      const products = productResult.status === 'fulfilled' ? productResult.value : [];
      const categoryData = categoryResult.status === 'fulfilled' ? categoryResult.value : [];
      setCatalog(Array.isArray(products) ? products : products?.products || products?.items || []);
      setCategories(Array.isArray(categoryData) ? categoryData : categoryData?.categories || categoryData?.items || []);
      const failed = productResult.status === 'rejected' || categoryResult.status === 'rejected';
      setCatalogStatus(failed ? 'error' : 'loaded');
      setCatalogWarning(failed ? 'Some catalog data could not be loaded. Existing selections are preserved.' : '');
    } finally { catalogRequest.current = false; }
  }, []);
  useEffect(() => { if (activeTab === 'homepage' && catalogStatus === 'idle') loadCatalog(); }, [activeTab, catalogStatus, loadCatalog]);
  useEffect(() => {
    if (!dirty && !busy) return undefined;
    const unload = (event) => { event.preventDefault(); event.returnValue = ''; };
    const navigateAway = (event) => {
      if (busy || !window.confirm('Leave Website Designer? Unsaved changes will be lost.')) event.preventDefault();
    };
    const leave = (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download') || /^[/#]/.test(link.getAttribute('href') || '')) return;
      if (busy || !window.confirm('Leave Website Designer? Unsaved changes will be lost.')) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', unload);
    window.addEventListener(BEFORE_ROUTE_CHANGE_EVENT, navigateAway);
    document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', unload); window.removeEventListener(BEFORE_ROUTE_CHANGE_EVENT, navigateAway); document.removeEventListener('click', leave, true); };
  }, [dirty, busy]);

  const run = async (label, action) => {
    if (lock.current) return;
    lock.current = true; setBusy(label); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message || 'Unable to complete this action. Your draft is still in the editor.'); }
    finally { lock.current = false; setBusy(''); }
  };
  const confirmLeave = () => !dirty || window.confirm('Discard unsaved editor changes and switch themes? Save or export first to keep them.');
  const reloadThemeList = async () => {
    try { const themes = await api.get('/admin/customization/themes'); setWorkspace((current) => ({ ...current, themes })); }
    catch { setMessage((current) => `${current} Theme list could not refresh; reload when connected.`.trim()); }
  };
  const selectTheme = (id) => {
    if (!confirmLeave()) return;
    run('loading-theme', async () => {
      acceptTheme(await api.get(`/admin/customization/themes/${id}`));
      loadHistory(id);
    });
  };
  const replaceDraft = useCallback((next) => {
    dispatchDraft({ type: 'replace', draft: next });
    setMessage(''); setPublishReview(false);
  }, []);
  const updateDraft = useCallback((path, value) => {
    dispatchDraft({ type: 'edit', path, value, time: Date.now() });
    setMessage(''); setPublishReview(false);
  }, []);
  const undo = () => { dispatchDraft({ type: 'undo' }); setPublishReview(false); };
  const redo = () => { dispatchDraft({ type: 'redo' }); setPublishReview(false); };
  const updateSection = useCallback((id, field, value) => {
    dispatchDraft({ type: 'section', id, field, value, time: Date.now() });
    setMessage(''); setPublishReview(false);
  }, []);
  const moveSection = useCallback((id, direction) => {
    dispatchDraft({ type: 'move-section', id, direction });
    setMessage(''); setPublishReview(false);
  }, []);
  const persistDraft = async () => {
    if (issues.length) throw new Error(issues[0]);
    if (!selectedTheme.name.trim()) throw new Error('Enter a theme name.');
    const theme = await api.put(`/admin/customization/themes/${selectedTheme._id}/draft`, {
      name: selectedTheme.name, config: draft, expectedUpdatedAt: selectedTheme.updatedAt,
    });
    acceptTheme(theme);
    return theme;
  };
  const saveDraft = () => run('save', async () => {
    await persistDraft(); setMessage('Draft saved. Your live storefront has not changed.'); await reloadThemeList();
  });
  const publish = () => run('publish', async () => {
    const saved = await persistDraft();
    const result = await api.post(`/admin/customization/themes/${saved._id}/publish`, {
      note: publishNote.trim() || 'Published from Website Designer', expectedUpdatedAt: saved.updatedAt,
    });
    acceptTheme(result.theme); setPublishNote('');
    setMessage(`Published successfully as version ${result.version.version}.`);
    await Promise.all([reloadThemeList(), loadHistory(saved._id), refreshPublishedConfig()]);
  });
  const themeAction = (action, body, success) => run(action, async () => {
    const theme = await api.post(`/admin/customization/themes/${selectedTheme._id}/${action}`, { ...body, expectedUpdatedAt: selectedTheme.updatedAt });
    acceptTheme(theme); setMessage(success); await reloadThemeList();
    if (action === 'activate') await refreshPublishedConfig();
  });
  const createTheme = () => {
    if (!newThemeName.trim()) { setMessage('Enter a theme name first.'); return; }
    run('create', async () => {
      const preset = workspace.presets.find((item) => item.id === newPreset);
      if (!preset?.config) throw new Error('Preset data is unavailable. Reload the designer.');
      const theme = await api.post('/admin/customization/themes', {
        name: newThemeName.trim(), preset: newPreset, config: applyAppearancePreset(draft, preset.config),
      });
      acceptTheme(theme); setNewThemeName(''); historyRequest.current += 1; setHistory([]);
      setMessage('Created a private theme, preserving your content and mobile settings.'); await reloadThemeList();
    });
  };
  const duplicate = () => run('duplicate', async () => {
    const theme = await api.post('/admin/customization/themes', {
      name: `${selectedTheme.name} Copy`.slice(0, 80), preset: draft.theme.preset, config: draft,
    });
    acceptTheme(theme); historyRequest.current += 1; setHistory([]); setMessage('Current editor draft duplicated.'); await reloadThemeList();
  });
  const removeTheme = () => {
    if (selectedTheme.isActive || !window.confirm(`Delete “${selectedTheme.name}” and its version history? This cannot be undone.`)) return;
    run('delete', async () => { await api.delete(`/admin/customization/themes/${selectedTheme._id}`); await loadWorkspace(); setMessage('Theme and its version history deleted.'); });
  };
  const restoreVersion = (id) => {
    if (!window.confirm('Replace this draft with the selected version? The live storefront will not change.')) return;
    run('restore', async () => {
      const result = await api.post(`/admin/customization/themes/${selectedTheme._id}/history/${id}/restore`, { expectedUpdatedAt: selectedTheme.updatedAt });
      acceptTheme(result.theme); setMessage(result.message); await reloadThemeList();
    });
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportThemeFile(draft, selectedTheme.name)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'samira-theme.json'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importFile = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 512000) throw new Error('Theme files must be smaller than 500 KB.');
      const config = parseThemeFile(await file.text());
      if (window.confirm('Replace the editor draft with this file? You can undo this. Nothing will be published.')) {
        replaceDraft(config); setMessage('Theme imported into the editor. Review every device before publishing.');
      }
    } catch (error) { setMessage(error instanceof SyntaxError ? 'This file is not valid JSON.' : error.message); }
  };

  if (loading) return <section className="admin-card p-8 text-sm text-slate-500" role="status">Loading Website Designer…</section>;
  if (!draft) return <section className="admin-card space-y-4 p-8"><h2 className="text-lg font-bold">Website Designer could not load</h2><p role="alert">{message}</p><button type="button" className="admin-btn" onClick={() => loadWorkspace()}>Try again</button></section>;

  return <section className="min-w-0 space-y-5">
    <PageHeader title="Website Designer" note="Your store, your style. Edit privately, preview real pages, and publish with confidence." />
    <div className="admin-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2"><StatusDot active={selectedTheme.isActive} />
          <input maxLength={80} disabled={!!busy} className="h-10 min-w-0 max-w-full rounded-xl border px-3 text-sm font-bold" value={selectedTheme.name} onChange={(event) => setSelectedTheme((current) => ({ ...current, name: event.target.value }))} aria-label="Theme name" />
          <span className={`text-xs font-semibold ${dirty ? 'text-amber-700' : 'text-slate-500'}`}>{dirty ? 'Unsaved changes' : 'Draft saved'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={Undo2} label="Undo" onClick={undo} disabled={!!busy || !undoStack.length} />
          <ActionButton icon={Redo2} label="Redo" onClick={redo} disabled={!!busy || !redoStack.length} />
          <ActionButton icon={Save} label={busy === 'save' ? 'Saving…' : 'Save draft'} onClick={saveDraft} disabled={!!busy || !!issues.length} />
          <button type="button" onClick={() => setPublishReview(true)} disabled={!!busy || !!issues.length || workspace.configurationLocked} className="inline-flex h-10 items-center gap-2 rounded-xl bg-wine px-4 text-xs font-black text-white disabled:opacity-50"><UploadCloud className="h-4 w-4" />Review & publish</button>
        </div>
      </div>
      <p className="text-xs leading-5 text-slate-500">Desktop appearance controls do not change mobile layouts. Branding and footer content are shared. Mobile and tablet overrides are off unless you enable them.</p>
    </div>
    {workspace.configurationLocked && <p className="admin-card p-4 text-sm text-amber-800">Store structure is locked. You can prepare private drafts; unlock it in <a className="font-bold underline" href="/master">Master configuration</a> before publishing or activating a theme.</p>}
    {message && <p role="status" className="rounded-xl border border-[#eadfd5] bg-white p-4 text-sm font-semibold text-wine">{message}</p>}
    {!!issues.length && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Correct these fields before saving</p><ul className="mt-2 list-disc pl-5">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
    {publishReview && <div className="admin-card space-y-3 border-wine p-5" role="region" aria-label="Publish review">
      <h2 className="text-lg font-bold">Ready to update the live storefront?</h2>
      <p className="text-sm text-slate-600">Changes compared with this theme’s last published version: {changedGroups.join(', ') || 'No appearance changes'}. {selectedTheme.isActive ? '' : 'This will replace the currently active theme.'}</p>
      <p className="text-sm text-slate-600">Mobile overrides: {draft.mobile.enabled ? 'enabled' : 'off — existing layout preserved'}. Tablet overrides: {draft.tablet.enabled ? 'enabled' : 'off'}.</p>
      <Field label="Version note (optional)" value={publishNote} onChange={setPublishNote} />
      <div className="flex flex-wrap gap-2"><button type="button" disabled={!!busy} className="admin-btn" onClick={publish}>{busy === 'publish' ? 'Publishing…' : 'Confirm publish'}</button><button type="button" disabled={!!busy} className="admin-btn-secondary" onClick={() => setPublishReview(false)}>Keep editing</button></div>
      <p className="text-xs text-slate-500">Publishing records a version. You can restore an earlier version to a draft at any time.</p>
    </div>}
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-4">
        <div className="admin-card space-y-3 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Palette className="h-4 w-4" />My themes</h2>
          <div className="max-h-64 space-y-2 overflow-y-auto">{workspace.themes.map((theme) => <button key={theme._id} disabled={!!busy} onClick={() => selectTheme(theme._id)} className={`w-full rounded-xl border p-3 text-left text-xs ${theme._id === selectedTheme._id ? 'border-wine bg-[#fff5f6]' : 'border-[#eadfd5]'}`}><span className="block truncate font-bold">{theme.name}</span><span className="mt-1 block text-slate-500">{theme.isActive ? 'Live storefront' : theme.hasPublishedVersion ? 'Published · inactive' : 'Private draft'}</span></button>)}</div>
          <Field label="New theme name" value={newThemeName} onChange={setNewThemeName} />
          <label className="grid gap-2 text-xs font-bold">Starting preset<select disabled={!!busy} value={newPreset} onChange={(event) => setNewPreset(event.target.value)} className="h-10 max-w-full rounded-xl border bg-white px-2">{workspace.presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
          <button type="button" disabled={!!busy || !!issues.length} onClick={createTheme} className="admin-btn inline-flex w-full items-center justify-center gap-2"><Plus className="h-4 w-4" />Create theme</button>
        </div>
        <div className="admin-card flex flex-wrap gap-2 p-4">
          <ActionButton icon={Copy} label="Duplicate" onClick={duplicate} disabled={!!busy || !!issues.length} />
          <ActionButton icon={Download} label="Export JSON" onClick={download} disabled={!!busy || !!issues.length} />
          <ActionButton icon={UploadCloud} label="Import JSON" onClick={() => importInput.current?.click()} disabled={!!busy} />
          <input ref={importInput} aria-label="Import theme file" type="file" accept=".json,application/json" className="hidden" onChange={importFile} />
          <ActionButton icon={RotateCcw} label="Reset draft" disabled={!!busy} onClick={() => {
            if (window.confirm('Reset this entire draft to its last published version (or its preset if never published)?')) themeAction('discard', {}, 'Draft reset. The live storefront is unchanged.');
          }} />
          {!selectedTheme.isActive && selectedTheme.publishedConfig && <ActionButton icon={Check} label="Activate published" disabled={!!busy || workspace.configurationLocked} onClick={() => {
            if (window.confirm('Activate this theme’s last published version? Saved drafts are kept, but unsaved editor changes will be discarded.')) themeAction('activate', {}, 'Published theme activated.');
          }} />}
          <ActionButton icon={Trash2} label="Delete theme" danger disabled={!!busy || selectedTheme.isActive} onClick={removeTheme} />
        </div>
        <details className="admin-card p-4">
          <summary className="cursor-pointer text-sm font-bold"><History className="mr-2 inline h-4 w-4" />Version history ({history.length})</summary>
          {historyWarning && <p className="mt-3 text-xs text-amber-800">{historyWarning}</p>}
          {!history.length && !historyWarning && <p className="mt-3 text-xs text-slate-500">Your first publish will create version 1.</p>}
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{history.map((version) => <button key={version._id} disabled={!!busy} type="button" onClick={() => restoreVersion(version._id)} className="w-full rounded-xl border p-3 text-left"><span className="text-xs font-bold">Restore version {version.version}</span><span className="mt-1 block text-[10px] text-slate-500">{formatDate(version.createdAt)}</span><span className="mt-1 block break-words text-xs">{version.note}</span></button>)}</div>
        </details>
      </aside>
      <div className="min-w-0 space-y-5">
        <div className="admin-card min-w-0 overflow-hidden">
          <div className="flex gap-1 overflow-x-auto border-b p-2" role="tablist" aria-label="Customization settings">
            {editorTabs.map(([id, label]) => <button key={id} role="tab" aria-selected={activeTab === id} type="button" onClick={() => setActiveTab(id)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${activeTab === id ? 'bg-wine text-white' : 'text-slate-500'}`}>{label}</button>)}
          </div>
          {activeTab === 'homepage' && catalogStatus === 'loading' && <p role="status" className="p-4 text-xs text-slate-500">Loading catalog choices… You can keep editing other settings.</p>}
          {catalogWarning && <p className="p-4 text-xs text-amber-800">{catalogWarning} <button type="button" disabled={catalogStatus === 'loading'} onClick={loadCatalog} className="underline">Retry catalog</button></p>}
          <fieldset disabled={!!busy} className="max-h-[700px] min-w-0 overflow-y-auto p-4 sm:p-5" role="tabpanel">
            {activeTab === 'presets' ? <Panel title="A starting point for your brand" note="Apply a coordinated look to this draft. Your logo, content, catalog choices, footer links and mobile settings stay unchanged.">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{workspace.presets.map((preset) => <button key={preset.id} type="button" disabled={!preset.config} onClick={() => { replaceDraft(applyAppearancePreset(draft, preset.config)); setMessage(`${preset.name} applied to the draft. Your content and mobile settings are preserved.`); }} className={`rounded-xl border p-4 text-left ${draft.theme.preset === preset.id ? 'border-wine ring-1 ring-wine' : 'border-[#eadfd5]'}`}>
                <span className="mb-3 flex gap-1.5">{Object.values(preset.swatches || {}).map((color, index) => <span key={index} className="h-7 w-7 rounded-full border border-black/10" style={{ background: color }} />)}</span>
                <span className="block text-sm font-bold">{preset.name}</span><span className="mt-1 block text-xs text-slate-500">{preset.description || 'Coordinated storefront appearance'}</span>
              </button>)}</div>
            </Panel> : <EditorPanel tab={activeTab} draft={draft} update={updateDraft} updateSection={updateSection} moveSection={moveSection} catalog={catalog} categories={categories} />}
          </fieldset>
        </div>
        <div className="admin-card min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
            <button type="button" onClick={() => setPreviewOpen(!previewOpen)} aria-expanded={previewOpen} className="text-left"><h2 className="text-sm font-bold">Storefront preview</h2><span className="text-xs text-slate-500">{previewOpen ? 'Hide preview' : 'Show preview'} · Private until published</span></button>
            <div className="flex rounded-xl bg-slate-100 p-1">{[['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]].map(([id, Icon]) => <button key={id} type="button" onClick={() => { setDevice(id); setPreviewOpen(true); }} aria-label={`${id} preview`} aria-pressed={device === id} className={`grid h-10 w-11 place-items-center rounded-lg ${device === id ? 'bg-white text-wine shadow-sm' : 'text-slate-500'}`}><Icon className="h-4 w-4" /></button>)}</div>
          </div>
          {previewOpen && <DeferredMount label="storefront preview"><LazyBoundary resetKey={selectedTheme?._id}><Suspense fallback={<p role="status" className="min-h-[480px] p-6 text-sm text-slate-500">Loading storefront preview…</p>}><StorefrontPreview config={draft} device={device} valid={!issues.length} /></Suspense></LazyBoundary></DeferredMount>}
        </div>
      </div>
    </div>
  </section>;
}

function EditorPanel({ tab, draft, update, updateSection, moveSection, catalog, categories }) {
  const productOptions = useMemo(() => catalog.map((product) => ({ value: String(product._id || product.id || product.slug), label: product.name || product.title })), [catalog]);
  const categoryOptions = useMemo(() => categories.map((category) => ({ value: String(category._id || category.id || category.slug), label: category.name || category.title })), [categories]);
  if (tab === 'mobile') return <Panel title="Mobile storefront" note="These overrides apply below 768 px only. The existing menu, search icon, bottom navigation and shopping flow are preserved. Turn off overrides to restore the current mobile appearance.">
    <Toggle label="Enable mobile overrides" checked={draft.mobile.enabled} onChange={(value) => update(['mobile', 'enabled'], value)} />
    <fieldset disabled={!draft.mobile.enabled} className="space-y-4 disabled:opacity-50">
      <div className="grid gap-3 sm:grid-cols-3">{[['headerBackground', 'Header background'], ['headerText', 'Header icons'], ['pageBackground', 'Home background']].map(([key, label]) => <ColorField key={key} label={label} value={draft.mobile[key]} onChange={(value) => update(['mobile', key], value)} />)}</div>
      <Range label="Products per row" value={draft.mobile.columns} min="1" max="2" onChange={(value) => update(['mobile', 'columns'], Number(value))} />
      <Range label="Product gap" value={draft.mobile.gridGap} min="8" max="24" suffix="px" onChange={(value) => update(['mobile', 'gridGap'], Number(value))} />
      <Range label="Product image corners" value={draft.mobile.cardRadius} min="0" max="24" suffix="px" onChange={(value) => update(['mobile', 'cardRadius'], Number(value))} />
      <Select label="Home product image ratio" value={draft.mobile.imageRatio} options={['original', '1/1', '4/5', '3/4']} onChange={(value) => update(['mobile', 'imageRatio'], value)} />
      <Toggle label="Use desktop catalog selections on mobile home" checked={draft.mobile.useDesktopCatalog} onChange={(value) => update(['mobile', 'useDesktopCatalog'], value)} />
      <h3 className="text-sm font-bold">Mobile home sections</h3>
      {[...draft.mobile.sections].sort((a, b) => a.order - b.order).map((section, index, list) => <div key={section.id} className="space-y-3 rounded-xl border p-3">
        <div className="flex items-center gap-2"><label className="flex flex-1 items-center gap-2 text-sm font-bold"><input type="checkbox" className="accent-wine" checked={section.visible} onChange={(event) => update(['mobile', 'sections'], list.map((item) => item.id === section.id ? { ...item, visible: event.target.checked } : item))} />{draft.homepage.sections.find((item) => item.id === section.id)?.label}</label>
          {[-1, 1].map((direction) => <IconButton key={direction} icon={direction < 0 ? ArrowUp : ArrowDown} label={direction < 0 ? 'Move mobile section up' : 'Move mobile section down'} disabled={index + direction < 0 || index + direction >= list.length} onClick={() => {
            const next = [...list]; [next[index], next[index + direction]] = [next[index + direction], next[index]];
            update(['mobile', 'sections'], next.map((item, position) => ({ ...item, order: position * 10 })));
          }} />)}
        </div>
        {['hero', 'trending', 'newArrivals', 'ethnicSets', 'accessories'].includes(section.id) && <Field label="Mobile heading (blank keeps current wording)" value={section.heading} onChange={(value) => update(['mobile', 'sections'], list.map((item) => item.id === section.id ? { ...item, heading: value } : item))} />}
      </div>)}
    </fieldset>
  </Panel>;
  if (tab === 'tablet') return <Panel title="Tablet product layout" note="Applies from 768–1023 px only. Mobile and desktop remain independent.">
    <Toggle label="Enable tablet overrides" checked={draft.tablet.enabled} onChange={(value) => update(['tablet', 'enabled'], value)} />
    <fieldset disabled={!draft.tablet.enabled} className="space-y-4">
      <Range label="Tablet products per row" value={draft.tablet.columns} min="2" max="4" onChange={(value) => update(['tablet', 'columns'], Number(value))} />
      <Range label="Tablet product gap" value={draft.tablet.gridGap} min="8" max="32" suffix="px" onChange={(value) => update(['tablet', 'gridGap'], Number(value))} />
    </fieldset>
  </Panel>;
  if (tab === 'branding') return <Panel title="Brand identity" note="Used in the header, browser tab and search metadata.">
    <Field label="Website name" value={draft.branding.websiteName} onChange={(value) => update(['branding', 'websiteName'], value)} />
    <Field label="Tagline" value={draft.branding.tagline} onChange={(value) => update(['branding', 'tagline'], value)} />
    <UploadField label="Logo" value={draft.branding.logo} onChange={(value) => update(['branding', 'logo'], value)} context="website-branding" />
    <UploadField label="Favicon" value={draft.branding.favicon} onChange={(value) => update(['branding', 'favicon'], value)} context="website-favicon" />
  </Panel>;

  if (tab === 'colors') return <Panel title="Desktop theme colors" note="Desktop storefront palette. Mobile header and home colors are edited separately in the Mobile tab."><div className="grid gap-3 sm:grid-cols-2">{[
    ['primary', 'Primary'], ['secondary', 'Secondary'], ['accent', 'Accent'], ['background', 'Page background'], ['surface', 'Cards / surface'], ['text', 'Main text'], ['mutedText', 'Muted text'],
  ].map(([key, label]) => <ColorField key={key} label={label} value={draft.colors[key]} onChange={(value) => update(['colors', key], value)} />)}</div></Panel>;

  if (tab === 'header') return <Panel title="Header and announcement">
    <Toggle label="Show announcement bar" checked={draft.header.announcementEnabled} onChange={(value) => update(['header', 'announcementEnabled'], value)} />
    <Field label="Announcement text" value={draft.header.announcementText} onChange={(value) => update(['header', 'announcementText'], value)} />
    <div className="grid gap-3 sm:grid-cols-2"><ColorField label="Header background" value={draft.header.background} onChange={(value) => update(['header', 'background'], value)} /><ColorField label="Header text" value={draft.header.textColor} onChange={(value) => update(['header', 'textColor'], value)} /><ColorField label="Announcement background" value={draft.header.announcementBackground} onChange={(value) => update(['header', 'announcementBackground'], value)} /><ColorField label="Announcement text" value={draft.header.announcementTextColor} onChange={(value) => update(['header', 'announcementTextColor'], value)} /></div>
    <Range label="Logo size" value={draft.header.logoSize} min="36" max="140" suffix="px" onChange={(value) => update(['header', 'logoSize'], Number(value))} />
    <Select label="Menu alignment" value={draft.header.menuAlignment} options={['left', 'center', 'right']} onChange={(value) => update(['header', 'menuAlignment'], value)} />
    <Toggle label="Sticky desktop header" checked={draft.header.sticky} onChange={(value) => update(['header', 'sticky'], value)} />
  </Panel>;

  if (tab === 'homepage') return <Panel title="Desktop homepage sections" note="Hide, edit or reorder sections. All selected products and categories come from the real catalog API.">
    <MultiSelect max={8} label="Featured categories (leave empty for automatic)" value={draft.homepage.featuredCategoryIds} options={categoryOptions} onChange={(value) => update(['homepage', 'featuredCategoryIds'], value)} />
    {draft.homepage.featuredCategoryIds.length > 0 && <div className="rounded-2xl border border-[#eadfd5] p-4"><p className="mb-3 text-xs font-black text-slate-600">Category image overrides</p><div className="space-y-4">{draft.homepage.featuredCategoryIds.map((categoryId) => { const category = categories.find((item) => String(item._id || item.id || item.slug) === String(categoryId)); const current = draft.homepage.categoryImages.find((item) => String(item.categoryId) === String(categoryId)); return <UploadField key={categoryId} label={category?.name || 'Category image'} value={current?.image || ''} onChange={(image) => update(['homepage', 'categoryImages'], updateCategoryImages(draft.homepage.categoryImages, categoryId, image))} context="website-categories" />; })}</div></div>}
    <div className="space-y-3">{[...draft.homepage.sections].sort((a, b) => a.order - b.order).map((section, index, list) =>
      <HomeSectionEditor key={section.id} section={section} first={index === 0} last={index === list.length - 1}
        products={draft.homepage.sectionProductIds[section.id]} options={productOptions}
        update={update} updateSection={updateSection} moveSection={moveSection} />)}</div>
  </Panel>;

  if (tab === 'typography') return <Panel title="Desktop typography" note="Applied to the desktop homepage. Mobile text sizing is preserved.">
    <Select label="Heading font" value={draft.typography.headingFont} options={['Playfair Display', 'Inter', 'Georgia', 'Arial']} onChange={(value) => update(['typography', 'headingFont'], value)} />
    <Select label="Body font" value={draft.typography.bodyFont} options={['Inter', 'Figtree', 'Georgia', 'Arial']} onChange={(value) => update(['typography', 'bodyFont'], value)} />
    <Select label="Button font" value={draft.typography.buttonFont} options={['Inter', 'Figtree', 'Georgia', 'Arial']} onChange={(value) => update(['typography', 'buttonFont'], value)} />
    <Range label="Heading scale" value={draft.typography.headingScale} min="0.75" max="1.5" step="0.05" suffix="×" onChange={(value) => update(['typography', 'headingScale'], Number(value))} />
    <Range label="Body scale" value={draft.typography.bodyScale} min="0.8" max="1.3" step="0.05" suffix="×" onChange={(value) => update(['typography', 'bodyScale'], Number(value))} />
    <Select label="Body weight" value={String(draft.typography.bodyWeight)} options={['300', '400', '500', '600', '700']} onChange={(value) => update(['typography', 'bodyWeight'], Number(value))} />
    <Select label="Button weight" value={String(draft.typography.buttonWeight)} options={['400', '500', '600', '700', '800', '900']} onChange={(value) => update(['typography', 'buttonWeight'], Number(value))} />
    <Select label="Heading weight" value={String(draft.typography.headingWeight)} options={['400', '500', '600', '700', '800', '900']} onChange={(value) => update(['typography', 'headingWeight'], Number(value))} />
  </Panel>;

  if (tab === 'buttons') return <Panel title="Desktop storefront buttons"><div className="grid gap-3 sm:grid-cols-2"><ColorField label="Background" value={draft.buttons.background} onChange={(value) => update(['buttons', 'background'], value)} /><ColorField label="Text" value={draft.buttons.textColor} onChange={(value) => update(['buttons', 'textColor'], value)} /></div><Range label="Corner radius" value={draft.buttons.borderRadius} min="0" max="999" suffix="px" onChange={(value) => update(['buttons', 'borderRadius'], Number(value))} /><Select label="Style" value={draft.buttons.style} options={['solid', 'outline', 'soft']} onChange={(value) => update(['buttons', 'style'], value)} /><Select label="Size" value={draft.buttons.size} options={['small', 'medium', 'large']} onChange={(value) => update(['buttons', 'size'], value)} /><Select label="Hover effect" value={draft.buttons.hoverEffect} options={['none', 'lift', 'darken', 'glow']} onChange={(value) => update(['buttons', 'hoverEffect'], value)} /></Panel>;

  if (tab === 'cards') return <Panel title="Desktop product cards" note="Applies to desktop home and catalog cards. Shopping controls on product details and mobile are preserved."><Select label="Card layout" value={draft.productCards.layout} options={['classic', 'minimal', 'compact']} onChange={(value) => update(['productCards', 'layout'], value)} /><Select label="Image ratio" value={draft.productCards.imageRatio} options={['1/1', '4/5', '3/4']} onChange={(value) => update(['productCards', 'imageRatio'], value)} /><Range label="Corner radius" value={draft.productCards.borderRadius} min="0" max="32" suffix="px" onChange={(value) => update(['productCards', 'borderRadius'], Number(value))} /><Select label="Shadow" value={draft.productCards.shadow} options={['none', 'soft', 'elevated']} onChange={(value) => update(['productCards', 'shadow'], value)} /><div className="grid gap-2 sm:grid-cols-2">{[['showTitle', 'Show title'], ['showPrice', 'Show price'], ['showDiscount', 'Show discount'], ['showRating', 'Show rating'], ['showWishlist', 'Show wishlist'], ['showAddToCart', 'Show add to cart'], ['quickView', 'Show quick view']].map(([key, label]) => <Toggle key={key} label={label} checked={draft.productCards[key]} onChange={(value) => update(['productCards', key], value)} />)}</div></Panel>;

  if (tab === 'footer') return <Panel title="Footer"><Toggle label="Show footer" checked={draft.footer.enabled} onChange={(value) => update(['footer', 'enabled'], value)} /><UploadField label="Footer logo override" value={draft.footer.logo} onChange={(value) => update(['footer', 'logo'], value)} context="website-footer" /><Field multiline label="Description" value={draft.footer.description} onChange={(value) => update(['footer', 'description'], value)} /><div className="grid gap-3 sm:grid-cols-2"><ColorField label="Background" value={draft.footer.background} onChange={(value) => update(['footer', 'background'], value)} /><ColorField label="Text" value={draft.footer.textColor} onChange={(value) => update(['footer', 'textColor'], value)} /></div><Toggle label="Show contact details" checked={draft.footer.showContact} onChange={(value) => update(['footer', 'showContact'], value)} />{draft.footer.showContact && <div className="grid gap-3"><Field label="Contact email" value={draft.footer.contactEmail} onChange={(value) => update(['footer', 'contactEmail'], value)} /><Field label="Contact phone" value={draft.footer.contactPhone} onChange={(value) => update(['footer', 'contactPhone'], value)} /><Field label="Contact address" value={draft.footer.contactAddress} onChange={(value) => update(['footer', 'contactAddress'], value)} /></div>}<Toggle label="Show social links" checked={draft.footer.showSocialLinks} onChange={(value) => update(['footer', 'showSocialLinks'], value)} />{draft.footer.showSocialLinks && <div className="grid gap-3 sm:grid-cols-2">{Object.keys(draft.footer.socialLinks).map((network) => <Field key={network} label={`${network} URL`} value={draft.footer.socialLinks[network]} onChange={(value) => update(['footer', 'socialLinks', network], value)} />)}</div>}<Toggle label="Show newsletter" checked={draft.footer.showNewsletter} onChange={(value) => update(['footer', 'showNewsletter'], value)} /><MenuEditor label="Shopping menu" items={draft.footer.menus.shopping} onChange={(value) => update(['footer', 'menus', 'shopping'], value)} /><MenuEditor label="Policies menu" items={draft.footer.menus.policies} onChange={(value) => update(['footer', 'menus', 'policies'], value)} /><MenuEditor label="About menu" items={draft.footer.menus.about} onChange={(value) => update(['footer', 'menus', 'about'], value)} /><Field label="Copyright text" value={draft.footer.copyrightText} onChange={(value) => update(['footer', 'copyrightText'], value)} /></Panel>;

  return <Panel title="Store layout"><Select label="Page width" value={draft.layout.mode} options={['full', 'boxed']} onChange={(value) => update(['layout', 'mode'], value)} /><Range label="Maximum width" value={draft.layout.maxWidth} min="960" max="1920" step="40" suffix="px" onChange={(value) => update(['layout', 'maxWidth'], Number(value))} /><Range label="Section spacing" value={draft.layout.sectionSpacing} min="16" max="160" step="4" suffix="px" onChange={(value) => update(['layout', 'sectionSpacing'], Number(value))} /><Range label="Product grid gap" value={draft.layout.gridGap} min="4" max="64" step="2" suffix="px" onChange={(value) => update(['layout', 'gridGap'], Number(value))} /><div className="grid gap-3 sm:grid-cols-3"><Range label="Desktop columns" value={draft.layout.productsPerRow.desktop} min="2" max="6" onChange={(value) => update(['layout', 'productsPerRow', 'desktop'], Number(value))} /></div></Panel>;
}

function Panel({ title, note, children }) { return <div className="space-y-4"><div><h2 className="text-lg font-black text-charcoal">{title}</h2>{note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}</div>{children}</div>; }
function Field({ label, value, onChange, multiline = false }) { const Tag = multiline ? 'textarea' : 'input'; return <label className="grid gap-2 text-xs font-black text-slate-600">{label}<Tag value={value ?? ''} onChange={(event) => onChange(event.target.value)} className={`${multiline ? 'min-h-24 py-3' : 'h-10'} rounded-xl border border-[#eadfd5] px-3 text-sm font-medium text-charcoal outline-none focus:border-wine`} /></label>; }
function ColorField({ label, value, onChange }) { return <label className="grid gap-2 text-xs font-black text-slate-600">{label}<span className="flex h-10 overflow-hidden rounded-xl border border-[#eadfd5] bg-white"><input type="color" aria-label={`${label} picker`} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 cursor-pointer border-0" /><input aria-label={`${label} hex`} value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 px-2 text-xs font-bold uppercase outline-none" /></span></label>; }
function Toggle({ label, checked, onChange }) { return <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#eadfd5] bg-white px-3 text-xs font-black text-slate-600"><span>{label}</span><input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-wine" /></label>; }
function Range({ label, value, onChange, min, max, step = '1', suffix = '' }) { return <label className="grid gap-2 text-xs font-black text-slate-600"><span className="flex justify-between"><span>{label}</span><span className="text-wine">{value}{suffix}</span></span><input type="range" aria-label={label} value={value} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} className="accent-wine" /></label>; }
function Select({ label, value, options, onChange }) { return <label className="grid gap-2 text-xs font-black text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-[#eadfd5] bg-white px-3 text-sm font-bold capitalize"><option value="" disabled>Select</option>{options.map((option) => <option key={option} value={option}>{String(option).replace(/([A-Z])/g, ' $1')}</option>)}</select></label>; }
const HomeSectionEditor = memo(function HomeSectionEditor({ section, first, last, products, options, update, updateSection, moveSection }) {
  const [expanded, setExpanded] = useState(false);
  return <div className="rounded-2xl border border-[#eadfd5] p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={section.visible} onChange={(event) => updateSection(section.id, 'visible', event.target.checked)} className="accent-wine" />{section.label}</label>
      <div className="flex gap-1"><button type="button" aria-expanded={expanded} aria-controls={`section-editor-${section.id}`} onClick={() => setExpanded(!expanded)} className="rounded-lg border px-3 text-xs font-bold text-wine">{expanded ? 'Close' : 'Edit'} {section.label}</button><IconButton icon={ArrowUp} label={`Move ${section.label} up`} disabled={first} onClick={() => moveSection(section.id, -1)} /><IconButton icon={ArrowDown} label={`Move ${section.label} down`} disabled={last} onClick={() => moveSection(section.id, 1)} /></div>
    </div>
    {expanded && <div id={`section-editor-${section.id}`} className="mt-3 grid gap-3">
      {section.id !== 'services' && <Field label="Heading" value={section.heading} onChange={(value) => updateSection(section.id, 'heading', value)} />}
      {!['services', 'categories'].includes(section.id) && <Field label="Description" value={section.description} onChange={(value) => updateSection(section.id, 'description', value)} />}
      {!['services', 'categories', 'reviews'].includes(section.id) && <div className="grid gap-3 sm:grid-cols-2"><Field label="Button text" value={section.buttonText} onChange={(value) => updateSection(section.id, 'buttonText', value)} />{section.id !== 'newsletter' && <Field label="Button link" value={section.buttonLink} onChange={(value) => updateSection(section.id, 'buttonLink', value)} />}</div>}
      {products && <MultiSelect label="Products (leave empty for automatic)" value={products} options={options} onChange={(value) => update(['homepage', 'sectionProductIds', section.id], value)} />}
      {['hero', 'sale', 'promotional'].includes(section.id) && <UploadField label="Section image override" value={section.image} onChange={(value) => updateSection(section.id, 'image', value)} context={`website-${section.id}`} />}
      <UploadField label="Section background" value={section.backgroundImage} onChange={(value) => updateSection(section.id, 'backgroundImage', value)} context={`website-${section.id}-background`} />
    </div>}
  </div>;
});

export function MultiSelect({ label, value = [], options = [], onChange, max = 12 }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const available = useMemo(() => new Set(options.map((item) => item.value)), [options]);
  const filtered = useMemo(() => {
    const missing = value.filter((id) => !available.has(id)).map((id) => ({ value: id, label: 'Unavailable catalog item (selected)' }));
    const query = search.trim().toLowerCase();
    return [...missing, ...options].filter((item) => String(item.label).toLowerCase().includes(query));
  }, [available, value, options, search]);
  const pageSize = 40;
  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  const start = currentPage * pageSize;
  return <div className="space-y-2 rounded-xl border p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold">{label}</p><button type="button" onClick={() => onChange([])} className="text-xs font-bold text-wine">Clear ({value.length})</button></div>
    <input aria-label={`Search ${label}`} placeholder="Search catalog…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} className="h-10 w-full rounded-lg border px-3 text-sm" />
    <div className="max-h-48 space-y-1 overflow-y-auto">{filtered.slice(start, start + pageSize).map((item) => <label key={item.value} className="flex min-h-10 items-center gap-3 rounded-lg p-2 text-xs hover:bg-slate-50"><input type="checkbox" disabled={!value.includes(item.value) && value.length >= max} className="h-4 w-4 accent-wine" checked={value.includes(item.value)} onChange={(event) => onChange(event.target.checked ? [...value, item.value].slice(0, max) : value.filter((id) => id !== item.value))} /><span>{item.label}</span></label>)}
      {!filtered.length && <p className="p-2 text-xs text-slate-500">{options.length ? 'No matching catalog items.' : 'No catalog items available.'}</p>}
    </div>
    {filtered.length > pageSize && <div className="flex items-center justify-between gap-2 text-xs">
      <button type="button" aria-label={`Previous ${label} results`} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button>
      <span role="status">{start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}</span>
      <button type="button" aria-label={`Next ${label} results`} disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button>
    </div>}
    <p className="text-[11px] text-slate-500">Choose up to {max}. Search covers the full catalog. No selection uses the automatic collection. Selections keep their chosen order.</p>
  </div>;
}
function MenuEditor({ label, items = [], onChange }) { const edit = (index, key, value) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); return <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-xs font-black text-slate-600">{label}</p><button type="button" disabled={items.length >= 20} onClick={() => onChange([...items, { label: 'New link', path: '/products' }])} className="text-[10px] font-black text-wine">+ Add link</button></div>{items.map((item, index) => <div key={index} className="grid grid-cols-[1fr_1.25fr_32px] gap-2"><input value={item.label} onChange={(event) => edit(index, 'label', event.target.value)} className="h-9 min-w-0 rounded-lg border border-[#eadfd5] px-2 text-xs" aria-label={`${label} link label`} /><input value={item.path} onChange={(event) => edit(index, 'path', event.target.value)} className="h-9 min-w-0 rounded-lg border border-[#eadfd5] px-2 text-xs" aria-label={`${label} link path`} /><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="grid h-9 place-items-center rounded-lg border border-rose-100 text-rose-600" aria-label="Remove footer link"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>; }
function UploadField({ label, value, onChange, context }) { return <div className="space-y-2"><p className="text-xs font-black text-slate-600">{label}</p><ImageUploader value={value ? [{ url: value, primary: true }] : []} onChange={(files) => onChange(files[0]?.url || '')} uploadContext={context} showPrimaryControl={false} label={`Upload ${label}`} helpText="JPG, PNG or WEBP. Existing store upload rules apply." /></div>; }
function IconButton({ icon: Icon, label, ...props }) { return <button type="button" aria-label={label} title={label} className="grid h-8 w-8 place-items-center rounded-lg border border-[#eadfd5] text-slate-500 disabled:opacity-30" {...props}><Icon className="h-3.5 w-3.5" /></button>; }
function ActionButton({ icon: Icon, label, danger = false, ...props }) { return <button type="button" className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black ${danger ? 'border-rose-200 text-rose-700' : 'border-[#eadfd5] bg-white text-slate-600'}`} {...props}><Icon className="h-4 w-4" />{label}</button>; }
function StatusDot({ active }) { return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />{active ? 'Live' : 'Draft'}</span>; }
function formatDate(value) { try { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); } catch { return ''; } }
function previewDeviceForViewport() { if (typeof window === 'undefined') return 'desktop'; if (window.matchMedia('(max-width: 767px)').matches) return 'mobile'; if (window.matchMedia('(max-width: 1023px)').matches) return 'tablet'; return 'desktop'; }
function updateCategoryImages(items, categoryId, image) { const next = (items || []).filter((item) => String(item.categoryId) !== String(categoryId)); return image ? [...next, { categoryId, image }] : next; }
