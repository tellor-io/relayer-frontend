import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  CircularProgress,
  TextField,
  Box,
  Pagination
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import TellorABI from '../contracts/TellorABI.json';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io/address/0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a";
const DEFAULT_CONTRACT_ADDRESS = "0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a";

const DataFeed = () => {
  const [currentValue, setCurrentValue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [inputAddress, setInputAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [timeScale, setTimeScale] = useState('seconds'); // 'seconds', 'hourly', or 'daily'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/c9C61uwd-LHombk09TFBRF-NGhNI75JX");
        const contract = new ethers.Contract(
          contractAddress,
          TellorABI,
          provider
        );

        console.log('Fetching extended data...');
        
        const result = await contract.getAllExtendedData();
        console.log('Raw result:', result);

        if (result && result.length > 0) {
          console.log('Number of transactions:', result.length);
          console.log('Sample transaction data:', result[0]);
          
          // Process all transactions, sort by timestamp descending
          const processedData = result.map((data, index, array) => {
            const timestamp = data.timestamp.toNumber();
            const relayTimestamp = data.relayTimestamp.toNumber();
            
            // Calculate time difference in seconds for current row
            const timeDiff = Math.abs(relayTimestamp - (timestamp / 1000));
            const timeDiffFormatted = timeDiff < 60 
              ? `${timeDiff.toFixed(1)}s`
              : `${Math.floor(timeDiff / 60)}m ${(timeDiff % 60).toFixed(1)}s`;

            // Calculate difference with previous delay
            let delayChange = '-';  // Default value
            if (index > 0) {
              const prevData = array[index - 1];
              const prevTimestamp = prevData.timestamp.toNumber();
              const prevRelayTimestamp = prevData.relayTimestamp.toNumber();
              const prevTimeDiff = Math.abs(prevRelayTimestamp - (prevTimestamp / 1000));
              
              // Calculate the difference in delays using the exact values
              const difference = timeDiff - prevTimeDiff;
              
              // Format the difference using the same logic as the main delay
              if (Math.abs(difference) < 0.1) { // If difference is negligible
                delayChange = '±0s';
              } else if (Math.abs(difference) < 60) {
                delayChange = `${difference > 0 ? '+' : ''}${difference.toFixed(1)}s`;
              } else {
                const mins = Math.floor(Math.abs(difference) / 60);
                const secs = (Math.abs(difference) % 60).toFixed(1);
                delayChange = `${difference > 0 ? '+' : '-'}${mins}m ${secs}s`;
              }
            }

            console.log('Raw timestamps:', {
              timestamp,
              relayTimestamp,
              timestampDate: new Date(timestamp),
              relayDate: new Date(relayTimestamp * 1000),
              timeDiff,
              timeDiffFormatted
            });
            
            return {
              value: Number(ethers.utils.formatUnits(data.value, 18)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }),
              timestamp: new Date(timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }),
              aggregatePower: Number(data.aggregatePower).toLocaleString(),
              relayTimestamp: new Date(relayTimestamp * 1000).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }),
              timeDifference: timeDiffFormatted,
              delayChange: delayChange,
              blockNumber: Math.floor(timestamp / 1000) // Convert timestamp to approximate block number
            };
          }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
          console.log('First processed item:', processedData[0]);
          
          setCurrentValue(processedData);
        } else {
          throw new Error('No data retrieved from contract');
        }

        setLoading(false);
      } catch (err) {
        console.error('Detailed error:', err);
        setError(err.message || 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [contractAddress]);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (ethers.utils.isAddress(inputAddress)) {
      setContractAddress(inputAddress);
      setError(null);
    } else {
      setError('Invalid Ethereum address');
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const TimeScaleToggle = () => (
    <div style={{ 
      marginBottom: '1rem', 
      display: 'flex', 
      gap: '8px',
      justifyContent: 'center' 
    }}>
      {['seconds', 'hourly', 'daily'].map((scale) => (
        <button
          key={scale}
          onClick={() => setTimeScale(scale)}
          style={{
            padding: '4px 12px',
            backgroundColor: timeScale === scale ? '#0E5353' : 'transparent',
            color: timeScale === scale ? 'white' : '#0E5353',
            border: '1px solid #0E5353',
            borderRadius: '4px',
            cursor: 'pointer',
            textTransform: 'capitalize'
          }}
        >
          {scale}
        </button>
      ))}
    </div>
  );

  const prepareChartData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return { labels: [], datasets: [] };

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let processedData;
    
    switch(timeScale) {
      case 'hourly': {
        // Group by hour and calculate averages
        const hourlyGroups = sortedData.reduce((acc, item) => {
          const date = new Date(item.timestamp);
          const hourKey = date.getTime(); // Use timestamp as key
          
          if (!acc[hourKey]) {
            acc[hourKey] = { 
              delays: [], 
              deltas: [],
              hour: date
            };
          }
          
          // Parse delay value (remove 's' suffix and convert to number)
          let delay = parseFloat(item.timeDifference);
          if (item.timeDifference.includes('m')) {
            const [min, sec] = item.timeDifference.split('m');
            delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
          }

          // Parse delta value
          let delta = 0;
          if (item.delayChange !== '-' && item.delayChange !== '±0s') {
            if (item.delayChange.includes('m')) {
              const match = item.delayChange.match(/([+-])?(\d+)m\s*(\d+\.?\d*)s/);
              if (match) {
                const [_, sign, mins, secs] = match;
                const totalSeconds = parseInt(mins) * 60 + parseFloat(secs);
                delta = sign === '-' ? -totalSeconds : totalSeconds;
              }
            } else {
              delta = parseFloat(item.delayChange.replace('s', ''));
            }
          }
          
          acc[hourKey].delays.push(delay);
          acc[hourKey].deltas.push(delta);
          
          return acc;
        }, {});

        // Get last 12 hours
        const hourKeys = Object.keys(hourlyGroups)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .slice(-12);

        processedData = {
          labels: hourKeys.map(key => 
            hourlyGroups[key].hour.toLocaleString('en-US', { 
              hour: 'numeric',
              hour12: true 
            })
          ),
          delays: hourKeys.map(key => {
            const delays = hourlyGroups[key].delays;
            return delays.reduce((sum, val) => sum + val, 0) / delays.length;
          }),
          deltas: hourKeys.map(key => {
            const deltas = hourlyGroups[key].deltas.filter(d => !isNaN(d));
            return deltas.length > 0 
              ? deltas.reduce((sum, val) => sum + val, 0) / deltas.length 
              : null;
          })
        };
        break;
      }
      
      case 'daily': {
        // Group by day and calculate averages
        const dailyGroups = sortedData.reduce((acc, item) => {
          const date = new Date(item.timestamp);
          const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          if (!acc[dayKey]) {
            acc[dayKey] = { 
              delays: [], 
              deltas: [],
              date: date
            };
          }
          
          // Parse delay value
          let delay = parseFloat(item.timeDifference);
          if (item.timeDifference.includes('m')) {
            const [min, sec] = item.timeDifference.split('m');
            delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
          }

          // Parse delta value with improved handling of signs
          let delta = null;
          if (item.delayChange !== '-' && item.delayChange !== '±0s') {
            if (item.delayChange.includes('m')) {
              const match = item.delayChange.match(/([+-])?(\d+)m\s*(\d+\.?\d*)s/);
              if (match) {
                const [_, sign, mins, secs] = match;
                const totalSeconds = (parseInt(mins) * 60) + parseFloat(secs);
                delta = sign === '-' ? -totalSeconds : totalSeconds;
              }
            } else {
              // Handle simple seconds format (e.g., "+1.5s" or "-2.3s")
              const match = item.delayChange.match(/([+-])?(\d+\.?\d*)s/);
              if (match) {
                const [_, sign, seconds] = match;
                delta = parseFloat(seconds);
                if (sign === '-') delta = -delta;
              }
            }
          } else if (item.delayChange === '±0s') {
            delta = 0;
          }
          
          if (!isNaN(delay)) acc[dayKey].delays.push(delay);
          if (delta !== null) acc[dayKey].deltas.push(delta);
          
          return acc;
        }, {});

        // Get last 7 days
        const dayKeys = Object.keys(dailyGroups)
          .sort()
          .slice(-7);

        // Calculate absolute average of deltas (don't let positives and negatives cancel out)
        processedData = {
          labels: dayKeys.map(key => 
            dailyGroups[key].date.toLocaleString('en-US', { 
              month: 'short',
              day: 'numeric'
            })
          ),
          delays: dayKeys.map(key => {
            const delays = dailyGroups[key].delays;
            return delays.length > 0 
              ? delays.reduce((sum, val) => sum + val, 0) / delays.length 
              : null;
          }),
          deltas: dayKeys.map(key => {
            const deltas = dailyGroups[key].deltas;
            // Calculate average magnitude of change
            const avgDelta = deltas.length > 0 
              ? deltas.reduce((sum, val) => sum + Math.abs(val), 0) / deltas.length
              : null;
            console.log(`Average delta for ${key}:`, avgDelta);
            return avgDelta;
          })
        };

        console.log('Processed daily data:', processedData);
        break;
      }
      
      default: { // seconds (raw data)
        const last12Entries = sortedData.slice(-12);
        processedData = {
          labels: last12Entries.map(item => 
            new Date(item.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            })
          ),
          delays: last12Entries.map(item => parseFloat(item.timeDifference)),
          deltas: last12Entries.map(item => parseFloat(item.delayChange) || 0)
        };
      }
    }

    return {
      labels: processedData.labels,
      datasets: [
        {
          label: `${timeScale === 'seconds' ? 'Current' : 'Average'} Delay (seconds)`,
          data: processedData.delays,
          borderColor: '#0E5353',
          backgroundColor: 'rgba(14, 83, 83, 0.5)',
          tension: 0.4,
        },
        {
          label: `${timeScale === 'seconds' ? 'Current' : 'Average'} Delta (seconds)`,
          data: processedData.deltas,
          borderColor: '#08D482',
          backgroundColor: 'rgba(8, 212, 130, 0.5)',
          tension: 0.4,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#0E5353',
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Last 12 Hours - Delay and Delta',
        color: '#0E5353',
        padding: 20
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#0E5353',
          callback: function(value) {
            return value.toFixed(1) + 's';
          }
        },
        grid: {
          color: 'rgba(14, 83, 83, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#0E5353',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(14, 83, 83, 0.1)'
        }
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6">Error: {error}</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Grid container alignItems="center" sx={{ mt: 4, mb: 3 }}>
        <Grid item xs={6}>
          <img 
            src="/tellor-relayer-logo.png" 
            alt="Tellor Relayer"
            style={{
              height: '40px',
              width: 'auto',
              display: 'block'
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <form onSubmit={handleAddressSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={9}>
                <TextField
                  fullWidth
                  label="Contract Address"
                  variant="outlined"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  error={!!error && error.includes('address')}
                  helperText={error && error.includes('address') ? error : ''}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#0E5353',
                      },
                      '&:hover fieldset': {
                        borderColor: '#0E5353',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0E5353',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#0E5353',
                      '&.Mui-focused': {
                        color: '#0E5353',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#0E5353',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0E5353',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%',
                    height: '40px'
                  }}
                >
                  Update
                </button>
              </Grid>
            </Grid>
          </form>
        </Grid>
      </Grid>

      {/* New layout structure for main content */}
      <Grid container spacing={2}>
        {/* Data feed column */}
        <Grid item xs={7}>
          <Grid container spacing={2}>
            {Array.isArray(currentValue) && 
              currentValue
                .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                .map((data, index) => (
                  <Grid item xs={12} key={index}>
                    <Card 
                      sx={{ 
                        py: 1, 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          transition: 'background-color 0.3s',
                          '& .MuiTypography-root': {
                            color: '#0E5353',
                            transition: 'color 0.3s'
                          }
                        }
                      }}
                      onClick={() => window.open(ETHERSCAN_BASE_URL, '_blank')}
                    >
                      <CardContent sx={{ py: '8px !important' }}>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item xs={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                              <span style={{ fontWeight: 'bold' }}>ETH/USD:</span> ${data.value}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                              <span style={{ fontWeight: 'bold' }}>Power:</span> {data.aggregatePower}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                              <span style={{ fontWeight: 'bold' }}>Reported on Layer:</span> {data.timestamp}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                              <span style={{ fontWeight: 'bold' }}>Relayed to Bridge:</span> {data.relayTimestamp}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                              <span style={{ fontWeight: 'bold' }}>Delay:</span> {data.timeDifference}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                              <span style={{ fontWeight: 'bold' }}>Δ:</span> {data.delayChange}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={Math.ceil((currentValue?.length || 0) / rowsPerPage)}
                page={page}
                onChange={handlePageChange}
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#0E5353',
                  },
                  '& .MuiPaginationItem-page.Mui-selected': {
                    backgroundColor: '#0E5353',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#0E5353',
                    }
                  }
                }}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Chart column */}
        <Grid item xs={5} sx={{ position: 'sticky', top: 24 }}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: 1,
            height: 'calc(100vh - 180px)', // Adjust height to viewport minus header
            display: 'flex',
            flexDirection: 'column'
          }}>
            <TimeScaleToggle />
            <Line 
              options={{
                ...chartOptions,
                maintainAspectRatio: false
              }} 
              data={prepareChartData(currentValue)} 
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DataFeed; 