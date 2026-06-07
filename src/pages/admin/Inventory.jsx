import { products } from '../../data/seedAdmin';
import { AdminPage, AdminTable } from './Products';
export default function Inventory() {
  return <AdminPage title="Inventory"><AdminTable heads={['SKU', 'Product', 'Stock', 'Low Stock', 'Actions']} rows={products.slice(0, 12).map((p) => [p.sku, p.name, p.stock, p.stock < 5 ? 'Yes' : 'No', 'Update Stock'])} /></AdminPage>;
}
