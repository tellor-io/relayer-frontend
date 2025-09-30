import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Pagination,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import TellorABI from '../contracts/TellorABI.json';
import DataBankABI from '../contracts/DataBank.json';
import '../styles/DataFeed.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const ETHERSCAN_BASE_URL = "https://sepolia.etherscan.io/address/";
const DEFAULT_CONTRACT_ADDRESS = "0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a";
const DATABANK_CONTRACT_ADDRESS = "0x6f250229af8D83c51500f3565b10E93d8907B644";

// DataBank price pair queryIds (these are the specific feeds we want)
const DATABANK_PRICE_PAIRS = {
  'BTC/USD': '0xa6f013ee236804827b77696d350e9f0ac3e879328f2a3021d473a0b778ad78ac',
  'ETH/USD': '0x83a7f3d48786ac2667503a61e8c415438ed2922eb86a2906e4ee66d9a2ce4992',
  'SAGA/USD': '0x74c9cfdfd2e4a00a9437bf93bf6051e18e604a976f3fa37faafe0bb5a039431d',
  'USDC/USD': '0x8ee44cd434ed5b0e007eee581fbe0855336f3f84484e8d9989a620a4a49aa0f7',
  'USDT/USD': '0x68a37787e65e85768d4aa6e385fb15760d46df0f67a18ec032d8fd5848aca264',
  'USDN/USD': '0xe010d752f28dcd2804004d0b57ab1bdc4eca092895d49160204120af11d15f3e',
  'sUSDS/USD': '0x59ae85cec665c779f18255dd4f3d97821e6a122691ee070b9a26888bc2a0e45a',
  'yUSD/USD': '0x35155b44678db9e9e021c2cf49dd20c31b49e03415325c2beffb5221cf63882d',
  'tBTC/USD': '0x76b504e33305a63a3b80686c0b7bb99e7697466927ba78e224728e80bfaaa0be',
  'rETH/USD': '0x0bc2d41117ae8779da7623ee76a109c88b84b9bf4d9b404524df04f7d0ca4ca7',
  'wstETH/USD': '0x1962cde2f19178fe2bb2229e78a6d386e6406979edc7b9a1966d89d83b3ebf2e',
  'KING/USD': '0xd62f132d9d04dde6e223d4366c48b47cd9f90228acdc6fa755dab93266db5176',
  'sUSDe/USD': '0x03731257e35c49e44b267640126358e5decebdd8f18b5e8f229542ec86e318cf',
  'stATOM/USD': '0x611fd0e88850bf0cc036d96d04d47605c90b993485c2971e022b5751bbb04f23',
  'vyUSD/USD': '0x91513b15db3cef441d52058b24412957f9cc8645c53aecf39446ac9b0d2dcca4',
  'sUSN/USD': '0x187f74d310dc494e6efd928107713d4229cd319c2cf300224de02776090809f1',
  'sfrxUSD/USD': '0xab30caa3e7827a27c153063bce02c0b260b29c0c164040c003f0f9ec66002510'
};

// Feed risk assessment mapping
const FEED_RISK_ASSESSMENT = {
  'BTC/USD': 'exemplary',      // 3 bars
  'ETH/USD': 'exemplary',      // 3 bars
  'SAGA/USD': 'moderate',      // 2 bars
  'USDC/USD': 'moderate',      // 2 bars
  'USDT/USD': 'moderate',      // 2 bars
  'USDN/USD': 'moderate',      // 2 bars
  'sUSDS/USD': 'moderate',     // 2 bars
  'yUSD/USD': 'high',          // 1 bar
  'tBTC/USD': 'moderate',      // 2 bars
  'rETH/USD': 'moderate',      // 2 bars
  'wstETH/USD': 'moderate',    // 2 bars
  'KING/USD': 'moderate',      // 2 bars
  'sUSDe/USD': 'high',         // 1 bar
  'stATOM/USD': 'moderate',    // 2 bars
  'vyUSD/USD': 'moderate',     // 2 bars
  'sUSN/USD': 'high',      // 1 bars
  'sfrxUSD/USD': 'high'    // 1 bars
};

// Risk level to bar count mapping
const RISK_BAR_COUNT = {
  'exemplary': 3,
  'moderate': 2,
  'high': 1
};

