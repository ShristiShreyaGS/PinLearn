import { render, screen } from '@testing-library/react';
import App from './App';

test('renders auth page heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/pinlearn/i);
  expect(headingElement).toBeInTheDocument();
});
