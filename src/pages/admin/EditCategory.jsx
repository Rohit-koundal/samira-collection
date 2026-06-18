import CategoryForm from '../../components/admin/CategoryForm';
import PageHeader from '../../components/admin/PageHeader';

export default function EditCategory({ route = '' }) {
  const categoryId = new URLSearchParams(route.split('?')[1] || '').get('id');

  return (
    <section className="space-y-5">
      <PageHeader title="Edit Category" note="Update the category name, image, visibility and ordering." />
      <CategoryForm mode="Update" categoryId={categoryId} />
    </section>
  );
}
