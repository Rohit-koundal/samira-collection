import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductDrafts from './ProductDrafts';
import api from '../../services/api';

jest.mock('../../services/api', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('../../hooks/useDesktopFeedback', () => () => ({ notify: () => false }));
jest.mock('../../utils/catalogOptions', () => ({ fetchCategories: async () => [{ _id: 'cat', name: 'Sarees' }], fetchSubcategories: async () => [] }));
let mockQuery, mockSave, mockDelete, mockPublish, mockUpload;
jest.mock('../../store/apiSlice', () => ({
  useGetProductDraftsQuery: () => mockQuery,
  useUpdateProductDraftMutation: () => [mockSave, { isLoading: false }],
  useDeleteProductDraftMutation: () => [mockDelete, { isLoading: false }],
  usePublishSelectedDraftsMutation: () => [mockPublish, { isLoading: false }],
  useBulkUploadProductDraftsMutation: () => [mockUpload, { isLoading: false }],
}));
const draft = { _id: 'draft-a', name: 'Rose saree', category: 'cat', price: 1000, sellingPrice: 1000, stock: 0, sizes: [], colors: [], images: [{ url: '/uploads/a.jpg' }], sizingMode: 'free-size' };

test('Smart Fill previews before applying, maps draft selling price and preserves it when saving', async () => {
  mockQuery.data.data = [{ ...draft, name: '', sellingPrice: 0, price: 0 }];
  api.post.mockResolvedValue({ mode: 'notes', suggestion: { name: 'Wine saree', price: 899, description: 'Wine saree with a floral border.' }, fieldSources: { price: { source: 'caption', quote: 'Price: 899' } } });
  render(<ProductDrafts />);
  await screen.findByText('No size selection');
  expect(api.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Smart fill/ }));
  fireEvent.change(screen.getByLabelText('Supplier notes or product details'), { target: { value: 'Name: Wine saree\nPrice: 899' } });
  fireEvent.click(screen.getByRole('button', { name: 'Suggest details' }));
  await screen.findByText('Review suggestions');
  expect(screen.getByPlaceholderText('Product name')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: /Apply \d+ selected details/ }));
  expect(screen.getByPlaceholderText('Selling price')).toHaveValue(899);
  expect(mockSave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
  await waitFor(() => expect(mockSave).toHaveBeenCalledWith({ id: 'draft-a', body: expect.objectContaining({ name: 'Wine saree', price: 899, sellingPrice: 899, description: 'Wine saree with a floral border.' }) }));
});

test('Smart Fill protects typing during a slow response and undo preserves later edits', async () => {
  mockQuery.data.data = [{ ...draft, name: '', description: '' }];
  let finish;
  api.post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<ProductDrafts />); await screen.findByText('No size selection');
  fireEvent.click(screen.getByRole('button', { name: /Smart fill/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Suggest details' }));
  fireEvent.change(screen.getByPlaceholderText('Product name'), { target: { value: 'My own title' } });
  await act(async () => finish({ mode: 'ai', suggestion: { name: 'Suggested title', description: 'An embroidered saree.' }, fieldSources: {} }));
  fireEvent.click(screen.getByRole('button', { name: /Apply 1 selected detail/ }));
  expect(screen.getByPlaceholderText('Product name')).toHaveValue('My own title');
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'My revised description' } });
  fireEvent.click(screen.getByRole('button', { name: 'Undo last fill' }));
  expect(screen.getByLabelText('Description')).toHaveValue('My revised description');
  expect(screen.getByPlaceholderText('Product name')).toHaveValue('My own title');
});

