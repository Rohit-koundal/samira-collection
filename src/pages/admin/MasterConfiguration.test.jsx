import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MasterConfiguration from './MasterConfiguration';
import api from '../../services/api';
import { BEFORE_ROUTE_CHANGE_EVENT } from '../../utils/routing';
jest.mock('../../services/api', () => ({ get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() }));
const structure = { industry: 'fashion', attributes: [{ key: 'material', label: 'Material', unit: '', required: false }], features: { sizing: true, specifications: true }, clientPermissions: { content: true, payments: true } };
const workspace = (locked = true) => ({
  configuration: { revision: 2, locked, structure, history: [] }, presets: [], admins: [],
  builtins: [{ id: 'electronics', name: 'Electronics', industry: 'electronics', attributes: [{ key: 'ram', label: 'RAM', unit: 'GB', required: false }], features: { sizing: false, specifications: true } }],
});
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(window, 'confirm').mockReturnValue(true); api.get.mockResolvedValue(workspace()); });
afterEach(() => { jest.restoreAllMocks(); });

test('locked store cannot change industry, edit attributes or import a structure', async () => {
  render(<MasterConfiguration />);
  expect(await screen.findByText('Configuration locked')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Electronics/ })).toBeDisabled();
  expect(screen.getByLabelText('Field key')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Import structure' })).toBeDisabled();
  expect(api.put).not.toHaveBeenCalled();
});

test('unlock explicitly sends current revision and enables the editor', async () => {
  api.put.mockResolvedValue(workspace(false).configuration);
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Unlock configuration' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/master/configuration', { revision: 2, locked: false }));
  expect(await screen.findByText('Owner editing enabled')).toBeInTheDocument();
  expect(screen.getByLabelText('Field key')).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Grant client admin access' })).toBeDisabled();
});

test('preset selection only changes local draft until explicitly saved', async () => {
  api.get.mockResolvedValue(workspace(false));
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: /Electronics/ }));
  expect(screen.getByLabelText('Customer-facing label')).toHaveValue('RAM');
  expect(api.put).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Save structure' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Lock for handover' })).toBeDisabled();
});

test('conflict retains local edits and prevents accidental navigation', async () => {
  api.get.mockResolvedValue(workspace(false));
  api.put.mockRejectedValue(new Error('Configuration changed in another session. Reload before continuing.'));
  render(<MasterConfiguration />);
  fireEvent.change(await screen.findByLabelText('Customer-facing label'), { target: { value: 'Fabric composition' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save structure' }));
  expect(await screen.findByText(/Configuration changed in another session/)).toBeInTheDocument();
  expect(screen.getByLabelText('Customer-facing label')).toHaveValue('Fabric composition');
  window.confirm.mockReturnValue(false);
  const event = new CustomEvent(BEFORE_ROUTE_CHANGE_EVENT, { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});

test('network error shows retry without creating a configuration', async () => {
  api.get.mockRejectedValueOnce(new Error('Network unavailable'));
  render(<MasterConfiguration />);
  expect(await screen.findByText('Network unavailable')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('Configuration locked')).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});
