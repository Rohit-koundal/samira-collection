import { customers } from '../../data/seedAdmin';
import { AdminPage, AdminTable } from './Products';
export default function Customers() {
  return <AdminPage title="Customers"><AdminTable heads={['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Status', 'Actions']} rows={customers.map((c) => [c.name, c.email, c.phone, c.totalOrders, `Rs. ${c.totalSpent}`, c.status, 'View / Block'])} /></AdminPage>;
}
