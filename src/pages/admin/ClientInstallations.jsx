import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, CalendarClock, Check, ChevronLeft, ChevronRight, CircleDollarSign,
  Cloud, ExternalLink, Filter, KeyRound, RefreshCw, Rocket, Save, Search, Settings2,
  ShieldCheck, ShieldOff, Sparkles, Store, X,
} from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/admin/PageHeader';
import PageState from '../../components/ui/PageState';
import { useAuth } from '../../context/AuthContext';
import useUnsavedChanges from '../../hooks/useUnsavedChanges';

const RELEASE_EMPTY = {
  version: '', channel: 'stable', notes: '', mandatory: false, eligibleIndustries: [], rolloutPercent: 100,
  artifact: { url: '', checksumSha256: '', commitSha: '', repository: '', migrationVersion: '', minimumProtocol: 1 },
};
const TABS = ['Overview', 'Subscription', 'Features & limits', 'Deployment', 'Activity'];
const OPERATION_SOURCE = ['COMPLIMENTARY', 'MANUAL_PAYMENT', 'PROMOTIONAL', 'SUPPORT_EXTENSION'];
const operationKey = (prefix) => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

export default function ClientInstallations() {
  const { notify } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [query, setQuery] = useState({ q: '', status: '', plan: '', industry: '', attention: '', sort: 'newest', page: 1 });
  const [release, setRelease] = useState(RELEASE_EMPTY);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [operations, setOperations] = useState(null);
  const [edit, setEdit] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [prompt, setPrompt] = useState(null);
  const loadSequence = useRef(0);
  const dirty = Boolean(edit && baseline && JSON.stringify(edit) !== JSON.stringify(baseline));
  const anyBusy = Object.values(busy).some(Boolean);
  useUnsavedChanges(dirty, anyBusy);

  const load = async (next = query) => {
    const sequence = ++loadSequence.current;
    const params = new URLSearchParams(Object.entries(next).filter(([, value]) => value !== '' && value != null));
    setError('');
    try {
      const result = await api.get(`/master/clients?${params}`);
      if (sequence === loadSequence.current) setWorkspace(result);
    } catch (requestError) {
      if (sequence !== loadSequence.current) return;
      if (!workspace) setError(requestError.message); else notify(requestError.message, 'error', 'Client control');
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => load(query), query.q ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q, query.status, query.plan, query.industry, query.attention, query.sort, query.page]);

  const run = async (key, task) => {
    if (busy[key]) return undefined;
    setBusy((current) => ({ ...current, [key]: true }));
    try { return await task(); }
    catch (requestError) { notify(requestError.message, 'error', requestError.status === 409 ? 'Reload required' : 'Client control'); return undefined; }
    finally { setBusy((current) => ({ ...current, [key]: false })); }
  };
  const applyInstallation = (item) => {
    setWorkspace((current) => current ? { ...current, installations: current.installations.map((row) => row.id === item.id ? item : row) } : current);
    setOperations((current) => current ? { ...current, installation: item } : current);
    const next = toEdit(item); setEdit(next); setBaseline(next);
  };
  const fetchOperations = async (id = selected, activityPage = 1) => {
    const result = await api.get(`/master/installations/${id}/operations?activityPage=${activityPage}`);
    setOperations(result); const next = toEdit(result.installation); setEdit(next); setBaseline(next); return result;
  };
  const openClient = (item) => run(`open-${item.id}`, async () => {
    setSelected(item.id); setOperations(null); const next = toEdit(item); setEdit(next); setBaseline(next); setTab('Overview');
    await fetchOperations(item.id);
  });
  const closeClient = () => {
    if (dirty && !window.confirm('Close client control? Unsaved changes will be lost.')) return;
    setSelected(null); setOperations(null); setEdit(null); setBaseline(null); setPrompt(null);
  };
  const mutate = (key, method, path, body, message) => run(key, async () => {
    let result;
    try {
      result = await api[method](path, { baseRevision: operations.installation.revision, ...body });
    } catch (requestError) {
      if (requestError.status === 409 || key.startsWith('deploy-')) {
        await Promise.allSettled([fetchOperations(selected), load(query)]);
      }
      throw requestError;
    }
    if (result?.installation) applyInstallation(result.installation);
    await fetchOperations(selected);
    await load(query);
    notify(message, 'success', 'Client updated');
    return result;
  });
  const saveOverview = () => mutate(`profile-${selected}`, 'patch', `/master/installations/${selected}/profile`, {
    contact: edit.contact, tags: edit.tags, notes: edit.notes,
  }, 'Client profile has been saved.');
  const saveWithReason = (kind, reason) => {
    if (kind === 'subscription') return mutate(`subscription-${selected}`, 'patch', `/master/installations/${selected}/subscription`, {
      plan: edit.plan, billingCycle: edit.billingCycle, endsAt: edit.endsAt, renewalMessage: edit.renewalMessage, reason,
    }, 'Subscription settings have been saved.');
    if (kind === 'entitlements') return mutate(`entitlements-${selected}`, 'patch', `/master/installations/${selected}/entitlements`, {
      featureOverrides: edit.featureOverrides, disabledFeatures: edit.disabledFeatures, limitOverrides: edit.limitOverrides, reason,
    }, 'Feature access and usage limits have been saved.');
    const hookValue = edit.deployHookUrl === '__REMOVE__' ? '' : edit.deployHookUrl;
    return mutate(`deployment-settings-${selected}`, 'patch', `/master/installations/${selected}/deployment`, {
      targetVersion: edit.targetVersion, updateChannel: edit.updateChannel, deploymentUrl: edit.deploymentUrl,
      provider: edit.provider, repository: edit.repository, branch: edit.branch, environment: edit.environment,
      ...(hookValue ? { deployHookUrl: hookValue } : edit.deployHookUrl === '__REMOVE__' ? { deployHookUrl: '' } : {}), reason,
    }, 'Deployment settings have been saved.');
  };
  const saveCurrent = () => {
    if (tab === 'Overview') return saveOverview();
    if (tab === 'Subscription') setPrompt({ kind: 'subscription', title: 'Save subscription changes?', reason: '' });
    if (tab === 'Features & limits') setPrompt({ kind: 'entitlements', title: 'Save access overrides?', reason: '' });
    if (tab === 'Deployment') setPrompt({ kind: 'deployment', title: 'Save deployment settings?', reason: '' });
    return undefined;
  };
  const publishRelease = () => run('release', async () => {
    await api.post('/master/releases', release); setRelease(RELEASE_EMPTY); await load(query);
    notify('The release is ready for controlled assignment.', 'success', 'Release published');
  });
  const downloadCredentials = (result) => {
    if (!result?.credentials) return;
    const blob = new Blob([`${JSON.stringify({ notice: result.notice, ...result.credentials }, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `${operations.installation.projectSlug}-pending-installation-key.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const submitPrompt = async () => {
    const value = prompt; if (!value) return;
    if (['subscription', 'entitlements', 'deployment'].includes(value.kind)) {
      setPrompt(null); await saveWithReason(value.kind, value.reason); return;
    }
    if (value.kind === 'grant') {
      setPrompt(null);
      await mutate(`grant-${selected}`, 'post', `/master/installations/${selected}/subscription/grants`, {
        plan: edit.plan, billingCycle: value.cycle, grantDays: value.days, source: value.source,
        reference: value.reference, reason: value.reason, idempotencyKey: value.operationId,
      }, `${grantLabel(value.cycle)} access is active.`); return;
    }
    if (value.kind === 'lifecycle') {
      setPrompt(null); await mutate(`lifecycle-${selected}`, 'patch', `/master/installations/${selected}/lifecycle`, { action: value.action, reason: value.reason }, `Client ${value.action.toLowerCase()} completed.`); return;
    }
    if (value.kind === 'rotate') {
      setPrompt(null);
      await run(`key-${selected}`, async () => {
        const result = await api.post(`/master/installations/${selected}/rotate-key`, { baseRevision: operations.installation.revision, reason: value.reason, idempotencyKey: value.operationId });
        downloadCredentials(result); if (result.installation) applyInstallation(result.installation); await fetchOperations(selected);
        notify('Current key stays valid until the pending key checks in.', 'warning', 'Staged key rotation started');
      }); return;
    }
    if (value.kind === 'cancel-key') {
      setPrompt(null); await mutate(`key-${selected}`, 'post', `/master/installations/${selected}/rotate-key/cancel`, { reason: value.reason }, 'Pending key rotation has been cancelled.'); return;
    }
    if (value.kind === 'release') {
      setPrompt(null);
      await run(`release-${value.releaseId}`, async () => {
        await api.patch(`/master/releases/${value.releaseId}`, { baseRevision: value.revision, action: value.action, rolloutPercent: value.rolloutPercent, reason: value.reason });
        await load(query); notify(`Release ${value.action.toLowerCase()} completed.`, 'success', 'Release updated');
      }); return;
    }
    if (value.kind === 'deploy') {
      setPrompt(null); await mutate(`deploy-${selected}`, 'post', `/master/installations/${selected}/deploy`, { reason: value.reason, idempotencyKey: value.operationId }, `Deployment ${edit.targetVersion} was accepted by the provider.`);
    }
  };

  const industries = workspace?.industryOptions || [];
  const plans = workspace?.plans || [];
  const installation = operations?.installation;
  const published = workspace?.releases?.filter((item) => item.status === 'PUBLISHED' && item.rolloutStatus !== 'PAUSED') || [];
  const eligibleReleases = installation ? published.filter((item) => item.channel === edit?.updateChannel && (!item.eligibleIndustries?.length || item.eligibleIndustries.includes(installation.industry))) : [];
  const allFeatures = useMemo(() => [...new Set((workspace?.plans || []).flatMap((plan) => plan.features || []))], [workspace?.plans]);
  if (!workspace && error) return <PageState error={error} onRetry={() => load(query)} />;
  if (!workspace) return <PageState loading loadingLabel="Loading client operations..." />;

  return <section className="min-w-0 space-y-5">
    <PageHeader title="Client control" note="Subscriptions, usage, releases and service health for every isolated client.">
      <button type="button" className="admin-btn-ghost" onClick={() => load(query)}><RefreshCw size={16} /> Refresh</button>
    </PageHeader>
    {!workspace.controlPlane?.signingReady && <Notice icon={AlertTriangle} title="Licence signing is not ready">Set platform signing keys before issuing production client packages.</Notice>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-7">
      <Summary icon={Store} label="All clients" value={workspace.summary.total} /><Summary icon={ShieldCheck} label="Active" value={workspace.summary.active} tone="green" />
      <Summary icon={Sparkles} label="Free trials" value={workspace.summary.trials} /><Summary icon={CalendarClock} label="Expiring in 30d" value={workspace.summary.expiring} tone={workspace.summary.expiring ? 'amber' : ''} onClick={() => setQuery((q) => ({ ...q, attention: 'expiring', page: 1 }))} />
      <Summary icon={Cloud} label="Offline active clients" value={workspace.summary.offline} tone={workspace.summary.offline ? 'red' : ''} onClick={() => setQuery((q) => ({ ...q, attention: 'offline', page: 1 }))} /><Summary icon={AlertTriangle} label="Critical risks" value={workspace.summary.needsAttention || 0} tone={workspace.summary.needsAttention ? 'red' : ''} onClick={() => setQuery((q) => ({ ...q, attention: 'risks', page: 1 }))} /><Summary icon={CircleDollarSign} label="Net paid this month" value={formatCurrency(workspace.summary.monthlyRevenue)} />
    </div>
    <ReleaseManager workspace={workspace} release={release} setRelease={setRelease} busy={busy.release} onPublish={publishRelease} onAction={(item, action) => setPrompt({ kind: 'release', title: `${actionReleaseLabel(action)} ${item.version}?`, releaseId: item.id, revision: item.revision || 0, action, rolloutPercent: item.rolloutPercent ?? 100, reason: '' })} />
    <div className="admin-card p-4"><div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(5,minmax(120px,auto))]">
      <label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input aria-label="Search clients" value={query.q} onChange={(event) => setQuery({ ...query, q: event.target.value, page: 1 })} className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm" placeholder="Search company, phone, email, domain or ID" /></label>
      <FilterSelect label="Status" value={query.status} onChange={(status) => setQuery({ ...query, status, page: 1 })}>{['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED'].map((value) => <option key={value}>{value}</option>)}</FilterSelect>
      <FilterSelect label="Plan" value={query.plan} onChange={(plan) => setQuery({ ...query, plan, page: 1 })}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</FilterSelect>
      <FilterSelect label="Industry" value={query.industry} onChange={(industry) => setQuery({ ...query, industry, page: 1 })}>{industries.map((item) => <option key={item.industry} value={item.industry}>{item.name}</option>)}</FilterSelect>
      <FilterSelect label="Attention" value={query.attention} onChange={(attention) => setQuery({ ...query, attention, page: 1 })}><option value="risks">Critical risks</option><option value="expiring">Expiring soon</option><option value="offline">Offline</option><option value="updates">Update pending</option></FilterSelect>
      <FilterSelect label="Sort" value={query.sort} onChange={(sort) => setQuery({ ...query, sort, page: 1 })}><option value="newest">Newest</option><option value="updated">Recently updated</option><option value="company">Company</option><option value="expiry">Expiry</option><option value="health">Last check-in</option></FilterSelect>
    </div>{(query.status || query.plan || query.industry || query.attention || query.q) && <button type="button" className="mt-3 text-xs font-black text-[#8f2748]" onClick={() => setQuery({ q: '', status: '', plan: '', industry: '', attention: '', sort: 'newest', page: 1 })}>Clear all filters</button>}</div>
    {workspace.installations.length ? <><div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm md:block"><table className="w-full text-left text-sm"><thead className="bg-[#fffaf7] text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-4">Client</th><th>Access</th><th>Usage</th><th>Health</th><th>Version</th><th className="pr-4 text-right">Action</th></tr></thead><tbody>{workspace.installations.map((item) => <ClientRow key={item.id} item={item} onOpen={() => openClient(item)} busy={busy[`open-${item.id}`]} />)}</tbody></table></div><div className="grid gap-3 md:hidden">{workspace.installations.map((item) => <ClientCard key={item.id} item={item} onOpen={() => openClient(item)} />)}</div><Pagination value={workspace.pagination} onChange={(page) => setQuery({ ...query, page })} /></> : <PageState empty emptyTitle="No clients match these filters" emptyMessage="Clear filters or generate a new isolated client project." />}
    {selected && <ClientDrawer installation={installation} edit={edit} setEdit={setEdit} tab={tab} setTab={setTab} plans={plans} pricing={workspace.pricing} allFeatures={allFeatures} eligibleReleases={eligibleReleases} operations={operations} busy={busy} dirty={dirty} promptOpen={Boolean(prompt)} onClose={closeClient} onSave={saveCurrent} onPrompt={setPrompt} onActivityPage={(page) => run(`activity-${selected}`, () => fetchOperations(selected, page))} controlPlane={workspace.controlPlane} />}
    {prompt && <OperationPrompt value={prompt} onChange={setPrompt} busy={anyBusy} onClose={() => setPrompt(null)} onConfirm={submitPrompt} />}
  </section>;
}

function ReleaseManager({ workspace, release, setRelease, busy, onPublish, onAction }) {
  const industries = workspace.industryOptions || []; const artifact = release.artifact;
  return <details className="admin-card overflow-hidden"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3e4e8] text-[#751d39]"><Rocket size={19} /></span><span><strong className="block">Release manager</strong><span className="text-xs text-slate-500">Publish traceable artifacts for controlled client rollout.</span></span></span><Settings2 size={18} /></summary><div className="grid gap-4 border-t p-5 sm:grid-cols-2 xl:grid-cols-4">
    <Field label="Semantic version"><input value={release.version} onChange={(e) => setRelease({ ...release, version: e.target.value })} placeholder="1.2.0" /></Field>
    <Field label="Channel"><select value={release.channel} onChange={(e) => setRelease({ ...release, channel: e.target.value })}><option value="stable">Stable</option><option value="beta">Beta</option></select></Field>
    <Field label="Rollout percentage"><input type="number" min="0" max="100" value={release.rolloutPercent} onChange={(e) => setRelease({ ...release, rolloutPercent: e.target.value })} /></Field>
    <label className="flex h-11 items-center gap-3 self-end rounded-xl border px-3 text-xs font-black"><input type="checkbox" checked={release.mandatory} onChange={(e) => setRelease({ ...release, mandatory: e.target.checked })} /> Required update</label>
    <Field label="Source repository"><input value={artifact.repository} onChange={(e) => setRelease({ ...release, artifact: { ...artifact, repository: e.target.value } })} placeholder="owner/repository" /></Field>
    <Field label="Commit SHA"><input value={artifact.commitSha} onChange={(e) => setRelease({ ...release, artifact: { ...artifact, commitSha: e.target.value } })} placeholder="7–64 hex characters" /></Field>
    <Field label="Signed artifact URL"><input value={artifact.url} onChange={(e) => setRelease({ ...release, artifact: { ...artifact, url: e.target.value } })} placeholder="https://.../release.zip" /></Field>
    <Field label="SHA-256 checksum"><input value={artifact.checksumSha256} onChange={(e) => setRelease({ ...release, artifact: { ...artifact, checksumSha256: e.target.value } })} placeholder="64-character checksum" /></Field>
    <Field label="Migration version"><input value={artifact.migrationVersion} onChange={(e) => setRelease({ ...release, artifact: { ...artifact, migrationVersion: e.target.value } })} placeholder="optional" /></Field>
    <Field label="Minimum protocol"><input type="number" min="1" value={artifact.minimumProtocol} onChange={(e) => setRelease({ ...release, artifact: { ...artifact, minimumProtocol: e.target.value } })} /></Field>
    <div className="sm:col-span-2"><p className="mb-2 text-xs font-black">Eligible industries <span className="font-normal text-slate-500">(none selected means all)</span></p><div className="flex flex-wrap gap-2">{industries.map((item) => <ToggleChip key={item.industry} active={release.eligibleIndustries.includes(item.industry)} onClick={() => setRelease((current) => ({ ...current, eligibleIndustries: toggle(current.eligibleIndustries, item.industry) }))}>{item.name}</ToggleChip>)}</div></div>
    <label className="grid gap-2 text-xs font-black sm:col-span-2 xl:col-span-4">Release notes<textarea value={release.notes} maxLength={5000} onChange={(e) => setRelease({ ...release, notes: e.target.value })} className="min-h-24 rounded-xl border p-3 text-sm font-normal" placeholder="Customer-visible improvements, migrations and rollback notes" /></label>
    <div className="flex items-center justify-between gap-3 sm:col-span-2 xl:col-span-4"><p className="text-xs text-slate-500">{workspace.releases?.length || 0} release records · rollout 0% pauses assignment.</p><button type="button" disabled={busy || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.version)} onClick={onPublish} className="admin-btn"><Rocket size={16} />{busy ? 'Publishing...' : 'Publish release'}</button></div>
    {!!workspace.releases?.length && <div className="space-y-2 sm:col-span-2 xl:col-span-4"><p className="text-xs font-black">Recent releases</p>{workspace.releases.slice(0, 5).map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3"><div><strong className="text-sm">{item.version} · {item.channel}</strong><p className="text-xs text-slate-500">{item.status} · {item.rolloutStatus || 'READY'} · {item.rolloutPercent ?? 100}% rollout{item.artifact?.commitSha ? ` · ${item.artifact.commitSha.slice(0, 10)}` : ''}</p></div>{item.status === 'PUBLISHED' && <div className="flex flex-wrap gap-2">{item.rolloutStatus === 'PAUSED' ? <button type="button" className="admin-btn-ghost" onClick={() => onAction(item, 'RESUME')}>Resume</button> : <button type="button" className="admin-btn-ghost" onClick={() => onAction(item, 'PAUSE')}>Pause</button>}{Number(item.rolloutPercent) < 100 && <button type="button" className="admin-btn-ghost" onClick={() => onAction(item, 'COMPLETE')}>Complete rollout</button>}<button type="button" className="admin-btn-ghost text-red-700" onClick={() => onAction(item, 'RETIRE')}>Retire</button></div>}</article>)}</div>}
  </div></details>;
}

function ClientDrawer(props) {
  const { installation, edit, setEdit, tab, setTab, plans, pricing, allFeatures, eligibleReleases, operations, busy, dirty, promptOpen, onClose, onSave, onPrompt, onActivityPage, controlPlane } = props;
  useEffect(() => { const key = (event) => { if (event.key === 'Escape' && !promptOpen) onClose(); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [onClose, promptOpen]);
  if (!installation || !edit) return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/30"><div className="rounded-2xl bg-white p-6 shadow-xl">Loading client details...</div></div>;
  const baseFeatures = plans.find((plan) => plan.id === edit.plan)?.features || [];
  const enabled = (feature) => !edit.disabledFeatures.includes(feature) && (baseFeatures.includes(feature) || edit.featureOverrides.includes(feature));
  const setFeature = (feature, checked) => setEdit((current) => ({ ...current, featureOverrides: checked && !baseFeatures.includes(feature) ? [...new Set([...current.featureOverrides, feature])] : current.featureOverrides.filter((item) => item !== feature), disabledFeatures: checked ? current.disabledFeatures.filter((item) => item !== feature) : [...new Set([...current.disabledFeatures, feature])] }));
  const releases = eligibleReleases.filter((item) => item.version !== edit.targetVersion);
  const saving = busy[`profile-${installation.id}`] || busy[`subscription-${installation.id}`] || busy[`entitlements-${installation.id}`] || busy[`deployment-settings-${installation.id}`];
  return <div className="fixed inset-0 z-[80] bg-black/35"><aside role="dialog" aria-modal="true" aria-label={`Manage ${installation.companyName}`} className="absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col bg-[#fffdfb] shadow-2xl">
    <header className="border-b bg-white px-4 py-4 sm:px-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a5269]">{installation.industry} · {installation.projectSlug}</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{installation.companyName}</h2><p className="mt-1 break-all text-xs text-slate-500">{installation.installationId} · revision {installation.revision}</p></div><button type="button" aria-label="Close client details" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border"><X size={18} /></button></div><div className="mt-4 flex gap-1 overflow-x-auto">{TABS.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${tab === item ? 'bg-[#751d39] text-white' : 'text-slate-600 hover:bg-[#f8efeb]'}`}>{item}{dirty && item === tab && item !== 'Activity' ? ' •' : ''}</button>)}</div></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-8">
      {installation.billingReview?.required && <Notice icon={AlertTriangle} title="Billing review required">{installation.billingReview.reason}</Notice>}
      {tab === 'Overview' && <OverviewTab installation={installation} edit={edit} setEdit={setEdit} />}
      {tab === 'Subscription' && <SubscriptionTab installation={installation} edit={edit} setEdit={setEdit} plans={plans} pricing={pricing} operations={operations} busy={busy} onGrant={(cycle) => onPrompt({ kind: 'grant', title: `Grant ${grantLabel(cycle)} access?`, cycle, days: 30, source: 'COMPLIMENTARY', reference: '', reason: '', operationId: operationKey('grant') })} />}
      {tab === 'Features & limits' && <FeaturesTab edit={edit} setEdit={setEdit} plans={plans} allFeatures={allFeatures} baseFeatures={baseFeatures} enabled={enabled} setFeature={setFeature} />}
      {tab === 'Deployment' && <DeploymentTab installation={installation} edit={edit} setEdit={setEdit} releases={releases} busy={busy} dirty={dirty} onPrompt={onPrompt} controlPlane={controlPlane} />}
      {tab === 'Activity' && <ActivityTab rows={operations.operations || []} pagination={operations.operationPagination} busy={busy[`activity-${installation.id}`]} onPage={onActivityPage} />}
    </div>
    <footer className="fixed inset-x-0 bottom-0 ml-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 border-t bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,.08)] backdrop-blur sm:absolute sm:p-4 sm:px-6"><div className="flex flex-wrap gap-2">{['SUSPENDED', 'REVOKED'].includes(installation.status) ? <button type="button" className="admin-btn-ghost text-emerald-800" onClick={() => onPrompt({ kind: 'lifecycle', title: 'Restore client access?', action: 'RESTORE', reason: '' })}>Restore</button> : <><button type="button" className="admin-btn-ghost text-amber-800" onClick={() => onPrompt({ kind: 'lifecycle', title: 'Suspend this client?', action: 'SUSPEND', reason: '' })}>Suspend</button><button type="button" className="admin-btn-ghost text-red-700" onClick={() => onPrompt({ kind: 'lifecycle', title: 'Revoke this client?', action: 'REVOKE', reason: '' })}><ShieldOff size={15} /> Revoke</button></>}{installation.keyRotation?.status === 'PENDING' ? <button type="button" className="admin-btn-ghost" onClick={() => onPrompt({ kind: 'cancel-key', title: 'Cancel pending key rotation?', reason: '' })}>Cancel key rotation</button> : <button type="button" className="admin-btn-ghost" title={!controlPlane?.deploymentHooksReady ? 'Configure platform credential encryption first' : ''} disabled={busy[`key-${installation.id}`] || !controlPlane?.deploymentHooksReady} onClick={() => onPrompt({ kind: 'rotate', title: 'Start staged key rotation?', reason: '', operationId: operationKey('key') })}><KeyRound size={15} /> Rotate key</button>}</div>{tab !== 'Activity' && <button type="button" disabled={saving || !dirty} onClick={onSave} className="admin-btn"><Save size={16} />{saving ? 'Saving...' : dirty ? `Save ${tab.toLowerCase()}` : 'No changes'}</button>}</footer>
  </aside></div>;
}

function OverviewTab({ installation, edit, setEdit }) {
  const ContactField = ({ name, label, type = 'text' }) => <Field label={label}><input type={type} value={edit.contact[name]} onChange={(e) => setEdit({ ...edit, contact: { ...edit.contact, [name]: e.target.value } })} /></Field>;
  return <div className="space-y-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Status" value={installation.status} /><Metric label="Last seen" value={relativeDate(installation.lastSeenAt)} /><Metric label="Database" value={installation.health?.databaseStatus} /><Metric label="Created" value={formatDate(installation.createdAt, true)} /></div><Panel title="Client profile" note="Contact and account ownership details visible only to the platform owner."><div className="grid gap-4 sm:grid-cols-2"><ContactField name="ownerName" label="Owner name" /><ContactField name="phone" label="Indian mobile" /><ContactField name="email" label="Email" type="email" /><ContactField name="billingEmail" label="Billing email" type="email" /><ContactField name="accountManager" label="Account manager" /><Field label="Tags"><input value={edit.tags} onChange={(e) => setEdit({ ...edit, tags: e.target.value })} placeholder="priority, fashion, north" /></Field></div></Panel><Panel title="Connection" note="Health comes from the client backend heartbeat."><div className="grid gap-3 sm:grid-cols-4"><Metric label="Service" value={installation.health?.status} /><Metric label="Database latency" value={installation.health?.databaseLatencyMs == null ? 'Not reported' : `${installation.health.databaseLatencyMs} ms`} /><Metric label="Memory" value={installation.health?.memoryRssMb == null ? 'Not reported' : `${installation.health.memoryRssMb} MB`} /><Metric label="Uptime" value={durationLabel(installation.health?.uptimeSeconds)} /><Metric label="Payments" value={installation.health?.paymentReady ? 'Ready' : 'Needs setup'} /><Metric label="Media storage" value={installation.health?.mediaStorageReady ? 'Ready' : 'Needs setup'} /><Metric label="Shipping" value={installation.health?.shippingProvider || 'disabled'} /><Metric label="Node runtime" value={installation.health?.nodeVersion || 'Not reported'} /><Metric label="Products" value={`${installation.usage?.products || 0} / ${installation.limits?.products || 0}`} /><Metric label="Orders this month" value={`${installation.usage?.ordersPerMonth || 0} / ${installation.limits?.ordersPerMonth || 0}`} /></div>{installation.health?.lastError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-800">{installation.health.lastError}</p>}</Panel><Panel title="Private notes"><Field label="Owner notes"><textarea value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} className="min-h-24 w-full rounded-xl border p-3 text-sm font-normal" maxLength={1000} /></Field></Panel></div>;
}

function SubscriptionTab({ installation, edit, setEdit, plans, pricing, operations, busy, onGrant }) {
  return <div className="space-y-5"><Panel title="Access & renewal" note="Status changes use protected lifecycle controls. Manual extensions create a separate operation record."><div className="grid gap-4 sm:grid-cols-2"><Field label="Plan"><select value={edit.plan} onChange={(e) => setEdit({ ...edit, plan: e.target.value })}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></Field><Field label="Current status"><input value={installation.status} disabled /></Field><Field label="Billing cycle"><select value={edit.billingCycle} onChange={(e) => setEdit({ ...edit, billingCycle: e.target.value })}>{['TRIAL', 'MONTHLY', 'YEARLY', 'LIFETIME', 'MANUAL'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Access ends"><input type="date" disabled={edit.billingCycle === 'LIFETIME'} value={edit.endsAt} onChange={(e) => setEdit({ ...edit, endsAt: e.target.value })} /></Field><Field label="Renewal message"><input value={edit.renewalMessage} onChange={(e) => setEdit({ ...edit, renewalMessage: e.target.value })} /></Field></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{plans.map((plan) => <article key={plan.id} className={`rounded-2xl border p-4 ${plan.id === edit.plan ? 'border-[#8f2748] bg-[#fff8fa]' : 'bg-white'}`}><strong>{plan.name}</strong><p className="mt-2 text-xs text-slate-500">Monthly {formatCurrency(plan.prices?.monthly)} · Yearly {formatCurrency(plan.prices?.yearly)}</p><p className="mt-1 text-xs text-slate-500">One-time {formatCurrency(plan.prices?.lifetime)}</p></article>)}</div><p className="mt-3 text-xs text-slate-500">Prices are {pricing?.taxMode === 'EXCLUSIVE' ? `before ${pricing.gstPercent}% GST` : `inclusive of ${pricing?.gstPercent || 0}% GST`}.</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{['TRIAL', 'MONTHLY', 'YEARLY', 'LIFETIME'].map((value) => <button key={value} type="button" disabled={busy[`grant-${installation.id}`]} onClick={() => onGrant(value)} className="h-11 rounded-xl border bg-white text-xs font-black text-[#751d39]">{grantLabel(value)}</button>)}</div></Panel><Panel title="Payment ledger" note={`${operations.paymentTotal || 0} subscription payment record(s).`}><PaymentTable rows={operations.payments || []} /></Panel></div>;
}

function FeaturesTab({ edit, setEdit, plans, allFeatures, baseFeatures, enabled, setFeature }) {
  return <div className="space-y-5"><Panel title="Usage limits" note="Leave an override empty to use the selected plan default."><div className="grid gap-4 sm:grid-cols-2"><Limit label="Active products" value={edit.limitOverrides.products} placeholder={planLimit(plans, edit.plan, 'products')} onChange={(value) => setEdit({ ...edit, limitOverrides: { ...edit.limitOverrides, products: value } })} /><Limit label="Orders per month" value={edit.limitOverrides.ordersPerMonth} placeholder={planLimit(plans, edit.plan, 'ordersPerMonth')} onChange={(value) => setEdit({ ...edit, limitOverrides: { ...edit.limitOverrides, ordersPerMonth: value } })} /></div></Panel><Panel title="Feature access" note="Plan defaults can be overridden for this installation only."><div className="grid gap-2 sm:grid-cols-2">{allFeatures.map((feature) => <label key={feature} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm"><span><strong className="block">{humanize(feature)}</strong><span className="text-[10px] text-slate-500">{baseFeatures.includes(feature) ? 'Included in plan' : 'Individual add-on'}</span></span><input type="checkbox" checked={enabled(feature)} onChange={(e) => setFeature(feature, e.target.checked)} /></label>)}</div></Panel></div>;
}

function DeploymentTab({ installation, edit, setEdit, releases, busy, dirty, onPrompt, controlPlane }) {
  return <div className="space-y-5"><Panel title="Release assignment" note="Assign a tested release, save it, then start deployment."><div className="grid gap-4 sm:grid-cols-2"><Field label="Update channel"><select value={edit.updateChannel} onChange={(e) => setEdit({ ...edit, updateChannel: e.target.value })}><option value="stable">Stable</option><option value="beta">Beta</option></select></Field><Field label="Target version"><select value={edit.targetVersion} onChange={(e) => setEdit({ ...edit, targetVersion: e.target.value })}><option value={edit.targetVersion}>{edit.targetVersion}</option>{releases.map((item) => <option key={item.version} value={item.version}>{item.version}{item.mandatory ? ' · required' : ''} · {item.rolloutPercent ?? 100}%</option>)}</select></Field></div><div className="mt-4 grid gap-3 sm:grid-cols-4"><Metric label="Installed" value={installation.lastValidatedVersion || installation.appVersion} /><Metric label="Target" value={installation.targetVersion} /><Metric label="Protocol" value={installation.lastProtocolVersion} /><Metric label="State" value={installation.deployment?.phase || 'Not started'} /></div></Panel><Panel title="Managed deployment" note="The private hook starts the configured provider build. Live is confirmed after the target version checks in.">{!controlPlane?.deploymentHooksReady && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Configure platform credential encryption before saving private hooks.</p>}<p className="mb-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">The hook rebuilds the branch configured at the hosting provider. To copy a release into an independent client repository, configure that repository’s CI to verify and apply the selected release artifact before its build.</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Provider"><select value={edit.provider} onChange={(e) => setEdit({ ...edit, provider: e.target.value })}>{['RENDER', 'VERCEL', 'NETLIFY', 'CLOUDFLARE', 'CUSTOM'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Store deployment URL"><input value={edit.deploymentUrl} onChange={(e) => setEdit({ ...edit, deploymentUrl: e.target.value })} placeholder="https://client.example.com" /></Field><Field label="Source repository"><input value={edit.repository} onChange={(e) => setEdit({ ...edit, repository: e.target.value })} placeholder="owner/repository" /></Field><Field label="Branch"><input value={edit.branch} onChange={(e) => setEdit({ ...edit, branch: e.target.value })} /></Field><Field label="Environment"><input value={edit.environment} onChange={(e) => setEdit({ ...edit, environment: e.target.value })} /></Field><Field label={installation.deployment?.hasHook ? 'Replace private deploy hook' : 'Private deploy hook'}><input type="password" autoComplete="new-password" value={edit.deployHookUrl || ''} onChange={(e) => setEdit({ ...edit, deployHookUrl: e.target.value })} placeholder={installation.deployment?.hasHook ? 'Leave blank to keep current hook' : 'Provider deploy hook URL'} /></Field></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="admin-btn" disabled={busy[`deploy-${installation.id}`] || dirty || !installation.deployment?.hasHook} onClick={() => onPrompt({ kind: 'deploy', title: `Deploy ${installation.targetVersion}?`, reason: '', operationId: operationKey('deploy') })}><Rocket size={16} />{busy[`deploy-${installation.id}`] ? 'Starting...' : `Deploy ${installation.targetVersion}`}</button>{installation.deploymentUrl && <a href={installation.deploymentUrl} target="_blank" rel="noreferrer" className="admin-btn-ghost"><ExternalLink size={16} /> Open client</a>}{installation.deployment?.hasHook && <button type="button" className="admin-btn-ghost" onClick={() => setEdit({ ...edit, deployHookUrl: '__REMOVE__' })}>Remove hook</button>}</div>{dirty && <p className="mt-3 text-xs font-bold text-amber-800">Save deployment settings before starting the build.</p>}{installation.deployment?.last && <p className="mt-3 text-xs text-slate-600">{installation.deployment.phase} · {installation.deployment.last.message} · {formatDate(installation.deployment.last.completedAt || installation.deployment.last.requestedAt)}</p>}</Panel>{installation.keyRotation?.status === 'PENDING' && <Notice icon={KeyRound} title="Pending credential check-in">Current key remains active until the replacement key checks in. Pending key expires {formatDate(installation.keyRotation.expiresAt)}.</Notice>}</div>;
}

function ActivityTab({ rows, pagination, busy, onPage }) {
  return <Panel title="Client activity" note="Reasoned subscription, entitlement, credential and deployment operations."><div className="space-y-2">{rows.length ? rows.map((item) => <details key={item.id} className="rounded-xl border bg-white p-3"><summary className="flex cursor-pointer list-none gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f5e9ec] text-[#751d39]"><Activity size={16} /></span><div><strong className="block text-sm">{humanize(item.type)}</strong><p className="text-xs text-slate-500">{item.actor} · {formatDate(item.createdAt)} · {item.source}</p>{item.reason && <p className="mt-1 text-xs text-slate-700">{item.reason}</p>}</div></summary>{(item.before || item.after) && <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] text-slate-100">{JSON.stringify({ before: item.before, after: item.after, metadata: item.metadata }, null, 2)}</pre>}</details>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No client activity recorded yet.</p>}</div>{pagination?.pages > 1 && <div className="mt-4 flex justify-end gap-2"><button type="button" className="admin-btn-ghost" disabled={busy || pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>Previous</button><span className="self-center text-xs">{pagination.page}/{pagination.pages}</span><button type="button" className="admin-btn-ghost" disabled={busy || pagination.page >= pagination.pages} onClick={() => onPage(pagination.page + 1)}>Next</button></div>}</Panel>;
}

function OperationPrompt({ value, onChange, onClose, onConfirm, busy }) {
  useEffect(() => { const key = (event) => { if (event.key === 'Escape' && !busy) onClose(); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [busy, onClose]);
  const destructive = value.kind === 'lifecycle' && ['SUSPEND', 'REVOKE', 'EXPIRE'].includes(value.action);
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4"><div role="alertdialog" aria-modal="true" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${destructive ? 'bg-red-50 text-red-700' : 'bg-[#f5e9ec] text-[#751d39]'}`}>{destructive ? <ShieldOff /> : <ShieldCheck />}</span><h2 className="mt-4 text-xl font-black">{value.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">This operation is revision-checked and will be recorded in the control history.</p>{value.kind === 'grant' && <div className="mt-4 grid gap-3"><Field label="Grant source"><select value={value.source} onChange={(e) => onChange({ ...value, source: e.target.value })}>{OPERATION_SOURCE.map((item) => <option key={item}>{item}</option>)}</select></Field>{value.cycle === 'TRIAL' && <Field label="Trial days"><input type="number" min="1" max="365" value={value.days} onChange={(e) => onChange({ ...value, days: e.target.value })} /></Field>}<Field label="Payment/reference (optional)"><input value={value.reference} onChange={(e) => onChange({ ...value, reference: e.target.value })} /></Field></div>}{value.kind === 'release' && value.action === 'RESUME' && <div className="mt-4"><Field label="Rollout percentage"><input type="number" min="1" max="100" value={value.rolloutPercent} onChange={(e) => onChange({ ...value, rolloutPercent: e.target.value })} /></Field></div>}<Field label="Reason"><textarea autoFocus value={value.reason} onChange={(e) => onChange({ ...value, reason: e.target.value })} className="mt-3 min-h-24 w-full rounded-xl border p-3 text-sm" maxLength={500} /></Field><div className="mt-5 flex justify-end gap-2"><button type="button" className="admin-btn-ghost" onClick={onClose}>Cancel</button><button type="button" disabled={busy || value.reason.trim().length < 3} className={destructive ? 'admin-btn bg-red-700' : 'admin-btn'} onClick={onConfirm}>{busy ? 'Working...' : 'Confirm'}</button></div></div></div>;
}

function ClientRow({ item, onOpen, busy }) { return <tr className="border-t hover:bg-[#fffdfb]"><td className="p-4"><strong>{item.companyName}</strong><p className="mt-1 text-xs text-slate-500">{item.industry} · {item.contact?.ownerName || item.projectSlug}</p></td><td><Status value={item.status} /><p className="mt-1 text-xs text-slate-500">{item.plan} · {accessLabel(item)}</p></td><td><Usage value={item.usage?.products} limit={item.limits?.products} label="products" /><Usage value={item.usage?.ordersPerMonth} limit={item.limits?.ordersPerMonth} label="orders" /></td><td><Health value={item.health?.status} /><p className="mt-1 text-xs text-slate-500">{relativeDate(item.lastSeenAt)}</p></td><td><p className="text-xs font-bold">{item.lastValidatedVersion || item.appVersion}</p><p className="mt-1 text-xs text-slate-500">Target {item.targetVersion}</p></td><td className="pr-4 text-right"><button type="button" disabled={busy} onClick={onOpen} className="rounded-xl border px-3 py-2 text-xs font-black text-[#751d39]">{busy ? 'Opening...' : 'Manage'}</button></td></tr>; }
function ClientCard({ item, onOpen }) { return <article className="admin-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#9a5269]">{item.industry}</p><h2 className="mt-1 font-black">{item.companyName}</h2><p className="text-xs text-slate-500">{item.plan} · {accessLabel(item)}</p></div><Status value={item.status} /></div>{item.attention?.length > 0 && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">{item.attention[0].label}{item.attention.length > 1 ? ` +${item.attention.length - 1}` : ''}</p>}<div className="mt-4 grid grid-cols-3 gap-2"><Metric label="Health" value={item.health?.status} /><Metric label="Products" value={`${item.usage?.products || 0}/${item.limits?.products || 0}`} /><Metric label="Version" value={item.lastValidatedVersion || item.appVersion} /></div><button type="button" onClick={onOpen} className="admin-btn mt-4 w-full">Manage client</button></article>; }
function Summary({ icon: Icon, label, value, tone = '', onClick }) { const colors = tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-[#f6e9ed] text-[#7a1c39]'; const Tag = onClick ? 'button' : 'div'; return <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="admin-card flex min-w-0 items-center gap-3 p-4 text-left"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors}`}><Icon size={18} /></span><span className="min-w-0"><strong className="block truncate text-lg">{value}</strong><span className="block truncate text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span></span></Tag>; }
function Panel({ title, note, children }) { return <section className="rounded-2xl border bg-white p-4 sm:p-5"><h3 className="font-black">{title}</h3>{note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}<div className="mt-4">{children}</div></section>; }
function Notice({ icon: Icon, title, children }) { return <div className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><Icon className="shrink-0" size={19} /><div><strong>{title}</strong><p className="mt-1 text-xs leading-5">{children}</p></div></div>; }
function Field({ label, children }) { return <label className="grid min-w-0 gap-2 text-xs font-black"><span>{label}</span><span className="[&>input]:h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:px-3 [&>input]:text-sm [&>input]:font-normal [&>select]:h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:bg-white [&>select]:px-3 [&>select]:text-sm [&>select]:font-normal">{children}</span></label>; }
function FilterSelect({ label, value, onChange, children }) { return <label className="relative"><Filter className="pointer-events-none absolute left-3 top-3 text-slate-400" size={15} /><select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border bg-white pl-9 pr-7 text-xs font-bold">{label !== 'Sort' && <option value="">All {label.toLowerCase()}</option>}{children}</select></label>; }
function Metric({ label, value }) { return <div className="min-w-0 rounded-xl bg-[#fbf7f4] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><strong className="mt-1 block truncate text-xs">{value || 'Not available'}</strong></div>; }
function Status({ value }) { const good = ['ACTIVE', 'TRIAL', 'PAID'].includes(value); return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ${good ? 'bg-emerald-100 text-emerald-800' : value === 'REVOKED' || value === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{value}</span>; }
function Health({ value }) { const color = value === 'ONLINE' ? 'text-emerald-700' : value === 'ERROR' ? 'text-red-700' : 'text-amber-700'; return <span className={`text-xs font-black ${color}`}>{value || 'OFFLINE'}</span>; }
function Usage({ value, limit, label }) { const ratio = Number(limit) > 0 ? Number(value || 0) / Number(limit) : 0; return <p className={`text-xs ${ratio >= 1 ? 'font-black text-red-700' : ratio >= .8 ? 'font-bold text-amber-700' : 'text-slate-600'}`}>{Number(value || 0).toLocaleString('en-IN')}/{Number(limit || 0).toLocaleString('en-IN')} {label}</p>; }
function ToggleChip({ active, onClick, children }) { return <button type="button" onClick={onClick} className={`rounded-full border px-3 py-2 text-xs font-black ${active ? 'border-[#751d39] bg-[#751d39] text-white' : 'bg-white text-slate-600'}`}>{active && <Check className="mr-1 inline" size={13} />}{children}</button>; }
function Limit({ label, value, placeholder, onChange }) { return <label className="grid gap-1.5 text-xs font-bold text-slate-700">{label}<input type="number" min="0" step="1" value={value} placeholder={`Plan default: ${Number(placeholder || 0).toLocaleString('en-IN')}`} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl border px-3 text-sm font-normal" /></label>; }
function PaymentTable({ rows }) { if (!rows.length) return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No subscription payments yet.</p>; return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="text-[9px] uppercase tracking-wider text-slate-500"><tr><th className="pb-3">Date</th><th>Plan</th><th>Cycle</th><th>Base/GST</th><th>Total</th><th>Refunded</th><th>Status</th><th>Reference</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="py-3">{formatDate(row.paidAt || row.createdAt, true)}</td><td>{row.plan}</td><td>{row.billingCycle}</td><td>{formatCurrency(row.baseAmount)} / {formatCurrency(row.taxAmount)}</td><td>{formatCurrency(row.amount)}</td><td>{formatCurrency(row.refundedAmount)}</td><td><Status value={row.status} /></td><td className="max-w-[150px] truncate" title={row.razorpayPaymentId || row.receipt}>{row.razorpayPaymentId || row.receipt}</td></tr>)}</tbody></table></div>; }
function Pagination({ value, onChange }) { return <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Page {value.page} of {value.pages} · {value.total} clients</p><div className="flex gap-2"><button type="button" aria-label="Previous page" disabled={value.page <= 1} onClick={() => onChange(value.page - 1)} className="grid h-10 w-10 place-items-center rounded-xl border bg-white disabled:opacity-40"><ChevronLeft size={17} /></button><button type="button" aria-label="Next page" disabled={value.page >= value.pages} onClick={() => onChange(value.page + 1)} className="grid h-10 w-10 place-items-center rounded-xl border bg-white disabled:opacity-40"><ChevronRight size={17} /></button></div></div>; }

function toEdit(item) { return { plan: item.plan, billingCycle: item.billingCycle, endsAt: item.endsAt ? new Date(item.endsAt).toISOString().slice(0, 10) : '', targetVersion: item.targetVersion, updateChannel: item.updateChannel, deploymentUrl: item.deploymentUrl || '', deployHookUrl: '', provider: item.deployment?.provider || 'CUSTOM', repository: item.deployment?.repository || '', branch: item.deployment?.branch || 'main', environment: item.deployment?.environment || 'production', notes: item.notes || '', renewalMessage: item.renewalMessage || '', contact: { ownerName: item.contact?.ownerName || '', phone: item.contact?.phone || '', email: item.contact?.email || '', billingEmail: item.contact?.billingEmail || '', accountManager: item.contact?.accountManager || '' }, tags: (item.tags || []).join(', '), featureOverrides: [...(item.featureOverrides || [])], disabledFeatures: [...(item.disabledFeatures || [])], limitOverrides: { products: item.limitOverrides?.products ?? '', ordersPerMonth: item.limitOverrides?.ordersPerMonth ?? '' } }; }
function planLimit(plans, plan, key) { return plans.find((item) => item.id === plan)?.limits?.[key] || 0; }
function toggle(values, value) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }
function grantLabel(value) { return ({ TRIAL: 'Trial', MONTHLY: '1 month', YEARLY: '1 year', LIFETIME: 'Lifetime' })[value] || value; }
function accessLabel(item) { return item.billingCycle === 'LIFETIME' ? 'Lifetime' : item.daysRemaining == null ? item.billingCycle : `${item.daysRemaining} days`; }
function relativeDate(value) { if (!value) return 'Never'; const date = new Date(value); const hours = Math.floor((Date.now() - date.getTime()) / 3600000); return hours < 1 ? 'Just now' : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`; }
function formatDate(value, dateOnly = false) { if (!value) return 'Not available'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-IN', dateOnly ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' }); }
function formatCurrency(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }
function durationLabel(seconds) { const value = Number(seconds); if (!Number.isFinite(value)) return 'Not reported'; const days = Math.floor(value / 86400); const hours = Math.floor((value % 86400) / 3600); return days ? `${days}d ${hours}h` : `${hours}h`; }
function humanize(value) { return String(value || '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase()); }
function actionReleaseLabel(value) { return ({ PAUSE: 'Pause release', RESUME: 'Resume release', COMPLETE: 'Complete rollout for', RETIRE: 'Retire release' })[value] || 'Update release'; }
