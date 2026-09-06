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

test('private presets save a copy and failed deletion leaves both active structure and preset intact', async () => {
  api.get.mockResolvedValue(workspace(false));
  api.post.mockResolvedValue({ _id: 'private', name: 'My fashion preset', structure });
  api.delete.mockRejectedValueOnce(new Error('Preset deletion failed')).mockResolvedValueOnce({});
  render(<MasterConfiguration />);
  fireEvent.change(await screen.findByLabelText('New preset name'), { target: { value: 'My fashion preset' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save editor as private preset' }));
  const remove = await screen.findByRole('button', { name: 'Delete preset My fashion preset' });
  expect(api.post).toHaveBeenCalledWith('/master/clone', { name: 'My fashion preset', structure });
  fireEvent.click(remove);
  await screen.findByText('Preset deletion failed');
  expect(screen.getByRole('button', { name: 'My fashion preset' })).toBeInTheDocument();
  fireEvent.click(remove);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'My fashion preset' })).not.toBeInTheDocument());
  expect(screen.getByLabelText('Customer-facing label')).toHaveValue('Material');
  expect(api.put).not.toHaveBeenCalled();
});

test('client handover preserves typed details after failure and refreshes the locked workspace on success', async () => {
  api.post.mockRejectedValueOnce(new Error('Phone cannot be granted access')).mockResolvedValueOnce({});
  render(<MasterConfiguration />);
  fireEvent.change(await screen.findByLabelText('Client name'), { target: { value: 'Store client' } });
  fireEvent.change(screen.getByLabelText('Client mobile number'), { target: { value: '9000000002' } });
  fireEvent.click(screen.getByRole('button', { name: 'Grant client admin access' }));
  await screen.findByText('Phone cannot be granted access');
  expect(screen.getByLabelText('Client mobile number')).toHaveValue('9000000002');
  fireEvent.click(screen.getByRole('button', { name: 'Grant client admin access' }));
  await screen.findByText(/Client access granted/);
  expect(api.post).toHaveBeenLastCalledWith('/master/client-admins', { name: 'Store client', phone: '9000000002' });
  expect(screen.getByLabelText('Client mobile number')).toHaveValue('');
});

test('template import sends the reviewed file and revision; oversized files never reach the API', async () => {
  api.get.mockResolvedValue(workspace(false));
  api.post.mockResolvedValue({ ...workspace(false).configuration, revision: 3 });
  render(<MasterConfiguration />);
  const input = await screen.findByLabelText('Import store template');
  fireEvent.change(input, { target: { files: [{ size: 64001, text: async () => '{}' }] } });
  await screen.findByText('Choose a store template under 64 KB.');
  expect(api.post).not.toHaveBeenCalled();
  const template = { structure, version: 1 };
  fireEvent.change(input, { target: { files: [{ size: 800, text: async () => JSON.stringify(template) }] } });
  await screen.findByText('Template imported. Review and lock before handover.');
  expect(api.post).toHaveBeenCalledWith('/master/import', { revision: 2, template });
});

test('template export downloads the saved API response and refuses unsaved local edits', async () => {
  const template = { structure, version: 1 };
  api.get.mockImplementation(async path => path === '/master/export' ? template : workspace(false));
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:template') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Export structure' }));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(api.get).toHaveBeenCalledWith('/master/export');
  fireEvent.change(screen.getByLabelText('Customer-facing label'), { target: { value: 'Fabric' } });
  fireEvent.click(screen.getByRole('button', { name: 'Export structure' }));
  await screen.findByText('Save your draft first; exports use the saved configuration.');
  expect(click).toHaveBeenCalledTimes(1);
});
