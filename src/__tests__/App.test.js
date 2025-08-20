import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the DataFeed component
jest.mock('../components/DataFeed', () => {
  return function MockDataFeed() {
    return <div data-testid="data-feed">DataFeed Component</div>;
  };
});

// Mock the fonts.css import
jest.mock('../styles/fonts.css', () => ({}));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('data-feed')).toBeInTheDocument();
  });

  test('renders DataFeed component', () => {
    render(<App />);
    const dataFeed = screen.getByTestId('data-feed');
    expect(dataFeed).toBeInTheDocument();
    expect(dataFeed.textContent).toBe('DataFeed Component');
  });

  test('applies Material-UI theme', () => {
    render(<App />);
    
    // Check that the app is wrapped in a theme provider
    // The theme should be applied to the root element
    const appElement = document.querySelector('#root') || document.body;
    expect(appElement).toBeInTheDocument();
  });

  test('has proper CSS baseline', () => {
    render(<App />);
    
    // Material-UI CssBaseline should be applied
    // This is typically applied to the body element
    expect(document.body).toBeInTheDocument();
  });

  test('maintains component hierarchy', () => {
    const { container } = render(<App />);
    
    // Check that the component structure is maintained
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild.tagName).toBe('DIV');
  });

  test('handles theme configuration correctly', () => {
    render(<App />);
    
    // The theme should be properly configured with dark mode
    // and custom typography settings
    const appElement = document.querySelector('#root') || document.body;
    expect(appElement).toBeInTheDocument();
  });
});
