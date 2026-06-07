import { products } from '../../data/seedAdmin';
import { AdminPage, AdminTable } from './Products';
export default function Reviews() {
  return <AdminPage title="Reviews"><AdminTable heads={['Product', 'Customer', 'Rating', 'Comment', 'Status', 'Actions']} rows={products.slice(0, 8).map((p, i) => [p.name, i % 2 ? 'Anaya' : 'Riya', p.rating, 'Great quality and fit.', 'Visible', 'Hide / Delete'])} /></AdminPage>;
}
