import { Card, CardContent, CardTitle } from '../ui';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, navigate, className = '', gridClassName = '' }) {
  if (!products.length) {
    return (
      <Card className={className ? `text-center ${className}` : 'text-center'}>
        <CardContent className="p-6 md:p-10">
          <CardTitle className="text-xl">No products found</CardTitle>
          <p className="body-text mt-2 text-slate-500">Try changing filters or search terms.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 ${gridClassName}`}>
      {products.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
    </div>
  );
}