test('changed notes invalidate suggestions, while failed analysis preserves the draft', async () => {
  mockQuery.data.data = [{ ...draft, description: '' }];
  api.post.mockResolvedValueOnce({ mode: 'ai', suggestion: { description: 'A floral saree.' } }).mockRejectedValueOnce(new Error('Analysis unavailable'));
  render(<ProductDrafts />); await screen.findByText('No size selection');
  fireEvent.click(screen.getByRole('button', { name: /Smart fill/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Suggest details' }));
  await screen.findByText('Review suggestions');
  fireEvent.change(screen.getByLabelText('Supplier notes or product details'), { target: { value: 'Another product' } });
  expect(screen.getByRole('button', { name: /Apply.*selected details/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Suggest details' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Analysis unavailable');
  expect(screen.getByPlaceholderText('Product name')).toHaveValue('Rose saree');
  expect(screen.getByLabelText('Description')).toHaveValue('');
});
beforeEach(() => {
  jest.clearAllMocks(); jest.spyOn(window, 'confirm').mockReturnValue(true);
  api.get.mockResolvedValue({ features: { sizing: false }, attributes: [] });
  mockQuery = { data: { data: [draft, { ...draft, _id: 'draft-b', name: 'Green saree' }] }, isLoading: false, refetch: jest.fn() };
  mockSave = jest.fn(() => ({ unwrap: async () => ({ success: true }) }));
  mockDelete = jest.fn(() => ({ unwrap: async () => ({ success: true }) }));
  mockPublish = jest.fn(() => ({ unwrap: async () => ({ success: true }) }));
  mockUpload = jest.fn(() => ({ unwrap: async () => ({ success: true }) }));
});
afterEach(() => jest.restoreAllMocks());

test('publish saves the selected card edits first and leaves unselected edits untouched', async () => {
  render(<ProductDrafts />);
  await screen.findAllByText('No size selection');
  fireEvent.change(screen.getAllByPlaceholderText('Product name')[0], { target: { value: 'Reviewed rose saree' } });
  fireEvent.change(screen.getAllByPlaceholderText('Stock')[0], { target: { value: '12' } });
  fireEvent.change(screen.getAllByPlaceholderText('Product name')[1], { target: { value: 'Keep green draft' } });
  fireEvent.click(screen.getAllByRole('checkbox', { name: 'Draft' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Publish Selected' }));
  await waitFor(() => expect(mockPublish).toHaveBeenCalledWith({ ids: ['draft-a'] }));
  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(mockSave).toHaveBeenCalledWith({ id: 'draft-a', body: expect.objectContaining({ name: 'Reviewed rose saree', stock: 12 }) });
  expect(mockSave.mock.invocationCallOrder[0]).toBeLessThan(mockPublish.mock.invocationCallOrder[0]);
  expect(screen.getByDisplayValue('Keep green draft')).toBeInTheDocument();
});

test('a failed pre-publish save stops publication and shows the actual API explanation', async () => {
  mockSave.mockImplementation(() => ({ unwrap: async () => { throw Object.assign(new Error('Validation failed'), { data: { message: 'Stock must be a whole number' } }); } }));
  render(<ProductDrafts />);
  await screen.findAllByText('No size selection');
  fireEvent.change(screen.getAllByPlaceholderText('Stock')[0], { target: { value: '1.5' } });
  fireEvent.click(screen.getAllByRole('checkbox', { name: 'Draft' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Publish Selected' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Stock must be a whole number');
  expect(mockPublish).not.toHaveBeenCalled();
  expect(screen.getAllByPlaceholderText('Stock')[0]).toHaveValue(1.5);
});

test('background refetch preserves locally edited draft cards', async () => {
  const view = render(<ProductDrafts />);
  fireEvent.change(screen.getAllByPlaceholderText('Product name')[1], { target: { value: 'Unsaved local name' } });
  mockQuery = { ...mockQuery, isFetching: true, data: { data: mockQuery.data.data.map(item => ({ ...item })) } };
  view.rerender(<ProductDrafts />);
  expect(screen.getByDisplayValue('Unsaved local name')).toBeInTheDocument();
  await act(() => Promise.resolve());
  expect(screen.getByDisplayValue('Unsaved local name')).toBeInTheDocument();
});

test('load errors show retry and delete errors leave the draft available', async () => {
  mockQuery = { ...mockQuery, error: { data: { message: 'Draft database unavailable' } } };
  mockDelete.mockImplementation(() => ({ unwrap: async () => { throw Object.assign(new Error('Delete failed'), { data: { message: 'Delete was not saved' } }); } }));
  render(<ProductDrafts />);
  expect(screen.getByRole('alert')).toHaveTextContent('Draft database unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading drafts' }));
  expect(mockQuery.refetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getAllByRole('button', { name: 'Delete draft' })[0]);
  expect(await screen.findByRole('status')).toHaveTextContent('Delete was not saved');
  expect(screen.getByDisplayValue('Rose saree')).toBeInTheDocument();
});
