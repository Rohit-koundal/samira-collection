import BannerForm from '../../components/admin/BannerForm';
import { banners } from '../../data/seedAdmin';
import { AdminPage, AdminTable } from './Products';
export default function Banners() {
  return <AdminPage title="Banners"><BannerForm /><AdminTable heads={['Title', 'Subtitle', 'Type', 'Active', 'Order', 'Actions']} rows={banners.map((b, i) => [b.title, b.subtitle, b.type, b.isActive ? 'Yes' : 'No', i + 1, 'Edit / Delete'])} /></AdminPage>;
}
