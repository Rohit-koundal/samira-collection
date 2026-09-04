import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReviewModal from './ReviewModal';

const product = {
  _id: 'product-1',
  name: 'Royal Zari Silk Saree',
  brand: 'Samira Collection',
  images: [{ url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' }],
};

describe('ReviewModal', () => {
  test('requires a star rating and submits trimmed review content', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ message: 'Your verified review is now visible.' });
    render(<ReviewModal open product={product} onClose={jest.fn()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please select a rating');
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /5 stars.*Excellent/i }));
    fireEvent.change(screen.getByPlaceholderText('Summarise your experience'), { target: { value: '  Beautiful saree  ' } });
    fireEvent.change(screen.getByPlaceholderText(/Tell other customers/i), { target: { value: '  Great fabric and finish.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      rating: 5,
      title: 'Beautiful saree',
      comment: 'Great fabric and finish.',
    }));
    expect(await screen.findByText('Review saved')).toBeInTheDocument();
    expect(screen.getByText('Your verified review is now visible.')).toBeInTheDocument();
  });

  test('loads an existing review for editing and closes with Escape', () => {
    const onClose = jest.fn();
    render(
      <ReviewModal
        open
        product={product}
        existingReview={{ _id: 'review-1', rating: 3, title: 'Good', comment: 'Comfortable fit.' }}
        onClose={onClose}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Edit your review' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Summarise your experience')).toHaveValue('Good');
    expect(screen.getByPlaceholderText(/Tell other customers/i)).toHaveValue('Comfortable fit.');
    expect(screen.getByRole('button', { name: /3 stars.*Good/i })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
