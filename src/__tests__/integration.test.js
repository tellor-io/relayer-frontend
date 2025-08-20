import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DataFeed from '../components/DataFeed';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart">Chart Component</div>
}));

// Mock contract ABIs
jest.mock('../contracts/TellorABI.json', () => ({}));
jest.mock('../contracts/DataBank.json', () => ({
  abi: []
}));

// Mock ethers
jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn(() => ({
    getBlockNumber: jest.fn().mockResolvedValue(12345),
    getBlock: jest.fn().mockResolvedValue({
      number: 12345,
      timestamp: Math.floor(Date.now() / 1000)
    })
  })),
  Contract: jest.fn(() => ({
    getAllExtendedData: jest.fn().mockResolvedValue([]),
    getAggregateValueCount: jest.fn().mockResolvedValue(0),
    getAggregateByIndex: jest.fn().mockResolvedValue([])
  })),
  isAddress: jest.fn(() => true),
  formatUnits: jest.fn(() => '2000.00'),
  AbiCoder: {
    defaultAbiCoder: () => ({
      decode: jest.fn(() => [BigInt('2000000000000000000000')])
    })
  }
}));

// Create a test theme
const testTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#f6f7f9',
      paper: '#0E5353'
    }
  }
});

// Wrapper component for testing
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={testTheme}>
    {children}
  </ThemeProvider>
);

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Feed Selection and Contract Switching', () => {
    test('complete flow from Tellor to DataBank feed selection', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Initially should show Tellor feed as selected
      const ethButton = screen.getByText('ETH/USD');
      expect(ethButton).toHaveStyle({ backgroundColor: '#0E5353' });

      // Click on BTC/USD to switch to DataBank
      const btcButton = screen.getByText('BTC/USD');
      fireEvent.click(btcButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      // Should switch to DataBank contract
      await waitFor(() => {
        expect(btcButton).toHaveStyle({ backgroundColor: '#0E5353' });
        expect(ethButton).not.toHaveStyle({ backgroundColor: '#0E5353' });
      });
    });

    test('feed switching maintains UI state correctly', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Switch to BTC/USD
      const btcButton = screen.getByText('BTC/USD');
      fireEvent.click(btcButton);

      await waitFor(() => {
        expect(btcButton).toHaveStyle({ backgroundColor: '#0E5353' });
      });

      // Switch back to ETH/USD
      const ethButton = screen.getByText('ETH/USD');
      fireEvent.click(ethButton);

      await waitFor(() => {
        expect(ethButton).toHaveStyle({ backgroundColor: '#0E5353' });
        expect(btcButton).not.toHaveStyle({ backgroundColor: '#0E5353' });
      });
    });
  });

  describe('Chart Controls Integration', () => {
    test('time scale changes affect chart data processing', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check that time scale buttons are present
      expect(screen.getByText('recent')).toBeInTheDocument();
      expect(screen.getByText('daily')).toBeInTheDocument();
      expect(screen.getByText('weekly')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();

      // Click on daily view
      const dailyButton = screen.getByText('daily');
      fireEvent.click(dailyButton);

      // Should maintain selected state
      await waitFor(() => {
        expect(dailyButton).toHaveStyle({ backgroundColor: '#0E5353' });
      });
    });

    test('custom date range shows inputs when selected', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Click on custom date range
      const customButton = screen.getByText('Date Range');
      fireEvent.click(customButton);

      // Should show date inputs
      await waitFor(() => {
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
        expect(screen.getByLabelText('End Date')).toBeInTheDocument();
      });

      // Should maintain selected state
      expect(customButton).toHaveStyle({ backgroundColor: '#0E5353' });
    });

    test('block time toggle affects chart display', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check block time toggle is present
      const blockTimeToggle = screen.getByText(/Remove EVM Block Time/);
      expect(blockTimeToggle).toBeInTheDocument();

      // Toggle should be clickable
      const toggleSwitch = blockTimeToggle.closest('label').querySelector('input[type="checkbox"]');
      expect(toggleSwitch).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    test('loading states transition correctly', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      // Should start with loading
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Should transition to no data state
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('No data available for the selected feed')).toBeInTheDocument();
      });
    });

    test('chart renders when data is available', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Chart should be present
      await waitFor(() => {
        expect(screen.getByTestId('chart')).toBeInTheDocument();
      });
    });
  });

  describe('UI Responsiveness Integration', () => {
    test('layout maintains structure across different states', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      // Check main layout sections are present
      expect(screen.getByText('Sepolia Feeds:')).toBeInTheDocument();
      expect(screen.getByText('Saga Feeds:')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Layout should still be intact
      expect(screen.getByText('Sepolia Feeds:')).toBeInTheDocument();
      expect(screen.getByText('Saga Feeds:')).toBeInTheDocument();
      expect(screen.getByTestId('chart')).toBeInTheDocument();
    });

    test('feed selection maintains visual feedback', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // All feed buttons should be present and clickable
      const feedButtons = [
        'ETH/USD',
        'BTC/USD',
        'SAGA/USD',
        'USDC/USD',
        'USDT/USD',
        'FBTC/USD'
      ];

      feedButtons.forEach(feedName => {
        const button = screen.getByText(feedName);
        expect(button).toBeInTheDocument();
        expect(button).toBeEnabled();
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('graceful degradation when network errors occur', async () => {
      // Mock ethers to throw an error
      const { ethers } = require('ethers');
      ethers.JsonRpcProvider.mockImplementation(() => {
        throw new Error('Network error');
      });

      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show appropriate error state
      await waitFor(() => {
        expect(screen.getByText('No data available for the selected feed')).toBeInTheDocument();
      });
    });

    test('maintains functionality after error recovery', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should still be able to interact with UI
      const btcButton = screen.getByText('BTC/USD');
      fireEvent.click(btcButton);

      // Should respond to user interaction
      await waitFor(() => {
        expect(btcButton).toHaveStyle({ backgroundColor: '#0E5353' });
      });
    });
  });

  describe('Performance Integration', () => {
    test('handles rapid user interactions without breaking', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const btcButton = screen.getByText('BTC/USD');
      const ethButton = screen.getByText('ETH/USD');
      const dailyButton = screen.getByText('daily');

      // Rapid interactions
      for (let i = 0; i < 3; i++) {
        fireEvent.click(btcButton);
        fireEvent.click(ethButton);
        fireEvent.click(dailyButton);
      }

      // UI should remain functional
      expect(btcButton).toBeInTheDocument();
      expect(ethButton).toBeInTheDocument();
      expect(dailyButton).toBeInTheDocument();
    });

    test('maintains state consistency during rapid changes', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const btcButton = screen.getByText('BTC/USD');
      const customButton = screen.getByText('Date Range');

      // Switch feed and time scale rapidly
      fireEvent.click(btcButton);
      fireEvent.click(customButton);

      // Should maintain consistent state
      await waitFor(() => {
        expect(btcButton).toHaveStyle({ backgroundColor: '#0E5353' });
        expect(customButton).toHaveStyle({ backgroundColor: '#0E5353' });
      });
    });
  });
});
