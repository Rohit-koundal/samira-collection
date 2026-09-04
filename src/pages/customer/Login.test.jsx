import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import Login from './Login';

const mockAuth = {
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  resendOtp: jest.fn(),
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

});
