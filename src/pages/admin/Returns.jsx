import { AdminPage, AdminTable } from './Products';
export default function Returns() {
  const rows = ['Size issue', 'Product damaged', 'Wrong product received', 'Quality issue'].map((reason, i) => [`RET-${1000 + i}`, i % 2 ? 'Exchange' : 'Return', reason, ['Requested', 'Approved', 'Pickup Scheduled', 'Refunded'][i], 'Approve / Reject / Update']);
  return <AdminPage title="Returns / Exchange"><AdminTable heads={['Request ID', 'Type', 'Reason', 'Status', 'Actions']} rows={rows} /></AdminPage>;
}
