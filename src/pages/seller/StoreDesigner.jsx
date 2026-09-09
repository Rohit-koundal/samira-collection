import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, LayoutTemplate, Palette, Save, Sparkles } from 'lucide-react';
import api from '../../services/api';
import PageState from '../../components/ui/PageState';
import { useAuth } from '../../context/AuthContext';

const COLOR_FIELDS = [['primary', 'Primary'], ['secondary', 'Secondary'], ['accent', 'Accent'], ['background', 'Page'], ['surface', 'Cards'], ['text', 'Text']];
const FONTS = ['Inter', 'Playfair Display', 'Georgia', 'Arial'];

export default function StoreDesigner() {
  const { notify } = useAuth();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    setError('');
    try { const result = await api.get('/seller/design'); setData(result); setDraft(result.draftConfig); }
    catch (requestError) { setError(requestError.message); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateGroup = (group, key, value) => setDraft((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  const applyPreset = (preset) => {
    const appearance = preset.config || {};
    setDraft((current) => ({
      ...current,
      colors: { ...current.colors, ...appearance.colors },
      typography: { ...current.typography, ...appearance.typography },
      buttons: { ...current.buttons, ...appearance.buttons },
      productCards: { ...current.productCards, ...appearance.productCards },
      theme: { ...current.theme, ...appearance.theme, preset: preset.id },
    }));
  };
  const updateSection = (id, changes) => setDraft((current) => ({ ...current, homepage: { ...current.homepage, sections: current.homepage.sections.map((section) => section.id === id ? { ...section, ...changes } : section) } }));
  const moveSection = (id, direction) => setDraft((current) => {
    const sections = [...current.homepage.sections].sort((left, right) => left.order - right.order);
    const index = sections.findIndex((section) => section.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return current;
    const order = sections[index].order;
    sections[index] = { ...sections[index], order: sections[target].order };
    sections[target] = { ...sections[target], order };
    return { ...current, homepage: { ...current.homepage, sections } };
  });

  const save = async (publish = false) => {
    if (!draft || busy) return;
    setBusy(publish ? 'publish' : 'save');
    try {
      const saved = await api.put('/seller/design', { config: draft, preset: draft.theme?.preset });
      setDraft(saved.draftConfig);
      if (publish) {
        const result = await api.post('/seller/design/publish', {});
        setData((current) => ({ ...current, publishedAt: result.publishedAt, publishedConfig: result.config }));
        notify('Your storefront design is now live.', 'success', 'Website published');
      } else notify('Design draft saved. Your live store has not changed.', 'success', 'Draft saved');
    } catch (requestError) { notify(requestError.message, 'error', 'Store designer'); }
    finally { setBusy(''); }
  };

  if (!data && !error) return <PageState loading loadingLabel="Opening Store Designer..." />;
  if (!data && error) return <PageState error={error} onRetry={load} />;
  const sections = [...(draft.homepage?.sections || [])].sort((left, right) => left.order - right.order);

  return <section className="mx-auto max-w-[1440px] space-y-5 text-slate-900">
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#28151c] via-[#68152f] to-[#a03e5c] p-5 text-white shadow-xl sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-white/65">No-code storefront</p><h1 className="mt-2 font-display text-3xl font-black">Store Designer</h1><p className="mt-2 max-w-2xl text-sm leading-6 text text-white/75">Choose a polished starting point, adjust your visual system and control homepage sections. Product, order and checkout data stay untouched.</p></div><a href={data.store.slug === 'samira-collection' ? '/' : `/store/${data.store.slug}`} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-black hover:bg-white/20">Open storefront <ExternalLink size={15} /></a></div><p className="mt-5 text-xs font-bold text-white/65">{data.publishedAt ? `Last published ${new Date(data.publishedAt).toLocaleString('en-IN')}` : 'Using the platform design until you publish your first version.'}</p></header>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <Panel icon={Sparkles} title="Premium presets" note="Presets update appearance only; your content and product selections remain in place."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.presets.map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${draft.theme?.preset === preset.id ? 'border-[#751d39] ring-2 ring-[#751d39]/10' : ''}`}><span className="flex gap-1">{['primary', 'secondary', 'accent'].map((key) => <i key={key} className="h-7 flex-1 rounded-lg" style={{ background: preset.config?.colors?.[key] }} />)}</span><strong className="mt-3 block text-sm">{preset.name}</strong><small className="mt-1 block leading-5 text-slate-500">{preset.description}</small></button>)}</div></Panel>

        <Panel icon={Palette} title="Colours and typography" note="Accessible choices are normalized by the same theme engine used by the storefront."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{COLOR_FIELDS.map(([key, label]) => <label key={key} className="grid gap-2 text-xs font-black">{label} colour<span className="flex h-11 items-center gap-2 rounded-xl border px-2"><input type="color" value={draft.colors[key]} onChange={(event) => updateGroup('colors', key, event.target.value)} className="h-8 w-10 border-0 bg-transparent" /><input aria-label={`${label} hex colour`} value={draft.colors[key]} maxLength={7} onChange={(event) => updateGroup('colors', key, event.target.value)} className="min-w-0 flex-1 text-sm font-bold uppercase outline-none" /></span></label>)}<Select label="Heading font" value={draft.typography.headingFont} onChange={(value) => updateGroup('typography', 'headingFont', value)} options={FONTS} /><Select label="Body font" value={draft.typography.bodyFont} onChange={(value) => updateGroup('typography', 'bodyFont', value)} options={FONTS} /><Select label="Button shape" value={String(draft.buttons.borderRadius)} onChange={(value) => updateGroup('buttons', 'borderRadius', Number(value))} options={[['2', 'Square'], ['8', 'Soft'], ['16', 'Rounded'], ['999', 'Pill']]} /></div></Panel>

        <Panel icon={LayoutTemplate} title="Product cards and layout" note="These settings apply across product grids on desktop and mobile."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Select label="Card style" value={draft.productCards.layout} onChange={(value) => updateGroup('productCards', 'layout', value)} options={[['classic', 'Classic'], ['minimal', 'Minimal'], ['compact', 'Compact']]} /><Select label="Image ratio" value={draft.productCards.imageRatio} onChange={(value) => updateGroup('productCards', 'imageRatio', value)} options={['4/5', '3/4', '1/1']} /><Select label="Card shadow" value={draft.productCards.shadow} onChange={(value) => updateGroup('productCards', 'shadow', value)} options={['none', 'soft', 'elevated']} /><NumberField label="Card roundness" value={draft.productCards.borderRadius} min={0} max={32} onChange={(value) => updateGroup('productCards', 'borderRadius', value)} /><NumberField label="Desktop products per row" value={draft.layout.productsPerRow.desktop} min={2} max={6} onChange={(value) => updateGroup('layout', 'productsPerRow', { ...draft.layout.productsPerRow, desktop: value })} /><NumberField label="Section spacing" value={draft.layout.sectionSpacing} min={24} max={140} onChange={(value) => updateGroup('layout', 'sectionSpacing', value)} /></div><div className="mt-4 flex flex-wrap gap-3">{[['showRating', 'Ratings'], ['showWishlist', 'Wishlist'], ['showAddToCart', 'Add to bag'], ['showDiscount', 'Discount']].map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"><input type="checkbox" checked={draft.productCards[key]} onChange={(event) => updateGroup('productCards', key, event.target.checked)} /> Show {label}</label>)}</div></Panel>

        <Panel icon={LayoutTemplate} title="Homepage sections" note="Hide, rename or reorder sections without deleting catalog data."><div className="divide-y rounded-2xl border">{sections.map((section, index) => <div key={section.id} className="grid gap-3 p-4 sm:grid-cols-[auto_minmax(160px,1fr)_minmax(180px,1.2fr)_auto] sm:items-center"><input type="checkbox" aria-label={`Show ${section.label}`} checked={section.visible} onChange={(event) => updateSection(section.id, { visible: event.target.checked })} /><div><strong className="text-sm">{section.label}</strong><small className="block text-slate-400">{section.id}</small></div><input aria-label={`${section.label} heading`} value={section.heading || ''} maxLength={100} onChange={(event) => updateSection(section.id, { heading: event.target.value })} className="h-10 rounded-xl border px-3 text-sm" /><div className="flex gap-1"><button type="button" aria-label={`Move ${section.label} up`} disabled={index === 0} onClick={() => moveSection(section.id, -1)} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30"><ArrowUp size={15} /></button><button type="button" aria-label={`Move ${section.label} down`} disabled={index === sections.length - 1} onClick={() => moveSection(section.id, 1)} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30"><ArrowDown size={15} /></button></div></div>)}</div></Panel>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-5"><div className="overflow-hidden rounded-3xl border bg-white shadow-lg"><div className="p-4" style={{ background: draft.colors.background }}><div className="rounded-2xl p-4 shadow-sm" style={{ background: draft.colors.surface, color: draft.colors.text }}><div className="h-2 w-24 rounded-full" style={{ background: draft.colors.primary }} /><h2 className="mt-6 text-2xl font-black" style={{ fontFamily: draft.typography.headingFont }}>Your storefront preview</h2><p className="mt-2 text-sm" style={{ fontFamily: draft.typography.bodyFont, color: draft.colors.mutedText }}>A light preview of your colours, type and product card.</p><div className="mt-5 overflow-hidden border" style={{ borderRadius: draft.productCards.borderRadius, boxShadow: draft.productCards.shadow === 'elevated' ? '0 18px 40px #0002' : draft.productCards.shadow === 'soft' ? '0 8px 22px #0001' : 'none' }}><div className="aspect-[4/5]" style={{ background: draft.colors.secondary }} /><div className="p-3"><strong className="text-sm">Sample product</strong><p className="mt-1 font-black" style={{ color: draft.colors.primary }}>₹1,299</p></div></div><button type="button" className="mt-5 h-11 w-full font-black text-white" style={{ background: draft.buttons.background || draft.colors.primary, borderRadius: draft.buttons.borderRadius }}>Shop now</button></div></div></div><div className="rounded-3xl border bg-white p-5 shadow-sm"><p className="text-xs leading-5 text-slate-500">Save keeps a private draft. Publish updates only this store and leaves the platform theme, products, orders and checkout logic unchanged.</p><div className="mt-4 grid gap-2"><button type="button" disabled={Boolean(busy)} onClick={() => save(false)} className="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black"><Save size={16} />{busy === 'save' ? 'Saving...' : 'Save draft'}</button><button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#751d39] text-sm font-black text-white"><Sparkles size={16} />{busy === 'publish' ? 'Publishing...' : 'Save and publish'}</button></div></div></aside>
    </div>
  </section>;
}

function Panel({ icon: Icon, title, note, children }) { return <section className="rounded-3xl border border-[#eaded6] bg-white p-5 shadow-sm sm:p-6"><header className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f4e5e9] text-[#751d39]"><Icon size={18} /></span><div><h2 className="text-lg font-black">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{note}</p></div></header>{children}</section>; }
function Select({ label, value, onChange, options }) { return <label className="grid gap-2 text-xs font-black">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm font-normal">{options.map((item) => { const [key, text] = Array.isArray(item) ? item : [item, item]; return <option key={key} value={key}>{text}</option>; })}</select></label>; }
function NumberField({ label, value, onChange, min, max }) { return <label className="grid gap-2 text-xs font-black">{label}<input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} className="h-11 rounded-xl border px-3 text-sm font-normal" /></label>; }
