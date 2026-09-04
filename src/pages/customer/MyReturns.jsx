import { useEffect, useState } from 'react';
import { Button, Card, CardContent } from '../../components/ui';
import api from '../../services/api';

export default function MyReturns({ navigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/returns/my-requests')
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  return (
    <section className="container-page py-6 md:py-10">
      <h1 className="page-title md:text-3xl">Returns & exchanges</h1>
      <p className="body-text mt-2 text-slate-500">Track requests you have submitted after delivery.</p>
      {loading && <Card className="mt-5"><CardContent className="p-6 text-center">Loading requests...</CardContent></Card>}
      {error && <Card className="mt-5"><CardContent className="p-6 text-center text-rose"><p>{error}</p><Button className="mt-4" onClick={() => setReloadKey((value) => value + 1)}>Try again</Button></CardContent></Card>}
      {!loading && !requests.length && (
        <Card className="mt-5">
          <CardContent className="p-6 text-center">
            <p className="font-black">No return requests yet.</p>
            <Button className="mt-4" onClick={() => navigate('/orders')}>View orders</Button>
          </CardContent>
        </Card>
      )}
      <div className="mt-5 space-y-3">
        {requests.map((item) => (
          <Card key={item._id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{item.product?.name || 'Product'}</p>
                  <p className="small-text mt-1 text-slate-500">{item.type} · {item.reason}</p>
                </div>
                <span className="rounded-full bg-wine/10 px-3 py-1 text-xs font-bold uppercase text-wine">{item.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
