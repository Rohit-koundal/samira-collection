import CategoryForm from '../../components/admin/CategoryForm';
import { AdminPage, AdminTable } from './Products';
import { categories } from '../../data/seedAdmin';
export default function Categories() {
  return <AdminPage title="Categories"><CategoryForm /><AdminTable heads={['Name', 'Slug', 'Products', 'Active', 'Display Order', 'Actions']} rows={categories.map((c, i) => [c.name, c.id, c.count, 'Yes', i + 1, 'Edit / Delete'])} /></AdminPage>;
}
