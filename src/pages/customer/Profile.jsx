import { Badge, Button, Card, CardContent } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, logout, switchMode } = useAuth();
  return (
    <section className="container-page py-6 md:py-8">
      <Card>
        <CardContent className="p-5 md:p-7">
          <h1 className="page-title md:text-3xl">My Profile</h1>
          <p className="body-text mt-3 text-slate-600">{user?.name} | {user?.phone || user?.email}</p>
          <Badge className="mt-3">{user?.activeMode || 'customer'} Mode</Badge>
          <div className="mt-6 grid gap-3 md:grid-cols-3 md:gap-4">
            {['Addresses', 'Orders', 'Wishlist'].map((item) => <div key={item} className="label-text rounded-xl bg-[#f8f2ec] p-4 text-charcoal md:rounded-2xl md:p-5">{item}</div>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {user?.role === 'admin' && user?.activeMode !== 'admin' && <Button onClick={() => switchMode('admin')}>Switch to Admin</Button>}
            <Button onClick={logout} variant="secondary" className="bg-charcoal text-white hover:bg-charcoal/90">Logout</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
