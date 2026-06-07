import OrderTable from '../../components/admin/OrderTable';
import { orders } from '../../data/seedAdmin';
export default function Orders() {
  return <section className="space-y-5"><h1 className="text-3xl font-black">Orders</h1><OrderTable orders={orders} /></section>;
}
