import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown, ArrowUp, Check, Copy, History, Monitor, Palette,
  Plus, RotateCcw, Save, Smartphone, Tablet, Trash2, UploadCloud,
} from 'lucide-react';
import PageHeader from '../../components/admin/PageHeader';
import ImageUploader from '../../components/admin/ImageUploader';
import api from '../../services/api';
import { buildWebsiteCssVariables, mergeWebsiteConfig } from '../../config/websiteCustomization';
import { normalizeImageUrl } from '../../services/normalize';
import { useWebsiteCustomization } from '../../context/WebsiteCustomizationContext';

const editorTabs = [
  ['branding', 'Branding'], ['colors', 'Colors'], ['header', 'Header'], ['homepage', 'Home sections'],
  ['typography', 'Typography'], ['buttons', 'Buttons'], ['cards', 'Product cards'], ['footer', 'Footer'], ['layout', 'Layout'],
];

const deviceWidths = { desktop: '100%', tablet: '768px', mobile: '390px' };

export default function WebsiteCustomizer() {
  const { refresh: refreshPublishedConfig } = useWebsiteCustomization();
  const [workspace, setWorkspace] = useState({ themes: [], presets: [] });
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('branding');
  const [device, setDevice] = useState(() => previewDeviceForViewport());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [newThemeName, setNewThemeName] = useState('');
  const [newPreset, setNewPreset] = useState('default');
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadHistory = useCallback(async (themeId) => {
    if (!themeId) return setHistory([]);
    try { setHistory(await api.get(`/admin/customization/themes/${themeId}/history`)); } catch { setHistory([]); }
  }, []);

  const selectTheme = useCallback(async (themeId) => {
    setBusy('loading-theme');
    setMessage('');
    try {
      const theme = await api.get(`/admin/customization/themes/${themeId}`);
      setSelectedTheme(theme);
      setDraft(mergeWebsiteConfig(theme.draftConfig));
      await loadHistory(themeId);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  }, [loadHistory]);

  const loadWorkspace = useCallback(async (preferredId) => {
    setLoading(true);
    try {
      const data = await api.get('/admin/customization');
      setWorkspace(data);
      const [productResult, categoryResult] = await Promise.allSettled([
        api.get('/admin/products'),
        api.get('/admin/categories'),
      ]);
      const productData = productResult.status === 'fulfilled' ? productResult.value : [];
      const categoryData = categoryResult.status === 'fulfilled' ? categoryResult.value : [];
      setCatalog(Array.isArray(productData) ? productData : productData.products || productData.items || []);
      setCategories(Array.isArray(categoryData) ? categoryData : categoryData.categories || categoryData.items || []);
      const target = preferredId || data.selectedTheme?._id || data.themes?.[0]?._id;
      if (target) await selectTheme(target);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectTheme]);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  const updateDraft = (path, value) => {
    setDraft((current) => setNested(current, path, value));
    setMessage('Unsaved changes');
  };

  const updateSection = (id, field, value) => {
    const sections = draft.homepage.sections.map((section) => section.id === id ? { ...section, [field]: value } : section);
    updateDraft(['homepage', 'sections'], sections);
  };

  const moveSection = (id, direction) => {
    const sorted = [...draft.homepage.sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((section) => section.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
    updateDraft(['homepage', 'sections'], sorted.map((section, order) => ({ ...section, order: (order + 1) * 10 })));
  };

  const saveDraft = async ({ quiet = false } = {}) => {
    if (!selectedTheme || !draft) return null;
    setBusy('save');
    setMessage('');
    try {
      const theme = await api.put(`/admin/customization/themes/${selectedTheme._id}/draft`, { name: selectedTheme.name, config: draft });
      setSelectedTheme(theme);
      setDraft(mergeWebsiteConfig(theme.draftConfig));
      if (!quiet) setMessage('Draft saved. The live storefront has not changed.');
      await reloadThemeList(theme._id);
      return theme;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      setBusy('');
    }
  };

  const publish = async () => {
    const saved = await saveDraft({ quiet: true });
    if (!saved) return;
    setBusy('publish');
    try {
      const result = await api.post(`/admin/customization/themes/${saved._id}/publish`, { note: `Published from Website Designer` });
      setSelectedTheme(result.theme);
      setDraft(mergeWebsiteConfig(result.theme.draftConfig));
      setMessage(`Published successfully as version ${result.version.version}.`);
      await Promise.all([reloadThemeList(saved._id), loadHistory(saved._id), refreshPublishedConfig()]);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  };

  const discard = async () => {
    if (!selectedTheme || !window.confirm('Discard all unpublished changes in this theme?')) return;
    await themeAction('discard', {}, 'Draft reset to the last published version.');
  };

  const createTheme = async () => {
    const name = newThemeName.trim();
    if (!name) return setMessage('Enter a theme name first.');
    setBusy('create');
    try {
      const theme = await api.post('/admin/customization/themes', { name, preset: newPreset });
      setNewThemeName('');
      setMessage('Theme created as a private draft.');
      await loadWorkspace(theme._id);
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  };

  const duplicate = async () => {
    if (!selectedTheme) return;
    setBusy('duplicate');
    try {
      const theme = await api.post(`/admin/customization/themes/${selectedTheme._id}/duplicate`, { name: `${selectedTheme.name} Copy` });
      setMessage('Theme duplicated.');
      await loadWorkspace(theme._id);
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  };

  const removeTheme = async () => {
    if (!selectedTheme || selectedTheme.isActive) return setMessage('The live theme cannot be deleted. Publish another theme first.');
    if (!window.confirm(`Delete “${selectedTheme.name}” and its version history?`)) return;
    setBusy('delete');
    try {
      await api.delete(`/admin/customization/themes/${selectedTheme._id}`);
      setMessage('Theme deleted.');
      await loadWorkspace();
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  };

  const restoreVersion = async (versionId) => {
    if (!window.confirm('Restore this version into the draft editor? The live storefront will remain unchanged.')) return;
    setBusy('restore');
    try {
      const result = await api.post(`/admin/customization/themes/${selectedTheme._id}/history/${versionId}/restore`, {});
      setSelectedTheme(result.theme);
      setDraft(mergeWebsiteConfig(result.theme.draftConfig));
      setMessage(result.message);
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  };

  const themeAction = async (action, body, successMessage) => {
    setBusy(action);
    try {
      const theme = await api.post(`/admin/customization/themes/${selectedTheme._id}/${action}`, body);
      setSelectedTheme(theme);
      setDraft(mergeWebsiteConfig(theme.draftConfig));
      setMessage(successMessage);
      await reloadThemeList(theme._id);
      if (action === 'activate') await refreshPublishedConfig();
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  };

  const reloadThemeList = async (selectedId) => {
    const themes = await api.get('/admin/customization/themes');
    setWorkspace((current) => ({ ...current, themes }));
    if (selectedId) setSelectedTheme((current) => ({ ...current, ...(themes.find((theme) => theme._id === selectedId) || {}) }));
  };

  if (loading || !draft) {
    return <section className="admin-card grid min-h-80 place-items-center p-8 text-sm font-black text-slate-500">Loading Website Designer...</section>;
  }

  return (
    <section className="space-y-5">
      <PageHeader title="Website Designer" note="Create safely in draft, preview every device, then publish when the storefront is ready." />

      <div className="admin-card flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <StatusDot active={selectedTheme.isActive} />
          <input className="h-10 min-w-48 rounded-xl border border-[#eadfd5] px-3 text-sm font-black" value={selectedTheme.name || ''} onChange={(event) => setSelectedTheme((current) => ({ ...current, name: event.target.value }))} aria-label="Theme name" />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">{draft.theme.preset}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={RotateCcw} label="Discard" onClick={discard} disabled={!!busy} />
          <ActionButton icon={Copy} label="Duplicate" onClick={duplicate} disabled={!!busy} />
          {!selectedTheme.isActive && selectedTheme.publishedConfig && <ActionButton icon={Check} label="Activate" onClick={() => themeAction('activate', {}, 'Theme activated on the live storefront.')} disabled={!!busy} />}
          <ActionButton icon={Trash2} label="Delete" onClick={removeTheme} disabled={!!busy || selectedTheme.isActive} danger />
          <ActionButton icon={Save} label={busy === 'save' ? 'Saving...' : 'Save draft'} onClick={() => saveDraft()} disabled={!!busy} />
          <button type="button" onClick={publish} disabled={!!busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-wine px-4 text-xs font-black text-white disabled:opacity-50"><UploadCloud className="h-4 w-4" />{busy === 'publish' ? 'Publishing...' : 'Publish theme'}</button>
        </div>
      </div>

      {message && <p className={`rounded-xl border px-4 py-3 text-sm font-bold ${message === 'Unsaved changes' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-[#eadfd5] bg-white text-wine'}`}>{message}</p>}

      <div className="grid gap-5 xl:grid-cols-[240px_minmax(320px,430px)_minmax(460px,1fr)]">
        <aside className="space-y-4">
          <div className="admin-card p-4">
            <div className="mb-3 flex items-center gap-2"><Palette className="h-4 w-4 text-wine" /><h2 className="text-sm font-black">My themes</h2></div>
            <div className="space-y-2">
              {workspace.themes.map((theme) => (
                <button key={theme._id} type="button" onClick={() => selectTheme(theme._id)} className={`w-full rounded-xl border p-3 text-left ${theme._id === selectedTheme._id ? 'border-wine bg-[#fff5f6]' : 'border-[#eadfd5] bg-white'}`}>
                  <span className="flex items-center justify-between gap-2 text-xs font-black"><span className="truncate">{theme.name}</span>{theme.isActive && <Check className="h-3.5 w-3.5 text-emerald-600" />}</span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">{theme.hasPublishedVersion ? 'Published' : 'Draft only'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card space-y-3 p-4">
            <h2 className="text-sm font-black">Create from preset</h2>
            <input value={newThemeName} onChange={(event) => setNewThemeName(event.target.value)} placeholder="Theme name" className="h-10 w-full rounded-xl border border-[#eadfd5] px-3 text-sm" />
            <select value={newPreset} onChange={(event) => setNewPreset(event.target.value)} className="h-10 w-full rounded-xl border border-[#eadfd5] bg-white px-3 text-sm font-bold">
              {workspace.presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
            </select>
            <button type="button" onClick={createTheme} disabled={!!busy} className="admin-btn inline-flex h-10 w-full items-center justify-center gap-2"><Plus className="h-4 w-4" />Create theme</button>
          </div>

          <div className="admin-card p-4">
            <div className="mb-3 flex items-center gap-2"><History className="h-4 w-4 text-wine" /><h2 className="text-sm font-black">Version history</h2></div>
            {history.length ? <div className="space-y-2">{history.slice(0, 8).map((version) => (
              <button key={version._id} type="button" onClick={() => restoreVersion(version._id)} className="w-full rounded-xl border border-[#eadfd5] p-3 text-left hover:border-wine">
                <span className="block text-xs font-black">Version {version.version}</span>
                <span className="mt-1 block text-[10px] text-slate-500">{formatDate(version.createdAt)}</span>
              </button>
            ))}</div> : <p className="text-xs leading-5 text-slate-500">Published versions will appear here.</p>}
          </div>
        </aside>

        <div className="admin-card overflow-hidden">
          <div className="flex gap-1 overflow-x-auto border-b border-[#eadfd5] p-2">
            {editorTabs.map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ${activeTab === id ? 'bg-wine text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{label}</button>)}
          </div>
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-4 sm:p-5">
            <EditorPanel tab={activeTab} draft={draft} update={updateDraft} updateSection={updateSection} moveSection={moveSection} catalog={catalog} categories={categories} />
          </div>
        </div>

        <div className="admin-card min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfd5] p-3">
            <div><h2 className="text-sm font-black">Live draft preview</h2><p className="text-[10px] font-semibold text-slate-400">Private until you publish</p></div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {[['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]].map(([id, Icon]) => <button key={id} type="button" onClick={() => setDevice(id)} title={id} aria-label={`${id} preview`} className={`grid h-8 w-9 place-items-center rounded-lg ${device === id ? 'bg-white text-wine shadow-sm' : 'text-slate-400'}`}><Icon className="h-4 w-4" /></button>)}
            </div>
          </div>
          <div className="min-h-[620px] overflow-auto bg-slate-100 p-3 sm:p-5">
            <div className="mx-auto min-h-[580px] overflow-hidden rounded-xl bg-white shadow-xl transition-[width] duration-300" style={{ width: deviceWidths[device], maxWidth: '100%' }}>
              <ThemePreview config={draft} device={device} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EditorPanel({ tab, draft, update, updateSection, moveSection, catalog, categories }) {
  if (tab === 'branding') return <Panel title="Brand identity" note="Used in the header, browser tab and search metadata.">
    <Field label="Website name" value={draft.branding.websiteName} onChange={(value) => update(['branding', 'websiteName'], value)} />
    <Field label="Tagline" value={draft.branding.tagline} onChange={(value) => update(['branding', 'tagline'], value)} />
    <UploadField label="Logo" value={draft.branding.logo} onChange={(value) => update(['branding', 'logo'], value)} context="website-branding" />
    <UploadField label="Favicon" value={draft.branding.favicon} onChange={(value) => update(['branding', 'favicon'], value)} context="website-favicon" />
  </Panel>;

  if (tab === 'colors') return <Panel title="Theme colors" note="A controlled palette keeps the full storefront consistent."><div className="grid gap-3 sm:grid-cols-2">{[
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

  if (tab === 'homepage') return <Panel title="Homepage sections" note="Hide, edit or reorder sections. All selected products and categories come from the real catalog API.">
    <MultiSelect label="Featured categories (leave empty for automatic)" value={draft.homepage.featuredCategoryIds} options={categories.map((category) => ({ value: String(category._id || category.id || category.slug), label: category.name || category.title }))} onChange={(value) => update(['homepage', 'featuredCategoryIds'], value)} />
    {draft.homepage.featuredCategoryIds.length > 0 && <div className="rounded-2xl border border-[#eadfd5] p-4"><p className="mb-3 text-xs font-black text-slate-600">Category image overrides</p><div className="space-y-4">{draft.homepage.featuredCategoryIds.map((categoryId) => { const category = categories.find((item) => String(item._id || item.id || item.slug) === String(categoryId)); const current = draft.homepage.categoryImages.find((item) => String(item.categoryId) === String(categoryId)); return <UploadField key={categoryId} label={category?.name || 'Category image'} value={current?.image || ''} onChange={(image) => update(['homepage', 'categoryImages'], updateCategoryImages(draft.homepage.categoryImages, categoryId, image))} context="website-categories" />; })}</div></div>}
    <div className="space-y-3">{[...draft.homepage.sections].sort((a, b) => a.order - b.order).map((section, index, list) => <div key={section.id} className="rounded-2xl border border-[#eadfd5] p-4">
      <div className="mb-3 flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={section.visible} onChange={(event) => updateSection(section.id, 'visible', event.target.checked)} className="accent-wine" />{section.label}</label><div className="flex gap-1"><IconButton icon={ArrowUp} label="Move up" disabled={index === 0} onClick={() => moveSection(section.id, -1)} /><IconButton icon={ArrowDown} label="Move down" disabled={index === list.length - 1} onClick={() => moveSection(section.id, 1)} /></div></div>
      <div className="grid gap-3"><Field label="Heading" value={section.heading} onChange={(value) => updateSection(section.id, 'heading', value)} /><Field label="Description" value={section.description} onChange={(value) => updateSection(section.id, 'description', value)} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Button text" value={section.buttonText} onChange={(value) => updateSection(section.id, 'buttonText', value)} /><Field label="Button link" value={section.buttonLink} onChange={(value) => updateSection(section.id, 'buttonLink', value)} /></div>{draft.homepage.sectionProductIds[section.id] && <MultiSelect label="Products (leave empty for automatic)" value={draft.homepage.sectionProductIds[section.id]} options={catalog.map((product) => ({ value: String(product._id || product.id || product.slug), label: product.name || product.title }))} onChange={(value) => update(['homepage', 'sectionProductIds', section.id], value)} />}<UploadField label="Section image override" value={section.image} onChange={(value) => updateSection(section.id, 'image', value)} context={`website-${section.id}`} /><UploadField label="Section background" value={section.backgroundImage} onChange={(value) => updateSection(section.id, 'backgroundImage', value)} context={`website-${section.id}-background`} /></div>
    </div>)}</div>
  </Panel>;

  if (tab === 'typography') return <Panel title="Typography">
    <Select label="Heading font" value={draft.typography.headingFont} options={['Playfair Display', 'Inter', 'Georgia', 'Arial']} onChange={(value) => update(['typography', 'headingFont'], value)} />
    <Select label="Body font" value={draft.typography.bodyFont} options={['Inter', 'Figtree', 'Georgia', 'Arial']} onChange={(value) => update(['typography', 'bodyFont'], value)} />
    <Select label="Button font" value={draft.typography.buttonFont} options={['Inter', 'Figtree', 'Georgia', 'Arial']} onChange={(value) => update(['typography', 'buttonFont'], value)} />
    <Range label="Heading scale" value={draft.typography.headingScale} min="0.75" max="1.5" step="0.05" suffix="×" onChange={(value) => update(['typography', 'headingScale'], Number(value))} />
    <Range label="Body scale" value={draft.typography.bodyScale} min="0.8" max="1.3" step="0.05" suffix="×" onChange={(value) => update(['typography', 'bodyScale'], Number(value))} />
    <Select label="Heading weight" value={String(draft.typography.headingWeight)} options={['400', '500', '600', '700', '800', '900']} onChange={(value) => update(['typography', 'headingWeight'], Number(value))} />
  </Panel>;

  if (tab === 'buttons') return <Panel title="Buttons"><div className="grid gap-3 sm:grid-cols-2"><ColorField label="Background" value={draft.buttons.background} onChange={(value) => update(['buttons', 'background'], value)} /><ColorField label="Text" value={draft.buttons.textColor} onChange={(value) => update(['buttons', 'textColor'], value)} /></div><Range label="Corner radius" value={draft.buttons.borderRadius} min="0" max="40" suffix="px" onChange={(value) => update(['buttons', 'borderRadius'], Number(value))} /><Select label="Style" value={draft.buttons.style} options={['solid', 'outline', 'soft']} onChange={(value) => update(['buttons', 'style'], value)} /><Select label="Size" value={draft.buttons.size} options={['small', 'medium', 'large']} onChange={(value) => update(['buttons', 'size'], value)} /><Select label="Hover effect" value={draft.buttons.hoverEffect} options={['none', 'lift', 'darken', 'glow']} onChange={(value) => update(['buttons', 'hoverEffect'], value)} /></Panel>;

  if (tab === 'cards') return <Panel title="Product cards" note="These switches affect every compatible storefront product card."><Select label="Card layout" value={draft.productCards.layout} options={['classic', 'minimal', 'compact']} onChange={(value) => update(['productCards', 'layout'], value)} /><Select label="Image ratio" value={draft.productCards.imageRatio} options={['1/1', '4/5', '3/4']} onChange={(value) => update(['productCards', 'imageRatio'], value)} /><Range label="Corner radius" value={draft.productCards.borderRadius} min="0" max="32" suffix="px" onChange={(value) => update(['productCards', 'borderRadius'], Number(value))} /><Select label="Shadow" value={draft.productCards.shadow} options={['none', 'soft', 'elevated']} onChange={(value) => update(['productCards', 'shadow'], value)} /><div className="grid gap-2 sm:grid-cols-2">{[['showTitle', 'Show title'], ['showPrice', 'Show price'], ['showDiscount', 'Show discount'], ['showRating', 'Show rating'], ['showWishlist', 'Show wishlist'], ['showAddToCart', 'Show add to cart'], ['quickView', 'Show quick view']].map(([key, label]) => <Toggle key={key} label={label} checked={draft.productCards[key]} onChange={(value) => update(['productCards', key], value)} />)}</div></Panel>;

  if (tab === 'footer') return <Panel title="Footer"><Toggle label="Show footer" checked={draft.footer.enabled} onChange={(value) => update(['footer', 'enabled'], value)} /><UploadField label="Footer logo override" value={draft.footer.logo} onChange={(value) => update(['footer', 'logo'], value)} context="website-footer" /><Field multiline label="Description" value={draft.footer.description} onChange={(value) => update(['footer', 'description'], value)} /><div className="grid gap-3 sm:grid-cols-2"><ColorField label="Background" value={draft.footer.background} onChange={(value) => update(['footer', 'background'], value)} /><ColorField label="Text" value={draft.footer.textColor} onChange={(value) => update(['footer', 'textColor'], value)} /></div><Toggle label="Show contact details" checked={draft.footer.showContact} onChange={(value) => update(['footer', 'showContact'], value)} />{draft.footer.showContact && <div className="grid gap-3"><Field label="Contact email" value={draft.footer.contactEmail} onChange={(value) => update(['footer', 'contactEmail'], value)} /><Field label="Contact phone" value={draft.footer.contactPhone} onChange={(value) => update(['footer', 'contactPhone'], value)} /><Field label="Contact address" value={draft.footer.contactAddress} onChange={(value) => update(['footer', 'contactAddress'], value)} /></div>}<Toggle label="Show social links" checked={draft.footer.showSocialLinks} onChange={(value) => update(['footer', 'showSocialLinks'], value)} />{draft.footer.showSocialLinks && <div className="grid gap-3 sm:grid-cols-2">{Object.keys(draft.footer.socialLinks).map((network) => <Field key={network} label={`${network} URL`} value={draft.footer.socialLinks[network]} onChange={(value) => update(['footer', 'socialLinks', network], value)} />)}</div>}<Toggle label="Show newsletter" checked={draft.footer.showNewsletter} onChange={(value) => update(['footer', 'showNewsletter'], value)} /><MenuEditor label="Shopping menu" items={draft.footer.menus.shopping} onChange={(value) => update(['footer', 'menus', 'shopping'], value)} /><MenuEditor label="Policies menu" items={draft.footer.menus.policies} onChange={(value) => update(['footer', 'menus', 'policies'], value)} /><MenuEditor label="About menu" items={draft.footer.menus.about} onChange={(value) => update(['footer', 'menus', 'about'], value)} /><Field label="Copyright text" value={draft.footer.copyrightText} onChange={(value) => update(['footer', 'copyrightText'], value)} /></Panel>;

  return <Panel title="Store layout"><Select label="Page width" value={draft.layout.mode} options={['full', 'boxed']} onChange={(value) => update(['layout', 'mode'], value)} /><Range label="Maximum width" value={draft.layout.maxWidth} min="960" max="1920" step="40" suffix="px" onChange={(value) => update(['layout', 'maxWidth'], Number(value))} /><Range label="Section spacing" value={draft.layout.sectionSpacing} min="16" max="160" step="4" suffix="px" onChange={(value) => update(['layout', 'sectionSpacing'], Number(value))} /><Range label="Product grid gap" value={draft.layout.gridGap} min="4" max="64" step="2" suffix="px" onChange={(value) => update(['layout', 'gridGap'], Number(value))} /><div className="grid gap-3 sm:grid-cols-3"><Range label="Desktop columns" value={draft.layout.productsPerRow.desktop} min="2" max="6" onChange={(value) => update(['layout', 'productsPerRow', 'desktop'], Number(value))} /><Range label="Tablet columns" value={draft.layout.productsPerRow.tablet} min="2" max="5" onChange={(value) => update(['layout', 'productsPerRow', 'tablet'], Number(value))} /><Range label="Mobile columns" value={draft.layout.productsPerRow.mobile} min="1" max="3" onChange={(value) => update(['layout', 'productsPerRow', 'mobile'], Number(value))} /></div></Panel>;
}

function ThemePreview({ config, device }) {
  const sections = [...config.homepage.sections].filter((section) => section.visible).sort((a, b) => a.order - b.order);
  const logo = normalizeImageUrl(config.branding.logo);
  const style = buildWebsiteCssVariables(config);
  const narrow = device !== 'desktop';
  return <div className="min-h-[580px]" style={{ ...style, background: config.colors.background, color: config.colors.text, fontFamily: style['--site-body-font'] }}>
    {config.header.announcementEnabled && <div className="px-3 py-2 text-center text-[9px] font-bold" style={{ background: config.header.announcementBackground, color: config.header.announcementTextColor }}>{config.header.announcementText}</div>}
    <div className="flex items-center justify-between border-b px-4 py-3" style={{ background: config.header.background, color: config.header.textColor }}>
      <div className="flex items-center gap-2">{logo ? <img src={logo} alt="Theme logo" className="object-contain" style={{ height: Math.min(44, config.header.logoSize * .5) }} /> : <span className="grid h-8 w-8 place-items-center rounded-full text-xs font-black" style={{ background: config.colors.secondary, color: config.colors.primary }}>SC</span>}<strong className="text-xs">{config.branding.websiteName}</strong></div>
      <div className="flex items-center gap-3 text-[9px] font-bold">{!narrow && <><span>Home</span><span>Shop</span><span>New</span><span>Offers</span></>}<span>Bag</span></div>
    </div>
    <div className="flex flex-col">{sections.map((section) => <PreviewSection key={section.id} section={section} config={config} narrow={narrow} />)}</div>
    {config.footer.enabled && <div className="p-5" style={{ background: config.footer.background, color: config.footer.textColor }}><strong className="text-xs">{config.branding.websiteName}</strong><p className="mt-2 max-w-md text-[9px] leading-4 opacity-75">{config.footer.description}</p><p className="mt-4 text-[8px] opacity-60">{config.footer.copyrightText}</p></div>}
  </div>;
}

function PreviewSection({ section, config, narrow }) {
  if (section.id === 'hero') {
    const image = normalizeImageUrl(section.image);
    return <section className={`grid min-h-52 items-center gap-4 p-6 ${narrow ? 'grid-cols-1' : 'grid-cols-2'}`} style={{ background: config.colors.secondary }}><div><p className="text-[8px] font-black uppercase tracking-[.2em]" style={{ color: config.colors.accent }}>New collection</p><h2 className="mt-2 text-2xl leading-tight" style={{ fontFamily: 'var(--site-heading-font)', transformOrigin: 'left', fontWeight: config.typography.headingWeight }}>{section.heading}</h2><p className="mt-2 text-[10px] opacity-65">{section.description}</p>{section.buttonText && <button type="button" className="mt-4 px-4 py-2 text-[9px]" style={previewButtonStyle(config)}>{section.buttonText}</button>}</div><div className="min-h-36 overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${config.colors.secondary}, ${config.colors.accent}55)` }}>{image && <img src={image} alt="Hero preview" className="h-full min-h-36 w-full object-cover" />}</div></section>;
  }
  if (['categories', 'featured', 'newArrivals', 'bestSellers', 'trending', 'instagram'].includes(section.id)) {
    const count = narrow ? Math.min(2, config.layout.productsPerRow.mobile) : Math.min(4, config.layout.productsPerRow.desktop);
    return <section className="p-5" style={{ background: config.colors.background }}><div className="mb-3 flex items-end justify-between"><div><h3 className="text-base" style={{ fontFamily: 'var(--site-heading-font)' }}>{section.heading}</h3><p className="text-[8px] opacity-55">{section.description}</p></div>{section.buttonText && <span className="text-[8px] font-bold" style={{ color: config.colors.primary }}>{section.buttonText}</span>}</div><div className="grid" style={{ gridTemplateColumns: `repeat(${count},minmax(0,1fr))`, gap: Math.min(config.layout.gridGap, 14) }}>{Array.from({ length: count }).map((_, index) => <div key={index} className="overflow-hidden bg-white" style={{ borderRadius: config.productCards.borderRadius, boxShadow: previewShadow(config.productCards.shadow) }}><div style={{ aspectRatio: config.productCards.imageRatio, background: `linear-gradient(145deg, ${config.colors.secondary}, ${config.colors.accent}66)` }} /><div className="space-y-1 p-2">{config.productCards.showTitle && <div className="h-1.5 w-4/5 rounded bg-slate-300" />}{config.productCards.showPrice && <div className="h-1.5 w-1/2 rounded" style={{ background: config.colors.primary }} />}</div></div>)}</div></section>;
  }
  if (section.id === 'sale' || section.id === 'promotional') return <section className="m-5 flex min-h-24 items-center justify-between gap-4 rounded-xl p-5" style={{ background: config.colors.primary, color: config.buttons.textColor }}><div><h3 className="text-lg" style={{ fontFamily: 'var(--site-heading-font)' }}>{section.heading}</h3><p className="text-[9px] opacity-70">{section.description}</p></div>{section.buttonText && <button type="button" className="shrink-0 border px-3 py-2 text-[8px]" style={{ borderRadius: config.buttons.borderRadius }}>{section.buttonText}</button>}</section>;
  return <section className="p-5 text-center" style={{ background: section.id === 'newsletter' ? config.colors.secondary : config.colors.background }}><h3 className="text-base" style={{ fontFamily: 'var(--site-heading-font)' }}>{section.heading}</h3><p className="mt-1 text-[8px] opacity-55">{section.description}</p></section>;
}

function previewButtonStyle(config) {
  return { borderRadius: config.buttons.borderRadius, background: config.buttons.style === 'outline' ? 'transparent' : config.buttons.style === 'soft' ? config.colors.secondary : config.buttons.background, color: config.buttons.style === 'outline' ? config.buttons.background : config.buttons.textColor, border: config.buttons.style === 'outline' ? `1px solid ${config.buttons.background}` : 'none' };
}
function previewShadow(shadow) { return shadow === 'none' ? 'none' : shadow === 'elevated' ? '0 8px 20px rgba(0,0,0,.14)' : '0 4px 12px rgba(0,0,0,.08)'; }
function Panel({ title, note, children }) { return <div className="space-y-4"><div><h2 className="text-lg font-black text-charcoal">{title}</h2>{note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}</div>{children}</div>; }
function Field({ label, value, onChange, multiline = false }) { const Tag = multiline ? 'textarea' : 'input'; return <label className="grid gap-2 text-xs font-black text-slate-600">{label}<Tag value={value || ''} onChange={(event) => onChange(event.target.value)} className={`${multiline ? 'min-h-24 py-3' : 'h-10'} rounded-xl border border-[#eadfd5] px-3 text-sm font-medium text-charcoal outline-none focus:border-wine`} /></label>; }
function ColorField({ label, value, onChange }) { return <label className="grid gap-2 text-xs font-black text-slate-600">{label}<span className="flex h-10 overflow-hidden rounded-xl border border-[#eadfd5] bg-white"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 cursor-pointer border-0" /><input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 px-2 text-xs font-bold uppercase outline-none" /></span></label>; }
function Toggle({ label, checked, onChange }) { return <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#eadfd5] bg-white px-3 text-xs font-black text-slate-600"><span>{label}</span><input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-wine" /></label>; }
function Range({ label, value, onChange, min, max, step = '1', suffix = '' }) { return <label className="grid gap-2 text-xs font-black text-slate-600"><span className="flex justify-between"><span>{label}</span><span className="text-wine">{value}{suffix}</span></span><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} className="accent-wine" /></label>; }
function Select({ label, value, options, onChange }) { return <label className="grid gap-2 text-xs font-black text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-[#eadfd5] bg-white px-3 text-sm font-bold capitalize"><option value="" disabled>Select</option>{options.map((option) => <option key={option} value={option}>{String(option).replace(/([A-Z])/g, ' $1')}</option>)}</select></label>; }
function MultiSelect({ label, value = [], options = [], onChange }) { return <label className="grid gap-2 text-xs font-black text-slate-600">{label}<select multiple value={value} onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => option.value))} className="min-h-32 rounded-xl border border-[#eadfd5] bg-white p-2 text-sm font-semibold"><option value="" disabled>{options.length ? 'Ctrl/Cmd-click to select multiple' : 'No published catalog items available'}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function MenuEditor({ label, items = [], onChange }) { const edit = (index, key, value) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); return <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-xs font-black text-slate-600">{label}</p><button type="button" onClick={() => onChange([...items, { label: 'New link', path: '/products' }])} className="text-[10px] font-black text-wine">+ Add link</button></div>{items.map((item, index) => <div key={`${index}-${item.label}`} className="grid grid-cols-[1fr_1.25fr_32px] gap-2"><input value={item.label} onChange={(event) => edit(index, 'label', event.target.value)} className="h-9 min-w-0 rounded-lg border border-[#eadfd5] px-2 text-xs" aria-label={`${label} link label`} /><input value={item.path} onChange={(event) => edit(index, 'path', event.target.value)} className="h-9 min-w-0 rounded-lg border border-[#eadfd5] px-2 text-xs" aria-label={`${label} link path`} /><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="grid h-9 place-items-center rounded-lg border border-rose-100 text-rose-600" aria-label="Remove footer link"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>; }
function UploadField({ label, value, onChange, context }) { return <div className="space-y-2"><p className="text-xs font-black text-slate-600">{label}</p><ImageUploader value={value ? [{ url: value, primary: true }] : []} onChange={(files) => onChange(files[0]?.url || '')} uploadContext={context} showPrimaryControl={false} label={`Upload ${label}`} helpText="JPG, PNG or WEBP. Existing store upload rules apply." /></div>; }
function IconButton({ icon: Icon, label, ...props }) { return <button type="button" aria-label={label} title={label} className="grid h-8 w-8 place-items-center rounded-lg border border-[#eadfd5] text-slate-500 disabled:opacity-30" {...props}><Icon className="h-3.5 w-3.5" /></button>; }
function ActionButton({ icon: Icon, label, danger = false, ...props }) { return <button type="button" className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black ${danger ? 'border-rose-200 text-rose-700' : 'border-[#eadfd5] bg-white text-slate-600'}`} {...props}><Icon className="h-4 w-4" />{label}</button>; }
function StatusDot({ active }) { return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />{active ? 'Live' : 'Draft'}</span>; }
function formatDate(value) { try { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); } catch { return ''; } }
function setNested(source, path, value) { const next = JSON.parse(JSON.stringify(source)); let target = next; path.slice(0, -1).forEach((key) => { target[key] = target[key] && typeof target[key] === 'object' ? target[key] : {}; target = target[key]; }); target[path[path.length - 1]] = value; return next; }
function previewDeviceForViewport() { if (typeof window === 'undefined') return 'desktop'; if (window.matchMedia('(max-width: 767px)').matches) return 'mobile'; if (window.matchMedia('(max-width: 1023px)').matches) return 'tablet'; return 'desktop'; }
function updateCategoryImages(items, categoryId, image) { const next = (items || []).filter((item) => String(item.categoryId) !== String(categoryId)); return image ? [...next, { categoryId, image }] : next; }