const DataFeed = () => {
  // Helper functions for time string parsing and formatting
  const parseTimeString = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    // Handle formats like "7.4s", "6m 55.6s", "1h 2m 3s", "54m 55.6s"
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

  const [currentValue, setCurrentValue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false); // New state for feed selection loading
  const [error, setError] = useState(null);
  const [currentFeed, setCurrentFeed] = useState(null); // Track current feed being processed
  const [contractAddress, setContractAddress] = useState('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
  const [inputAddress, setInputAddress] = useState('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [timeScale, setTimeScale] = useState('recent'); // 'recent', 'daily', 'weekly', or 'custom'
  const [includeBlockTime, setIncludeBlockTime] = useState(true);
  const [avgBlockTime, setAvgBlockTime] = useState(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDataBankContract, setIsDataBankContract] = useState(false);
  const [selectedDataBankFeed, setSelectedDataBankFeed] = useState(null);
  // Add new state for incremental loading
  const [isIncrementalLoading, setIsIncrementalLoading] = useState(false);
  // Add render key to force re-renders
  const [renderKey, setRenderKey] = useState(0);
  // Add flag to prevent auto-refresh until initial fetch is complete
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);
  // Use ref to track current data for immediate updates
  const currentValueRef = useRef([]);
  // Add state to force re-renders when ref changes
  const [forceUpdate, setForceUpdate] = useState(0);
  // Add cancellation token to prevent race conditions
  const [cancellationToken, setCancellationToken] = useState(0);
  // Add ref to track current feed for immediate filtering
  const currentFeedRef = useRef(null);

  // Function to determine which ABI to use based on contract address
  const getContractABI = (address) => {
    if (address.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      return DataBankABI.abi;
    }
    return TellorABI;
  };

    // Function to fetch data from DataBank contract - CLEAN SINGLE FEED VERSION
  // Function to fetch data from DataBank contract - CLEAN SINGLE FEED VERSION
const fetchDataBankData = useCallback(async (contract, provider, targetFeed = null, token = 0, blockTimeOverride = null) => {

  try {
    let data = [];
    
    // CRITICAL: Only process the SPECIFIC feed passed as parameter
    if (!targetFeed) {
      return [];
    }
    
    const queryId = DATABANK_PRICE_PAIRS[targetFeed];
    if (!queryId) {
      return [];
    }
    
    try {
      // Step 1: Get the total count of updates for this specific price pair
      const valueCount = await contract.getAggregateValueCount(queryId);
      
      if (valueCount && valueCount > 0) {
        // Start incremental loading
        setIsIncrementalLoading(true);
        
        // Step 2: Process transactions asynchronously to allow React to update UI
        const processTransactions = async () => {
          try {
            // Validate that we're still processing the correct feed
            if (currentFeed !== targetFeed) {
              setIsIncrementalLoading(false);
              return;
            }
            
            // Check cancellation token
            if (token !== cancellationToken) {
              setIsIncrementalLoading(false);
              return;
            }
            
            // Convert valueCount to number to prevent BigInt mixing errors
            const numValueCount = Number(valueCount);
            
            // Process from most recent (highest index) to oldest (index 0)
            for (let index = numValueCount - 1; index >= 0; index--) {
              try {
                // Check if feed has changed during processing
                if (currentFeed !== targetFeed) {
                  setIsIncrementalLoading(false);
                  return;
                }
                
                // Check cancellation token
                if (token !== cancellationToken) {
                  setIsIncrementalLoading(false);
                  return;
                }
                
                // Get the individual update data
                const updateData = await contract.getAggregateByIndex(queryId, index);
                
                if (updateData) {
                  // Extract the core data fields
                  let price = "Processing...";
                  let aggregateTimestamp = 0;
                  let relayTimestamp = 0;
                  let power = 0;
                  
                  try {
                    // Decode the price from the value field (index 0)
                    if (updateData[0] && updateData[0] !== '0x' && updateData[0] !== '0x0') {
                      try {
                        // Decode the bytes to get the actual price
                        const decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], updateData[0]);
                        const rawPrice = decodedValue[0];
                        
                        // Convert from wei to USD (using 18 decimals to get the right price scale)
                        price = ethers.formatUnits(rawPrice, 18);
                        
                        // Format as currency
                        price = parseFloat(price).toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        });
                      } catch (decodeError) {
                        price = "Decode error";
                      }
                    } else {
                      price = "0.00";
                    }
                    
                    // Extract timestamps and power from the update data using numeric indices
                    power = Number(updateData[1] || 0);                    // index 1: power
                    aggregateTimestamp = Number(updateData[2] || 0);       // index 2: aggregateTimestamp  
                    relayTimestamp = Number(updateData[4] || 0);           // index 4: relayTimestamp
                    
                  } catch (decodeError) {
                    price = "Decode error";
                  }
                  
                  // Handle timestamp conversion - normalize both timestamps to milliseconds
                  const aggTimestampMs = Number(aggregateTimestamp);
                  const finalAggTimestamp = aggTimestampMs < 10000000000 ? aggTimestampMs * 1000 : aggTimestampMs;
                  const relayTimestampMs = Number(relayTimestamp);
                  const finalRelayTimestamp = relayTimestampMs < 10000000000 ? relayTimestampMs * 1000 : relayTimestampMs;
                  
                  // Calculate time difference in seconds - ensure all values are numbers
                  let timeDiff = finalAggTimestamp && finalRelayTimestamp 
                    ? Math.abs(Number(finalRelayTimestamp) - Number(finalAggTimestamp)) / 1000
                    : 0;
                  
                  // Store the original time difference before any adjustments
                  const originalTimeDiff = timeDiff;
                  
                  // Subtract block time if toggle is enabled (same logic as Tellor feeds)
                  const effectiveBlockTime = blockTimeOverride !== null ? blockTimeOverride : avgBlockTime;
                  
                  if (includeBlockTime && effectiveBlockTime > 0) {
                    const adjustedTimeDiff = Math.max(0, timeDiff - effectiveBlockTime);
                    timeDiff = adjustedTimeDiff;
                  } else if (includeBlockTime && effectiveBlockTime === 0 && avgBlockTime > 0) {
                    // Fallback to avgBlockTime if effectiveBlockTime is 0 but avgBlockTime is available
                    const adjustedTimeDiff = Math.max(0, timeDiff - avgBlockTime);
                    timeDiff = adjustedTimeDiff;
                  }
                  
                  // Format the ORIGINAL time difference (not the adjusted one) for storage
                  const originalTimeDiffFormatted = originalTimeDiff < 60 
                    ? `${originalTimeDiff.toFixed(1)}s`
                    : `${Math.floor(originalTimeDiff / 60)}m ${(originalTimeDiff % 60).toFixed(1)}s`;
                  
                  // Format the adjusted time difference for display
                  const timeDiffFormatted = timeDiff < 60 
                    ? `${timeDiff.toFixed(1)}s`
                    : `${Math.floor(timeDiff / 60)}m ${(timeDiff % 60).toFixed(1)}s`;
                  
                  // Get real block number from current blockchain state
                  let realBlockNumber = "Fetching...";
                  try {
                    const currentBlock = await provider.getBlockNumber();
                    realBlockNumber = currentBlock;
                  } catch (blockError) {
                    realBlockNumber = Math.floor(Number(aggTimestampMs) / 1000) || "Unknown";
                  }
                  
                  // Create the data entry
                  const newTransaction = {
                    value: price,
                    timestamp: finalAggTimestamp ? new Date(Number(finalAggTimestamp)).toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    }) : "Unknown",
                    aggregatePower: Number(power).toString() || "1",
                    relayTimestamp: finalRelayTimestamp ? new Date(Number(finalRelayTimestamp)).toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    }) : "Unknown",
                    timeDifference: originalTimeDiffFormatted,
                    blockNumber: realBlockNumber,
                    pair: targetFeed,
                    txHash: `update_${targetFeed}_${index}_${Date.now()}`,
                    note: `Update ${index + 1}/${valueCount}`,
                    // Keep raw timestamp for sorting
                    _rawTimestamp: aggTimestampMs
                  };
                  
                  // CRITICAL: Validate that we're still processing the correct feed
                  if (currentFeed !== targetFeed) {
                    // Feed has changed, stop processing this transaction
                    return;
                  }
                  
                  // CRITICAL: Update the UI immediately with each new transaction
                  setCurrentValue(prevData => {
                    // CRITICAL: Validate we're still processing the correct feed
                    if (currentFeed !== targetFeed || currentFeedRef.current !== targetFeed) {
                      return prevData; // Feed changed, don't add this data
                    }
                    
                    // For DataBank contracts, only add data if it's for the current feed
                    if (isDataBankContract && currentFeedRef.current && newTransaction.pair && newTransaction.pair !== currentFeedRef.current) {
                      return prevData; // Don't add data for wrong feed
                    }
                    
                    // CRITICAL: Remove any existing data from different feeds before adding new data
                    const cleanedPrevData = isDataBankContract && currentFeedRef.current 
                      ? prevData.filter(existing => !existing.pair || existing.pair === currentFeedRef.current)
                      : prevData;
                    
                    // Additional safety check: ensure we don't add duplicate transactions
                    const isDuplicate = cleanedPrevData.some(existing => 
                      existing.txHash === newTransaction.txHash || 
                      (existing.pair === newTransaction.pair && existing._rawTimestamp === newTransaction._rawTimestamp)
                    );
                    
                    if (isDuplicate) {
                      return cleanedPrevData; // Don't add duplicate
                    }
                    
                    const updatedData = [...cleanedPrevData, newTransaction];
                    // Sort by timestamp descending (newest first)
                    const sortedData = updatedData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
                    // Update ref for immediate access
                    currentValueRef.current = sortedData;
                    // Force re-render by updating forceUpdate state
                    setForceUpdate(prev => prev + 1);
                    return sortedData;
                  });
                  
                  // Force React to re-render immediately by updating render key
                  setRenderKey(prev => prev + 1);
                  
                  // CRITICAL: Use setTimeout to break out of synchronous execution and allow React to update
                  await new Promise(resolve => setTimeout(resolve, 0));
                }
                
              } catch (indexError) {
                // Silent error handling
              }
            }
            
            // Finish incremental loading
            setIsIncrementalLoading(false);
          } catch (error) {
            setIsIncrementalLoading(false);
          }
        };
        
        // Start processing transactions asynchronously
        processTransactions();
      }
      
    } catch (functionError) {
      setIsIncrementalLoading(false);
    }
    
    // Return the final data (though UI is already updated incrementally)
    return [];
    
  } catch (error) {
    setIsIncrementalLoading(false);
    throw error;
  }
}, [includeBlockTime, avgBlockTime, currentFeed, cancellationToken, isDataBankContract]);

  // Function to fetch data from Tellor contract
  const fetchTellorData = useCallback(async (contract, provider) => {
    try {
        const result = await contract.getAllExtendedData();

        if (result && result.length > 0) {
          // Process all transactions, sort by timestamp descending
          const processedData = await Promise.all(result.map(async (data, index, array) => {
            // Convert BigInt values to numbers
            const timestamp = typeof data.timestamp === 'bigint' ? Number(data.timestamp) : Number(data.timestamp);
            const relayTimestamp = typeof data.relayTimestamp === 'bigint' ? Number(data.relayTimestamp) : Number(data.relayTimestamp);
            const value = data.value; // Keep as is for ethers.formatUnits
            const aggregatePower = typeof data.aggregatePower === 'bigint' ? Number(data.aggregatePower) : Number(data.aggregatePower);
            
            // Calculate time difference in seconds for current row
            let timeDiff = Math.abs(Number(relayTimestamp) - (Number(timestamp) / 1000));
            
            // Subtract block time if toggle is enabled
          if (includeBlockTime && avgBlockTime > 0) {
            timeDiff = Math.max(0, timeDiff - avgBlockTime);
            }
            
            const timeDiffFormatted = timeDiff < 60 
              ? `${timeDiff.toFixed(1)}s`
              : `${Math.floor(timeDiff / 60)}m ${(timeDiff % 60).toFixed(1)}s`;
            
            // Get real block number from current blockchain state
            let realBlockNumber = "Fetching...";
            try {
              const currentBlock = await provider.getBlockNumber();
              realBlockNumber = currentBlock;
            } catch (blockError) {
              realBlockNumber = Math.floor(Number(timestamp) / 1000) || "Unknown";
            }
            
            return {
              value: parseFloat(ethers.formatUnits(value, 18)).toLocaleString(undefined, {
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
              aggregatePower: aggregatePower.toLocaleString(),
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
              blockNumber: realBlockNumber,
              // Keep raw timestamp for sorting
              _rawTimestamp: Number(timestamp)
            };
          }));
          
          // Sort by raw timestamp descending (newest first)
          processedData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
          
        return processedData;
        } else {
          throw new Error('No data retrieved from contract');
      }
    } catch (error) {
      throw error;
    }
  }, [includeBlockTime, avgBlockTime]);

  // Function to fetch only new transactions (for incremental updates)
  const fetchNewTransactionsOnly = useCallback(async (contract, queryId, startIndex, endIndex, token = 0, blockTimeOverride = null) => {

    try {
      // Validate that we're still processing the correct feed
      if (currentFeed !== selectedDataBankFeed) {

        return [];
      }
      
      // Check cancellation token
      if (token !== cancellationToken) {
        return [];
      }
      
      // Create provider for block number fetching
      const rpcUrl = "https://sagaevm.jsonrpc.sagarpc.io";
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      let newData = [];
      
      // Only fetch the new transactions (from startIndex to endIndex-1)
      for (let index = startIndex; index < endIndex; index++) {
        try {
          // Check if feed has changed during processing
          if (currentFeed !== selectedDataBankFeed) {
            return [];
          }
          
          // Check cancellation token
          if (token !== cancellationToken) {
            return [];
          }
          
          // Get the individual update data
          const updateData = await contract.getAggregateByIndex(queryId, index);
          
          if (updateData) {
            // Extract the core data fields (same logic as main function)
            let price = "Processing...";
            let aggregateTimestamp = 0;
            let relayTimestamp = 0;
            let power = 0;
            
            try {
              // Decode the price from the value field (index 0)
              if (updateData[0] && updateData[0] !== '0x' && updateData[0] !== '0x0') {
                try {
                  const decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], updateData[0]);
                  const rawPrice = decodedValue[0];
                  price = ethers.formatUnits(rawPrice, 18);
                  price = parseFloat(price).toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  });
                } catch (decodeError) {
                  price = "Decode error";
                }
              } else {
                price = "0.00";
              }
              
              // Extract timestamps and power
              power = Number(updateData[1] || 0);
              aggregateTimestamp = Number(updateData[2] || 0);
              relayTimestamp = Number(updateData[4] || 0);
              
            } catch (decodeError) {
              price = "Decode error";
            }
            
            // Handle timestamp conversion - normalize both timestamps to milliseconds
            const aggTimestampMs = Number(aggregateTimestamp);
            const finalAggTimestamp = aggTimestampMs < 10000000000 ? aggTimestampMs * 1000 : aggTimestampMs;
            const relayTimestampMs = Number(relayTimestamp);
            const finalRelayTimestamp = relayTimestampMs < 10000000000 ? relayTimestampMs * 1000 : relayTimestampMs;
            
            // Calculate time difference
            let timeDiff = finalAggTimestamp && finalRelayTimestamp 
              ? Math.abs(Number(finalRelayTimestamp) - Number(finalAggTimestamp)) / 1000
              : 0;
            
            // Store the original time difference before any adjustments
            const originalTimeDiff = timeDiff;
            
            // Subtract block time if toggle is enabled (same logic as Tellor feeds)
            const effectiveBlockTime = blockTimeOverride !== null ? blockTimeOverride : avgBlockTime;
            
            if (includeBlockTime && effectiveBlockTime > 0) {
              const adjustedTimeDiff = Math.max(0, timeDiff - effectiveBlockTime);
              timeDiff = adjustedTimeDiff;
            } else if (includeBlockTime && effectiveBlockTime === 0 && avgBlockTime > 0) {
              // Fallback to avgBlockTime if effectiveBlockTime is 0 but avgBlockTime is available
              const adjustedTimeDiff = Math.max(0, timeDiff - avgBlockTime);
              timeDiff = adjustedTimeDiff;
            }
            
            // Format the ORIGINAL time difference (not the adjusted one) for storage
            const originalTimeDiffFormatted = originalTimeDiff < 60 
              ? `${originalTimeDiff.toFixed(1)}s`
              : `${Math.floor(originalTimeDiff / 60)}m ${(originalTimeDiff % 60).toFixed(1)}s`;
            
            // Get real block number from current blockchain state
            let realBlockNumber = "Fetching...";
            try {
              const currentBlock = await provider.getBlockNumber();
              realBlockNumber = currentBlock;
            } catch (blockError) {
              realBlockNumber = Math.floor(Number(aggTimestampMs) / 1000) || "Unknown";
            }
            
            // Create the data entry
            newData.push({
              value: price,
              timestamp: finalAggTimestamp ? new Date(Number(finalAggTimestamp)).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }) : "Unknown",
              aggregatePower: Number(power).toString() || "1",
              relayTimestamp: finalRelayTimestamp ? new Date(Number(finalRelayTimestamp)).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }) : "Unknown",
              timeDifference: originalTimeDiffFormatted,
              blockNumber: realBlockNumber,
              pair: selectedDataBankFeed,
              txHash: `update_${selectedDataBankFeed}_${index + 1}_${Date.now()}`,
              note: `Update ${index + 1} (New)`,
              // Keep raw timestamp for sorting
              _rawTimestamp: aggTimestampMs
            });
          }
          
        } catch (indexError) {
          // Silent error handling
        }
      }
      
      // Sort by raw timestamp descending (newest first)
      newData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
      
      return newData;
      
    } catch (error) {
      return [];
    }
  }, [selectedDataBankFeed, includeBlockTime, avgBlockTime, currentFeed, cancellationToken, isDataBankContract]);

  // Function to calculate average block time
  const calculateAverageBlockTime = async (provider, contractAddress) => {
    try {

      
      // Get current block
      const endBlock = await provider.getBlock('latest');

      
      // Use different block ranges for different chains based on RPC capabilities
      const isSagaChain = contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase();
      let blockRange, startBlockNumber;
      
      if (isSagaChain) {
        // For Saga, start with a much smaller range that the RPC can likely access
        blockRange = 1000;
        startBlockNumber = Math.max(0, endBlock.number - blockRange);

      } else {
        // For Sepolia, use the full 100,000 block range
        blockRange = 100000;
        startBlockNumber = Math.max(0, endBlock.number - blockRange);

      }
      


      
      const startBlock = await provider.getBlock(startBlockNumber);

      
      if (!startBlock) {

        // Try with a much smaller range that should definitely work
        const fallbackRange = isSagaChain ? 100 : 1000;
        const fallbackStartBlockNumber = Math.max(0, endBlock.number - fallbackRange);

        
        const fallbackStartBlock = await provider.getBlock(fallbackStartBlockNumber);
        if (!fallbackStartBlock) {

          const defaultBlockTime = isSagaChain ? 2 : 12;

          setAvgBlockTime(defaultBlockTime);
          return defaultBlockTime;
        }
        
        const timeDifference = endBlock.timestamp - fallbackStartBlock.timestamp;
        const blockCount = endBlock.number - fallbackStartBlockNumber;
        const averageBlockTime = blockCount > 0 ? timeDifference / blockCount : (isSagaChain ? 2 : 12);
        

        setAvgBlockTime(averageBlockTime);
        return averageBlockTime;
      }
      

      
      // Calculate average block time
      const timeDifference = endBlock.timestamp - startBlock.timestamp;
      const blockCount = endBlock.number - startBlockNumber;
      const averageBlockTime = blockCount > 0 ? timeDifference / blockCount : 0;
      


        setAvgBlockTime(averageBlockTime);
        
        return averageBlockTime;
    } catch (error) {
      console.error('Error calculating block time:', error);
      const isSagaChain = contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase();
      const defaultBlockTime = isSagaChain ? 2 : 12;

      setAvgBlockTime(defaultBlockTime);
      return defaultBlockTime;
    }
  };

  useEffect(() => {
    // Skip main data fetching if a specific DataBank feed is selected
    if (selectedDataBankFeed && contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      return;
    }
    
    // Skip if we're switching to DataBank contract but don't have feed yet
    if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      return;
    }
    
    const fetchData = async () => {
      try {
        // Using the correct Saga EVM RPC endpoint
        
        const rpcUrl = contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase() 
          ? "https://sagaevm.jsonrpc.sagarpc.io" // Correct Saga EVM RPC
          : "https://eth-sepolia.g.alchemy.com/v2/c9C61uwd-LHombk09TFBRF-NGhNI75JX";
        
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contractABI = getContractABI(contractAddress);
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          provider
        );
        
        // Calculate average block time if toggle is enabled
        if (includeBlockTime) {
          await calculateAverageBlockTime(provider, contractAddress);
        }
        
        let processedData;
        
        // Determine which contract type and fetch data accordingly
        if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
          setIsDataBankContract(true);
          processedData = [];
        } else {
          setIsDataBankContract(false);
          try {
            processedData = await fetchTellorData(contract, provider);
          } catch (error) {
            processedData = [];
          }
        }
        
        if (processedData && processedData.length > 0) {
          // CRITICAL: Only set data if we're still on the right contract type
          if (!selectedDataBankFeed && contractAddress.toLowerCase() !== DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
            setCurrentValue(processedData);
            currentValueRef.current = processedData;
            setInitialFetchComplete(true); // Mark initial fetch as complete
          } else {
            setCurrentValue([]);
            currentValueRef.current = [];
          }
        } else {
          // Don't throw error, just set empty array
          setCurrentValue([]);
          currentValueRef.current = [];
        }

        setLoading(false);
        setFeedLoading(false); // Stop feed loading when main data fetch completes
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        setLoading(false);
        setFeedLoading(false); // Stop feed loading on error
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [contractAddress, includeBlockTime, timeScale, customStartDate, customEndDate, fetchTellorData, selectedDataBankFeed]);

    // Separate useEffect to handle DataBank feed selection changes
  useEffect(() => {
    // Only run if we have a selected feed and we're on the DataBank contract
    if (!selectedDataBankFeed || contractAddress.toLowerCase() !== DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      return;
    }
    
    // Clear any existing data when switching to a new feed
    if (currentValue.length > 0 && currentValue[0]?.pair !== selectedDataBankFeed) {
      setCurrentValue([]);
      currentValueRef.current = [];
      setCurrentFeed(selectedDataBankFeed);
      setPage(1); // Reset to first page
    }
    
    // Prevent duplicate fetches for the same feed if data already exists
    if (currentValue.length > 0 && currentValue[0]?.pair === selectedDataBankFeed) {
      return;
    }
    
    // Set current feed being processed
    setCurrentFeed(selectedDataBankFeed);
    
    // Initial data fetch when feed selection changes
    const fetchSelectedFeedData = async () => {
      try {
        const rpcUrl = "https://sagaevm.jsonrpc.sagarpc.io";
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(
          contractAddress,
          DataBankABI.abi,
          provider
        );
        
        // Clear existing data before starting incremental fetch
        setCurrentValue([]);
        currentValueRef.current = [];
        
        // Reset initial fetch flag for new feed
        setInitialFetchComplete(false);
        
        // Calculate average block time if toggle is enabled (same as Tellor feeds)
        let currentBlockTime = avgBlockTime;
        if (includeBlockTime) {
          const blockTime = await calculateAverageBlockTime(provider, contractAddress);
          // Update state and also use the value directly
          setAvgBlockTime(blockTime);
          currentBlockTime = blockTime;
        }
        
        const data = await fetchDataBankData(contract, provider, selectedDataBankFeed, cancellationToken, currentBlockTime);
        
        setLoading(false);
        setFeedLoading(false);
        setError(null);
        
        // Store the initial transaction count for this feed BEFORE setting up auto-refresh
        const initialCount = await contract.getAggregateValueCount(DATABANK_PRICE_PAIRS[selectedDataBankFeed]);
        
        // Mark initial fetch as complete for this feed
        setInitialFetchComplete(true);
        
        // Set up periodic refresh every 30 seconds for real-time updates
        const refreshInterval = setInterval(async () => {

          // Don't run auto-refresh until initial fetch is complete
          if (!initialFetchComplete) {

            return;
          }
          
          // Validate that we're still processing the correct feed
          if (currentFeed !== selectedDataBankFeed) {

            return;
          }
          
          try {
            const rpcUrl = "https://sagaevm.jsonrpc.sagarpc.io";
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const contract = new ethers.Contract(
              contractAddress,
              DataBankABI.abi,
              provider
            );
            
            // Get current total count from blockchain
            const queryId = DATABANK_PRICE_PAIRS[selectedDataBankFeed];
            const currentCount = await contract.getAggregateValueCount(queryId);
            const currentCountNum = Number(currentCount);
            
            // Get the current number of transactions we have locally
            const localTransactionCount = currentValueRef.current.length;
            
            // Only fetch if there are actually new transactions
            if (currentCountNum > localTransactionCount) {
              const newTransactionCount = currentCountNum - localTransactionCount;
              
              // Recalculate block time if toggle is enabled (same as Tellor feeds)
              let currentRefreshBlockTime = avgBlockTime;



              
              if (includeBlockTime) {
                const blockTime = await calculateAverageBlockTime(provider, contractAddress);
                currentRefreshBlockTime = blockTime;

              } else {

              }
              

              
              // Fetch only the new transactions (from local count to current count-1)
              const newTransactions = await fetchNewTransactionsOnly(contract, queryId, localTransactionCount, currentCountNum, cancellationToken, currentRefreshBlockTime);
              
              if (newTransactions && newTransactions.length > 0) {
                // Validate that we're still processing the correct feed before updating
                if (currentFeed !== selectedDataBankFeed) {
                  return;
                }
                
                // Append new transactions to existing data and sort by timestamp (newest first)
                setCurrentValue(prevData => {
                  // CRITICAL: Validate we're still on the correct feed
                  if (currentFeed !== selectedDataBankFeed || currentFeedRef.current !== selectedDataBankFeed) {
                    return prevData;
                  }
                  
                  // CRITICAL: Clean existing data to remove any cross-feed contamination
                  const cleanedPrevData = isDataBankContract && currentFeedRef.current 
                    ? prevData.filter(existing => !existing.pair || existing.pair === currentFeedRef.current)
                    : prevData;
                  
                  // For DataBank contracts, filter to only include data for current feed
                  let filteredNewTransactions;
                  if (isDataBankContract && currentFeedRef.current) {
                    filteredNewTransactions = newTransactions.filter(tx => tx.pair && tx.pair === currentFeedRef.current);
                  } else {
                    // For Tellor contracts, include all new transactions
                    filteredNewTransactions = newTransactions;
                  }
                  
                  if (filteredNewTransactions.length === 0) {
                    return cleanedPrevData; // No valid transactions to add
                  }
                  
                  // Remove duplicates before combining
                  const uniqueNewTransactions = filteredNewTransactions.filter(newTx => 
                    !cleanedPrevData.some(existing => 
                      existing.txHash === newTx.txHash || 
                      (existing.pair === newTx.pair && existing._rawTimestamp === newTx._rawTimestamp)
                    )
                  );
                  
                  if (uniqueNewTransactions.length === 0) {
                    return cleanedPrevData; // No unique transactions to add
                  }
                  
                  const combinedData = [...cleanedPrevData, ...uniqueNewTransactions];
                  // Sort by timestamp in descending order (newest first)
                  const sortedData = combinedData.sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    return timeB - timeA; // Descending order
                  });
                  // Update ref
                  currentValueRef.current = sortedData;
                  return sortedData;
                });
              }
            }
          } catch (error) {
            // Silent error handling for background refresh
          }
        }, 30000); // Check every 30 seconds
        
        // Cleanup interval when feed changes or component unmounts
        return () => {
          clearInterval(refreshInterval);
          // Clear data if feed has changed during cleanup
          if (currentFeed !== selectedDataBankFeed) {
            setCurrentValue([]);
            currentValueRef.current = [];
            setInitialFetchComplete(false);
            setIsIncrementalLoading(false);
            setPage(1); // Reset to first page
          }
        };
      } catch (error) {
        setError(error.message || 'Failed to fetch selected feed data');
        setLoading(false);
        setFeedLoading(false);
        setIsIncrementalLoading(false);
      }
    };
    
    // Initial fetch
    fetchSelectedFeedData();
    
  }, [selectedDataBankFeed, contractAddress, fetchDataBankData]);

  // Effect to immediately clear data when feed changes
  useEffect(() => {
    // CRITICAL: Always clear data immediately when feed changes, regardless of feed type
    setCurrentValue([]);
    currentValueRef.current = [];
    setInitialFetchComplete(false);
    setIsIncrementalLoading(false);
    setPage(1); // Reset to first page
    
    // Clear block time state when switching feeds to prevent data corruption
    setAvgBlockTime(0);
    
    if (selectedDataBankFeed) {
      // Setting up for DataBank feed
      setCurrentFeed(selectedDataBankFeed);
      currentFeedRef.current = selectedDataBankFeed; // Update ref immediately
    } else {
      // Clearing feed selection (going to Tellor or no feed)
      setCurrentFeed(null);
      currentFeedRef.current = null; // Update ref immediately
    }
    
    // Force a re-render to ensure UI updates
    setForceUpdate(prev => prev + 1);
    setRenderKey(prev => prev + 1);
  }, [selectedDataBankFeed]);

  // Effect to recalculate block time when toggle changes or feed changes
  useEffect(() => {

    const recalculateBlockTime = async () => {
      if (includeBlockTime) {
        try {
          let rpcUrl;
          if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
            rpcUrl = "https://sagaevm.jsonrpc.sagarpc.io";
          } else {
            rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/c9C61uwd-LHombk09TFBRF-NGhNI75JX";
          }
          

          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const newBlockTime = await calculateAverageBlockTime(provider, contractAddress);

          setAvgBlockTime(newBlockTime);
          
          // If this is a saga feed and we're enabling block time, we need to refresh the data
          if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase() && selectedDataBankFeed && includeBlockTime) {

            // Force a data refresh by clearing the initial fetch flag
            setInitialFetchComplete(false);
            // This will trigger the saga feed useEffect to re-fetch data with the new block time
          }
        } catch (error) {
          console.error('Failed to recalculate block time:', error);
        }
      } else {
        setAvgBlockTime(0);
      }
    };

    recalculateBlockTime();
  }, [includeBlockTime, contractAddress, selectedDataBankFeed]);

  // Effect to clear block time when switching feeds to force recalculation
  useEffect(() => {
    if (selectedDataBankFeed) {

      // Reset block time toggle when switching feeds to prevent data corruption
      setIncludeBlockTime(true);
      setAvgBlockTime(0);

    }
  }, [selectedDataBankFeed]);

  // Effect to reprocess existing data when block time settings change
  useEffect(() => {
    if (!selectedDataBankFeed || !currentValue.length) return;
    




    
    // Safety check: ensure we're processing data for the current feed
    if (currentValue[0] && currentValue[0].pair && currentValue[0].pair !== selectedDataBankFeed) {


      return;
    }
    
    // Don't reprocess if block time toggle is enabled but we don't have the calculated value yet
    if (includeBlockTime && avgBlockTime === 0) {

      return;
    }
    
    // Reprocess the existing data with current block time settings
    const reprocessedData = currentValue.map(item => {

      
      // Check for both timeDiff (numeric) and timeDifference (string) properties
      const hasTimeDiff = item.timeDiff !== undefined;
      const hasTimeDifference = item.timeDifference !== undefined;
      

      
      if (hasTimeDiff) {
        // Handle numeric timeDiff (like Tellor feeds)
        const originalTimeDiff = item._originalTimeDiff || item.timeDiff;

        
        // Store original value if not already stored
        if (!item._originalTimeDiff) {
          item._originalTimeDiff = originalTimeDiff;

        }
        
        // Apply block time adjustment if enabled
        if (includeBlockTime && avgBlockTime > 0) {
          const adjustedTimeDiff = Math.max(0, originalTimeDiff - avgBlockTime);

          return { ...item, timeDiff: adjustedTimeDiff };
        } else {
          // Restore original value if block time is disabled

          return { ...item, timeDiff: originalTimeDiff };
        }
      } else if (hasTimeDifference) {
        // Handle string timeDifference (like Saga feeds)
        let originalTimeDifference = item._originalTimeDifference || item.timeDifference;

        
        // Check if the stored time difference seems wrong or imprecise
        if (item.timestamp && item.relayTimestamp) {
          try {
            const reportedTime = new Date(item.timestamp).getTime();
            const relayedTime = new Date(item.relayTimestamp).getTime();
            const actualDiffSeconds = Math.abs(relayedTime - reportedTime) / 1000;
            
            // Parse the current stored time difference
            const storedTimeInSeconds = parseTimeString(originalTimeDifference) || 0;
            
            // If the stored time is significantly different from the actual timestamp difference
            const timeDifference = Math.abs(actualDiffSeconds - storedTimeInSeconds);
            const shouldRecalculate = originalTimeDifference === '0.0s' || timeDifference > 0.5;
            
            if (shouldRecalculate && actualDiffSeconds > 0.1) {
              const recalculatedDiff = actualDiffSeconds < 60 
                ? `${actualDiffSeconds.toFixed(1)}s`
                : `${Math.floor(actualDiffSeconds / 60)}m ${(actualDiffSeconds % 60).toFixed(1)}s`;
              

              originalTimeDifference = recalculatedDiff;
            }
          } catch (error) {

          }
        }
        
        // Store original value if not already stored
        if (!item._originalTimeDifference) {
          item._originalTimeDifference = originalTimeDifference;

        }
        
        // Apply block time adjustment if enabled
        if (includeBlockTime && avgBlockTime > 0) {
          // Convert string time to numeric seconds for calculation
          const timeInSeconds = parseTimeString(originalTimeDifference);

          
          if (timeInSeconds !== null) {
            const adjustedTimeInSeconds = Math.max(0, timeInSeconds - avgBlockTime);
            const adjustedTimeDifference = formatTimeString(adjustedTimeInSeconds);

            return { ...item, timeDifference: adjustedTimeDifference };
          } else {

            return item;
          }
        } else {
          // Restore original value if block time is disabled

          return { ...item, timeDifference: originalTimeDifference };
        }
      } else {

      }
      return item;
    });
    
    // Update the data with reprocessed values
    setCurrentValue(reprocessedData);
    currentValueRef.current = reprocessedData;
    

  }, [includeBlockTime, avgBlockTime, selectedDataBankFeed, currentValue.length]);

  // Cleanup effect to clear all data when switching contract types
  useEffect(() => {
    // CRITICAL: Always clear data completely when switching contract types
    setCurrentValue([]);
    currentValueRef.current = [];
    setInitialFetchComplete(false);
    setIsIncrementalLoading(false);
    setPage(1); // Reset to first page
    
    // Clear feed references based on contract type
    if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      // Switching to DataBank contract
      if (!selectedDataBankFeed) {
        setCurrentFeed(null);
        currentFeedRef.current = null;
      }
    } else {
      // Switching to Tellor contract - clear DataBank-specific state
      setCurrentFeed(null);
      currentFeedRef.current = null;
    }
    
    // Force re-render
    setForceUpdate(prev => prev + 1);
    setRenderKey(prev => prev + 1);
  }, [contractAddress]);

  // Cleanup effect for component unmount and major state changes
  useEffect(() => {
    return () => {
      // Clear all data and states when component unmounts
      setCurrentValue([]);
      currentValueRef.current = [];
      setInitialFetchComplete(false);
      setIsIncrementalLoading(false);
      setCurrentFeed(null);
      setFeedLoading(false);
      setPage(1); // Reset to first page
    };
  }, []);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (ethers.isAddress(inputAddress)) {
      setContractAddress(inputAddress);
      setError(null);
      // Reset page when switching contracts
      setPage(1);
    } else {
      setError('Invalid Ethereum address');
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const TimeScaleToggle = () => (
    <div className="time-scale-toggle">
      {['recent', 'daily', 'weekly', 'custom'].map((scale) => (
        <button
          key={scale}
          onClick={() => setTimeScale(scale)}
          className={`time-scale-button ${timeScale === scale ? 'active' : ''}`}
        >
          {scale === 'custom' ? 'Date Range' : scale}
        </button>
      ))}
    </div>
  );

  const CustomDateRangeInputs = () => (
    <div className="custom-date-inputs">
      <TextField
        label="Start Date"
        type="datetime-local"
        value={customStartDate}
        onChange={(e) => setCustomStartDate(e.target.value)}
        size="small"
        InputLabelProps={{
          shrink: true,
          style: { color: '#0E5353', fontSize: '0.875rem' }
        }}
        inputProps={{
          style: { color: '#0E5353', fontSize: '0.875rem' }
        }}
        sx={{
          width: '180px',
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
        }}
      />
      <TextField
        label="End Date"
        type="datetime-local"
        value={customEndDate}
        onChange={(e) => setCustomEndDate(e.target.value)}
        size="small"
        InputLabelProps={{
          shrink: true,
          style: { color: '#0E5353', fontSize: '0.875rem' }
        }}
        inputProps={{
          style: { color: '#0E5353', fontSize: '0.875rem' }
        }}
        sx={{
          width: '180px',
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
        }}
      />
    </div>
  );

  const BlockTimeToggle = () => (
    <div className="block-time-toggle">
      <FormControlLabel
        control={
          <Switch
            checked={includeBlockTime}
            onChange={(e) => {


              setIncludeBlockTime(e.target.checked);
            }}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#00b96f',
                '&:hover': {
                  backgroundColor: 'rgba(0, 185, 111, 0.08)',
                },
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#00b96f',
              },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: '#0E5353', fontSize: '0.875rem' }}>
            Remove {contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase() ? 'SagaEVM' : 'EVM'} Block Time
            {includeBlockTime && avgBlockTime > 0 && (
              <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                ({avgBlockTime.toFixed(1)}s avg)
              </span>
            )}
            {includeBlockTime && avgBlockTime === 0 && (
              <span style={{ marginLeft: '8px', opacity: 0.7, color: '#ff6b6b' }}>
                (Calculating...)
              </span>
            )}
          </Typography>
        }
      />
    </div>
  );

  const prepareChartData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return { labels: [], datasets: [] };

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let processedData;
    
    switch(timeScale) {
      case 'recent': {
        // Get the last 12 data points
        const last12Entries = sortedData.slice(-12);
        
        const delays = last12Entries.map(item => {
          let delay = parseFloat(item.timeDifference);
          if (item.timeDifference.includes('m')) {
            const [min, sec] = item.timeDifference.split('m');
            delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
          }
          return delay;
        });

        // Calculate rolling average for benchmark line
        const rollingAverages = delays.map((_, index) => {
          const subset = delays.slice(0, index + 1);
          return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
        });
        
        processedData = {
          labels: last12Entries.map(item => 
            new Date(item.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            })
          ),
          delays: delays,
          averageDelay: rollingAverages
        };
        break;
      }
      
      case 'daily': {
        // Get all data points from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        let recentData = sortedData.filter(item => new Date(item.timestamp) >= sevenDaysAgo);
        
        // Limit to max 100 points to prevent overcrowding
        if (recentData.length > 100) {
          const step = Math.ceil(recentData.length / 100);
          recentData = recentData.filter((_, index) => index % step === 0);
        }
        
        const delays = recentData.map(item => {
          let delay = parseFloat(item.timeDifference);
          if (item.timeDifference.includes('m')) {
            const [min, sec] = item.timeDifference.split('m');
            delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
          }
          return delay;
        });

        // Calculate rolling average for benchmark line
        const rollingAverages = delays.map((_, index) => {
          const subset = delays.slice(0, index + 1);
          return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
        });
        
        processedData = {
          labels: recentData.map(item => 
            new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          ),
          delays: delays,
          averageDelay: rollingAverages
        };
        break;
      }
      
      case 'weekly': {
        // Get all data points from the last 4 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        
        let recentData = sortedData.filter(item => new Date(item.timestamp) >= fourWeeksAgo);
        
        // Limit to max 200 points to prevent overcrowding
        if (recentData.length > 200) {
          const step = Math.ceil(recentData.length / 200);
          recentData = recentData.filter((_, index) => index % step === 0);
        }
        
        const delays = recentData.map(item => {
          let delay = parseFloat(item.timeDifference);
          if (item.timeDifference.includes('m')) {
            const [min, sec] = item.timeDifference.split('m');
            delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
          }
          return delay;
        });

        // Calculate rolling average for benchmark line
        const rollingAverages = delays.map((_, index) => {
          const subset = delays.slice(0, index + 1);
          return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
        });
        
        processedData = {
          labels: recentData.map(item => 
            new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          ),
          delays: delays,
          averageDelay: rollingAverages
        };
        break;
      }
      
      case 'custom': {
        // Handle custom date range
        if (!customStartDate || !customEndDate) {
          // If no custom dates set, fall back to weekly view
          const fourWeeksAgo = new Date();
          fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
          
          let recentData = sortedData.filter(item => new Date(item.timestamp) >= fourWeeksAgo);
          
          if (recentData.length > 200) {
            const step = Math.ceil(recentData.length / 200);
            recentData = recentData.filter((_, index) => index % step === 0);
          }
          
          const delays = recentData.map(item => {
            let delay = parseFloat(item.timeDifference);
            if (item.timeDifference.includes('m')) {
              const [min, sec] = item.timeDifference.split('m');
              delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
            }
            return delay;
          });

          const rollingAverages = delays.map((_, index) => {
            const subset = delays.slice(0, index + 1);
            return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
          });
          
          processedData = {
            labels: recentData.map(item => 
              new Date(item.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            ),
            delays: delays,
            averageDelay: rollingAverages
          };
        } else {
          // Filter data by custom date range
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          
          let customData = sortedData.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= startDate && itemDate <= endDate;
          });
          
          // Limit to max 300 points to prevent overcrowding
          if (customData.length > 300) {
            const step = Math.ceil(customData.length / 300);
            customData = customData.filter((_, index) => index % step === 0);
          }
          
          const delays = customData.map(item => {
            let delay = parseFloat(item.timeDifference);
            if (item.timeDifference.includes('m')) {
              const [min, sec] = item.timeDifference.split('m');
              delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
            }
            return delay;
          });

          const rollingAverages = delays.map((_, index) => {
            const subset = delays.slice(0, index + 1);
            return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
          });
          
          processedData = {
            labels: customData.map(item => 
              new Date(item.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            ),
            delays: delays,
            averageDelay: rollingAverages
          };
        }
        break;
      }
      
      default: {
        // Fall back to weekly view for any unexpected timeScale
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        
        let recentData = sortedData.filter(item => new Date(item.timestamp) >= fourWeeksAgo);
        
        if (recentData.length > 200) {
          const step = Math.ceil(recentData.length / 200);
          recentData = recentData.filter((_, index) => index % step === 0);
        }
        
        const delays = recentData.map(item => {
          let delay = parseFloat(item.timeDifference);
          if (item.timeDifference.includes('m')) {
            const [min, sec] = item.timeDifference.split('m');
            delay = (parseInt(min) * 60) + parseFloat(sec.replace('s', ''));
          }
          return delay;
        });

        const rollingAverages = delays.map((_, index) => {
          const subset = delays.slice(0, index + 1);
          return subset.reduce((sum, delay) => sum + delay, 0) / subset.length;
        });
        
        processedData = {
          labels: recentData.map(item => 
            new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          ),
          delays: delays,
          averageDelay: rollingAverages
        };
        break;
      }
    }

    return {
      labels: processedData.labels,
      datasets: [
        {
          label: 'Rolling Average',
          data: processedData.averageDelay,
          borderColor: '#4e597b',
          backgroundColor: 'rgba(78, 89, 123, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
        },
        {
          label: `${timeScale === 'recent' ? 'Current' : 'Individual'} Delay${includeBlockTime ? ' (Block Time Adj.)' : ''} (seconds)`,
          data: processedData.delays,
          borderColor: '#00b96f',
          backgroundColor: 'rgba(0, 185, 111, 0.2)',
          borderWidth: timeScale === 'recent' ? 2 : 1,
          pointRadius: timeScale === 'recent' ? 4 : 2,
          pointHoverRadius: timeScale === 'recent' ? 6 : 4,
          pointBackgroundColor: '#00b96f',
          pointBorderColor: '#00b96f',
          tension: 0.1,
        }
      ]
    };
  };

  // Helper function to format prices with 2 decimals and with commas
  const formatPrice = (value) => {
    if (isNaN(value) || value === null || value === undefined) return '$0.00';
    const rounded = Math.round(value * 100) / 100; // Round to 2 decimal places
    return '$' + rounded.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const preparePriceChartData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return { labels: [], datasets: [] };

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let processedData;
    
    switch(timeScale) {
      case 'recent': {
        // Get the last 12 data points
        const last12Entries = sortedData.slice(-12);
        
        const prices = last12Entries.map(item => {
          // Parse price value - remove commas and convert to number
          const priceStr = item.value.toString().replace(/,/g, '');
          const price = parseFloat(priceStr);
          return price;
        });

        // Calculate rolling average for benchmark line
        const rollingAverages = prices.map((_, index) => {
          const subset = prices.slice(0, index + 1);
          const validPrices = subset.filter(price => !isNaN(price) && price > 0);
          const avg = validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0;
          // Round to 2 decimal places for consistent precision
          return Math.round(avg * 100) / 100;
        });
        
        processedData = {
          labels: last12Entries.map(item => 
            new Date(item.timestamp).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            })
          ),
          prices: prices,
          averagePrice: rollingAverages
        };
        break;
      }
      
      case 'daily': {
        // Get all data points from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        let recentData = sortedData.filter(item => new Date(item.timestamp) >= sevenDaysAgo);
        
        // Limit to max 100 points to prevent overcrowding
        if (recentData.length > 100) {
          const step = Math.ceil(recentData.length / 100);
          recentData = recentData.filter((_, index) => index % step === 0);
        }
        
        const prices = recentData.map(item => {
          const priceStr = item.value.toString().replace(/,/g, '');
          return parseFloat(priceStr);
        });

        const rollingAverages = prices.map((_, index) => {
          const subset = prices.slice(0, index + 1);
          const validPrices = subset.filter(price => price > 0);
          const avg = validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0;
          return Math.round(avg * 100) / 100;
        });
        
        processedData = {
          labels: recentData.map(item => 
            new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          ),
          prices: prices,
          averagePrice: rollingAverages
        };
        break;
      }
      
      case 'weekly': {
        // Get all data points from the last 4 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        
        let recentData = sortedData.filter(item => new Date(item.timestamp) >= fourWeeksAgo);
        
        // Limit to max 200 points to prevent overcrowding
        if (recentData.length > 200) {
          const step = Math.ceil(recentData.length / 200);
          recentData = recentData.filter((_, index) => index % step === 0);
        }
        
        const prices = recentData.map(item => {
          const priceStr = item.value.toString().replace(/,/g, '');
          return parseFloat(priceStr);
        });

        const rollingAverages = prices.map((_, index) => {
          const subset = prices.slice(0, index + 1);
          const validPrices = subset.filter(price => price > 0);
          const avg = validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0;
          return Math.round(avg * 100) / 100;
        });
        
        processedData = {
          labels: recentData.map(item => 
            new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          ),
          prices: prices,
          averagePrice: rollingAverages
        };
        break;
      }
      
      case 'custom': {
        // Handle custom date range
        if (!customStartDate || !customEndDate) {
          // If no custom dates set, fall back to weekly view
          const fourWeeksAgo = new Date();
          fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
          
          let recentData = sortedData.filter(item => new Date(item.timestamp) >= fourWeeksAgo);
          
          if (recentData.length > 200) {
            const step = Math.ceil(recentData.length / 200);
            recentData = recentData.filter((_, index) => index % step === 0);
          }
          
          const prices = recentData.map(item => {
            const priceStr = item.value.toString().replace(/,/g, '');
            return parseFloat(priceStr);
          });

          const rollingAverages = prices.map((_, index) => {
            const subset = prices.slice(0, index + 1);
            const validPrices = subset.filter(price => !isNaN(price) && price > 0);
            const avg = validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0;
            return Math.round(avg * 100) / 100;
          });
          
          processedData = {
            labels: recentData.map(item => 
              new Date(item.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            ),
            prices: prices,
            averagePrice: rollingAverages
          };
        } else {
          // Filter data by custom date range
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          
          let customData = sortedData.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= startDate && itemDate <= endDate;
          });
          
          // Limit to max 300 points to prevent overcrowding
          if (customData.length > 300) {
            const step = Math.ceil(customData.length / 300);
            customData = customData.filter((_, index) => index % step === 0);
          }
          
          const prices = customData.map(item => {
            const priceStr = item.value.toString().replace(/,/g, '');
            return parseFloat(priceStr);
          });

          const rollingAverages = prices.map((_, index) => {
            const subset = prices.slice(0, index + 1);
            const validPrices = subset.filter(price => !isNaN(price) && price > 0);
            const avg = validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0;
            return Math.round(avg * 100) / 100;
          });
          
          processedData = {
            labels: customData.map(item => 
              new Date(item.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            ),
            prices: prices,
            averagePrice: rollingAverages
          };
        }
        break;
      }
      
      default: {
        // Fall back to weekly view for any unexpected timeScale
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        
        let recentData = sortedData.filter(item => new Date(item.timestamp) >= fourWeeksAgo);
        
        if (recentData.length > 200) {
          const step = Math.ceil(recentData.length / 200);
          recentData = recentData.filter((_, index) => index % step === 0);
        }
        
        const prices = recentData.map(item => {
          const priceStr = item.value.toString().replace(/,/g, '');
          return parseFloat(priceStr);
        });

        const rollingAverages = prices.map((_, index) => {
          const subset = prices.slice(0, index + 1);
          const validPrices = subset.filter(price => price > 0);
          const avg = validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0;
          return Math.round(avg * 100) / 100;
        });
        
        processedData = {
          labels: recentData.map(item => 
            new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          ),
          prices: prices,
          averagePrice: rollingAverages
        };
        break;
      }
    }


    return {
      labels: processedData.labels,
      datasets: [
        {
          label: 'Rolling Average',
          data: processedData.averagePrice,
          borderColor: 'rgb(17, 122, 118)',
          backgroundColor: 'rgba(183, 184, 184, 0.34)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
        },
        {
          label: `${timeScale === 'recent' ? 'Current' : 'Individual'} Price (USD)`,
          data: processedData.prices,
          borderColor: '#00d6b9',
          backgroundColor: 'rgb(66, 255, 255)',
          borderWidth: timeScale === 'recent' ? 2 : 1,
          pointRadius: timeScale === 'recent' ? 4 : 2,
          pointHoverRadius: timeScale === 'recent' ? 6 : 4,
          pointBackgroundColor: '#00d6b9',
          pointBorderColor: '#00d6b9',
          tension: 0.1,
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
        text: `Delay - ${
          timeScale === 'recent' ? 'Recent' : 
          timeScale === 'custom' ? 'Custom Date Range' :
          'Detailed ' + timeScale.charAt(0).toUpperCase() + timeScale.slice(1)
        } View${includeBlockTime ? ' (Block Time Adjusted)' : ''}`,
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

  const priceChartOptions = {
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
        text: `Price - ${
          timeScale === 'recent' ? 'Recent' : 
          timeScale === 'custom' ? 'Custom Date Range' :
          'Detailed ' + timeScale.charAt(0).toUpperCase() + timeScale.slice(1)
        } View`,
        color: '#0E5353',
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatPrice(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          color: '#0E5353',
          callback: function(value) {
            return formatPrice(value);
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


            {/* Header with Logo and Status */}
      <Grid container alignItems="center" sx={{ mt: 4, mb: 3 }}>
        <Grid item xs={12} sm={6} sx={{ mb: { xs: 2, sm: 0 } }}>
          <img 
            src="/tellor-relayer-logo.png" 
            alt="Tellor Relayer"
            style={{
              height: '50px',
              width: 'auto',
              display: 'block'
            }}
          />
          
        </Grid>
      </Grid>

      {/* Side-by-Side Layout: Left (Price Feeds + Data Feed) | Right (Chart) */}
      <div className="datafeed-container">
        {/* Left Column - Price Feeds + Data Feed */}
        <div className="datafeed-left-column">
          {/* Oracle Price Feeds */}
          <div className="price-feeds-container">
            {/* Feed Selection - Responsive Layout */}
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-between' }}>
              {/* Left Side - Feed Sections */}
              <div style={{ display: 'flex', gap: '40px', flex: '0 0 auto' }}>
                {/* Ethereum Feeds */}
                <div>
                  <Typography variant="body2" sx={{ color: '#0E5353', fontWeight: 'bold', mb: 2, fontSize: '14px' }}>
                    Sepolia Feeds:
                    {feedLoading && !isDataBankContract && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '12px', 
                        opacity: 0.7,
                        fontWeight: 'normal'
                      }}>
                        (Loading...)
                      </span>
                    )}
                  </Typography>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                      onClick={() => {
                        if (feedLoading) return; // Prevent clicks during loading
                        
                        setFeedLoading(true); // Start loading immediately
                        
                        // Clear DataBank feed selection immediately
                        setSelectedDataBankFeed(null);
                        
                        // Set contract states
                        setIsDataBankContract(false);
                        setContractAddress('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
                        setInputAddress('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
                        
                        // Clear current data immediately to show loading state
                        setCurrentValue([]);
                        currentValueRef.current = [];
                        setCurrentFeed(null);
                        currentFeedRef.current = null;
                        setInitialFetchComplete(false);
                        setIsIncrementalLoading(false);
                        setPage(1);
                        
                        // Force re-render
                        setForceUpdate(prev => prev + 1);
                        setRenderKey(prev => prev + 1);
                      }}
                      disabled={feedLoading}
                  style={{
                      minWidth: '110px',
                    padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: (!isDataBankContract && !selectedDataBankFeed) ? 'bold' : 'normal',
                        backgroundColor: (!isDataBankContract && !selectedDataBankFeed) ? '#0E5353' : 'transparent',
                        color: (!isDataBankContract && !selectedDataBankFeed) ? 'white' : '#0E5353',
                        border: `2px solid #0E5353`,
                      borderRadius: '4px',
                      cursor: feedLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                        opacity: feedLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!feedLoading) {
                          e.target.style.backgroundColor = (!isDataBankContract && !selectedDataBankFeed) ? '#0E5353' : 'rgba(14, 83, 83, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!feedLoading) {
                          e.target.style.backgroundColor = (!isDataBankContract && !selectedDataBankFeed) ? '#0E5353' : 'transparent';
                        }
                      }}
                    >
                      {feedLoading && !selectedDataBankFeed ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <CircularProgress size={12} style={{ color: 'white' }} />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column-reverse',
                              gap: '1px', 
                              height: '10px',
                              justifyContent: 'center',
                              alignItems: 'center',
                              flexShrink: 0
                            }}
                            title={`Risk Level: ${FEED_RISK_ASSESSMENT['ETH/USD'] === 'exemplary' ? 'Exemplary (3/3)' : FEED_RISK_ASSESSMENT['ETH/USD'] === 'moderate' ? 'Moderate (2/3)' : 'High Risk (1/3)'}`}
                          >
                            {Array.from({ length: 3 }, (_, index) => (
                              <div
                                key={index}
                                style={{
                                  width: '6px',
                                  height: '2px',
                                  backgroundColor: index < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT['ETH/USD'] || 'high'] 
                                    ? ((!isDataBankContract && !selectedDataBankFeed) ? 'white' : '#0E5353')
                                    : 'rgba(255,255,255,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          <span>ETH/USD</span>
                        </div>
                      )}
                  </button>
                  </div>
                </div>

                {/* Saga Feeds */}
                <div>
                <Typography variant="body2" sx={{ color: '#0E5353', fontWeight: 'bold', mb: 2, fontSize: '14px' }}>
                  Saga Feeds:
                  {feedLoading && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '12px', 
                      opacity: 0.7,
                      fontWeight: 'normal'
                    }}>
                      (Loading...)
                    </span>
                  )}
                </Typography>
                
                
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 125,
                    height: '36px',
                    '& .MuiOutlinedInput-root': {
                      color: '#0E5353',
                      height: '36px',
                      '& fieldset': {
                        borderColor: '#0E5353',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#0E5353',
                        borderWidth: '2px',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0E5353',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiSelect-icon': {
                      color: '#0E5353',
                    }
                  }}
                >
                  <InputLabel sx={{ color: '#0E5353' }}>Select Feed</InputLabel>
                  <Select
                    value={selectedDataBankFeed || ''}
                    label="Select Saga Feed"
                    onChange={(e) => {
                      const selectedFeed = e.target.value;
                      if (feedLoading) return;
                      
                      if (selectedFeed === '') {
                        // Deselect
                        setFeedLoading(true);
                        setCancellationToken(prev => prev + 1);
                          currentValueRef.current = [];
                          currentFeedRef.current = null;
                          setCurrentValue([]);
                          setCurrentFeed(null);
                          setInitialFetchComplete(false);
                          setIsIncrementalLoading(false);
                        setPage(1);
                        setForceUpdate(prev => prev + 1);
                        setRenderKey(prev => prev + 1);
                          setSelectedDataBankFeed(null);
                          setIsDataBankContract(false);
                          setContractAddress('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
                          setInputAddress('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
                        } else {
                        // Select new feed
                        setFeedLoading(true);
                        setCancellationToken(prev => prev + 1);
                          currentValueRef.current = [];
                        currentFeedRef.current = selectedFeed;
                          setCurrentValue([]);
                        setCurrentFeed(selectedFeed);
                          setInitialFetchComplete(false);
                          setIsIncrementalLoading(false);
                        setPage(1);
                        setForceUpdate(prev => prev + 1);
                        setRenderKey(prev => prev + 1);
                        setSelectedDataBankFeed(selectedFeed);
                          setIsDataBankContract(true);
                          setContractAddress('0x6f250229af8D83c51500f3565b10E93d8907B644');
                          setInputAddress('0x6f250229af8D83c51500f3565b10E93d8907B644');
                        }
                      }}
                      disabled={feedLoading}
                    renderValue={(selected) => {
                      if (!selected) return '';
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div 
                      style={{ 
                              display: 'flex', 
                              flexDirection: 'column-reverse',
                              gap: '1px', 
                              height: '10px',
                              justifyContent: 'flex-start',
                              flexShrink: 0
                            }}
                          >
                            {Array.from({ length: 3 }, (_, index) => (
                              <div
                                key={index}
                                style={{
                                  width: '6px',
                                  height: '2px',
                                  backgroundColor: index < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT[selected] || 'high'] 
                                    ? '#0E5353'
                                    : 'rgba(14,83,83,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          <span>{selected}</span>
                        </div>
                      );
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {/* All feeds */}
                    {Object.entries(DATABANK_PRICE_PAIRS)
                      .map(([pairName, queryId]) => (
                      <MenuItem key={pairName} value={pairName}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column-reverse',
                              gap: '1px', 
                              height: '10px',
                              justifyContent: 'flex-start',
                              flexShrink: 0
                            }}
                            title={`Risk Level: ${FEED_RISK_ASSESSMENT[pairName] === 'exemplary' ? 'Exemplary (3/3)' : FEED_RISK_ASSESSMENT[pairName] === 'moderate' ? 'Moderate (2/3)' : 'High Risk (1/3)'}`}
                          >
                            {Array.from({ length: 3 }, (_, index) => (
                              <div
                                key={index}
                                style={{
                                  width: '6px',
                                  height: '2px',
                                  backgroundColor: index < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT[pairName] || 'high'] 
                                    ? 'white'
                                    : 'rgba(255,255,255,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          <span>{pairName}</span>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                </div>
              </div>
              
              {/* Right Side - Best Practices Rating Legend */}
              <div style={{ 
                padding: '12px 16px', 
                backgroundColor: 'rgba(14, 83, 83, 0.05)', 
                borderRadius: '6px',
                border: '1px solid rgba(14, 83, 83, 0.1)',
                width: 'fit-content',
                alignSelf: 'flex-end'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Typography variant="caption" sx={{ 
                    color: '#0E5353', 
                    fontWeight: 'bold', 
                    fontSize: '11px'
                  }}>
                    'Best Practices' Rating:
                  </Typography>
                  <Tooltip
                    title={
                      <div style={{ padding: '12px', textAlign: 'center' }}>
                        <img 
                          src="/BPR.png" 
                          alt="Best Practices Rating Chart"
                          style={{ 
                            maxWidth: '800px', 
                            width: '100%', 
                            height: 'auto',
                            borderRadius: '6px',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div style={{ 
                          display: 'none', 
                          color: 'white', 
                          fontSize: '14px', 
                          padding: '20px',
                          textAlign: 'center'
                        }}>
                          Best Practices Rating Chart<br/>
                          <span style={{ fontSize: '12px', opacity: 0.8 }}>
                            (Add Best-practices-Rating.png to public folder)
                          </span>
                        </div>
                      </div>
                    }
                    placement="bottom"
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'rgba(0, 0, 0, 0.9)',
                          maxWidth: '850px',
                          '& .MuiTooltip-arrow': {
                            color: 'rgba(0, 0, 0, 0.9)',
                          },
                        },
                      },
                    }}
                  >
                    <InfoOutlined sx={{ 
                      fontSize: '14px', 
                      color: '#0E5353', 
                      cursor: 'help',
                      opacity: 0.7,
                      '&:hover': {
                        opacity: 1
                      }
                    }} />
                  </Tooltip>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column-reverse',
                      gap: '1px', 
                      height: '8px'
                    }}>
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} style={{
                          width: '6px',
                          height: '2px',
                          backgroundColor: '#0E5353',
                          borderRadius: '1px'
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', color: '#0E5353' }}>Exemplary</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column-reverse',
                      gap: '1px', 
                      height: '8px'
                    }}>
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} style={{
                          width: '6px',
                          height: '2px',
                          backgroundColor: i < 2 ? '#0E5353' : 'rgba(14, 83, 83, 0.3)',
                          borderRadius: '1px'
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', color: '#0E5353' }}>Moderate</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column-reverse',
                      gap: '1px', 
                      height: '8px'
                    }}>
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} style={{
                          width: '6px',
                          height: '2px',
                          backgroundColor: i < 1 ? '#0E5353' : 'rgba(14, 83, 83, 0.3)',
                          borderRadius: '1px'
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', color: '#0E5353' }}>High Risk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Feed - Now Inside Left Column */}
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: 'fit-content'
          }}>
            
            {/* Show incremental loading status */}
            {isIncrementalLoading && (
              <div style={{ 
                padding: '16px 20px', 
                textAlign: 'center',
                color: '#0E5353',
                backgroundColor: 'rgba(14, 83, 83, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CircularProgress size={16} style={{ color: '#0E5353' }} />
                  <span>Loading transactions ...</span>
                </div>

              </div>
            )}
            
            {/* Loading indicator for feed selection */}
            {feedLoading && !isIncrementalLoading && (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center',
                color: '#0E5353',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <CircularProgress size={20} style={{ color: '#0E5353' }} />
                <span>Fetching {selectedDataBankFeed} data...</span>
              </div>
            )}
            
            <Grid container spacing={2} key={`${renderKey}-${forceUpdate}`}>
              {/* Data feed items */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {feedLoading ? (
                    // Show loading state when fetching feed data
                    <Grid item xs={12}>
                      <div style={{ 
                        padding: '40px', 
                        textAlign: 'center',
                        color: '#0E5353'
                      }}>
                        <CircularProgress size={40} style={{ color: '#0E5353', marginBottom: '16px' }} />
                        <div>Loading {selectedDataBankFeed} data...</div>
                        <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
                          This may take a few moments while we fetch the latest transactions
                        </div>
                      </div>
                    </Grid>
                  ) : Array.isArray(currentValue) && currentValue.length > 0 ? (
                    // Show data when available - FILTER appropriately based on contract type
                    currentValue
                      .filter(data => {
                        // CRITICAL: For DataBank contracts, only show current feed data
                        if (isDataBankContract && selectedDataBankFeed && data.pair) {
                          return data.pair === selectedDataBankFeed;
                        }
                        // CRITICAL: For Tellor contracts, exclude any data with pair property (DataBank data)
                        if (!isDataBankContract && !selectedDataBankFeed) {
                          return !data.pair; // Only show data without pair property (Tellor data)
                        }
                        // Fallback: don't show data if we're in an inconsistent state
                        return false;
                      })
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
                            onClick={() => {
                              if (isDataBankContract) {
                                // For DataBank, link to the transactions tab to see all transactions
                                window.open(`https://sagaevm.sagaexplorer.io/address/${contractAddress}?tab=transactions`, '_blank');
                              } else {
                                // For Tellor, use the contract address
                                window.open(ETHERSCAN_BASE_URL + contractAddress, '_blank');
                              }
                            }}
                          >
                            <CardContent sx={{ py: '8px !important' }}>
                              <Grid container spacing={2}>
                                {/* First Row - Main Data */}
                                <Grid item xs={12}>
                                  <Grid container alignItems="center" spacing={3}>
                                    <Grid item xs={12} sm={2.4}>
                                      <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                                        <span style={{ fontWeight: 'bold' }}>
                                          {isDataBankContract && data.pair ? data.pair : 'ETH/USD'}:
                                        </span> ${data.value}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={2.4}>
                                      <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                                        <span style={{ fontWeight: 'bold' }}>Power:</span> {data.aggregatePower}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={2.4}>
                                      <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                                        <span style={{ fontWeight: 'bold' }}>Reported:</span> {data.timestamp}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={2.4}>
                                      <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                                        <span style={{ fontWeight: 'bold' }}>Relayed:</span> {data.relayTimestamp}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={2.4}>
                                      <Typography variant="body2" color="textSecondary" gutterBottom={false}>
                                        <span style={{ fontWeight: 'bold' }}>Delay:</span> {data.timeDifference}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                  ) : (
                    // Show no data message when not loading and no data
                    <Grid item xs={12}>
                      <div style={{ 
                        padding: '40px', 
                        textAlign: 'center',
                        color: '#0E5353',
                        opacity: 0.7
                      }}>
                        {loading ? (
                          <div>
                            <CircularProgress size={40} style={{ color: '#0E5353', marginBottom: '16px' }} />
                            <div>Loading data...</div>
                          </div>
                        ) : (
                          <div>No data available for the selected feed</div>
                        )}
                      </div>
                    </Grid>
                  )}
                </Grid>
                
                {/* Pagination */}
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  {!feedLoading && (
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
                  )}
                </Grid>
              </Grid>
            </Grid>
          </div>
        </div>

        {/* Right Column - Chart */}
        <div className="analytics-dashboard">
          {/* Chart header - simple title */}
          <div className="analytics-dashboard-header">
            <Typography variant="h6" className="analytics-dashboard-title">
              {feedLoading ? (
                <div className="analytics-loading">
                  <CircularProgress size={18} className="loading-spinner" />
                  Loading Chart...
                </div>
              ) : (
                'Performance Analytics Dashboard'
              )}
            </Typography>
          </div>
          
          {/* Controls directly in chart container */}
          {!feedLoading && (
            <>
              <BlockTimeToggle />
              <TimeScaleToggle />
              {timeScale === 'custom' && <CustomDateRangeInputs />}
            </>
          )}
          
          {/* Delay Performance Chart */}
          <div className="chart-container">
            {feedLoading ? (
              <div className="chart-loading">
                <CircularProgress size={40} className="loading-spinner" />
                <div>Loading chart data...</div>
              </div>
            ) : (
              <Line 
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false
                }} 
                data={prepareChartData(currentValue)} 
              />
            )}
          </div>

          {/* Price Performance Chart */}
          <div className="chart-container">
            {feedLoading ? (
              <div className="chart-loading">
                <CircularProgress size={40} className="loading-spinner" />
                <div>Loading price chart data...</div>
              </div>
            ) : (
              <Line 
                options={{
                  ...priceChartOptions,
                  maintainAspectRatio: false
                }} 
                data={preparePriceChartData(currentValue)} 
              />
            )}
          </div>
          
          {/* Chart footer with additional info */}
          <div className="chart-footer">
            <Typography variant="caption" className="chart-footer-text">
              Data updates every 30 seconds • Hover for detailed metrics
            </Typography>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default DataFeed;