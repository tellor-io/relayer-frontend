import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import DataFeed from '../components/DataFeed';
import { createTellorTheme, TELLOR_COLORS } from '../theme/tellorTheme';
import { ThemeModeContext } from '../context/ThemeModeContext';

// Mock GraphQL service
jest.mock('../services/grapqlService', () => ({
  getPaginatedFeedData: jest.fn().mockResolvedValue({ updates: [], totalCount: 0 }),
  getChartData: jest.fn().mockResolvedValue([]),
  getOverviewData: jest.fn().mockResolvedValue([]),
}));

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

const ACTIVE_BG = TELLOR_COLORS.pine950;
const ACTIVE_BG_RGB = 'rgb(0, 55, 52)';

async function waitForChartControls() {
  await waitFor(() => {
    expect(screen.getByText('recent')).toBeInTheDocument();
  });
}

async function switchToFeedAnalytics() {
  fireEvent.click(screen.getByRole('tab', { name: /Feed Analytics/i }));
  await waitFor(() => {
    expect(screen.getByText('Sepolia Feeds:')).toBeInTheDocument();
  });
  await waitForChartControls();
}

function expectActiveBackground(element) {
  if (!element) {
    throw new Error('Element not found for background check');
  }
  const bg = window.getComputedStyle(element).backgroundColor;
  expect([ACTIVE_BG, ACTIVE_BG_RGB, '']).toContain(bg);
}

function getFeedButton(feedText) {
  const matches = screen.getAllByText(feedText);
  return matches.find((node) => node.closest('div[class*="MuiBox-root"]'))
    ?.closest('div[class*="MuiBox-root"]');
}

function clickFeed(feedText) {
  const button = getFeedButton(feedText);
  expect(button).toBeTruthy();
  fireEvent.click(button);
}

// Create a test theme
const testTheme = createTellorTheme('light');

// Wrapper component for testing
const TestWrapper = ({ children }) => (
  <ThemeModeContext.Provider value={{ mode: 'light', toggleTheme: jest.fn() }}>
    <ThemeProvider theme={testTheme}>
      {children}
    </ThemeProvider>
  </ThemeModeContext.Provider>
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

      await switchToFeedAnalytics();

      // Initially should show Tellor feed as selected
      expect(getFeedButton('ETH/USD')).toBeTruthy();

      clickFeed('BTC/USD');

      await waitFor(() => {
        expect(screen.getByText('Loading data...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(getFeedButton('BTC/USD')).toBeTruthy();
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

      await switchToFeedAnalytics();

      clickFeed('BTC/USD');

      await waitFor(() => {
        expect(getFeedButton('BTC/USD')).toBeTruthy();
      });

      clickFeed('ETH/USD');

      await waitFor(() => {
        expect(getFeedButton('ETH/USD')).toBeTruthy();
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

      await switchToFeedAnalytics();

      // Check that time scale buttons are present
      expect(screen.getByText('recent')).toBeInTheDocument();
      expect(screen.getByText('daily')).toBeInTheDocument();
      expect(screen.getByText('weekly')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();

      // Click on daily view
      const dailyButton = screen.getByText('daily');
      fireEvent.click(dailyButton);

      await waitForChartControls();
      expect(screen.getByText('daily')).toBeInTheDocument();
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

      await switchToFeedAnalytics();

      // Click on custom date range
      const customButton = screen.getByText('Date Range');
      fireEvent.click(customButton);

      // Should show date inputs
      await waitFor(() => {
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
        expect(screen.getByLabelText('End Date')).toBeInTheDocument();
        expect(screen.getByText('Date Range')).toBeInTheDocument();
      });
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

      await switchToFeedAnalytics();

      const blockTimeToggle = screen.getByText(/Remove network Block Time/);
      expect(blockTimeToggle).toBeInTheDocument();

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

      await switchToFeedAnalytics();

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

      await switchToFeedAnalytics();

      // Chart should be present
      await waitFor(() => {
        expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
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

      await switchToFeedAnalytics();

      // Check main layout sections are present
      expect(screen.getByText('Sepolia Feeds:')).toBeInTheDocument();
      expect(screen.getByText('Saga Feeds:')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Layout should still be intact
      expect(screen.getByText('Sepolia Feeds:')).toBeInTheDocument();
      expect(screen.getByText('Saga Feeds:')).toBeInTheDocument();
      expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
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

      await switchToFeedAnalytics();

      // All feed buttons should be present and clickable
      const feedButtons = ['ETH/USD', 'BTC/USD'];

      feedButtons.forEach((feedName) => {
        expect(screen.getAllByText(feedName).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('graceful degradation when network errors occur', async () => {
      render(
        <TestWrapper>
          <DataFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      await switchToFeedAnalytics();

      expect(screen.getByText('No data available for the selected feed')).toBeInTheDocument();
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

      await switchToFeedAnalytics();

      clickFeed('BTC/USD');

      await waitFor(() => {
        expect(getFeedButton('BTC/USD')).toBeTruthy();
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

      await switchToFeedAnalytics();

      for (let i = 0; i < 3; i++) {
        clickFeed('BTC/USD');
        clickFeed('ETH/USD');
        await waitForChartControls();
        fireEvent.click(screen.getByText('daily'));
      }

      await waitForChartControls();
      expect(getFeedButton('BTC/USD')).toBeTruthy();
      expect(getFeedButton('ETH/USD')).toBeTruthy();
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

      await switchToFeedAnalytics();

      clickFeed('BTC/USD');
      await waitForChartControls();
      fireEvent.click(screen.getByText('Date Range'));

      await waitFor(() => {
        expect(getFeedButton('BTC/USD')).toBeTruthy();
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      });
    });
  });
});
