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
  FormControlLabel
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
import DataBankABI from '../contracts/DataBank.json';

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
  'FBTC/USD': '0xc444759b83c7bb0f6694306e1f719e65679d48ad754a31d3a366856becf1e71e'
};

const DataFeed = () => {
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
  const [includeBlockTime, setIncludeBlockTime] = useState(false);
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

  // Function to determine which ABI to use based on contract address
  const getContractABI = (address) => {
    if (address.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      return DataBankABI.abi;
    }
    return TellorABI;
  };

    // Function to fetch data from DataBank contract - CLEAN SINGLE FEED VERSION
  // Function to fetch data from DataBank contract - CLEAN SINGLE FEED VERSION
const fetchDataBankData = useCallback(async (contract, provider, targetFeed = null) => {
  try {
    console.log('=== fetchDataBankData CALLED ===');
    console.log('Target feed parameter:', targetFeed);
    console.log('Fetching DataBank data...');
    
    let data = [];
    
    // CRITICAL: Only process the SPECIFIC feed passed as parameter
    if (!targetFeed) {
      console.log('No target feed specified, returning empty data');
      return [];
    }
    
    const queryId = DATABANK_PRICE_PAIRS[targetFeed];
    if (!queryId) {
      console.log(`No queryId found for feed: ${targetFeed}`);
      return [];
    }
    
    console.log(`Processing ONLY ${targetFeed} with queryId: ${queryId}`);
    
    try {
      // Step 1: Get the total count of updates for this specific price pair
      const valueCount = await contract.getAggregateValueCount(queryId);
      console.log(`${targetFeed} has ${valueCount} total updates`);
      
      if (valueCount && valueCount > 0) {
        // Start incremental loading
        setIsIncrementalLoading(true);
        
        // Step 2: Process transactions asynchronously to allow React to update UI
        const processTransactions = async () => {
          for (let index = 0; index < valueCount; index++) {
            try {
              console.log(`Fetching ${targetFeed} update ${index + 1}/${valueCount}...`);
              
              // Get the individual update data
              const updateData = await contract.getAggregateByIndex(queryId, index);
              console.log(`${targetFeed} update ${index + 1} data:`, updateData);
              
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
                      
                      console.log(`Decoded price for ${targetFeed} update ${index + 1}: $${price}`);
                    } catch (decodeError) {
                      console.log(`Error decoding price:`, decodeError.message);
                      price = "Decode error";
                    }
                  } else {
                    price = "0.00";
                  }
                  
                  // Extract timestamps and power from the update data using numeric indices
                  power = updateData[1] || 0;                    // index 1: power
                  aggregateTimestamp = updateData[2] || 0;       // index 2: aggregateTimestamp  
                  relayTimestamp = updateData[4] || 0;           // index 4: relayTimestamp
                  
                } catch (decodeError) {
                  console.log(`Error decoding ${targetFeed} update ${index + 1}:`, decodeError.message);
                  price = "Decode error";
                }
                
                // Handle timestamp conversion
                const aggTimestampMs = Number(aggregateTimestamp);
                const relayTimestampMs = Number(relayTimestamp);
                const finalRelayTimestamp = relayTimestampMs < 10000000000 ? relayTimestampMs * 1000 : relayTimestampMs;
                
                // Calculate time difference in seconds
                const timeDiff = aggTimestampMs && finalRelayTimestamp 
                  ? Math.abs(finalRelayTimestamp - aggTimestampMs) / 1000
                  : 0;
                
                // Get real block number from current blockchain state
                let realBlockNumber = "Fetching...";
                try {
                  const currentBlock = await provider.getBlockNumber();
                  realBlockNumber = currentBlock;
                  console.log(`📦 Real block number for ${targetFeed} update ${index + 1}: ${realBlockNumber}`);
                } catch (blockError) {
                  console.log(`⚠️ Could not fetch real block number, using timestamp approximation:`, blockError.message);
                  realBlockNumber = Math.floor(aggTimestampMs / 1000) || "Unknown";
                }
                
                // Create the data entry
                const newTransaction = {
                  value: price,
                  timestamp: aggTimestampMs ? new Date(aggTimestampMs).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  }) : "Unknown",
                  aggregatePower: power.toString() || "1",
                  relayTimestamp: finalRelayTimestamp ? new Date(finalRelayTimestamp).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  }) : "Unknown",
                  timeDifference: `${timeDiff.toFixed(1)}s`,
                  blockNumber: realBlockNumber,
                  pair: targetFeed,
                  txHash: `update_${targetFeed}_${index}_${Date.now()}`,
                  note: `Update ${index + 1}/${valueCount}`,
                  // Keep raw timestamp for sorting
                  _rawTimestamp: aggTimestampMs
                };
                
                // CRITICAL: Update the UI immediately with each new transaction
                setCurrentValue(prevData => {
                  const updatedData = [...prevData, newTransaction];
                  // Sort by timestamp descending (newest first)
                  const sortedData = updatedData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
                  // Update ref for immediate access
                  currentValueRef.current = sortedData;
                  console.log(`🔄 Ref updated: ${sortedData.length} transactions, latest: ${sortedData[0]?.value}`);
                  // Force re-render by updating forceUpdate state
                  setForceUpdate(prev => prev + 1);
                  return sortedData;
                });
                
                // Force React to re-render immediately by updating render key
                setRenderKey(prev => prev + 1);
                
                // Additional force update to ensure re-render
                setCurrentValue(currentValue => [...currentValue]);
                
                console.log(`✅ Added ${targetFeed} update ${index + 1} to UI immediately`);
                
                // CRITICAL: Use setTimeout to break out of synchronous execution and allow React to update
                await new Promise(resolve => setTimeout(resolve, 0));
              }
              
            } catch (indexError) {
              console.log(`Error fetching ${targetFeed} update ${index + 1}:`, indexError.message);
            }
          }
          
          // Finish incremental loading
          setIsIncrementalLoading(false);
        };
        
        // Start processing transactions asynchronously
        processTransactions();
      } else {
        console.log(`${targetFeed} has no updates available`);
      }
      
    } catch (functionError) {
      console.log('Error with DataBank contract functions:', functionError.message);
      setIsIncrementalLoading(false);
    }
    
    console.log(`Successfully fetched all updates for ${targetFeed}`);
    
    // Return the final data (though UI is already updated incrementally)
    return [];
    
  } catch (error) {
    console.error('Error fetching DataBank data:', error);
    setIsIncrementalLoading(false);
    throw error;
  }
}, [includeBlockTime, avgBlockTime]);

  // Function to fetch data from Tellor contract
  const fetchTellorData = useCallback(async (contract, provider) => {
    try {
      console.log('Fetching Tellor data...');
        
        const result = await contract.getAllExtendedData();
      console.log('Raw Tellor result:', result);

        if (result && result.length > 0) {
          console.log('Number of transactions:', result.length);
          console.log('Sample transaction data:', result[0]);
          
          // Process all transactions, sort by timestamp descending
          const processedData = await Promise.all(result.map(async (data, index, array) => {
            // Convert BigInt values to numbers
            const timestamp = typeof data.timestamp === 'bigint' ? Number(data.timestamp) : Number(data.timestamp);
            const relayTimestamp = typeof data.relayTimestamp === 'bigint' ? Number(data.relayTimestamp) : Number(data.relayTimestamp);
            const value = data.value; // Keep as is for ethers.formatUnits
            const aggregatePower = typeof data.aggregatePower === 'bigint' ? Number(data.aggregatePower) : Number(data.aggregatePower);
            
            // Calculate time difference in seconds for current row
            let timeDiff = Math.abs(relayTimestamp - (timestamp / 1000));
            
            // Subtract block time if toggle is enabled
          if (includeBlockTime && avgBlockTime > 0) {
            timeDiff = Math.max(0, timeDiff - avgBlockTime);
            }
            
            const timeDiffFormatted = timeDiff < 60 
              ? `${timeDiff.toFixed(1)}s`
              : `${Math.floor(timeDiff / 60)}m ${(timeDiff % 60).toFixed(1)}s`;

            console.log('Raw timestamps:', {
              timestamp,
              relayTimestamp,
              timestampDate: new Date(timestamp),
              relayDate: new Date(relayTimestamp * 1000),
              timeDiff,
              timeDiffFormatted,
            blockTime: includeBlockTime ? avgBlockTime : 0
            });
            
            // Get real block number from current blockchain state
            let realBlockNumber = "Fetching...";
            try {
              const currentBlock = await provider.getBlockNumber();
              realBlockNumber = currentBlock;
              console.log(`📦 Real block number for Tellor transaction ${index + 1}: ${realBlockNumber}`);
            } catch (blockError) {
              console.log(`⚠️ Could not fetch real block number, using timestamp approximation:`, blockError.message);
              realBlockNumber = Math.floor(timestamp / 1000) || "Unknown";
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
              _rawTimestamp: timestamp
            };
          }));
          
          // Sort by raw timestamp descending (newest first)
          processedData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
          
          console.log('First processed item:', processedData[0]);
          
        return processedData;
        } else {
          throw new Error('No data retrieved from contract');
      }
    } catch (error) {
      console.error('Error fetching Tellor data:', error);
      throw error;
    }
  }, [includeBlockTime, avgBlockTime]);

  // Function to fetch only new transactions (for incremental updates)
  const fetchNewTransactionsOnly = useCallback(async (contract, queryId, startIndex, endIndex) => {
    try {
      console.log(`🆕 Fetching new transactions from index ${startIndex} to ${endIndex - 1}`);
      
      // Create provider for block number fetching
      const rpcUrl = "https://sagaevm.jsonrpc.sagarpc.io";
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      let newData = [];
      
      // Only fetch the new transactions (from startIndex to endIndex-1)
      for (let index = startIndex; index < endIndex; index++) {
        try {
          console.log(`📥 Fetching new transaction ${index + 1}...`);
          
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
                  console.log(`Error decoding price:`, decodeError.message);
                  price = "Decode error";
                }
              } else {
                price = "0.00";
              }
              
              // Extract timestamps and power
              power = updateData[1] || 0;
              aggregateTimestamp = updateData[2] || 0;
              relayTimestamp = updateData[4] || 0;
              
            } catch (decodeError) {
              console.log(`Error decoding transaction ${index + 1}:`, decodeError.message);
              price = "Decode error";
            }
            
            // Handle timestamp conversion
            const aggTimestampMs = Number(aggregateTimestamp);
            const relayTimestampMs = Number(relayTimestamp);
            const finalRelayTimestamp = relayTimestampMs < 10000000000 ? relayTimestampMs * 1000 : relayTimestampMs;
            
            // Calculate time difference
            const timeDiff = aggTimestampMs && finalRelayTimestamp 
              ? Math.abs(finalRelayTimestamp - aggTimestampMs) / 1000
              : 0;
            
            // Get real block number from current blockchain state
            let realBlockNumber = "Fetching...";
            try {
              const currentBlock = await provider.getBlockNumber();
              realBlockNumber = currentBlock;
              console.log(`📦 Real block number for new ${selectedDataBankFeed} transaction ${index + 1}: ${realBlockNumber}`);
            } catch (blockError) {
              console.log(`⚠️ Could not fetch real block number, using timestamp approximation:`, blockError.message);
              realBlockNumber = Math.floor(aggTimestampMs / 1000) || "Unknown";
            }
            
            // Create the data entry
            newData.push({
              value: price,
              timestamp: aggTimestampMs ? new Date(aggTimestampMs).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }) : "Unknown",
              aggregatePower: power.toString() || "1",
              relayTimestamp: finalRelayTimestamp ? new Date(finalRelayTimestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }) : "Unknown",
              timeDifference: `${timeDiff.toFixed(1)}s`,
              blockNumber: realBlockNumber,
              pair: selectedDataBankFeed,
              txHash: `update_${selectedDataBankFeed}_${index + 1}_${Date.now()}`,
              note: `Update ${index + 1} (New)`,
              // Keep raw timestamp for sorting
              _rawTimestamp: aggTimestampMs
            });
            
            console.log(`✅ Added new transaction ${index + 1} to incremental update`);
          }
          
        } catch (indexError) {
          console.log(`Error fetching new transaction ${index + 1}:`, indexError.message);
        }
      }
      
      console.log(`🆕 Successfully fetched ${newData.length} new transactions`);
      
      // Sort by raw timestamp descending (newest first)
      newData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
      
      return newData;
      
    } catch (error) {
      console.error('Error fetching new transactions only:', error);
      return [];
    }
  }, [selectedDataBankFeed]);

  // Function to calculate average block time
  const calculateAverageBlockTime = async (provider) => {
    try {
      console.log('Calculating average block time...');
      
      // Get current block
      const endBlock = await provider.getBlock('latest');
      console.log('Current block:', endBlock.number);
      
      // Get block from 100,000 blocks ago
      const startBlockNumber = Math.max(0, endBlock.number - 100000);
      const startBlock = await provider.getBlock(startBlockNumber);
      console.log('Start block:', startBlockNumber);
      
      // Calculate average block time
      const timeDifference = endBlock.timestamp - startBlock.timestamp;
      const blockCount = endBlock.number - startBlockNumber;
      const averageBlockTime = blockCount > 0 ? timeDifference / blockCount : 0;
      
      console.log('Average block time:', averageBlockTime, 'seconds');
      setAvgBlockTime(averageBlockTime);
      
      return averageBlockTime;
    } catch (error) {
      console.error('Error calculating average block time:', error);
      setAvgBlockTime(0);
      return 0;
    }
  };

  useEffect(() => {
    // Skip main data fetching if a specific DataBank feed is selected
    if (selectedDataBankFeed && contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      console.log('Skipping main data fetch - specific feed selected:', selectedDataBankFeed);
      return;
    }
    
    // Also skip if we're in the middle of switching to DataBank
    if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase() && feedLoading) {
      console.log('Skipping main data fetch - switching to DataBank feed');
      return;
    }
    
    // Also skip if we're processing a specific feed
    if (currentFeed && contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      console.log('Skipping main data fetch - processing specific feed:', currentFeed);
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

        console.log('Fetching data from contract:', contractAddress);
        console.log('Using ABI:', contractABI === DataBankABI.abi ? 'DataBank' : 'Tellor');
        console.log('Using RPC:', rpcUrl);
        
        // Debug: Check what functions are available on the contract
        if (contractABI === DataBankABI.abi) {
          try {
            console.log('Contract object:', contract);
            console.log('Contract interface:', contract.interface);
            
                    if (contract.interface && contract.interface.functions) {
          const functionNames = Array.from(contract.interface.functions.keys());
          console.log('DataBank contract functions available:', functionNames);
          
          // Check if our expected functions exist
          const hasGetAggregateValueCount = functionNames.includes('getAggregateValueCount');
          const hasGetCurrentAggregateData = functionNames.includes('getCurrentAggregateData');
          const hasData = functionNames.includes('data');
          
          console.log('Function availability:', {
            getAggregateValueCount: hasGetAggregateValueCount,
            getCurrentAggregateData: hasGetCurrentAggregateData,
            data: hasData
          });
          
          // Log function signatures for debugging
          if (hasGetAggregateValueCount) {
            const func = contract.interface.getFunction('getAggregateValueCount');
            console.log('getAggregateValueCount signature:', func.format());
          }
          if (hasGetCurrentAggregateData) {
            const func = contract.interface.getFunction('getCurrentAggregateData');
            console.log('getCurrentAggregateData signature:', func.format());
          }
          if (hasData) {
            const func = contract.interface.getFunction('data');
            console.log('data signature:', func.format());
          }
        } else {
          console.log('Contract interface or functions not available');
        }
            
            // Try to get some basic contract info
            try {
              const dataBridge = await contract.dataBridge();
              console.log('DataBank dataBridge address:', dataBridge);
            } catch (e) {
              console.log('Failed to get dataBridge:', e);
            }
            
            // Try to get some constants
            try {
              const maxDataAge = await contract.MAX_DATA_AGE();
              console.log('MAX_DATA_AGE:', maxDataAge);
            } catch (e) {
              console.log('Failed to get MAX_DATA_AGE:', e);
            }
          } catch (debugError) {
            console.log('Debug error:', debugError);
          }
        }
        
        // Calculate average block time if toggle is enabled
        if (includeBlockTime) {
          await calculateAverageBlockTime(provider);
        }
        
        let processedData;
        
        // Determine which contract type and fetch data accordingly
        if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
          setIsDataBankContract(true);
          console.log('DataBank contract detected but no feed selected, setting empty data');
          processedData = [];
        } else {
          setIsDataBankContract(false);
          try {
            processedData = await fetchTellorData(contract, provider);
          } catch (error) {
            console.error('Error fetching Tellor data:', error);
            processedData = [];
          }
        }
        
        if (processedData && processedData.length > 0) {
          console.log('Setting currentValue with data:', processedData);
          setCurrentValue(processedData);
          currentValueRef.current = processedData;
          setInitialFetchComplete(true); // Mark initial fetch as complete
        } else {
          console.log('No data retrieved, processedData:', processedData);
          console.log('processedData type:', typeof processedData);
          console.log('processedData length:', processedData ? processedData.length : 'undefined');
          // Don't throw error, just set empty array
          setCurrentValue([]);
        }

        setLoading(false);
        setFeedLoading(false); // Stop feed loading when main data fetch completes
      } catch (err) {
        console.error('Detailed error:', err);
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
    console.log('🔄 Feed selection useEffect triggered:', { selectedDataBankFeed, contractAddress, currentFeed, feedLoading });
    
    // Only run if we have a selected feed and we're on the DataBank contract
    if (!selectedDataBankFeed || contractAddress.toLowerCase() !== DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      console.log('🛑 Skipping feed selection useEffect - no feed selected or wrong contract');
      return;
    }
    
    console.log('Selected feed changed, triggering data fetch for:', selectedDataBankFeed);
    
    // Prevent duplicate fetches for the same feed
    if (currentValue.length > 0 && currentValue[0]?.pair === selectedDataBankFeed) {
      console.log('🛑 Feed data already loaded for', selectedDataBankFeed, ', skipping duplicate fetch');
      return;
    }
    
    // Set current feed being processed
    setCurrentFeed(selectedDataBankFeed);
    
    // Initial data fetch when feed selection changes
    const fetchSelectedFeedData = async () => {
      try {
        console.log(`🚀 Starting data fetch for ${selectedDataBankFeed}...`);
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
        
        console.log(`📡 Contract created, calling fetchDataBankData...`);
        const data = await fetchDataBankData(contract, provider, selectedDataBankFeed);
        console.log(`✅ Data fetch completed`);
        
        setLoading(false);
        setFeedLoading(false);
        setError(null);
        
        console.log(`📊 Fetching transaction count for ${selectedDataBankFeed}...`);
        // Store the initial transaction count for this feed BEFORE setting up auto-refresh
        const initialCount = await contract.getAggregateValueCount(DATABANK_PRICE_PAIRS[selectedDataBankFeed]);
        console.log(`📊 Initial transaction count for ${selectedDataBankFeed}: ${initialCount}`);
        
        // Mark initial fetch as complete for this feed
        setInitialFetchComplete(true);
        
        // Set up periodic refresh every 30 seconds for real-time updates
        const refreshInterval = setInterval(async () => {
          // Don't run auto-refresh until initial fetch is complete
          if (!initialFetchComplete) {
            console.log(`⏳ Skipping auto-refresh - initial fetch not complete yet`);
            return;
          }
          
          try {
            console.log(`🔄 Auto-refreshing ${selectedDataBankFeed} data for new transactions...`);
            
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
            
            console.log(`📊 Auto-refresh check: blockchain=${currentCountNum}, local=${localTransactionCount}`);
            
            // Only fetch if there are actually new transactions
            if (currentCountNum > localTransactionCount) {
              const newTransactionCount = currentCountNum - localTransactionCount;
              console.log(`🆕 Found ${newTransactionCount} new transactions for ${selectedDataBankFeed}!`);
              
              // Fetch only the new transactions (from local count to current count-1)
              const newTransactions = await fetchNewTransactionsOnly(contract, queryId, localTransactionCount, currentCountNum);
              
              if (newTransactions && newTransactions.length > 0) {
                // Append new transactions to existing data and sort by timestamp (newest first)
                setCurrentValue(prevData => {
                  const combinedData = [...prevData, ...newTransactions];
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
                
                console.log(`✅ Added ${newTransactions.length} new transactions to ${selectedDataBankFeed}`);
              }
            } else {
              console.log(`ℹ️ No new transactions for ${selectedDataBankFeed} (blockchain: ${currentCountNum}, local: ${localTransactionCount})`);
            }
          } catch (error) {
            console.error(`❌ Error during auto-refresh for ${selectedDataBankFeed}:`, error.message);
            // Don't show error to user for background refresh
          }
        }, 30000); // Check every 30 seconds
        
        // Cleanup interval when feed changes or component unmounts
        return () => {
          console.log(`🛑 Stopping auto-refresh for ${selectedDataBankFeed}`);
          clearInterval(refreshInterval);
          // Don't clear data here - it causes the data to disappear
        };
      } catch (error) {
        console.error('Error fetching selected feed data:', error);
        setError(error.message || 'Failed to fetch selected feed data');
        setLoading(false);
        setFeedLoading(false);
        setIsIncrementalLoading(false);
      }
    };
    
    // Initial fetch
    console.log(`🔄 Calling fetchSelectedFeedData for ${selectedDataBankFeed}...`);
    fetchSelectedFeedData();
    
  }, [selectedDataBankFeed, contractAddress, fetchDataBankData]);

  // Cleanup effect to clear all data when switching contract types
  useEffect(() => {
    // Clear data when switching between DataBank and Tellor contracts
    if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      if (!selectedDataBankFeed) {
        // If switching to DataBank but no feed selected, clear data
        setCurrentValue([]);
        setFeedLoading(false);
        setInitialFetchComplete(false);
        currentValueRef.current = [];
      }
    } else {
      // If switching to Tellor, clear any DataBank feed data
      setSelectedDataBankFeed(null);
      setFeedLoading(false);
      setCurrentValue([]); // Clear DataBank data when switching to Tellor
      setInitialFetchComplete(false);
      currentValueRef.current = [];
    }
  }, [contractAddress, selectedDataBankFeed]);

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
    <div style={{ 
      marginBottom: '1rem', 
      display: 'flex', 
      gap: '8px',
      justifyContent: 'center' 
    }}>
      {['recent', 'daily', 'weekly', 'custom'].map((scale) => (
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
          {scale === 'custom' ? 'Date Range' : scale}
        </button>
      ))}
    </div>
  );

  const CustomDateRangeInputs = () => (
    <div style={{ 
      marginBottom: '0.5rem', 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px'
    }}>
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
    <div style={{ 
      marginBottom: '1rem', 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px'
    }}>
      <FormControlLabel
        control={
          <Switch
            checked={includeBlockTime}
            onChange={(e) => setIncludeBlockTime(e.target.checked)}
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
            Remove EVM Block Time
            {includeBlockTime && avgBlockTime > 0 && (
              <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                ({avgBlockTime.toFixed(1)}s avg)
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
        text: `Delay Performance - ${
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
              height: '40px',
              width: 'auto',
              display: 'block'
            }}
          />
          
        </Grid>
              </Grid>

      {/* Side-by-Side Layout: Left (Price Feeds + Data Feed) | Right (Chart) */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '20px'
      }}>
        {/* Left Column - Price Feeds + Data Feed */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Oracle Price Feeds */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: 'rgba(14, 83, 83, 0.1)', 
            borderRadius: '8px',
            width: '100%'
          }}>
            {/* Feed Selection - Responsive Layout */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px'
            }}>
              {/* Ethereum Feeds */}
              <div>
                <Typography variant="body2" sx={{ color: '#0E5353', fontWeight: 'bold', mb: 2, fontSize: '14px' }}>
                  Ethereum Feeds:
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
                      
                      console.log('Button clicked for: ETH/USD (Ethereum)');
                      setFeedLoading(true); // Start loading immediately
                      setSelectedDataBankFeed(null);
                      setIsDataBankContract(false);
                      setContractAddress('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
                      setInputAddress('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
                      
                      // Clear current data to show loading state
                      setCurrentValue([]);
                      currentValueRef.current = [];
                    }}
                    disabled={feedLoading}
                  style={{
                      minWidth: '150px',
                    padding: '8px 16px',
                      textTransform: 'none',
                      fontWeight: !isDataBankContract ? 'bold' : 'normal',
                      backgroundColor: !isDataBankContract ? '#0E5353' : 'transparent',
                      color: !isDataBankContract ? 'white' : '#0E5353',
                      border: `2px solid #0E5353`,
                    borderRadius: '4px',
                    cursor: feedLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s ease',
                      opacity: feedLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!feedLoading) {
                        e.target.style.backgroundColor = !isDataBankContract ? '#0E5353' : 'rgba(14, 83, 83, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!feedLoading) {
                        e.target.style.backgroundColor = !isDataBankContract ? '#0E5353' : 'transparent';
                      }
                    }}
                  >
                    {feedLoading && !isDataBankContract ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <CircularProgress size={12} style={{ color: 'white' }} />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'ETH/USD'
                    )}
                </button>
                </div>
              </div>

              {/* Saga Feeds */}
              <div style={{ marginLeft: '40px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {Object.entries(DATABANK_PRICE_PAIRS).map(([pairName, queryId]) => (
                    <button
                      key={pairName}
                      onClick={() => {
                        if (feedLoading) return; // Prevent clicks during loading
                        
                        console.log('Button clicked for:', pairName);
                        console.log('Current selectedDataBankFeed:', selectedDataBankFeed);
                        
                        if (selectedDataBankFeed === pairName) {
                          // Deselect if already selected
                          console.log('Deselecting feed:', pairName);
                          setFeedLoading(true); // Start loading immediately
                          setSelectedDataBankFeed(null);
                          setIsDataBankContract(false);
                          setContractAddress('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
                          setInputAddress('0x44941f399c4c009b01bE2D3b0A0852dC8FFD2C4a');
                          
                          // Clear current data to show loading state
                          setCurrentValue([]);
                          currentValueRef.current = [];
                        } else {
                          // Select this feed
                          console.log('Selecting feed:', pairName);
                          setFeedLoading(true); // Start loading immediately
                          setSelectedDataBankFeed(pairName);
                          setIsDataBankContract(true);
                          setContractAddress('0x6f250229af8D83c51500f3565b10E93d8907B644');
                          setInputAddress('0x6f250229af8D83c51500f3565b10E93d8907B644');
                          
                          // Clear current data to show loading state
                          setCurrentValue([]);
                          currentValueRef.current = [];
                        }
                        
                        console.log('State updates triggered for:', pairName);
                      }}
                      disabled={feedLoading}
                      style={{ 
                        minWidth: '100px',
                        padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: selectedDataBankFeed === pairName ? 'bold' : 'normal',
                        backgroundColor: selectedDataBankFeed === pairName ? '#0E5353' : 'transparent',
                        color: selectedDataBankFeed === pairName ? 'white' : '#0E5353',
                        border: `2px solid #0E5353`,
                        borderRadius: '4px',
                        cursor: feedLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                        opacity: feedLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!feedLoading) {
                          e.target.style.backgroundColor = selectedDataBankFeed === pairName ? '#0E5353' : 'rgba(14, 83, 83, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!feedLoading) {
                          e.target.style.backgroundColor = selectedDataBankFeed === pairName ? '#0E5353' : 'transparent';
                        }
                      }}
                    >
                      {feedLoading && selectedDataBankFeed === pairName ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <CircularProgress size={12} style={{ color: 'white' }} />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        pairName
                      )}
                    </button>
                  ))}
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
            {/* Feed selection header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}>
              <Typography variant="h6" sx={{ 
                color: '#0E5353', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {feedLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CircularProgress size={16} style={{ color: '#0E5353' }} />
                    Loading {selectedDataBankFeed} Feed...
                  </div>
                ) : selectedDataBankFeed ? (
                  `${selectedDataBankFeed} Feed Data`
                ) : (
                  'ETH/USD Feed Data'
                )}
              </Typography>
            </div>
            
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
                  <span>Loading transactions incrementally...</span>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                  Transactions will appear as they're fetched
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
                    // Show data when available
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
        <div style={{ 
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          height: 'fit-content',
          marginTop: '-60px'
        }}>
          {/* Chart header */}
          <div style={{ 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ 
              color: '#0E5353', 
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {feedLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CircularProgress size={16} style={{ color: '#0E5353' }} />
                  Loading Chart...
                </div>
              ) : (
                'Price Chart'
              )}
            </Typography>
          </div>
          
          {!feedLoading && (
            <>
              <BlockTimeToggle />
              <TimeScaleToggle />
              {timeScale === 'custom' && <CustomDateRangeInputs />}
            </>
          )}
          <div style={{ height: '280px', width: '100%' }}>
            {feedLoading ? (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#0E5353',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <CircularProgress size={40} style={{ color: '#0E5353' }} />
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
        </div>
      </div>
    </Container>
  );
};

export default DataFeed;