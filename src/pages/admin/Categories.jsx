import { useEffect, useState } from 'react';
import CategoryForm from '../../components/admin/CategoryForm';
import { AdminPage, AdminTable } from './Products';
import api from '../../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const load = () => api.get('/admin/categories?admin=true').then(setCategories).catch((error) => setMessage(error.message));
  useEffect(() => {
    load();
  }, []);

  const remove = async (category) => {
    await api.delete(`/admin/categories/${category._id}`);
    load();
  };

  return (
    <AdminPage title="Categories">
      <CategoryForm onSaved={load} />
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-wine">{message}</p>}
      <AdminTable heads={['Name', 'Slug', 'Products', 'Active', 'Display Order', 'Actions']} rows={categories.map((category) => [
        category.name,
        category.slug,
        '-',
        category.isActive ? 'Yes' : 'No',
        category.displayOrder,
        <button onClick={() => remove(category)} className="font-black text-rose">Delete</button>,
      ])} />
    </AdminPage>
  );
}
