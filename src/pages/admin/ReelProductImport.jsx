import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Check, FileVideo, GitMerge, MoveRight, Plus, RefreshCcw,
  Scissors, Search, Trash2, Upload, X,
} from 'lucide-react';
import PageHeader from '../../components/admin/PageHeader';
import EmptyState from '../../components/admin/EmptyState';
import Loader from '../../components/admin/Loader';
import StatusBadge from '../../components/admin/StatusBadge';
import { Select, TextInput } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { fetchCategories, fetchSubcategories } from '../../utils/catalogOptions';

const TERMINAL = new Set(['review_required', 'completed', 'failed', 'cancelled']);
const ACCEPTED_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const STATUS_OPTIONS = ['', 'queued', 'processing', 'review_required', 'completed', 'failed', 'cancelled'];

export default function ReelProductImport({ route = '', navigate }) {
  const jobId = useMemo(() => new URLSearchParams(route.split('?')[1] || '').get('jobId'), [route]);
  return jobId ? <ReviewWorkspace jobId={jobId} /> : <ImportWorkspace navigate={navigate} />;
}

function ImportWorkspace({ navigate }) {
  const { notify } = useAuth();
  const inputRef = useRef(null);
  const uploadRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(pagination.page), limit: '12' });
      if (search.trim()) query.set('search', search.trim());
      if (status) query.set('status', status);
      const response = await api.get(`/admin/reel-imports?${query}`);
      const nextItems = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
      setItems(nextItems);
      setPagination((current) => ({ ...current, ...(response?.pagination || {}) }));
    } catch (error) {
      setItems([]);
      notify(error.message, 'error', 'Reel Product Import');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [notify, pagination.page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!items.some((item) => !TERMINAL.has(item.status))) return undefined;
    const timer = window.setInterval(() => load(true), 4000);
    return () => window.clearInterval(timer);
  }, [items, load]);

  const chooseFile = (incoming) => {
    const selected = Array.from(incoming || [])[0];
    if (!selected) return;
    if (!ACCEPTED_TYPES.has(selected.type)) {
      notify('Only MP4, MOV, and WebM videos are supported.', 'error', 'Upload Product Reel');
      return;
    }
    if (selected.size > 250 * 1024 * 1024) {
      notify('The reel must be 250MB or smaller.', 'error', 'Upload Product Reel');
      return;
    }
    setFile(selected);
  };

  const upload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      const uploadResponse = await api.upload(
        '/admin/uploads/videos?folder=reel-imports/original',
        [file],
        {
          fieldName: 'videos',
          onRequest: (request) => {
            uploadRef.current = request;
            setUploadProgress(35);
          },
        },
      );
      const storedVideo = uploadResponse.files?.[0];
      const provider = storedVideo?.provider || uploadResponse.provider;
      if (!storedVideo?.publicId || !storedVideo?.url || !provider || provider === 'local') {
        throw new Error('Video upload did not return a valid storage reference. Please try again.');
      }
      setUploadProgress(80);
      uploadRef.current = null;
      const response = await api.post('/admin/reel-imports', {
        sourceVideo: {
          provider,
          storageKey: storedVideo.publicId,
          url: storedVideo.url,
          originalFilename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
      setUploadProgress(100);
      const job = response.data || response;
      if (response.warning || job.status === 'failed') {
        notify(response.warning || job.error?.safeMessage || 'Reel uploaded, but background processing is not available yet.', 'warning', 'Upload Product Reel');
      } else {
        notify('Reel uploaded. Background processing has started.', 'success', 'Upload Product Reel');
      }
      setFile(null);
      await load(true);
      if (job?._id || job?.id) navigate?.(`/admin/reel-import?jobId=${job._id || job.id}`);
    } catch (error) {
      if (error.name !== 'AbortError') notify(error.message, 'error', 'Upload Product Reel');
    } finally {
      uploadRef.current = null;
      setUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const cancelUpload = () => {
    uploadRef.current?.cancel();
    notify('Upload cancelled.', 'warning', 'Upload Product Reel');
  };

  const cancelJob = async (job) => {
    try {
      await api.post(`/admin/reel-imports/${job._id || job.id}/cancel`, {});
      notify('Processing cancelled.', 'success', 'Reel Product Import');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Reel Product Import');
    }
  };

  const retryJob = async (job) => {
    try {
      await api.post(`/admin/reel-imports/${job._id || job.id}/retry`, {});
      notify('Retry queued.', 'success', 'Reel Product Import');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Reel Product Import');
    }
  };

  const deleteJob = async (job) => {
    if (!window.confirm('Delete this reel import?')) return;
    try {
      await api.delete(`/admin/reel-imports/${job._id || job.id}`);
      notify('Reel import deleted.', 'success', 'Reel Product Import');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Reel Product Import');
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title="Reel Product Import" note="Turn a product reel into review-ready Product Drafts. Nothing is published automatically." />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="admin-card p-4 md:p-6">
          <h2 className="text-lg font-black text-charcoal">Upload Product Reel</h2>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files); }}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            className={`mt-4 grid min-h-56 w-full place-items-center rounded-[22px] border-2 border-dashed p-5 text-center transition ${dragging ? 'border-wine bg-blush' : 'border-wine/30 bg-[#fbf8f4] hover:border-wine'}`}
          >
            <span>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-wine text-white"><Plus className="h-6 w-6" /></span>
              <span className="mt-4 block text-base font-black text-charcoal">Drop a reel here or select a file</span>
              <span className="mt-2 block text-xs font-semibold text-slate-500">MP4, MOV or WebM · up to 180 seconds · maximum 250MB</span>
              <span className="mt-4 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-wine shadow-sm">Select file</span>
            </span>
          </button>
          <input ref={inputRef} type="file" accept=".mp4,.mov,.webm" className="hidden" onChange={(event) => chooseFile(event.target.files)} />
          {file && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#eadfd5] bg-[#fffdfa] p-4">
              <FileVideo className="h-6 w-6 text-wine" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-charcoal">{file.name}</p>
                <p className="text-xs font-semibold text-slate-500">{formatBytes(file.size)}</p>
              </div>
              {!uploading && <button type="button" onClick={() => setFile(null)} aria-label="Remove selected file"><X className="h-5 w-5 text-slate-500" /></button>}
            </div>
          )}
          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs font-black text-slate-500"><span>Uploading video</span><span>{uploadProgress}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-wine transition-all" style={{ width: `${uploadProgress}%` }} /></div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={!file || uploading} onClick={upload} className="admin-btn disabled:opacity-50">
              <Upload className="h-4 w-4" />{uploading ? 'Uploading…' : 'Upload and process'}
            </button>
            {uploading && <button type="button" onClick={cancelUpload} className="h-11 rounded-xl border border-rose-200 px-5 text-sm font-black text-rose">Cancel upload</button>}
          </div>
        </div>

        <aside className="admin-card p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-wine">For better results</p>
          <ul className="mt-4 space-y-3 text-sm font-semibold leading-5 text-slate-600">
            {['Keep each dress visible for 2–4 seconds.', 'Show a clear front view in good lighting.', 'Keep the complete outfit inside the frame.', 'Pause briefly before the next dress.', 'Avoid very fast transitions or multiple dresses together.'].map((tip) => (
              <li key={tip} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-wine" />{tip}</li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-blush p-4 text-xs font-bold leading-5 text-wine">The system prepares possible products and their best images. You verify every draft before publishing.</div>
        </aside>
      </div>

      <div className="admin-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-black text-charcoal">Import history</h2><p className="text-xs font-semibold text-slate-500">{pagination.total || items.length} imports</p></div>
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <label className="flex h-10 min-w-[190px] items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} placeholder="Search reels" className="w-full bg-transparent text-sm outline-none" /></label>
            <Select value={status} onChange={(event) => { setStatus(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} className="h-10">
              {STATUS_OPTIONS.map((option) => <option key={option || 'all'} value={option}>{option ? labelStatus(option) : 'All statuses'}</option>)}
            </Select>
          </div>
        </div>
        <div className="mt-4">
          {loading ? <Loader label="Loading reel imports…" /> : !items.length ? <EmptyState title="No reel imports yet" note="Upload your first product reel above." /> : (
            <div className="grid gap-3">
              {items.map((job) => <HistoryRow key={job._id || job.id} job={job} onCancel={cancelJob} onRetry={retryJob} onDelete={deleteJob} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HistoryRow({ job, onCancel, onRetry, onDelete }) {
  const id = job._id || job.id;
  const progress = Number(job.progress?.percentage || 0);
  return (
    <article className="grid gap-3 rounded-2xl border border-[#eee3da] bg-[#fffdfa] p-4 md:grid-cols-[1fr_180px_auto] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-charcoal">{job.sourceVideo?.originalFilename || 'Product reel'}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(job.createdAt)} · {formatDuration(job.sourceVideo?.durationSeconds)} · {job.statistics?.detectedProducts || 0} products</p>
        {job.status === 'failed' && job.error?.safeMessage ? (
          <p className="mt-1 text-xs font-semibold text-rose-700">{job.error.safeMessage}</p>
        ) : job.progress?.message && !TERMINAL.has(job.status) ? (
          <p className="mt-1 text-xs font-semibold text-slate-500">{job.progress.message}</p>
        ) : null}
      </div>
      <div>
        <div className="flex items-center justify-between gap-2"><StatusBadge value={labelStatus(job.status)} /><span className="text-xs font-black text-slate-500">{progress}%</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-wine" style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <a href={`/admin/reel-import?jobId=${id}`} className="rounded-xl bg-wine px-3 py-2 text-xs font-black text-white">{job.status === 'review_required' || job.status === 'completed' ? 'Open results' : 'View progress'}</a>
        {job.status === 'failed' && <button type="button" onClick={() => onRetry(job)} className="rounded-xl border border-slate-200 p-2" aria-label="Retry"><RefreshCcw className="h-4 w-4" /></button>}
        {['queued', 'processing'].includes(job.status) && <button type="button" onClick={() => onCancel(job)} className="rounded-xl border border-slate-200 p-2" aria-label="Cancel"><X className="h-4 w-4" /></button>}
        {!['processing', 'creating_drafts'].includes(job.status) && <button type="button" onClick={() => onDelete(job)} className="rounded-xl border border-rose-100 p-2 text-rose" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>}
      </div>
    </article>
  );
}

function ReviewWorkspace({ jobId }) {
  const { notify } = useAuth();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [forms, setForms] = useState({});
  const [selected, setSelected] = useState([]);
  const [draftSelected, setDraftSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const jobResponse = await api.get(`/admin/reel-imports/${jobId}`);
      const currentJob = jobResponse.data || jobResponse;
      setJob(currentJob);
      if (['review_required', 'completed'].includes(currentJob.status)) {
        const candidateResponse = await api.get(`/admin/reel-imports/${jobId}/candidates`);
        const nextCandidates = candidateResponse.data || [];
        setCandidates(nextCandidates);
        setDraftSelected((current) => current.length ? current : nextCandidates.filter((item) => !['ignored', 'merged'].includes(item.status)).map((item) => item._id || item.id));
        setForms((current) => {
          const next = { ...current };
          nextCandidates.forEach((candidate) => {
            const id = candidate._id || candidate.id;
            if (!next[id]) next[id] = candidateForm(candidate);
          });
          return next;
        });
      }
    } catch (error) {
      notify(error.message, 'error', 'Reel review');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [jobId, notify]);

  useEffect(() => {
    load();
    fetchCategories(api).then(setCategories).catch(() => setCategories([]));
  }, [load]);

  useEffect(() => {
    if (!job || TERMINAL.has(job.status)) return undefined;
    const timer = window.setInterval(() => load(true), 3500);
    return () => window.clearInterval(timer);
  }, [job, load]);

  const updateForm = (id, field, value) => setForms((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));

  const saveCandidate = async (candidate, quiet = false) => {
    const id = candidate._id || candidate.id;
    const form = forms[id] || candidateForm(candidate);
    const response = await api.patch(`/admin/reel-imports/${jobId}/candidates/${id}`, {
      status: form.status,
      adminOverrides: {
        name: form.name, category: form.category, subCategory: form.subCategory, primaryColor: form.primaryColor,
        pattern: form.pattern, tags: form.tags, price: form.price,
        sizes: form.sizes, stock: form.stock,
      },
      selectedFrameIds: form.selectedFrameIds,
    });
    if (!quiet) notify('Candidate saved.', 'success', 'Reel review');
    return response;
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(candidates.filter((item) => item.status !== 'merged').map((item) => saveCandidate(item, true)));
      notify('Review saved. You can return later.', 'success', 'Reel review');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Reel review');
    } finally {
      setSaving(false);
    }
  };

  const merge = async () => {
    if (selected.length < 2) return notify('Select at least two candidate groups to merge.', 'warning', 'Merge products');
    try {
      await api.post(`/admin/reel-imports/${jobId}/candidates/merge`, { candidateIds: selected });
      setSelected([]);
      notify('Candidate groups merged.', 'success', 'Merge products');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Merge products');
    }
  };

  const split = async (candidate) => {
    const id = candidate._id || candidate.id;
    const value = window.prompt('Split from which video timestamp (seconds)?', String(Math.round((candidate.sourceRange?.startSeconds + candidate.sourceRange?.endSeconds) / 2)));
    if (value === null) return;
    try {
      await api.post(`/admin/reel-imports/${jobId}/candidates/${id}/split`, { fromTimestamp: Number(value) });
      notify('Candidate split into two product groups.', 'success', 'Split product');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Split product');
    }
  };

  const moveFrame = async (candidate, frameId, targetCandidateId) => {
    if (!targetCandidateId) return;
    try {
      await api.post(`/admin/reel-imports/${jobId}/candidates/${candidate._id || candidate.id}/move-frame`, { frameId, targetCandidateId });
      notify('Frame moved to the selected product.', 'success', 'Move frame');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Move frame');
    }
  };

  const approveHighConfidence = async () => {
    const high = candidates.filter((item) => Number(item.confidence?.overall || 0) >= 0.75 && item.status === 'suggested');
    if (!high.length) return notify('No unapproved high-confidence candidates found.', 'info', 'Reel review');
    try {
      await Promise.all(high.map((item) => api.patch(`/admin/reel-imports/${jobId}/candidates/${item._id || item.id}`, { status: 'approved' })));
      notify(`${high.length} high-confidence candidate${high.length > 1 ? 's' : ''} approved.`, 'success', 'Reel review');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Reel review');
    }
  };

  const createDrafts = async () => {
    if (!draftSelected.length || saving) return notify('Select at least one candidate for draft creation.', 'warning', 'Create drafts');
    setSaving(true);
    try {
      await Promise.all(candidates.filter((item) => draftSelected.includes(item._id || item.id)).map((item) => saveCandidate(item, true)));
      const response = await api.post(`/admin/reel-imports/${jobId}/create-drafts`, { candidateIds: draftSelected });
      const count = response.data?.drafts?.length || draftSelected.length;
      notify(`${count} product draft${count > 1 ? 's' : ''} created.`, 'success', 'Create drafts');
      load(true);
    } catch (error) {
      notify(error.message, 'error', 'Create drafts');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading reel import…" />;
  if (!job) return <EmptyState title="Reel import not found" note="Return to import history and choose another job." />;

  return (
    <section className="space-y-5">
      <PageHeader title="Review Reel Products" note={job.sourceVideo?.originalFilename || 'Product reel'}>
        <a href="/admin/reel-import" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-charcoal"><ArrowLeft className="h-4 w-4" />Import history</a>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Status" value={labelStatus(job.status)} />
        <Stat label="Extracted" value={job.statistics?.extractedFrames || 0} />
        <Stat label="Rejected" value={job.statistics?.rejectedFrames || 0} />
        <Stat label="Duplicates" value={job.statistics?.duplicateFrames || 0} />
        <Stat label="Possible products" value={job.statistics?.detectedProducts || 0} />
      </div>

      {!TERMINAL.has(job.status) && (
        <div className="admin-card p-5">
          <div className="flex justify-between text-sm font-black"><span>{job.progress?.currentStep || 'Processing reel'}</span><span>{job.progress?.percentage || 0}%</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-wine transition-all" style={{ width: `${job.progress?.percentage || 0}%` }} /></div>
          <p className="mt-3 text-xs font-semibold text-slate-500">{job.progress?.message}</p>
        </div>
      )}
      {job.status === 'failed' && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{job.error?.safeMessage || 'Processing failed. Return to history to retry.'}</div>}

      {candidates.length > 0 && (
        <>
          <div className="sticky top-[74px] z-20 flex flex-wrap items-center justify-between gap-2 rounded-[20px] border border-[#eadfd5] bg-white/95 p-3 shadow-lg backdrop-blur">
            <p className="text-xs font-black text-slate-500">{draftSelected.length} selected for drafts · {selected.length} selected to merge</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={merge} disabled={selected.length < 2} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black disabled:opacity-40"><GitMerge className="h-4 w-4" />Merge</button>
              <button type="button" onClick={approveHighConfidence} className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-black">Approve high confidence</button>
              <button type="button" onClick={saveAll} disabled={saving} className="h-10 rounded-xl border border-wine px-3 text-xs font-black text-wine">Save for later</button>
              <button type="button" onClick={createDrafts} disabled={saving || !draftSelected.length} className="h-10 rounded-xl bg-wine px-4 text-xs font-black text-white disabled:opacity-50">{saving ? 'Saving…' : 'Create selected drafts'}</button>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {candidates.filter((item) => item.status !== 'merged').map((candidate) => (
              <CandidateCard
                key={candidate._id || candidate.id}
                candidate={candidate}
                candidates={candidates}
                categories={categories}
                form={forms[candidate._id || candidate.id] || candidateForm(candidate)}
                mergeSelected={selected.includes(candidate._id || candidate.id)}
                draftSelected={draftSelected.includes(candidate._id || candidate.id)}
                onMergeSelect={() => toggleId(setSelected, candidate._id || candidate.id)}
                onDraftSelect={() => toggleId(setDraftSelected, candidate._id || candidate.id)}
                onUpdate={(field, value) => updateForm(candidate._id || candidate.id, field, value)}
                onSave={() => saveCandidate(candidate)}
                onSplit={() => split(candidate)}
                onMove={(frameId, targetId) => moveFrame(candidate, frameId, targetId)}
              />
            ))}
          </div>
        </>
      )}
      {TERMINAL.has(job.status) && !candidates.length && job.status !== 'failed' && <EmptyState title="No product candidates found" note="Try a reel with better lighting, slower transitions, and a clear full-product view." />}
    </section>
  );
}

function CandidateCard({ candidate, candidates, categories, form, mergeSelected, draftSelected, onMergeSelect, onDraftSelect, onUpdate, onSave, onSplit, onMove }) {
  const id = candidate._id || candidate.id;
  const confidence = Math.round(Number(candidate.confidence?.overall || 0) * 100);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    fetchSubcategories(api, form.category).then(setSubcategories);
  }, [form.category]);
  return (
    <article className="admin-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h2 className="text-base font-black text-charcoal">Candidate {candidate.groupNumber}</h2><StatusBadge value={labelStatus(candidate.status)} /></div>
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatDuration(candidate.sourceRange?.startSeconds)}–{formatDuration(candidate.sourceRange?.endSeconds)} · {confidence}% confidence</p>
        </div>
        <div className="flex gap-3 text-xs font-black">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={mergeSelected} onChange={onMergeSelect} className="accent-wine" />Merge</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={draftSelected} onChange={onDraftSelect} className="accent-wine" />Draft</label>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(candidate.frames || []).map((frame) => (
          <div key={frame._id || frame.storageKey} className={`overflow-hidden rounded-xl border ${form.selectedFrameIds.includes(String(frame._id)) ? 'border-wine ring-2 ring-wine/10' : 'border-slate-200'}`}>
            <button type="button" onClick={() => onUpdate('selectedFrameIds', toggleValue(form.selectedFrameIds, String(frame._id)))} className="relative block w-full">
              <img src={frame.url} alt={candidate.suggestions?.altText || `Candidate ${candidate.groupNumber}`} className="h-28 w-full object-cover" />
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">{Number(frame.timestampSeconds || 0).toFixed(1)}s</span>
              {form.selectedFrameIds.includes(String(frame._id)) && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-wine text-white"><Check className="h-3 w-3" /></span>}
            </button>
            <MoveFrame frame={frame} sourceId={id} candidates={candidates} onMove={onMove} />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Labeled label="Product name"><TextInput value={form.name} onChange={(event) => onUpdate('name', event.target.value)} placeholder="Please confirm" className="w-full" /></Labeled>
        <Labeled label="Category">
          <Select value={form.category} onChange={(event) => onUpdate('category', event.target.value)} className="w-full">
            <option value="">Please confirm</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </Select>
        </Labeled>
        <Labeled label="Subcategory">
          <Select value={form.subCategory || ''} onChange={(event) => onUpdate('subCategory', event.target.value)} className="w-full">
            <option value="">{subcategories.length ? 'Select subcategory' : 'No subcategories yet'}</option>
            {subcategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </Labeled>
        <Labeled label="Primary colour"><TextInput value={form.primaryColor} onChange={(event) => onUpdate('primaryColor', event.target.value)} placeholder="Please confirm" className="w-full" /></Labeled>
        <Labeled label="Pattern"><TextInput value={form.pattern} onChange={(event) => onUpdate('pattern', event.target.value)} placeholder="Please confirm" className="w-full" /></Labeled>
        <Labeled label="Tags"><TextInput value={form.tags} onChange={(event) => onUpdate('tags', event.target.value)} placeholder="festive, maroon" className="w-full" /></Labeled>
        <Labeled label="Sizes"><TextInput value={form.sizes} onChange={(event) => onUpdate('sizes', event.target.value)} placeholder="S, M, L, XL" className="w-full" /></Labeled>
        <Labeled label="Selling price"><TextInput type="number" min="0" value={form.price} onChange={(event) => onUpdate('price', event.target.value)} placeholder="Enter manually" className="w-full" /></Labeled>
        <Labeled label="Stock"><TextInput type="number" min="0" value={form.stock} onChange={(event) => onUpdate('stock', event.target.value)} placeholder="Enter manually" className="w-full" /></Labeled>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onSave} className="inline-flex h-10 items-center gap-2 rounded-xl bg-wine px-4 text-xs font-black text-white"><Check className="h-4 w-4" />Save candidate</button>
        <button type="button" onClick={onSplit} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black"><Scissors className="h-4 w-4" />Split by timestamp</button>
        <button type="button" onClick={() => onUpdate('status', form.status === 'ignored' ? 'suggested' : 'ignored')} className="h-10 rounded-xl border border-rose-100 px-4 text-xs font-black text-rose">{form.status === 'ignored' ? 'Restore' : 'Ignore product'}</button>
      </div>
    </article>
  );
}

function MoveFrame({ frame, sourceId, candidates, onMove }) {
  const [target, setTarget] = useState('');
  return (
    <div className="flex items-center gap-1 p-1">
      <select value={target} onChange={(event) => setTarget(event.target.value)} aria-label="Move frame target" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1 py-1 text-[9px] font-bold">
        <option value="">Move to…</option>
        {candidates.filter((item) => (item._id || item.id) !== sourceId && !['merged', 'draft_created'].includes(item.status)).map((item) => <option key={item._id || item.id} value={item._id || item.id}>Candidate {item.groupNumber}</option>)}
      </select>
      <button type="button" disabled={!target} onClick={() => { onMove(frame._id, target); setTarget(''); }} className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 disabled:opacity-30" aria-label="Move frame"><MoveRight className="h-3 w-3" /></button>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-2xl border border-[#eadfd5] bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-wine/60">{label}</p><p className="mt-2 truncate text-lg font-black text-charcoal">{value}</p></div>;
}

function Labeled({ label, children }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-slate-600">{label}</span>{children}</label>;
}

function candidateForm(candidate) {
  const overrides = candidate.adminOverrides || {};
  const suggestions = candidate.suggestions || {};
  return {
    name: overrides.name || suggestions.name || '',
    category: overrides.category || '',
    subCategory: overrides.subCategory || suggestions.subcategory || suggestions.subCategory || '',
    primaryColor: overrides.primaryColor || suggestions.primaryColor || '',
    pattern: overrides.pattern || suggestions.pattern || '',
    tags: Array.isArray(overrides.tags || suggestions.tags) ? (overrides.tags || suggestions.tags).join(', ') : overrides.tags || '',
    sizes: Array.isArray(overrides.sizes) ? overrides.sizes.join(', ') : overrides.sizes || '',
    price: overrides.price || overrides.sellingPrice || '',
    stock: overrides.stock ?? '',
    status: candidate.status || 'suggested',
    selectedFrameIds: (candidate.frames || []).filter((frame) => frame.selected).map((frame) => String(frame._id)),
  };
}

function toggleId(setter, id) {
  setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function labelStatus(value = '') {
  return String(value).split('_').map((part) => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

function formatDuration(value) {
  const seconds = Math.max(0, Number(value || 0));
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
