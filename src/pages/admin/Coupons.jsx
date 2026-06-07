import CouponForm from '../../components/admin/CouponForm';
import { coupons } from '../../data/seedAdmin';
import { AdminPage, AdminTable } from './Products';
export default function Coupons() {
  return <AdminPage title="Coupons"><CouponForm /><AdminTable heads={['Code', 'Type', 'Value', 'Min Order', 'Max Discount', 'Active', 'Actions']} rows={coupons.map((c) => [c.code, c.type, c.discountValue, c.minOrderAmount, c.maxDiscountAmount, c.isActive ? 'Yes' : 'No', 'Edit / Delete'])} /></AdminPage>;
}
