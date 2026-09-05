import {
  buildSizeChartPayload,
  convertMeasurement,
  getSelectableSizes,
  getSizeChartColumns,
  getSizeChartValidation,
  inferSizeChartProfile,
} from './productSizing';

describe('category-aware product sizing', () => {
  test('treats sarees as one-size products even when legacy sizes exist', () => {
    const saree = { name: 'Royal Silk Saree', category: 'Sarees', sizes: ['S', 'M', 'XL'] };
    expect(inferSizeChartProfile(saree)).toBe('free-size');
    expect(getSelectableSizes(saree)).toEqual([]);
    expect(getSizeChartColumns(saree)).toEqual([]);
  });

  test('uses the requested measurement columns for kurta sets', () => {
    const columns = getSizeChartColumns({ category: 'Ethnic Sets', subCategory: 'Kurta Set', sizes: ['S'] });
    expect(columns.map((column) => column.key)).toEqual([
      'bust', 'chest', 'frontLength', 'bottomLength', 'waist', 'sleeveLength', 'hips', 'acrossShoulder', 'outseamLength', 'inseamLength',
    ]);
  });

  test('uses dress measurements without unrelated bottom fields', () => {
    const columns = getSizeChartColumns({ category: 'Dresses', sizes: ['S'] });
    expect(columns.map((column) => column.key)).toEqual(['acrossShoulder', 'sleeveLength', 'bust', 'waist', 'frontLength', 'hips']);
  });

  test('requires every configured measurement and builds a numeric API payload', () => {
    const product = {
      category: 'Dresses',
      sizes: ['S'],
      sizeChart: {
        unit: 'in',
        rows: [{ size: 'S', acrossShoulder: '14', sleeveLength: '18', bust: '36', waist: '30', frontLength: '51', hips: '38' }],
      },
    };
    expect(getSizeChartValidation(product)).toEqual({ valid: true, missing: [] });
    expect(buildSizeChartPayload(product).rows[0].bust).toBe(36);
  });

  test('converts inches and centimetres for the customer unit toggle', () => {
    expect(convertMeasurement(10, 'in', 'cm')).toBe(25.4);
    expect(convertMeasurement(25.4, 'cm', 'in')).toBe(10);
  });
});
