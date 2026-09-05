import { parseProductKey, productHref } from './routing';

describe('product routes', () => {
  const id = '6a33b378573544bac1ccd9b1';

  test('keeps a readable slug and includes the stable product id', () => {
    expect(productHref({ _id: id, slug: ' Royal Silk Saree ' }))
      .toBe(`/product/Royal%20Silk%20Saree?id=${id}`);
  });

  test('builds store product links with the same stable lookup id', () => {
    expect(productHref({ _id: id, slug: 'royal-silk-saree' }, 'samira-collection'))
      .toBe(`/store/samira-collection/products/royal-silk-saree?id=${id}`);
  });

  test('supports slug-only and missing product records safely', () => {
    expect(productHref({ slug: 'royal-silk-saree' })).toBe('/product/royal-silk-saree');
    expect(productHref({})).toBe('/products');
  });

  test.each([
    [`/product/royal-silk-saree?id=${id}`, id],
    ['/product/royal-silk-saree', 'royal-silk-saree'],
    ['/products/royal-silk-saree', 'royal-silk-saree'],
    ['/store/samira-collection/products/royal-silk-saree', 'royal-silk-saree'],
    ['/store/samira-collection/product/royal-silk-saree', 'royal-silk-saree'],
  ])('parses %s', (route, expected) => {
    expect(parseProductKey(route)).toBe(expected);
  });

  test('does not crash on malformed encoded route text', () => {
    expect(parseProductKey('/product/broken%')).toBe('broken%');
  });
});
