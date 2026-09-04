import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DataTable from './DataTable';

describe('admin data table', () => {
  test('adds mobile labels and displays the live record count', () => {
    const { container } = render(
      <DataTable
        title="Orders"
        heads={['Order ID', 'Customer']}
        rows={[
          <tr key="1">
            <td>SC-1001</td>
            <td>Samira Customer</td>
          </tr>,
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByText('1 record')).toBeInTheDocument();
    expect(container.querySelector('td[data-label="Order ID"]')).toHaveTextContent('SC-1001');
    expect(container.querySelector('td[data-label="Customer"]')).toHaveTextContent('Samira Customer');
  });
});
