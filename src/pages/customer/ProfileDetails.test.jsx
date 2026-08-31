import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import ProfileDetails from './ProfileDetails';

const mockAuth = {
  user: {
    name: 'Samira Shopper',
    phone: '9876543210',
    email: '',
    isPhoneVerified: true,
  },
  updateProfile: jest.fn(),
  deleteProfile: jest.fn(),
  sendProfilePhoneChangeOtp: jest.fn(),
  verifyProfilePhoneChangeOtp: jest.fn(),
  sendProfileEmailChangeOtp: jest.fn(),
  verifyProfileEmailChangeOtp: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

test('account mobile number accepts digits only and reports an invalid number', () => {
  render(<ProfileDetails />);

  fireEvent.click(screen.getAllByRole('button', { name: 'CHANGE' })[0]);
  const phone = screen.getByPlaceholderText('Enter mobile number');

  fireEvent.change(phone, { target: { value: '12ab!34' } });
  expect(phone).toHaveValue('1234');
  expect(screen.getByText('Enter a valid 10-digit mobile number starting with 6-9.')).toBeInTheDocument();

  fireEvent.change(phone, { target: { value: '98765#43210abc' } });
  expect(phone).toHaveValue('9876543210');
  expect(screen.queryByText('Enter a valid 10-digit mobile number starting with 6-9.')).not.toBeInTheDocument();
});
