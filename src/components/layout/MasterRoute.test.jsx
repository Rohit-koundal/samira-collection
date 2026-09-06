import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MasterRoute from './MasterRoute';
let mockUser;
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

test.each([
  undefined,
  { role: 'admin', activeMode: 'admin', systemRole: 'USER' },
  { role: 'admin', activeMode: 'admin', systemRole: 'MASTER_OWNER', offlineSession: true },
  { role: 'admin', activeMode: 'customer', systemRole: 'MASTER_OWNER' },
])('does not render master tools for unauthorized sessions: %j', (user) => {
  mockUser = user;
  render(<MasterRoute><p>Master tools</p></MasterRoute>);
  expect(screen.queryByText('Master tools')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/admin');
});

test('renders master tools for the authenticated owner in admin mode', () => {
  mockUser = { role: 'admin', activeMode: 'admin', systemRole: 'MASTER_OWNER' };
  render(<MasterRoute><p>Master tools</p></MasterRoute>);
  expect(screen.getByText('Master tools')).toBeInTheDocument();
});
