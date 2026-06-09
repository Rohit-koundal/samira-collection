import ProductForm from '../../components/admin/ProductForm';
import PageHeader from '../../components/admin/PageHeader';
export default function AddProduct() {
  return <section className="space-y-5"><PageHeader title="Add Product" note="Create a MongoDB-backed product for the storefront." /><ProductForm mode="Add" /></section>;
}
