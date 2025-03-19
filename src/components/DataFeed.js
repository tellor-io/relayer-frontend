import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  CircularProgress,
  TextField
} from '@mui/material';
import TellorABI from '../contracts/TellorABI.json';

const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io/address/0x39C93320776D7D9F75798fEF42C72433b718726d";
const DEFAULT_CONTRACT_ADDRESS = "0x39C93320776D7D9F75798fEF42C72433b718726d";

const DataFeed = () => {
  const [currentValue, setCurrentValue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [inputAddress, setInputAddress] = useState(DEFAULT_CONTRACT_ADDRESS);

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
              ? `${Math.round(timeDiff)}s`
              : `${Math.round(timeDiff / 60)}m ${Math.round(timeDiff % 60)}s`;

            // Calculate difference with previous delay
            let delayChange = '-';  // Default value
            if (index > 0) {  // Changed from index < array.length - 1
              const prevData = array[index - 1];  // Changed from index + 1
              const prevTimestamp = prevData.timestamp.toNumber();
              const prevRelayTimestamp = prevData.relayTimestamp.toNumber();
              const prevTimeDiff = Math.abs(prevRelayTimestamp - (prevTimestamp / 1000));
              
              // Calculate the difference in delays
              const difference = Math.round(timeDiff - prevTimeDiff);
              
              // Format the difference
              if (difference === 0) {
                delayChange = '±0s';
              } else if (difference > 0) {
                delayChange = `+${difference}s`;
              } else {
                delayChange = `${difference}s`;
              }

              console.log('Delay calculation:', {
                currentDelay: timeDiff,
                previousDelay: prevTimeDiff,
                difference,
                delayChange
              });
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
          <Typography variant="h4" component="h1" sx={{ color: '#0E5353', fontWeight: 'bold' }}>
            TELLOR RELAYER FEED
          </Typography>
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

      <Grid container spacing={2}>
        {Array.isArray(currentValue) && currentValue.map((data, index) => (
          <Grid item xs={12} key={index}>
            <Card 
              sx={{ 
                py: 1, 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  transition: 'background-color 0.3s'
                }
              }}
              onClick={() => window.open(ETHERSCAN_BASE_URL, '_blank')}
            >
              <CardContent sx={{ py: '8px !important' }}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={2}>
                    <Typography variant="subtitle1" gutterBottom={false}>
                      ETH/USD: ${data.value}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                      Power: {data.aggregatePower}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                      Reported on Layer: {data.timestamp}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                      Relayed to Bridge: {data.relayTimestamp}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                      Delay: {data.timeDifference}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                      Δ: {data.delayChange}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default DataFeed; 