import { useEffect, useState } from 'react';
import BannerForm from '../../components/admin/BannerForm';
import { AdminPage, AdminTable } from './Products';
import api from '../../services/api';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [message, setMessage] = useState('');
  const load = () => api.get('/admin/banners?admin=true').then(setBanners).catch((error) => setMessage(error.message));
  useEffect(load, []);

  const remove = async (banner) => {
    await api.delete(`/admin/banners/${banner._id}`);
    load();
  };

  return (
    <AdminPage title="Banners">
      <BannerForm onSaved={load} />
      {message && <p className="rounded-xl bg-rose/10 p-3 text-sm font-bold text-wine">{message}</p>}
      <AdminTable heads={['Title', 'Subtitle', 'Type', 'Active', 'Order', 'Actions']} rows={banners.map((banner) => [
        banner.title,
        banner.subtitle,
        banner.type,
        banner.isActive ? 'Yes' : 'No',
        banner.displayOrder,
        <button onClick={() => remove(banner)} className="font-black text-rose">Delete</button>,
      ])} />
    </AdminPage>
  );
}
