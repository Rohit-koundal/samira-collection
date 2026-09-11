import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, Archive, CalendarClock, Check, CheckCircle2, ChevronLeft, ChevronRight,
  ClipboardCheck, Copy, Download, ExternalLink, Filter, PackageSearch, PauseCircle, Plus, RefreshCw,
  RotateCcw, Save, Search, Settings2, ShieldCheck, Store, UserPlus, X,
} from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/admin/PageHeader';
import PageState from '../../components/ui/PageState';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { name: '', slug: '', ownerName: '', ownerPhone: '', industry: 'fashion', plan: 'PROFESSIONAL', licenseStatus: 'TRIAL', licenseEndsAt: '' };
const EMPTY_QUERY = { q: '', license: '', plan: '', industry: '', storeStatus: '', readiness: '', migration: '', archive: '', sort: 'newest', page: 1 };
const TABS = ['Overview', 'Subscription', 'Usage', 'Features & limits', 'Team', 'Storefront', 'Industry', 'Activity', 'Client app'];

export default function PlatformStores() {
  const { notify } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [query, setQuery] = useState(EMPTY_QUERY);
  const [create, setCreate] = useState(EMPTY);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [operations, setOperations] = useState(null);
  const [edit, setEdit] = useState(null);
  const [baseline, setBaseline] = useState('');
  const [tab, setTab] = useState('Overview');
  const [prompt, setPrompt] = useState(null);
  const [industryPreview, setIndustryPreview] = useState(null);
  const [migrationProducts, setMigrationProducts] = useState(null);

  const load = async (next = query) => {
    const params = new URLSearchParams(Object.entries(next).filter(([, value]) => value !== '' && value != null));
    setError('');
    try { setWorkspace(await api.get(`/master/stores?${params}`)); }
    catch (requestError) { if (!workspace) setError(requestError.message); else notify(requestError.message, 'error', 'Store portfolio'); }
  };
  useEffect(() => { const timer = window.setTimeout(() => load(query), query.q ? 300 : 0); return () => window.clearTimeout(timer); }, [query.q, query.license, query.plan, query.industry, query.storeStatus, query.readiness, query.migration, query.archive, query.sort, query.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (key, task) => {
    if (busy[key]) return;
    setBusy((current) => ({ ...current, [key]: true }));
    try { return await task(); }
    catch (requestError) { notify(requestError.message, 'error', 'Store portfolio'); return null; }
    finally { setBusy((current) => ({ ...current, [key]: false })); }
  };
  const mergeStore = (store) => setWorkspace((current) => current ? { ...current, stores: current.stores.map((item) => item.id === store.id ? store : item) } : current);
  const setCurrentStore = (store) => {
    mergeStore(store); setOperations((current) => current ? { ...current, store } : current);
    const next = toEdit(store); setEdit(next); setBaseline(JSON.stringify(next));
  };
  const refreshOperations = async (id = selected) => {
    const result = await api.get(`/master/stores/${id}/operations`); setOperations(result); mergeStore(result.store);
    const next = toEdit(result.store); setEdit(next); setBaseline(JSON.stringify(next)); return result;
  };
  const openStore = async (store) => {
    const result = await run(`open-${store.id}`, async () => {
      setSelected(store.id); setOperations(null); setEdit(null); setTab('Overview'); setIndustryPreview(null); setMigrationProducts(null);
      return refreshOperations(store.id);
    });
    if (!result) setSelected('');
  };
  const closeStore = () => {
    if (edit && JSON.stringify(edit) !== baseline) return setPrompt({ kind: 'discard', title: 'Discard unsaved changes?', message: 'Your changes in this store have not been saved.', reason: '' });
    setSelected(''); setOperations(null); setEdit(null); setPrompt(null); setIndustryPreview(null); setMigrationProducts(null);
  };
  const forceClose = () => { setSelected(''); setOperations(null); setEdit(null); setPrompt(null); setIndustryPreview(null); setMigrationProducts(null); };

  const createStore = () => run('create', async () => {
    const result = await api.post('/stores', create); setCreate(EMPTY); await load({ ...query, page: 1 });
    notify(`${result.store.name} was created with its owner, membership and starter catalogue.`, 'success', 'Store created');
  });
  const saveProfile = () => run(`profile-${selected}`, async () => {
    const result = await api.patch(`/master/stores/${selected}/profile`, { baseRevision: operations.store.revision, ...profilePayload(edit) });
    setCurrentStore(result.store); notify('Store identity and readiness were saved.', 'success', 'Store updated');
  });
  const saveSubscription = () => run(`subscription-${selected}`, async () => {
    const result = await api.patch(`/master/stores/${selected}/subscription`, { baseRevision: operations.store.revision, ...subscriptionPayload(edit) });
    setCurrentStore(result.store); notify('Plan, limits and feature access were saved.', 'success', 'Subscription updated');
  });
  const askGrant = (billingCycle) => setPrompt({ kind: 'grant', title: `Grant ${grantLabel(billingCycle)} access?`, message: 'This changes access immediately and creates an owner-only operation record.', billingCycle, reason: '' });
  const grant = (value) => run(`grant-${selected}`, async () => {
    const result = await api.post(`/master/stores/${selected}/subscription/grants`, { baseRevision: operations.store.revision, plan: edit.plan, billingCycle: value.billingCycle, reason: value.reason, idempotencyKey: operationKey('grant') });
    setPrompt(null); setCurrentStore(result.store); notify(result.duplicate ? 'This access grant was already applied.' : `${grantLabel(value.billingCycle)} access is active.`, result.duplicate ? 'warning' : 'success', 'Access updated');
  });
  const lifecycle = (value) => run(`lifecycle-${selected}`, async () => {
    const result = await api.patch(`/master/stores/${selected}/lifecycle`, { baseRevision: operations.store.revision, action: value.action, reason: value.reason });
    setPrompt(null); setCurrentStore(result.store); notify('Store lifecycle was updated.', 'success', 'Store updated');
  });
  const addMember = (member) => run(`member-${selected}`, async () => {
    await api.post(`/master/stores/${selected}/members`, { ...member, baseRevision: operations.store.revision }); const result = await refreshOperations();
    notify('Team access has been added.', 'success', 'Team updated');
    return result;
  });
  const updateMember = (member, values) => run(`member-${member.id}`, async () => {
    await api.patch(`/master/stores/${selected}/members/${member.id}`, { ...values, baseRevision: operations.store.revision }); const result = await refreshOperations();
    notify('Team member access was updated.', 'success', 'Team updated');
    return result;
  });
  const transferOwner = (value) => run(`owner-${selected}`, async () => {
    const result = await api.post(`/master/stores/${selected}/transfer-owner`, { baseRevision: operations.store.revision, phone: value.phone, reason: value.reason });
    setPrompt(null); setCurrentStore(result.store); await refreshOperations(); notify('Store ownership was transferred safely.', 'success', 'Owner updated');
  });
  const previewIndustry = () => run(`industry-${selected}`, async () => {
    const result = await api.get(`/master/stores/${selected}/industry-impact?industry=${encodeURIComponent(edit.industry)}`); setIndustryPreview({ ...result, note: '' });
  });
  const convertIndustry = (preview) => run(`convert-${selected}`, async () => {
    const result = await api.post(`/master/stores/${selected}/industry-conversion`, { industry: preview.to.id, baseRevision: preview.revision, impactToken: preview.impactToken, reviewNote: preview.note });
    setIndustryPreview(null); setCurrentStore(result.store); await refreshOperations(); notify(`${result.reviewProducts} product(s) need review against the new catalogue.`, result.reviewProducts ? 'warning' : 'success', 'Industry converted');
  });
  const loadMigrationProducts = () => run(`migration-products-${selected}`, async () => setMigrationProducts(await api.get(`/master/stores/${selected}/migration/products?page=1&limit=500`)));
  const saveMigrationReview = (reviewAssignedTo, note) => run(`migration-review-${selected}`, async () => {
    const result = await api.patch(`/master/stores/${selected}/migration`, { baseRevision: operations.store.revision, reviewAssignedTo, note }); setCurrentStore(result.store); await refreshOperations(); notify('Migration reviewer and note were saved.', 'success', 'Review updated');
  });
  const completeMigration = (value) => run(`migration-complete-${selected}`, async () => {
    const result = await api.post(`/master/stores/${selected}/migration/complete`, { baseRevision: operations.store.revision, note: value.reason }); setPrompt(null); setCurrentStore(result.store); await refreshOperations(); notify('Catalogue migration is complete.', 'success', 'Migration complete');
  });
  const rollbackMigration = (value) => run(`migration-rollback-${selected}`, async () => {
    const result = await api.post(`/master/stores/${selected}/migration/rollback`, { baseRevision: operations.store.revision, reason: value.reason }); setPrompt(null); setCurrentStore(result.store); await refreshOperations(); notify('Previous industry configuration was restored.', 'warning', 'Industry restored');
  });
  const exportStoreData = (value) => run(`export-${selected}`, async () => {
    const blob = await api.download(`/master/stores/${selected}/export`, { baseRevision: operations.store.revision, reason: value.reason });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${operations.store.slug}-data-${new Date().toISOString().slice(0, 10)}.ndjson`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setPrompt(null);
    notify('Client business data export was prepared.', 'success', 'Export complete');
  });

  const plans = useMemo(() => workspace?.plans || [], [workspace?.plans]);
  const industries = useMemo(() => workspace?.industryOptions || [], [workspace?.industryOptions]);
  const allFeatures = useMemo(() => [...new Set(plans.flatMap((plan) => plan.features || []))], [plans]);
  if (!workspace && error) return <PageState error={error} onRetry={() => load(query)} />;
  if (!workspace) return <PageState loading loadingLabel="Loading store operations..." />;

  return <section className="min-w-0 space-y-5">
    <PageHeader title="Store portfolio" note="Tenant identity, access, readiness and catalogue operations in one master workspace.">
      <button type="button" className="admin-btn-ghost" onClick={() => load(query)}><RefreshCw size={16} /> Refresh</button>
    </PageHeader>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      <Summary icon={Store} label="All stores" value={workspace.summary.total} />
      <Summary icon={ShieldCheck} label="Active" value={workspace.summary.active} tone="green" />
      <Summary icon={CalendarClock} label="Trials" value={workspace.summary.trials} />
      <Summary icon={AlertTriangle} label="Expired" value={workspace.summary.expired} tone={workspace.summary.expired ? 'red' : ''} onClick={() => setQuery({ ...query, license: 'EXPIRED', page: 1 })} />
      <Summary icon={PauseCircle} label="Suspended" value={workspace.summary.suspended} tone={workspace.summary.suspended ? 'red' : ''} onClick={() => setQuery({ ...query, license: 'SUSPENDED', page: 1 })} />
      <Summary icon={AlertTriangle} label="Expiring in 30d" value={workspace.summary.expiring} tone={workspace.summary.expiring ? 'amber' : ''} onClick={() => setQuery({ ...query, sort: 'expiry', page: 1 })} />
      <Summary icon={PackageSearch} label="Migration review" value={workspace.summary.migrationPending} tone={workspace.summary.migrationPending ? 'amber' : ''} onClick={() => setQuery({ ...query, migration: 'REVIEW_REQUIRED', page: 1 })} />
      <Summary icon={ClipboardCheck} label="Setup incomplete" value={workspace.summary.setupIncomplete} tone={workspace.summary.setupIncomplete ? 'red' : ''} onClick={() => setQuery({ ...query, readiness: 'incomplete', page: 1 })} />
    </div>

    <CreateStore create={create} setCreate={setCreate} plans={plans} industries={industries} busy={busy.create} onCreate={createStore} />

    <div className="admin-card p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(230px,1fr)_repeat(5,minmax(120px,auto))]">
        <label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input aria-label="Search stores" value={query.q} onChange={(event) => setQuery({ ...query, q: event.target.value, page: 1 })} className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm" placeholder="Search store, owner, phone, domain or slug" /></label>
        <FilterSelect label="Licence" value={query.license} onChange={(license) => setQuery({ ...query, license, page: 1 })}>{['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'].map((value) => <option key={value}>{value}</option>)}</FilterSelect>
        <FilterSelect label="Plan" value={query.plan} onChange={(plan) => setQuery({ ...query, plan, page: 1 })}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</FilterSelect>
        <FilterSelect label="Industry" value={query.industry} onChange={(industry) => setQuery({ ...query, industry, page: 1 })}>{industries.map((item) => <option key={item.industry} value={item.industry}>{item.name}</option>)}</FilterSelect>
        <FilterSelect label="Attention" value={query.readiness || query.migration} onChange={(value) => setQuery({ ...query, readiness: value === 'incomplete' ? value : '', migration: value === 'REVIEW_REQUIRED' ? value : '', page: 1 })}><option value="incomplete">Setup incomplete</option><option value="REVIEW_REQUIRED">Migration review</option></FilterSelect>
        <FilterSelect label="Sort" value={query.sort} onChange={(sort) => setQuery({ ...query, sort: sort || 'newest', page: 1 })}><option value="newest">Newest</option><option value="updated">Recently updated</option><option value="expiry">Expiry nearest</option><option value="usage">Highest usage</option><option value="name">Store name</option><option value="readiness">Readiness</option></FilterSelect>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><FilterChip active={query.storeStatus === 'SUSPENDED'} onClick={() => setQuery({ ...query, storeStatus: query.storeStatus ? '' : 'SUSPENDED', page: 1 })}>Paused stores</FilterChip><FilterChip active={query.archive === 'only'} onClick={() => setQuery({ ...query, archive: query.archive ? '' : 'only', page: 1 })}>Archived</FilterChip></div>{JSON.stringify(query) !== JSON.stringify(EMPTY_QUERY) && <button type="button" className="text-xs font-black text-[#8f2748]" onClick={() => setQuery(EMPTY_QUERY)}>Clear filters</button>}</div>
    </div>

    {workspace.stores.length ? <>
      <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm md:block"><table className="w-full text-left text-sm"><thead className="bg-[#fffaf7] text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-4">Store</th><th>Access</th><th>Usage</th><th>Readiness</th><th>Catalogue</th><th className="pr-4 text-right">Action</th></tr></thead><tbody>{workspace.stores.map((store) => <StoreRow key={store.id} store={store} busy={busy[`open-${store.id}`]} onOpen={() => openStore(store)} />)}</tbody></table></div>
      <div className="grid gap-3 md:hidden">{workspace.stores.map((store) => <StoreCard key={store.id} store={store} onOpen={() => openStore(store)} />)}</div>
      <Pagination value={workspace.pagination} onChange={(page) => setQuery({ ...query, page })} />
    </> : <PageState empty emptyTitle="No stores match these filters" emptyNote="Clear the filters or create a new isolated seller store." />}

    {selected && <StoreDrawer store={operations?.store} operations={operations} edit={edit} setEdit={setEdit} tab={tab} setTab={setTab} plans={plans} pricing={workspace.pricing} industries={industries} allFeatures={allFeatures} migrationProducts={migrationProducts} busy={busy} onClose={closeStore} onSaveProfile={saveProfile} onSaveSubscription={saveSubscription} onGrant={askGrant} onLifecycle={(action, title, message) => setPrompt({ kind: 'lifecycle', action, title, message, reason: '' })} onExport={() => setPrompt({ kind: 'export', title: 'Export this client’s business data?', message: 'A portable NDJSON file will include this store’s catalogue, orders, customer records, settings and operations without platform credentials.', reason: '' })} onAddMember={addMember} onUpdateMember={updateMember} onTransferOwner={() => setPrompt({ kind: 'owner', title: 'Transfer store ownership?', message: 'The current owner becomes a manager. The new owner must already be an active team member.', phone: '', reason: '' })} onPreviewIndustry={previewIndustry} onLoadMigrationProducts={loadMigrationProducts} onSaveMigrationReview={saveMigrationReview} onComplete={() => setPrompt({ kind: 'complete', title: 'Complete industry migration?', message: 'The server will recalculate every active product before completing.', reason: '' })} onRollback={() => setPrompt({ kind: 'rollback', title: 'Restore previous industry?', message: 'The previous catalogue definition will be restored and generated starter categories will be archived.', reason: '' })} />}
    {industryPreview && <IndustryPreview value={industryPreview} onChange={setIndustryPreview} busy={busy[`convert-${selected}`]} onClose={() => setIndustryPreview(null)} onExport={() => exportPreviewProducts(selected, industryPreview, notify)} onApply={() => convertIndustry(industryPreview)} />}
    {prompt && <ActionPrompt value={prompt} onChange={setPrompt} busy={Object.values(busy).some(Boolean)} onClose={() => setPrompt(null)} onConfirm={() => {
      if (prompt.kind === 'discard') return forceClose();
      if (prompt.kind === 'grant') return grant(prompt);
      if (prompt.kind === 'lifecycle') return lifecycle(prompt);
      if (prompt.kind === 'owner') return transferOwner(prompt);
      if (prompt.kind === 'complete') return completeMigration(prompt);
      if (prompt.kind === 'rollback') return rollbackMigration(prompt);
      if (prompt.kind === 'export') return exportStoreData(prompt);
      return null;
    }} />}
  </section>;
}

function CreateStore({ create, setCreate, plans, industries, busy, onCreate }) {
  const expiryRequired = create.licenseStatus === 'ACTIVE';
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return <details className="admin-card overflow-hidden">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
      <span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3e4e8] text-[#751d39]"><Plus size={19} /></span><span><strong className="block">Create an isolated seller store</strong><span className="text-xs text-slate-500">Owner, membership and starter catalogue are created together.</span></span></span><Settings2 size={18} />
    </summary>
    <div className="grid gap-4 border-t p-5 sm:grid-cols-2 xl:grid-cols-4">
      <Field label="Store name"><input value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} placeholder="Client business name" /></Field>
      <Field label="Preferred URL slug"><input value={create.slug} onChange={(e) => setCreate({ ...create, slug: e.target.value })} placeholder="Generated if blank" /></Field>
      <Field label="Owner name"><input value={create.ownerName} onChange={(e) => setCreate({ ...create, ownerName: e.target.value })} placeholder="Required for a new number" /></Field>
      <Field label="Owner mobile"><input inputMode="numeric" value={create.ownerPhone} onChange={(e) => setCreate({ ...create, ownerPhone: e.target.value })} placeholder="Leave blank to own it" /></Field>
      <Field label="Business type"><select value={create.industry} onChange={(e) => setCreate({ ...create, industry: e.target.value })}>{industries.map((item) => <option key={item.industry} value={item.industry}>{item.name}</option>)}</select></Field>
      <Field label="Plan"><select value={create.plan} onChange={(e) => setCreate({ ...create, plan: e.target.value })}>{plans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      <Field label="Initial access"><select value={create.licenseStatus} onChange={(e) => setCreate({ ...create, licenseStatus: e.target.value, licenseEndsAt: e.target.value === 'TRIAL' ? '' : create.licenseEndsAt })}><option>TRIAL</option><option>ACTIVE</option><option>SUSPENDED</option><option>EXPIRED</option></select></Field>
      <Field label={expiryRequired ? 'Access ends (required)' : 'Access ends'}><input type="date" min={tomorrow} value={create.licenseEndsAt} onChange={(e) => setCreate({ ...create, licenseEndsAt: e.target.value })} /></Field>
      {expiryRequired && !create.licenseEndsAt && <p className="text-xs font-bold text-amber-700 sm:col-span-2 xl:col-span-4">Active access needs a future expiry. Use a grant after creation for monthly, yearly or lifetime access.</p>}
      <div className="sm:col-span-2 xl:col-span-4"><button type="button" disabled={busy || create.name.trim().length < 2 || (expiryRequired && !create.licenseEndsAt)} onClick={onCreate} className="admin-btn"><Plus size={16} />{busy ? 'Creating...' : 'Create and assign store'}</button></div>
    </div>
  </details>;
}

function StoreDrawer(props) {
  const { store, operations, edit, setEdit, tab, setTab, plans, pricing, industries, allFeatures, migrationProducts, busy, onClose, onSaveProfile, onSaveSubscription, onGrant, onLifecycle, onExport, onAddMember, onUpdateMember, onTransferOwner, onPreviewIndustry, onLoadMigrationProducts, onSaveMigrationReview, onComplete, onRollback } = props;
  const dialogRef = useRef(null); useDialogFocusTrap(dialogRef, onClose, Object.values(busy).some(Boolean), Boolean(store && edit && operations));
  if (!store || !edit || !operations) return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/35"><div role="status" className="rounded-2xl bg-white p-6 shadow-xl">Loading store details...</div></div>;
  return <div className="fixed inset-0 z-[80] bg-black/35" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside ref={dialogRef} data-portfolio-dialog role="dialog" aria-modal="true" aria-label={`Manage ${store.name}`} className="absolute inset-y-0 right-0 flex w-full max-w-5xl flex-col bg-[#fffdfb] shadow-2xl"><header className="border-b bg-white px-4 py-4 sm:px-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#9a5269]">{store.industry} · /{store.slug}</p><h2 className="mt-1 truncate text-xl font-black sm:text-2xl">{store.name}</h2><p className="mt-1 text-xs text-slate-500">Revision {store.revision} · Updated {formatDate(store.updatedAt)}</p></div><button type="button" aria-label="Close store details" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border"><X size={18} /></button></div><div className="mt-4 flex gap-1 overflow-x-auto">{TABS.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${tab === item ? 'bg-[#751d39] text-white' : 'text-slate-600 hover:bg-[#f8efeb]'}`}>{item}</button>)}</div></header><div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
    {tab === 'Overview' && <OverviewTab store={store} operations={operations} />}
    {tab === 'Subscription' && <SubscriptionTab store={store} edit={edit} setEdit={setEdit} plans={plans} pricing={pricing} busy={busy} onSave={onSaveSubscription} onGrant={onGrant} payments={operations.payments || []} />}
    {tab === 'Usage' && <UsageTab store={store} payments={operations.payments || []} />}
    {tab === 'Features & limits' && <FeaturesTab edit={edit} setEdit={setEdit} plans={plans} allFeatures={allFeatures} onSave={onSaveSubscription} busy={busy[`subscription-${store.id}`]} />}
    {tab === 'Team' && <TeamTab store={store} members={operations.members || []} roles={operations.roles || []} busy={busy} onAdd={onAddMember} onUpdate={onUpdateMember} onTransfer={onTransferOwner} />}
    {tab === 'Storefront' && <StorefrontTab store={store} edit={edit} setEdit={setEdit} busy={busy} onSave={onSaveProfile} onLifecycle={onLifecycle} onExport={onExport} />}
    {tab === 'Industry' && <IndustryTab store={store} edit={edit} setEdit={setEdit} industries={industries} members={operations.members || []} products={migrationProducts} busy={busy} onPreview={onPreviewIndustry} onLoadProducts={onLoadMigrationProducts} onSaveReview={onSaveMigrationReview} onComplete={onComplete} onRollback={onRollback} />}
    {tab === 'Activity' && <ActivityTab rows={operations.activity || []} />}
    {tab === 'Client app' && <ClientAppTab store={store} />}
  </div></aside></div>;
}

function OverviewTab({ store, operations }) {
  const limits = store.platform.limits || {};
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Storefront" value={store.status} /><Metric label="Licence" value={store.platform.status} /><Metric label="Industry" value={store.industry} /><Metric label="Readiness" value={`${store.readiness.percent}%`} /></div>
    <Panel title="Action centre" note="Operational issues that need attention before this store can run smoothly."><div className="grid gap-3 sm:grid-cols-2">{!store.readiness.ready && <Notice icon={AlertTriangle} title="Setup is incomplete">{Object.entries(store.readiness.steps).filter(([, done]) => !done).map(([key]) => humanize(key)).join(', ')} still need attention.</Notice>}{['REVIEW_REQUIRED', 'FAILED'].includes(store.migration?.status) && <Notice icon={PackageSearch} title="Catalogue migration needs review">{store.migration.affectedProducts ?? store.migration.totalProducts ?? 0} products are in the review queue.</Notice>}{store.owner?.isBlocked && <Notice icon={AlertTriangle} title="Owner account is blocked">Unblock or transfer ownership before the client signs in.</Notice>}{store.readiness.ready && !['REVIEW_REQUIRED', 'FAILED'].includes(store.migration?.status) && !store.owner?.isBlocked && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="mb-2" size={20} /><strong>Store operations look healthy.</strong></div>}</div></Panel>
    <Panel title="Usage this month" note="Projections use this month’s current order and catalogue growth pace."><div className="grid gap-4 sm:grid-cols-3"><div><Usage label="Active products" value={store.usage.products} limit={limits.products} /><p className="mt-2 text-[10px] text-slate-500">{projectionLabel(store.usage.projectedProductLimitAt, 'No product-limit risk at the current pace')}</p></div><div><Usage label="Orders" value={store.usage.ordersPerMonth} limit={limits.ordersPerMonth} /><p className="mt-2 text-[10px] text-slate-500">{projectionLabel(store.usage.projectedOrderLimitAt, 'Expected to remain within this month’s limit')}</p></div><Metric label="Paid revenue" value={`₹${Number(store.usage.paidRevenueMonth || 0).toLocaleString('en-IN')}`} /></div></Panel>
    <Panel title="Connected records"><div className="grid grid-cols-3 gap-3"><Metric label="Draft products" value={operations.related.draftProducts} /><Metric label="Active bags" value={operations.related.activeCarts} /><Metric label="Open orders" value={operations.related.activeOrders} /></div></Panel>
  </div>;
}

function UsageTab({ store, payments }) {
  const limits = store.platform.limits || {};
  const latestPayment = payments[0] || store.platform.lastPayment;
  return <div className="space-y-5">
    <Panel title="Current plan consumption" note="Order usage resets each calendar month. Product usage reflects the active catalogue."><div className="grid gap-5 sm:grid-cols-2"><div><Usage label="Active products" value={store.usage.products} limit={limits.products} /><p className="mt-2 text-xs text-slate-500">{store.usage.productsAddedMonth} product(s) added this month · {projectionLabel(store.usage.projectedProductLimitAt, 'No product-limit risk at the current pace')}</p></div><div><Usage label="Orders this month" value={store.usage.ordersPerMonth} limit={limits.ordersPerMonth} /><p className="mt-2 text-xs text-slate-500">{projectionLabel(store.usage.projectedOrderLimitAt, 'Expected to remain within this month’s limit')}</p></div></div></Panel>
    <div className="grid gap-5 sm:grid-cols-2"><Panel title="Revenue this month"><Metric label="Paid order revenue" value={`₹${Number(store.usage.paidRevenueMonth || 0).toLocaleString('en-IN')}`} /></Panel><Panel title="Renewal context"><div className="grid grid-cols-2 gap-3"><Metric label="Access period" value={accessLabel(store)} /><Metric label="Next renewal / expiry" value={store.platform.endsAt ? formatDate(store.platform.endsAt) : 'Lifetime'} /><Metric label="Last payment" value={latestPayment?.paidAt || latestPayment?.createdAt ? formatDate(latestPayment.paidAt || latestPayment.createdAt) : 'No payment recorded'} /><Metric label="Plan" value={store.platform.name} /></div></Panel></div>
  </div>;
}

function SubscriptionTab({ store, edit, setEdit, plans, pricing, busy, onSave, onGrant, payments }) {
  const selectedPlan = plans.find((plan) => plan.id === edit.plan) || plans[0];
  return <div className="space-y-5">
    <Panel title="Access & renewal" note="Manual changes require an owner-only reason and use the current store revision."><div className="grid gap-4 sm:grid-cols-2"><Field label="Plan"><select value={edit.plan} onChange={(e) => setEdit({ ...edit, plan: e.target.value })}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></Field><Field label="Status"><select value={edit.licenseStatus} onChange={(e) => setEdit({ ...edit, licenseStatus: e.target.value })}>{['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Billing cycle"><select value={edit.billingCycle} onChange={(e) => setEdit({ ...edit, billingCycle: e.target.value })}>{['TRIAL', 'MONTHLY', 'YEARLY', 'LIFETIME', 'MANUAL'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Access ends"><input type="date" disabled={edit.billingCycle === 'LIFETIME'} value={edit.licenseEndsAt} onChange={(e) => setEdit({ ...edit, licenseEndsAt: e.target.value })} /></Field><Field label="Renewal / suspension message"><input maxLength={300} value={edit.renewalMessage} onChange={(e) => setEdit({ ...edit, renewalMessage: e.target.value })} /></Field><Field label="Reason for manual change"><input maxLength={500} value={edit.subscriptionReason} onChange={(e) => setEdit({ ...edit, subscriptionReason: e.target.value })} placeholder="Required when saving" /></Field></div><div className="mt-4 flex flex-wrap justify-end"><button type="button" disabled={busy[`subscription-${store.id}`] || edit.subscriptionReason.trim().length < 3} onClick={onSave} className="admin-btn"><Save size={16} /> Save subscription</button></div></Panel>
    <Panel title={`${selectedPlan?.name || 'Selected'} price reference`} note={`Current checkout prices from Master Configuration. ${pricing?.taxMode === 'EXCLUSIVE' ? `${pricing.gstPercent}% GST is included below.` : pricing ? `Includes ${pricing.gstPercent}% GST.` : ''} Manual access grants do not record a payment.`}><div className="grid gap-3 sm:grid-cols-3">{[['Monthly', 'monthly'], ['Yearly', 'yearly'], ['One-time', 'lifetime']].map(([label, cycle]) => <div key={cycle} className="rounded-xl border bg-white p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><strong className="mt-1 block text-lg">₹{subscriptionQuote(selectedPlan?.prices?.[cycle], pricing).toLocaleString('en-IN')}</strong><p className="text-[10px] text-slate-500">{cycle === 'lifetime' ? 'Lifetime access' : cycle === 'yearly' ? 'Per year' : 'Per month'}</p></div>)}</div></Panel>
    <Panel title="Grant access now" note="These shortcuts send only the selected plan, period and reason. Unsaved limits or industry changes are never included."><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{['TRIAL', 'MONTHLY', 'YEARLY', 'LIFETIME'].map((value) => <button key={value} type="button" onClick={() => onGrant(value)} className="h-11 rounded-xl border bg-white text-xs font-black text-[#751d39]">{grantIcon(value)} {grantLabel(value)}</button>)}</div></Panel>
    <Panel title="Payment ledger" note={`${payments.length} recent payment record(s).`}><PaymentTable rows={payments} /></Panel>
  </div>;
}

function FeaturesTab({ edit, setEdit, plans, allFeatures, onSave, busy }) { const base = plans.find((item) => item.id === edit.plan)?.features || []; const enabled = (feature) => !edit.disabledFeatures.includes(feature) && (base.includes(feature) || edit.featureOverrides.includes(feature)); const setFeature = (feature, checked) => setEdit((current) => ({ ...current, featureOverrides: checked && !base.includes(feature) ? [...new Set([...current.featureOverrides, feature])] : current.featureOverrides.filter((item) => item !== feature), disabledFeatures: checked ? current.disabledFeatures.filter((item) => item !== feature) : [...new Set([...current.disabledFeatures, feature])] })); return <div className="space-y-5"><Panel title="Usage limits" note="Leave an override empty to use the selected plan default."><div className="grid gap-4 sm:grid-cols-2"><Limit label="Active products" value={edit.limitOverrides.products} placeholder={planLimit(plans, edit.plan, 'products')} onChange={(value) => setEdit({ ...edit, limitOverrides: { ...edit.limitOverrides, products: value } })} /><Limit label="Orders per month" value={edit.limitOverrides.ordersPerMonth} placeholder={planLimit(plans, edit.plan, 'ordersPerMonth')} onChange={(value) => setEdit({ ...edit, limitOverrides: { ...edit.limitOverrides, ordersPerMonth: value } })} /></div></Panel><Panel title="Feature access" note="Plan defaults can be disabled or individual add-ons can be enabled for this store."><div className="grid gap-2 sm:grid-cols-2">{allFeatures.map((feature) => <label key={feature} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm"><span><strong className="block">{humanize(feature)}</strong><span className="text-[10px] text-slate-500">{base.includes(feature) ? 'Included in plan' : 'Individual add-on'}</span></span><input type="checkbox" checked={enabled(feature)} onChange={(e) => setFeature(feature, e.target.checked)} /></label>)}</div></Panel><Panel title="Save access controls"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><Field label="Reason"><input value={edit.subscriptionReason} onChange={(e) => setEdit({ ...edit, subscriptionReason: e.target.value })} placeholder="Required for audit history" /></Field><button type="button" className="admin-btn" disabled={busy || edit.subscriptionReason.trim().length < 3} onClick={onSave}><Save size={16} /> Save features & limits</button></div></Panel></div>; }

function TeamTab({ store, members, roles, busy, onAdd, onUpdate, onTransfer }) {
  const emptyMember = { name: '', phone: '', role: roles[0] || 'MANAGER', status: 'ACTIVE', reason: '' };
  const [member, setMember] = useState(emptyMember);
  return <div className="space-y-5">
    <Panel title="Owner"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{store.owner?.name || 'No owner assigned'}</strong><p className="text-xs text-slate-500">{store.owner?.phone || 'No phone'}{store.owner?.isBlocked ? ' · Blocked' : ''}</p></div><button type="button" className="admin-btn-ghost" onClick={onTransfer}><RotateCcw size={15} /> Transfer ownership</button></div></Panel>
    <Panel title="Team members" note="Roles are enforced by store-scoped backend permissions."><div className="space-y-2">{members.map((item) => <MemberRow key={item.id} member={item} roles={roles} busy={busy[`member-${item.id}`]} onUpdate={(values) => onUpdate(item, values)} />)}{!members.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No team members have been assigned.</p>}</div></Panel>
    <Panel title="Add team access"><div className="grid gap-3 sm:grid-cols-2">
      <Field label="Name"><input value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} /></Field>
      <Field label="Mobile"><input inputMode="numeric" value={member.phone} onChange={(e) => setMember({ ...member, phone: e.target.value })} /></Field>
      <Field label="Role"><select value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></Field>
      <Field label="Access"><select value={member.status} onChange={(e) => setMember({ ...member, status: e.target.value })}><option>ACTIVE</option><option>INVITED</option></select></Field>
      <Field label="Reason"><input maxLength={500} value={member.reason} onChange={(e) => setMember({ ...member, reason: e.target.value })} placeholder="Why access is being added" /></Field>
      <div className="self-end"><button type="button" className="admin-btn h-11" disabled={busy[`member-${store.id}`] || member.phone.replace(/\D/g, '').length < 10 || member.name.trim().length < 2 || member.reason.trim().length < 3} onClick={async () => { const result = await onAdd(member); if (result) setMember(emptyMember); }}><UserPlus size={16} /> Add member</button></div>
    </div></Panel>
  </div>;
}
function MemberRow({ member, roles, busy, onUpdate }) {
  const [role, setRole] = useState(member.role);
  const [reason, setReason] = useState('');
  if (member.role === 'OWNER') return <div className="flex items-center justify-between rounded-xl border bg-[#fffaf7] p-3"><div><strong className="text-sm">{member.user?.name || 'Owner'}</strong><p className="text-xs text-slate-500">{member.user?.phone} · OWNER</p></div><Status value={member.status} /></div>;
  const submit = async (values) => { const result = await onUpdate({ ...values, reason }); if (result) setReason(''); };
  return <div className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_180px_1fr_auto]">
    <div><strong className="text-sm">{member.user?.name || 'Team member'}</strong><p className="text-xs text-slate-500">{member.user?.phone} · {member.status}{member.user?.isBlocked ? ' · Blocked' : ''}</p></div>
    <select aria-label={`Role for ${member.user?.name}`} value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-xl border bg-white px-3 text-xs font-bold">{roles.map((item) => <option key={item}>{item}</option>)}</select>
    <input aria-label={`Reason for ${member.user?.name}`} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 rounded-xl border px-3 text-xs" placeholder="Reason for access change" />
    <div className="flex gap-2"><button type="button" disabled={busy || role === member.role || reason.trim().length < 3} className="rounded-xl border px-3 text-xs font-black" onClick={() => submit({ role })}>Save</button>{member.status === 'REVOKED' ? <button type="button" disabled={busy || reason.trim().length < 3} className="rounded-xl border px-3 text-xs font-black text-emerald-700" onClick={() => submit({ status: 'ACTIVE' })}>Activate</button> : <button type="button" disabled={busy || reason.trim().length < 3} className="rounded-xl border px-3 text-xs font-black text-red-700" onClick={() => submit({ status: 'REVOKED' })}>Revoke</button>}</div>
  </div>;
}

function StorefrontTab({ store, edit, setEdit, busy, onSave, onLifecycle, onExport }) {
  return <div className="space-y-5">
    <Panel title="Store identity"><div className="grid gap-4 sm:grid-cols-2">
      <Field label="Store name"><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
      <Field label="Legal name"><input value={edit.legalName} onChange={(e) => setEdit({ ...edit, legalName: e.target.value })} /></Field>
      <Field label="URL slug"><input value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></Field>
      <Field label="Custom domain"><input value={edit.customDomain} onChange={(e) => setEdit({ ...edit, customDomain: e.target.value })} placeholder="shop.example.com" /></Field>
      <Field label="Logo URL"><input value={edit.logo} onChange={(e) => setEdit({ ...edit, logo: e.target.value })} /></Field>
      <Field label="Support email"><input type="email" value={edit.supportEmail} onChange={(e) => setEdit({ ...edit, supportEmail: e.target.value })} /></Field>
      <Field label="Support mobile"><input value={edit.supportPhone} onChange={(e) => setEdit({ ...edit, supportPhone: e.target.value })} /></Field>
      <Field label="WhatsApp"><input value={edit.whatsappNumber} onChange={(e) => setEdit({ ...edit, whatsappNumber: e.target.value })} /></Field>
    </div></Panel>
    <Panel title="Commerce readiness"><div className="grid gap-3 sm:grid-cols-2"><Toggle label="Payments configured" checked={edit.paymentReady} onChange={(value) => setEdit({ ...edit, paymentReady: value })} /><Toggle label="Shipping configured" checked={edit.shippingReady} onChange={(value) => setEdit({ ...edit, shippingReady: value })} /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><AddressFields label="Pickup address" value={edit.pickupAddress} onChange={(value) => setEdit({ ...edit, pickupAddress: value })} /><AddressFields label="Return address" value={edit.returnAddress} onChange={(value) => setEdit({ ...edit, returnAddress: value })} /></div></Panel>
    <div className="flex flex-wrap justify-end"><button type="button" disabled={busy[`profile-${store.id}`]} onClick={onSave} className="admin-btn"><Save size={16} /> Save storefront</button></div>
    <Panel title="Store lifecycle" note="Storefront status and checkout control are separate from subscription access. Every restrictive action records its reason.">
      <div className="mb-4 grid grid-cols-2 gap-3"><Metric label="Storefront" value={store.archivedAt ? 'ARCHIVED' : store.status} /><Metric label="Checkout" value={store.checkoutEnabled ? 'ENABLED' : 'DISABLED'} /></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="admin-btn-ghost" onClick={() => copyStorefront(store)}><Copy size={15} /> Copy URL</button>
        <a className="admin-btn-ghost" href={store.isDefault ? '/' : `/store/${store.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open storefront</a>
        <button type="button" className="admin-btn-ghost" onClick={() => openSellerWorkspace(store.id)}><ExternalLink size={15} /> Open seller workspace</button>
        <button type="button" className="admin-btn-ghost" onClick={onExport}><Download size={15} /> Export client data</button>
        {store.checkoutEnabled ? <button type="button" className="admin-btn-ghost text-amber-800" onClick={() => onLifecycle('DISABLE_CHECKOUT', 'Disable checkout?', 'Customers can browse the storefront, but no new order can be placed until checkout is enabled.')}><PauseCircle size={15} /> Disable checkout</button> : <button type="button" className="admin-btn-ghost text-emerald-700" onClick={() => onLifecycle('ENABLE_CHECKOUT', 'Enable checkout?', 'Customers will be allowed to place orders if the subscription and storefront are active.')}><CheckCircle2 size={15} /> Enable checkout</button>}
        {store.status === 'SUSPENDED' ? <button type="button" className="admin-btn-ghost text-emerald-700" onClick={() => onLifecycle('RESUME', 'Resume this storefront?', 'The storefront will return to its previous published or onboarding state.')}><RotateCcw size={15} /> Resume</button> : <button type="button" disabled={store.isDefault} className="admin-btn-ghost text-amber-800" onClick={() => onLifecycle('PAUSE', 'Pause this storefront?', 'Customers will no longer be able to place new orders until it is resumed.')}><PauseCircle size={15} /> Pause</button>}
        {store.archivedAt ? <button type="button" className="admin-btn-ghost" onClick={() => onLifecycle('RESTORE', 'Restore archived store?', 'The store will return to onboarding and remain unpublished.')}><RotateCcw size={15} /> Restore</button> : <button type="button" disabled={store.isDefault} className="admin-btn-ghost text-red-700" onClick={() => onLifecycle('ARCHIVE', 'Archive this store?', 'Checkout will be disabled. Existing products, customers and orders remain stored.')}><Archive size={15} /> Archive</button>}
      </div>
    </Panel>
  </div>;
}

function IndustryTab({ store, edit, setEdit, industries, members, products, busy, onPreview, onLoadProducts, onSaveReview, onComplete, onRollback }) { const migration = store.migration || {}; const [reviewer, setReviewer] = useState(migration.reviewAssignedTo || ''); const [note, setNote] = useState(migration.reviewNote || ''); return <div className="space-y-5"><Panel title="Industry blueprint" note="Changing the industry updates catalogue definitions without deleting products or orders."><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Field label="Business type"><select value={edit.industry} onChange={(e) => setEdit({ ...edit, industry: e.target.value })}>{industries.map((item) => <option key={item.industry} value={item.industry}>{item.name}</option>)}</select></Field></div><button type="button" disabled={edit.industry === store.industry || busy[`industry-${store.id}`]} className="admin-btn h-11" onClick={onPreview}><PackageSearch size={16} /> Review impact</button></div></Panel><Panel title="Migration workspace" note={`Current status: ${humanize(migration.status || 'READY')}`}><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Products" value={migration.totalProducts || 0} /><Metric label="Affected" value={migration.affectedProducts || 0} /><Metric label="Missing fields" value={migration.missingRequired || 0} /><Metric label="Variant issues" value={migration.incompatibleVariants || 0} /></div>{['REVIEW_REQUIRED', 'FAILED'].includes(migration.status) && <><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Assign reviewer"><select value={reviewer} onChange={(e) => setReviewer(e.target.value)}><option value="">Unassigned</option>{members.filter((item) => item.status === 'ACTIVE').map((item) => <option key={item.id} value={item.user?.id}>{item.user?.name} · {humanize(item.role)}</option>)}</select></Field><Field label="Review note"><input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} /></Field></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="admin-btn-ghost" disabled={busy[`migration-review-${store.id}`]} onClick={() => onSaveReview(reviewer, note)}><Save size={15} /> Save review</button><button type="button" className="admin-btn-ghost" onClick={onLoadProducts}><PackageSearch size={15} /> Recalculate queue</button><a href={`/admin/products?storeId=${encodeURIComponent(store.id)}`} className="admin-btn-ghost">Open this store catalogue</a><button type="button" className="admin-btn" onClick={onComplete}><Check size={15} /> Validate & complete</button></div></>}{migration.canRollback && migration.status !== 'ROLLED_BACK' && <button type="button" className="mt-4 text-xs font-black text-red-700 underline" onClick={onRollback}>Restore previous industry configuration</button>}</Panel>{products && <Panel title={`Affected products (${products.total})`}><button type="button" className="admin-btn-ghost mb-3" onClick={() => downloadAffected(products.items, `${store.slug}-migration-products.csv`)}><Download size={15} /> Download CSV</button><AffectedProducts items={products.items} /></Panel>}</div>; }

function ActivityTab({ rows }) { return <Panel title="Owner activity" note="Sensitive store, access and catalogue changes are recorded here."><div className="space-y-2">{rows.length ? rows.map((item) => <div key={item.id} className="flex gap-3 rounded-xl border bg-white p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f5e9ec] text-[#751d39]"><Activity size={16} /></span><div><strong className="block text-sm">{humanize(item.action)}</strong><p className="text-xs text-slate-500">{item.actor} · {formatDate(item.createdAt)}</p>{item.summary && <p className="mt-1 text-xs text-slate-600">{item.summary}</p>}</div></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No owner activity has been recorded yet.</p>}</div></Panel>; }
function ClientAppTab({ store }) { return <div className="space-y-5"><Panel title="Client deployment" note="Generated client applications, runtime licences, versions, keys and deployments remain isolated in Client Control."><div className="grid gap-3 sm:grid-cols-3"><Metric label="Suggested project slug" value={store.slug} /><Metric label="Business type" value={humanize(store.industry)} /><Metric label="Store plan" value={store.platform.name} /></div><div className="mt-4 flex flex-wrap gap-2"><a href="/master/clients" className="admin-btn"><ExternalLink size={15} /> Open Client Control</a><p className="self-center text-xs text-slate-500">Link or search the generated installation there; control-plane code is never copied into its ZIP.</p></div></Panel></div>; }

function IndustryPreview({ value, onChange, busy, onClose, onExport, onApply }) { const impact = value.impact || {}; const dialogRef = useRef(null); useDialogFocusTrap(dialogRef, onClose, busy, true); return <div className="fixed inset-0 z-[100] flex items-end bg-black/55 sm:items-center sm:justify-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section ref={dialogRef} data-portfolio-dialog role="dialog" aria-modal="true" aria-labelledby="industry-review-title" className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:max-w-4xl sm:rounded-[28px]"><header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white p-5 sm:p-6"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a5269]">Signed catalogue review · revision {value.revision}</p><h2 id="industry-review-title" className="mt-1 text-xl font-black">{value.from.name} → {value.to.name}</h2><p className="mt-1 text-xs text-slate-500">This review expires after 15 minutes and becomes invalid if the store changes.</p></div><button type="button" aria-label="Close industry review" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border"><X size={18} /></button></header><div className="space-y-5 p-5 sm:p-6"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="All products" value={impact.totalProducts || 0} /><Metric label="Affected" value={impact.affectedProducts || 0} /><Metric label="Missing" value={impact.missingRequired || 0} /><Metric label="Invalid values" value={impact.invalidValues || 0} /><Metric label="Variant issues" value={impact.incompatibleVariants || 0} /><Metric label="Drafts" value={impact.draftProducts || 0} /><Metric label="Active bags" value={impact.activeCarts || 0} /><Metric label="Open orders" value={impact.activeOrders || 0} /></div>{impact.activeCarts || impact.activeOrders ? <Notice icon={AlertTriangle} title="Schedule a careful conversion">Active carts or orders exist. Their stored order data remains unchanged, but catalogue review should be completed before new sales continue.</Notice> : null}<div className="grid gap-4 sm:grid-cols-2"><Impact title="Adds" items={[...(impact.addedCategories || []).map((item) => `${item} category`), ...(impact.addedAttributes || [])]} tone="green" /><Impact title="Becomes inactive" items={impact.inactiveAttributes || []} tone="amber" /></div><AffectedProducts items={impact.examples || []} /><Field label="Conversion note"><textarea autoFocus value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })} className="min-h-24 w-full rounded-xl border p-3 text-sm font-normal" maxLength={500} placeholder="Reason and reviewer context (required)" /></Field></div><footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-white p-4 sm:px-6"><button type="button" className="admin-btn-ghost" onClick={onExport}><Download size={15} /> Export affected</button><button type="button" className="admin-btn-ghost" onClick={onClose}>Keep current industry</button><button type="button" disabled={busy || value.note.trim().length < 3} className="admin-btn" onClick={onApply}>{busy ? 'Applying...' : 'Apply reviewed change'}</button></footer></section></div>; }
function AffectedProducts({ items = [] }) { if (!items.length) return <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">No active product requires manual review.</p>; return <div className="max-h-72 space-y-2 overflow-y-auto">{items.map((item) => <div key={item.id} className="rounded-xl border p-3"><strong className="text-sm">{item.name}</strong><p className="text-xs text-slate-500">{item.sku || 'No SKU'}</p><div className="mt-2 flex flex-wrap gap-1">{(item.reasons || []).map((entry) => <span key={`${item.id}-${entry.code}`} className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-800">{humanize(entry.code)}{entry.fields?.length ? `: ${entry.fields.slice(0, 3).join(', ')}` : ''}</span>)}</div></div>)}</div>; }

function ActionPrompt({ value, onChange, busy, onClose, onConfirm }) { const dialogRef = useRef(null); useDialogFocusTrap(dialogRef, onClose, busy, true); const requiresReason = value.kind !== 'discard'; const ready = !requiresReason || value.reason?.trim().length >= 3; return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/45 p-4"><section ref={dialogRef} data-portfolio-dialog role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-black">{value.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{value.message}</p>{value.kind === 'owner' && <Field label="New owner mobile"><input autoFocus inputMode="numeric" value={value.phone || ''} onChange={(e) => onChange({ ...value, phone: e.target.value })} /></Field>}{requiresReason && <div className="mt-4"><Field label="Reason"><textarea autoFocus={value.kind !== 'owner'} value={value.reason || ''} onChange={(e) => onChange({ ...value, reason: e.target.value })} className="min-h-24 w-full rounded-xl border p-3 text-sm font-normal" maxLength={500} /></Field></div>}<div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} className="admin-btn-ghost" onClick={onClose}>Cancel</button><button type="button" disabled={busy || !ready || (value.kind === 'owner' && String(value.phone || '').replace(/\D/g, '').length < 10)} className="admin-btn" onClick={onConfirm}>{busy ? 'Working...' : value.kind === 'discard' ? 'Discard' : 'Confirm'}</button></div></section></div>; }

function StoreRow({ store, busy, onOpen }) { return <tr className="border-t hover:bg-[#fffdfb]"><td className="p-4"><strong>{store.name}</strong><p className="mt-1 text-xs text-slate-500">/{store.slug} · {store.owner?.name || 'No owner'}</p></td><td><Status value={store.platform.status} /><p className="mt-1 text-xs text-slate-500">{store.platform.name} · {accessLabel(store)}</p></td><td><p className="text-xs font-bold">{store.usage.products}/{store.platform.limits.products} products</p><p className="mt-1 text-xs text-slate-500">{store.usage.ordersPerMonth}/{store.platform.limits.ordersPerMonth} orders</p></td><td><strong className={store.readiness.ready ? 'text-emerald-700' : 'text-amber-700'}>{store.readiness.percent}%</strong><p className="mt-1 text-xs text-slate-500">{store.paymentReady ? 'Payments' : 'Payments pending'} · {store.shippingReady ? 'Shipping' : 'Shipping pending'}</p></td><td><Status value={store.migration?.status || 'READY'} /><p className="mt-1 text-xs text-slate-500">{humanize(store.industry)}</p></td><td className="pr-4 text-right"><button type="button" disabled={busy} onClick={onOpen} className="rounded-xl border px-3 py-2 text-xs font-black text-[#751d39]">{busy ? 'Opening...' : 'Manage'}</button></td></tr>; }
function StoreCard({ store, onOpen }) { return <article className="admin-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-wider text-[#9a5269]">{humanize(store.industry)} · {store.status}</p><h2 className="mt-1 truncate font-black">{store.name}</h2><p className="truncate text-xs text-slate-500">{store.owner?.name || 'No owner'} · {store.platform.name}</p></div><Status value={store.platform.status} /></div><div className="mt-4 grid grid-cols-3 gap-2"><Metric label="Ready" value={`${store.readiness.percent}%`} /><Metric label="Products" value={`${store.usage.products}/${store.platform.limits.products}`} /><Metric label="Orders" value={`${store.usage.ordersPerMonth}/${store.platform.limits.ordersPerMonth}`} /></div><button type="button" onClick={onOpen} className="admin-btn mt-4 w-full">Manage store</button></article>; }
function Summary({ icon: Icon, label, value, tone = '', onClick }) { const colors = tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-[#f6e9ed] text-[#7a1c39]'; const Tag = onClick ? 'button' : 'div'; return <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="admin-card flex min-w-0 items-center gap-3 p-4 text-left"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors}`}><Icon size={18} /></span><span className="min-w-0"><strong className="block truncate text-lg">{value}</strong><span className="block truncate text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</span></span></Tag>; }
function Panel({ title, note, children }) { return <section className="rounded-2xl border bg-white p-4 sm:p-5"><h3 className="font-black">{title}</h3>{note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}<div className="mt-4">{children}</div></section>; }
function Notice({ icon: Icon, title, children }) { return <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><Icon className="shrink-0" size={19} /><div><strong>{title}</strong><p className="mt-1 text-xs leading-5">{children}</p></div></div>; }
function Metric({ label, value }) { return <div className="min-w-0 rounded-xl bg-[#fbf7f4] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><strong className="mt-1 block truncate text-xs">{value ?? 'Not available'}</strong></div>; }
function Usage({ label, value = 0, limit = 0 }) { const percent = limit > 0 ? Math.min(100, Math.round((value / limit) * 100)) : 0; return <div className="rounded-xl border p-3"><div className="flex justify-between text-xs"><strong>{label}</strong><span>{value}/{limit}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full ${percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} /></div></div>; }
function Status({ value }) { const good = ['ACTIVE', 'TRIAL', 'READY', 'COMPLETED', 'PUBLISHED'].includes(value); const bad = ['EXPIRED', 'SUSPENDED', 'FAILED', 'ARCHIVED'].includes(value); return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ${good ? 'bg-emerald-100 text-emerald-800' : bad ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{humanize(value)}</span>; }
function Field({ label, children }) { return <label className="grid min-w-0 gap-2 text-xs font-black"><span>{label}</span><span className="[&>input]:h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:px-3 [&>input]:text-sm [&>input]:font-normal [&>select]:h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:bg-white [&>select]:px-3 [&>select]:text-sm [&>select]:font-normal">{children}</span></label>; }
function FilterSelect({ label, value, onChange, children }) { return <label className="relative"><Filter className="pointer-events-none absolute left-3 top-3 text-slate-400" size={15} /><select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border bg-white pl-9 pr-7 text-xs font-bold"><option value="">All {label.toLowerCase()}</option>{children}</select></label>; }
function FilterChip({ active, onClick, children }) { return <button type="button" onClick={onClick} className={`rounded-full border px-3 py-2 text-xs font-black ${active ? 'border-[#751d39] bg-[#751d39] text-white' : 'bg-white text-slate-600'}`}>{active && <Check size={12} className="mr-1 inline" />}{children}</button>; }
function Toggle({ label, checked, onChange }) { return <label className="flex items-center justify-between rounded-xl border p-3 text-sm font-bold">{label}<input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /></label>; }
function Limit({ label, value, placeholder, onChange }) { return <label className="grid gap-1.5 text-xs font-bold text-slate-700">{label}<input type="number" min="0" step="1" value={value} placeholder={`Plan default: ${Number(placeholder || 0).toLocaleString('en-IN')}`} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl border px-3 text-sm font-normal" /></label>; }
function AddressFields({ label, value, onChange }) { return <fieldset className="rounded-xl border p-3"><legend className="px-1 text-xs font-black">{label}</legend><div className="grid gap-2 sm:grid-cols-2"><input className="h-10 rounded-xl border px-3 text-sm" value={value.fullName || ''} onChange={(e) => onChange({ ...value, fullName: e.target.value })} placeholder="Contact name" /><input className="h-10 rounded-xl border px-3 text-sm" value={value.mobile || ''} onChange={(e) => onChange({ ...value, mobile: e.target.value })} placeholder="Mobile" /><input className="h-10 rounded-xl border px-3 text-sm" value={value.pincode || ''} onChange={(e) => onChange({ ...value, pincode: e.target.value })} placeholder="Pincode" /><input className="h-10 rounded-xl border px-3 text-sm" value={value.city || ''} onChange={(e) => onChange({ ...value, city: e.target.value })} placeholder="City" /><input className="h-10 rounded-xl border px-3 text-sm" value={value.state || ''} onChange={(e) => onChange({ ...value, state: e.target.value })} placeholder="State" /><input className="h-10 rounded-xl border px-3 text-sm" value={value.houseNo || ''} onChange={(e) => onChange({ ...value, houseNo: e.target.value })} placeholder="House / building" /><input className="h-10 rounded-xl border px-3 text-sm sm:col-span-2" value={value.area || ''} onChange={(e) => onChange({ ...value, area: e.target.value })} placeholder="Area / street" /></div></fieldset>; }
function Impact({ title, items = [], tone }) { const colors = tone === 'green' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'; return <section className={`rounded-2xl border p-4 ${colors}`}><h3 className="text-sm font-black">{title}</h3>{items.length ? <ul className="mt-3 space-y-1 text-xs">{items.slice(0, 20).map((item) => <li key={item}>• {String(item).replace(/-/g, ' ')}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">No changes in this section.</p>}</section>; }
function PaymentTable({ rows }) { if (!rows.length) return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No subscription payments recorded.</p>; return <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-[9px] uppercase text-slate-500"><tr><th className="pb-3">Date</th><th>Plan</th><th>Cycle</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="py-3">{formatDate(row.paidAt || row.createdAt)}</td><td>{row.plan}</td><td>{row.billingCycle}</td><td>₹{Number(row.amount || 0).toLocaleString('en-IN')}</td><td><Status value={row.status} /></td><td>{row.razorpayPaymentId || row.receipt}</td></tr>)}</tbody></table></div>; }
function Pagination({ value, onChange }) { return <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Page {value.page} of {value.pages} · {value.total} stores</p><div className="flex gap-2"><button type="button" aria-label="Previous page" disabled={value.page <= 1} onClick={() => onChange(value.page - 1)} className="grid h-10 w-10 place-items-center rounded-xl border bg-white disabled:opacity-40"><ChevronLeft size={17} /></button><button type="button" aria-label="Next page" disabled={value.page >= value.pages} onClick={() => onChange(value.page + 1)} className="grid h-10 w-10 place-items-center rounded-xl border bg-white disabled:opacity-40"><ChevronRight size={17} /></button></div></div>; }

function toEdit(store) { return { name: store.name || '', legalName: store.legalName || '', slug: store.slug || '', logo: store.logo || '', customDomain: store.customDomain || '', supportEmail: store.supportEmail || '', supportPhone: store.supportPhone || '', whatsappNumber: store.whatsappNumber || '', paymentReady: Boolean(store.paymentReady), shippingReady: Boolean(store.shippingReady), checkoutEnabled: store.checkoutEnabled !== false, pickupAddress: { ...(store.pickupAddress || {}) }, returnAddress: { ...(store.returnAddress || {}) }, industry: store.industry, plan: store.platform.id, licenseStatus: store.platform.status, billingCycle: store.platform.billingCycle, licenseEndsAt: dateValue(store.platform.endsAt), renewalMessage: store.platform.renewalMessage || '', subscriptionReason: '', featureOverrides: [...(store.platform.featureOverrides || [])], disabledFeatures: [...(store.platform.disabledFeatures || [])], limitOverrides: { products: store.platform.limitOverrides?.products ?? '', ordersPerMonth: store.platform.limitOverrides?.ordersPerMonth ?? '' } }; }
function profilePayload(value) { return { name: value.name, legalName: value.legalName, slug: value.slug, logo: value.logo, customDomain: value.customDomain, supportEmail: value.supportEmail, supportPhone: value.supportPhone, whatsappNumber: value.whatsappNumber, paymentReady: value.paymentReady, shippingReady: value.shippingReady, pickupAddress: value.pickupAddress, returnAddress: value.returnAddress }; }
function subscriptionPayload(value) { return { plan: value.plan, licenseStatus: value.licenseStatus, billingCycle: value.billingCycle, licenseEndsAt: value.licenseEndsAt, renewalMessage: value.renewalMessage, featureOverrides: value.featureOverrides, disabledFeatures: value.disabledFeatures, limitOverrides: value.limitOverrides, reason: value.subscriptionReason }; }
function dateValue(value) { if (!value) return ''; const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : ''; }
function planLimit(plans, id, key) { return plans.find((item) => item.id === id)?.limits?.[key] || 0; }
function subscriptionQuote(amount, pricing) { const base = Number(amount || 0); return pricing?.taxMode === 'EXCLUSIVE' ? base + Math.round(base * Number(pricing.gstPercent || 0) / 100) : base; }
function grantLabel(value) { return ({ TRIAL: '30-day trial', MONTHLY: '1 month', YEARLY: '1 year', LIFETIME: 'Lifetime' })[value] || value; }
function grantIcon(value) { return value === 'LIFETIME' ? '∞' : value === 'YEARLY' ? '★' : value === 'MONTHLY' ? '●' : '◇'; }
function accessLabel(store) { return store.platform.billingCycle === 'LIFETIME' ? 'Lifetime' : store.platform.daysRemaining == null ? store.platform.billingCycle : `${store.platform.daysRemaining} days`; }
function operationKey(prefix) { return `${prefix}:${Date.now()}:${window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`; }
function formatDate(value) { if (!value) return 'Not available'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }
function projectionLabel(value, fallback) { return value ? `At the current pace, limit may be reached by ${new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : fallback; }
function useDialogFocusTrap(ref, onClose, busy, activationKey) {
  const closeRef = useRef(onClose); const busyRef = useRef(busy); closeRef.current = onClose; busyRef.current = busy;
  useEffect(() => {
    const dialog = ref.current; if (!dialog) return undefined;
    const previous = document.activeElement;
    const focusable = () => [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
    focusable()[0]?.focus();
    const handle = (event) => {
      const dialogs = [...document.querySelectorAll('[data-portfolio-dialog]')];
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable(); if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('keydown', handle); previous?.focus?.(); };
  }, [ref, activationKey]);
}
function humanize(value) { return String(value || '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase()); }
function copyStorefront(store) { const path = store.isDefault ? '/' : `/store/${store.slug}`; navigator.clipboard?.writeText(new URL(path, window.location.origin).href); }
function openSellerWorkspace(storeId) { sessionStorage.setItem('samira_seller_store_id', storeId); window.location.assign('/seller'); }
function downloadAffected(items, filename) { const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`; const rows = [['Product', 'SKU', 'Review reasons'], ...items.map((item) => [item.name, item.sku, (item.reasons || []).map((entry) => `${humanize(entry.code)}: ${(entry.fields || []).join(', ')}`).join(' | ')])]; const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
async function exportPreviewProducts(storeId, preview, notify) { try { const params = new URLSearchParams({ industry: preview.to.id, impactToken: preview.impactToken, page: '1', limit: '500' }); const result = await api.get(`/master/stores/${storeId}/industry-impact/products?${params}`); downloadAffected(result.items, `${preview.from.id}-to-${preview.to.id}-affected-products.csv`); } catch (error) { notify(error.message, 'error', 'Export failed'); } }
