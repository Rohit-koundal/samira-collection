import { useCallback, useEffect, useState } from 'react';
import CategoryForm from '../../components/admin/CategoryForm';
import StatusBadge from '../../components/admin/StatusBadge';
import { AdminPage, AdminTable } from './Products';
import api from '../../services/api';
import { asCatalogList } from '../../utils/catalogOptions';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try { setCategories(asCatalogList(await api.get('/admin/categories?admin=true'))); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const remove = async (category) => {
    if (deleting) return;
    setDeleting(category._id);
    try {
      await api.delete(`/admin/categories/${category._id}`);
      setCategories((current) => current.filter((item) => item._id !== category._id));
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally { setDeleting(''); }
  };

  return (
    <AdminPage title="Categories">
      <CategoryForm onSaved={load} />
      {message && <p role="alert" className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-wine">{message} <button type="button" className="admin-btn-ghost" onClick={load}>Retry categories</button></p>}
      {loading ? <p role="status">Loading categories…</p> : <AdminTable title="Categories" heads={['Name', 'Slug', 'Active', 'Display Order', 'Actions']} rows={categories.map((category) => [
        category.name,
        category.slug,
        <StatusBadge value={category.isActive ? 'Active' : 'Inactive'} />,
        category.displayOrder,
        <div className="flex items-center gap-3">
          <a href={`/admin/categories/edit?id=${category._id}`} className="admin-table-action-link">Edit</a>
          <button disabled={Boolean(deleting)} onClick={() => remove(category)} className="admin-table-action-link is-danger">{deleting === category._id ? 'Deleting…' : 'Delete'}</button>
        </div>,
      ])} />}
    </AdminPage>
  );
}
