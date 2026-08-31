import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './Login';

const mockAuth = {
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  resendOtp: jest.fn(),
  login: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('../../hooks/useDesktopFeedback', () => () => ({
  notify: () => false,
}));

describe('customer login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.history.replaceState(null, '', '/login');
    mockAuth.login.mockResolvedValue({ ok: true });
  });

  test('restricts the phone field, scopes consent clicks, and exposes policy/help links', () => {
    render(<Login route="/login" />);

    const phone = screen.getByPlaceholderText('Mobile Number*');
    const consent = screen.getByRole('checkbox');
    const continueButton = screen.getByRole('button', { name: 'Continue' });

    fireEvent.change(phone, { target: { value: '9ab!8 765-43210' } });
    expect(phone).toHaveValue('9876543210');
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByText(/By continuing, I agree/i));
    expect(consent).not.toBeChecked();

    fireEvent.click(consent);
    expect(consent).toBeChecked();
    expect(continueButton).toBeEnabled();

    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy');
    expect(screen.getByRole('link', { name: /Get help/i })).toHaveAttribute('href', '/contact');
  });

  test('phone-password login validates inputs, toggles password visibility, and submits the phone', async () => {
    render(<Login route="/login" />);

    fireEvent.click(screen.getByRole('button', { name: /Log in using Password/i }));
    expect(screen.getByRole('heading', { name: 'Login with Phone' })).toBeInTheDocument();

    const phone = screen.getByPlaceholderText('Mobile Number*');
    const password = screen.getByPlaceholderText('Password');
    const continueButton = screen.getByRole('button', { name: 'Continue' });

    expect(continueButton).toBeDisabled();
    fireEvent.change(phone, { target: { value: '9876543210' } });
    fireEvent.change(password, { target: { value: 'secret1' } });
    expect(continueButton).toBeEnabled();

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith({
        phone: '9876543210',
        password: 'secret1',
        redirectTo: '/profile',
      });
    });
  });
});
