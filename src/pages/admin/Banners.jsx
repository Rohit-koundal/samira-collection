import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Filter, Image as ImageIcon, PauseCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import BannerForm from '../../components/admin/BannerForm';
import DataTable from '../../components/admin/DataTable';
import PageHeader from '../../components/admin/PageHeader';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import StatusBadge from '../../components/admin/StatusBadge';
import { Select } from '../../components/ui/Field';
import api from '../../services/api';
import { normalizeImageUrl } from '../../services/normalize';

const statusOptions = ['', 'active', 'inactive'];
const positionOptions = ['', 'Home - Top', 'Home - Middle', 'Home - Bottom', 'Cart - Bottom', 'Category - Featured', 'Offer Strip'];

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const loadSequence = useRef(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [position, setPosition] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const loadBanners = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true); setLoadError('');
    try {
      const data = await api.get('/admin/banners?admin=true');
      if (sequence !== loadSequence.current) return;
      if (!Array.isArray(data) || data.some(item => !item?._id)) throw new Error('Unable to read banners. Please try again.');
      setBanners(data);
      setMessage('');
    } catch (error) {
      if (sequence === loadSequence.current) setLoadError(error.message);
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
    return () => { loadSequence.current += 1; };
  }, [loadBanners]);

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || [banner.title, banner.subtitle, banner.link, banner.position]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
      const matchesStatus = !status || (status === 'active' ? banner.isActive : !banner.isActive);
      const matchesPosition = !position || banner.position === position;
      return matchesSearch && matchesStatus && matchesPosition;
    });
  }, [banners, position, search, status]);

  const stats = useMemo(() => {
    const active = banners.filter((banner) => banner.isActive).length;
    const inactive = banners.length - active;
    const views = banners.reduce((sum, banner) => sum + Number(banner.views || 0), 0);
    return { total: banners.length, active, inactive, views };
  }, [banners]);

  const openCreateForm = () => {
    setEditingBanner(null);
    setMessage('');
    setShowForm(true);
  };

  const openEditForm = (banner) => {
    setEditingBanner(banner);
    setMessage('');
    setShowForm(true);
  };

  const closeForm = ({ clearMessage = true } = {}) => {
    setEditingBanner(null);
    setShowForm(false);
    if (clearMessage) setMessage('');
  };

  const saveBanner = async (payload) => {
    setSaving(true);
    setMessage('');
    try {
      if (editingBanner?._id) {
        await api.put(`/admin/banners/${editingBanner._id}`, payload);
      } else {
        await api.post('/admin/banners', payload);
      }
      closeForm({ clearMessage: false });
      await loadBanners();
      setMessage(editingBanner?._id ? 'Banner updated successfully.' : 'Banner created successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async (banner) => {
    const confirmed = window.confirm(`Delete "${banner.title}" banner?`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/banners/${banner._id}`);
      setMessage('Banner deleted successfully.');
      await loadBanners();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader
        title="Manage Banners"
        note="Create, update, and manage website banners."
      >
        <button type="button" onClick={openCreateForm} className="admin-btn">
          <Plus className="h-4 w-4" />
          Add New Banner
        </button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ImageIcon} label="Total Banners" value={stats.total} tint="bg-[#fff6f1] text-[#a9513d]" />
        <StatCard icon={Eye} label="Active Banners" value={stats.active} tint="bg-[#eefaf1] text-[#208b45]" />
        <StatCard icon={PauseCircle} label="Inactive Banners" value={stats.inactive} tint="bg-[#fff7ec] text-[#f08a24]" />
        <StatCard icon={Eye} label="Total Views" value={formatNumber(stats.views)} tint="bg-[#f5f0ff] text-[#7c51d9]" />
      </div>

      {showForm && (
        <BannerForm
          initialValues={editingBanner}
          saving={saving}
          message={message}
          onSubmit={saveBanner}
          onCancel={closeForm}
        />
      )}

      <SearchFilterBar search={search} onSearch={setSearch} placeholder="Search banners by title">
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All Status</option>
          {statusOptions.filter(Boolean).map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
        </Select>
        <Select value={position} onChange={(event) => setPosition(event.target.value)}>
          <option value="">All Positions</option>
          {positionOptions.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <button
          type="button"
          onClick={() => { setSearch(''); setStatus(''); setPosition(''); }}
          disabled={!search && !status && !position}
          className="admin-btn-ghost"
        >
          <Filter className="h-4 w-4" />
          Reset
        </button>
      </SearchFilterBar>

      {message && !showForm && <p className="rounded-2xl bg-[#fdf4f6] px-4 py-3 text-sm font-bold text-wine">{message}</p>}

      <DataTable
        loading={loading}
        error={loadError} onRetry={loadBanners}
        emptyTitle="No banners found"
        emptyNote="Try adjusting filters or add a new banner."
        minWidth={1040}
        heads={['#', 'Banner', 'Title', 'Position', 'Status', 'Link', 'Order', 'Views', 'Actions']}
        rows={filteredBanners.map((banner, index) => (
          <tr key={banner._id || banner.id || index}>
            <td>{index + 1}</td>
            <td>
              <div className="h-[56px] w-[92px] overflow-hidden rounded-xl bg-[#f7eee7]">
                {banner.image ? (
                  <img src={normalizeImageUrl(banner.image)} alt={banner.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-[0.08em] text-wine">Samira</div>
                )}
              </div>
            </td>
            <td>
              <p className="text-sm font-black text-charcoal">{banner.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{banner.subtitle || 'No subtitle added'}</p>
            </td>
            <td><span className="inline-flex rounded-full bg-[#f5edff] px-3 py-1 text-[11px] font-bold text-[#6f50bf]">{banner.position || 'Home - Top'}</span></td>
            <td><StatusBadge value={banner.isActive ? 'Active' : 'Inactive'} /></td>
            <td className="text-sm font-semibold text-slate-600">{banner.link || '-'}</td>
            <td>{banner.displayOrder ?? 0}</td>
            <td>{formatNumber(Number(banner.views || 0))}</td>
            <td>
              <div className="flex gap-2 md:justify-end">
                <button type="button" onClick={() => openEditForm(banner)} className="admin-catalog-action" aria-label={`Edit ${banner.title}`} title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => removeBanner(banner)} className="admin-catalog-action is-danger" aria-label={`Delete ${banner.title}`} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      />
    </section>
  );
}

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="admin-card p-4 md:p-5">
      <div className="flex items-center gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-black text-charcoal">{value}</p>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function capitalize(value) {
  return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
}
