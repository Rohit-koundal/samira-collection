import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminLogin from './AdminLogin';

const mockLogin = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('../../hooks/useDesktopFeedback', () => () => ({
  notify: () => false,
}));

describe('admin login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses the separate admin flow and redirects to the dashboard', async () => {
    mockLogin.mockResolvedValue({ ok: true });
    render(<AdminLogin />);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password123',
      redirectTo: '/admin',
    }));
  });
});
