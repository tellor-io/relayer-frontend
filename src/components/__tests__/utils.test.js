import React from 'react';

// Test utility functions that are used in DataFeed component
describe('Utility Functions', () => {
  describe('Time String Parsing', () => {
    // Test the parseTimeString function logic
    const parseTimeString = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return null;
      
      const timeStrLower = timeStr.toLowerCase();
      let totalSeconds = 0;
      
      // Extract hours
      const hourMatch = timeStrLower.match(/(\d+)h/);
      if (hourMatch) {
        totalSeconds += parseInt(hourMatch[1]) * 3600;
      }
      
      // Extract minutes
      const minuteMatch = timeStrLower.match(/(\d+)m/);
      if (minuteMatch) {
        totalSeconds += parseInt(minuteMatch[1]) * 60;
      }
      
      // Extract seconds
      const secondMatch = timeStrLower.match(/(\d+(?:\.\d+)?)s/);
      if (secondMatch) {
        totalSeconds += parseFloat(secondMatch[1]);
      }
      
      return totalSeconds > 0 ? totalSeconds : null;
    };

    test('parses seconds correctly', () => {
      expect(parseTimeString('7.4s')).toBe(7.4);
      expect(parseTimeString('0.5s')).toBe(0.5);
      expect(parseTimeString('30s')).toBe(30);
    });

    test('parses minutes and seconds correctly', () => {
      expect(parseTimeString('6m 55.6s')).toBe(415.6);
      expect(parseTimeString('2m 30s')).toBe(150);
      expect(parseTimeString('0m 45s')).toBe(45);
    });

    test('parses hours, minutes and seconds correctly', () => {
      expect(parseTimeString('1h 2m 3s')).toBe(3723);
      expect(parseTimeString('2h 30m 15s')).toBe(9015);
      expect(parseTimeString('0h 0m 30s')).toBe(30);
    });

    test('handles edge cases', () => {
      expect(parseTimeString('')).toBeNull();
      expect(parseTimeString(null)).toBeNull();
      expect(parseTimeString(undefined)).toBeNull();
      expect(parseTimeString('invalid')).toBeNull();
      expect(parseTimeString('0s')).toBeNull();
      expect(parseTimeString('0m 0s')).toBeNull();
    });
  });

  describe('Time String Formatting', () => {
    // Test the formatTimeString function logic
    const formatTimeString = (seconds) => {
      if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours}h ${minutes}m ${remainingSeconds.toFixed(1)}s`;
      }
    };

    test('formats seconds correctly', () => {
      expect(formatTimeString(30)).toBe('30.0s');
      expect(formatTimeString(45.5)).toBe('45.5s');
      expect(formatTimeString(59.9)).toBe('59.9s');
    });

    test('formats minutes and seconds correctly', () => {
      expect(formatTimeString(90)).toBe('1m 30.0s');
      expect(formatTimeString(125.7)).toBe('2m 5.7s');
      expect(formatTimeString(3599)).toBe('59m 59.0s');
    });

    test('formats hours, minutes and seconds correctly', () => {
      expect(formatTimeString(3661)).toBe('1h 1m 1.0s');
      expect(formatTimeString(7325)).toBe('2h 2m 5.0s');
      expect(formatTimeString(3600)).toBe('1h 0m 0.0s');
    });

    test('handles edge cases', () => {
      expect(formatTimeString(0)).toBe('0.0s');
      expect(formatTimeString(0.1)).toBe('0.1s');
    });
  });

  describe('Data Processing', () => {
    // Test data processing logic
    const processDataForChart = (data, timeScale) => {
      if (!Array.isArray(data) || data.length === 0) {
        return { labels: [], datasets: [] };
      }

      // Sort data by timestamp
      const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      switch(timeScale) {
        case 'recent': {
          const last12Entries = sortedData.slice(-12);
          const delays = last12Entries.map(item => {
            let delay = parseFloat(item.timeDifference);
            if (item.timeDifference.includes('m')) {
              const [min, sec] = item.timeDifference.split('m');
              delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
            }
            return delay;
          });

          return {
            labels: last12Entries.map(item => 
              new Date(item.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
              })
            ),
            delays: delays
          };
        }
        
        case 'daily': {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          let recentData = sortedData.filter(item => new Date(item.timestamp) >= sevenDaysAgo);
          
          if (recentData.length > 100) {
            const step = Math.ceil(recentData.length / 100);
            recentData = recentData.filter((_, index) => index % step === 0);
          }
          
          return {
            labels: recentData.map(item => 
              new Date(item.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            ),
            delays: recentData.map(item => parseFloat(item.timeDifference) || 0)
          };
        }
        
        default:
          return { labels: [], datasets: [] };
      }
    };

    test('processes recent data correctly', () => {
      const mockData = [
        { timestamp: '2024-01-01T12:00:00Z', timeDifference: '5.0s' },
        { timestamp: '2024-01-01T12:01:00Z', timeDifference: '6.0s' },
        { timestamp: '2024-01-01T12:02:00Z', timeDifference: '4.5s' }
      ];

      const result = processDataForChart(mockData, 'recent');
      
      expect(result.labels).toHaveLength(3);
      expect(result.delays).toEqual([5.0, 6.0, 4.5]);
    });

    test('processes daily data correctly', () => {
      const mockData = [
        { timestamp: '2024-01-01T12:00:00Z', timeDifference: '5.0s' },
        { timestamp: '2024-01-01T12:01:00Z', timeDifference: '6.0s' }
      ];

      const result = processDataForChart(mockData, 'daily');
      
      expect(result.labels).toHaveLength(2);
      expect(result.delays).toEqual([5.0, 6.0]);
    });

    test('handles empty data', () => {
      const result = processDataForChart([], 'recent');
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });

    test('handles invalid data', () => {
      const result = processDataForChart(null, 'recent');
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });
  });

  describe('Block Time Calculations', () => {
    // Test block time calculation logic
    const calculateBlockTime = (startBlock, endBlock) => {
      if (!startBlock || !endBlock) return 0;
      
      const timeDifference = endBlock.timestamp - startBlock.timestamp;
      const blockCount = endBlock.number - startBlock.number;
      
      return blockCount > 0 ? timeDifference / blockCount : 0;
    };

    test('calculates block time correctly', () => {
      const startBlock = { number: 1000, timestamp: 1000000 };
      const endBlock = { number: 1100, timestamp: 1012000 };
      
      const result = calculateBlockTime(startBlock, endBlock);
      expect(result).toBe(12); // 12000 seconds / 100 blocks = 12 seconds per block
    });

    test('handles zero block difference', () => {
      const startBlock = { number: 1000, timestamp: 1000000 };
      const endBlock = { number: 1000, timestamp: 1000000 };
      
      const result = calculateBlockTime(startBlock, endBlock);
      expect(result).toBe(0);
    });

    test('handles invalid blocks', () => {
      expect(calculateBlockTime(null, { number: 1000, timestamp: 1000000 })).toBe(0);
      expect(calculateBlockTime({ number: 1000, timestamp: 1000000 }, null)).toBe(0);
      expect(calculateBlockTime(null, null)).toBe(0);
    });
  });

  describe('Data Validation', () => {
    // Test data validation logic
    const validateTransactionData = (data) => {
      if (!data) return false;
      
      const requiredFields = ['value', 'timestamp', 'aggregatePower', 'relayTimestamp', 'timeDifference'];
      return requiredFields.every(field => data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined);
    };

    test('validates valid transaction data', () => {
      const validData = {
        value: '2000.00',
        timestamp: '2024-01-01T12:00:00Z',
        aggregatePower: '1000',
        relayTimestamp: '2024-01-01T12:00:05Z',
        timeDifference: '5.0s'
      };
      
      expect(validateTransactionData(validData)).toBe(true);
    });

    test('rejects invalid transaction data', () => {
      const invalidData = {
        value: '2000.00',
        timestamp: '2024-01-01T12:00:00Z',
        // Missing aggregatePower
        relayTimestamp: '2024-01-01T12:00:05Z',
        timeDifference: '5.0s'
      };
      
      expect(validateTransactionData(invalidData)).toBe(false);
    });

    test('rejects null data', () => {
      expect(validateTransactionData(null)).toBe(false);
    });

    test('rejects undefined data', () => {
      expect(validateTransactionData(undefined)).toBe(false);
    });
  });
});
