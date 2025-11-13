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
  Tooltip,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { InfoOutlined, ArrowUpward, ArrowDownward } from '@mui/icons-material';
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
const DATABANK_CONTRACT_ADDRESS = "0x6f250229af8D83c51500f3565b10E93d8907B644";
const SEPOLIA_CONTRACT_ADDRESS = "0xF03B401966eF4c32e7Cef769c4BB2833BaC0eb9a";
const BASE_CONTRACT_ADDRESS = "0x5589e306b1920F009979a50B88caE32aecD471E4";
const SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const BASE_RPC_URL = "https://base-mainnet.public.blastapi.io";
const SAGA_RPC_URL = "https://sagaevm.jsonrpc.sagarpc.io";

// Sepolia Tellor feed queryIds
const SEPOLIA_QUERY_IDS = {
  'ETH/USD': '0x83a7f3d48786ac2667503a61e8c415438ed2922eb86a2906e4ee66d9a2ce4992',
  'BTC/USD': '0xa6f013ee236804827b77696d350e9f0ac3e879328f2a3021d473a0b778ad78ac',
};

// Base Tellor feed queryIds
const BASE_QUERY_IDS = {
  'ETH/USD': '0x83a7f3d48786ac2667503a61e8c415438ed2922eb86a2906e4ee66d9a2ce4992',
  'BTC/USD': '0xa6f013ee236804827b77696d350e9f0ac3e879328f2a3021d473a0b778ad78ac',
  'TRB/USD': '0x5c13cd9c97dbb98f2429c101a2a8150e6c7a0ddaff6124ee176a3a411067ded0',
};

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
  'sfrxUSD/USD': '0xab30caa3e7827a27c153063bce02c0b260b29c0c164040c003f0f9ec66002510',
  'yETH/USD': '0x9874c1c7b7e76b78afdfdda6dcecef56edf6bf3d49d6d6ef2a98404ea2e04a59'
};

// Feed risk assessment mapping
const FEED_RISK_ASSESSMENT = {
  'BTC/USD': 'exemplary',      // 3 bars
  'ETH/USD': 'exemplary',      // 3 bars
  'TRB/USD': 'moderate',       // 2 bars
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
  'sfrxUSD/USD': 'high',    // 1 bars
  'yETH/USD': 'high'    // 1 bars
};

// Risk level to bar count mapping
const RISK_BAR_COUNT = {
  'exemplary': 3,
  'moderate': 2,
  'high': 1
};

// Feed type mapping
const FEED_TYPE = {
  'BTC/USD': 'market',
  'ETH/USD': 'market',
  'TRB/USD': 'market',
  'SAGA/USD': 'market',
  'USDC/USD': 'market',
  'USDT/USD': 'market',
  'USDN/USD': 'market',
  'sUSDS/USD': 'market',
  'yUSD/USD': 'market',
  'tBTC/USD': 'market',
  'rETH/USD': 'mix',
  'wstETH/USD': 'mix',
  'KING/USD': 'mix',
  'sUSDe/USD': 'market',
  'stATOM/USD': 'market',
  'sfrxUSD/USD': 'fundamental',
  'sUSN/USD': 'market',
  'vyUSD/USD': 'fundamental',
  'yETH/USD': 'fundamental'
};

// Feed tooltip descriptions
const FEED_TOOLTIP = {
  'BTC/USD': 'market (7 sources)',
  'ETH/USD': 'market (7 sources)',
  'TRB/USD': 'market',
  'SAGA/USD': 'market (4 sources)',
  'USDC/USD': 'market (7 sources)',
  'USDT/USD': 'market (3 sources)',
  'FBTC/USD': 'market (3 sources)',
  'USDN/USD': 'market (2 sources)',
  'sUSDS/USD': 'market (1 source)',
  'yUSD/USD': 'market (2 sources)',
  'tBTC/USD': 'market (3 sources)',
  'rETH/USD': 'mix (fundamental as part of median)',
  'wstETH/USD': 'mix (fundamental as part of median)',
  'KING/USD': 'mix (fundamental as part of median)',
  'sUSDe/USD': 'market (2 sources)',
  'stATOM/USD': 'market (3 sources)',
  'sfrxUSD/USD': 'fundamental sfrxUSD/frxUSD ratio × market median frxUSD/USD price',
  'sUSN/USD': 'market (1 source)',
  'vyUSD/USD': 'fundamental vyUSD/USDC ratio × market median USDC/USD price',
  'yETH/USD': 'fundamental yeth/eth ratio × market median eth/usd price'
};

// Deviation Threshold mapping
const DEVIATION_THRESHOLD = {
  'ATOM/USD': '2.00%',
  'BTC/USD': '1.00%',
  'ETH/USD': '1.00%',
  'TRB/USD': '2.00%',
  'fBTC/USD': '0.25%',
  'KING/USD': '2.00%',
  'MUST/USD': '2.00%',
  'rETH/USD': '2.00%',
  'SAGA/USD': '2.00%',
  'sfrxUSD/USD': '2.00%',
  'sMUST/USD': '2.00%',
  'stATOM/USD': '2.00%',
  'sUSDe/USD': '2.00%',
  'sUSDS/USD': '2.00%',
  'sUSN/USD': '2.00%',
  'tBTC/USD': '2.00%',
  'USDC/USD': '0.50%',
  'USDN/USD': '2.00%',
  'USDT/USD': '0.50%',
  'vyUSD/USD': '2.00%',
  'wstETH/USD': '0.25%',
  'yETH/USD': '2.00%',
  'yUSD/USD': '2.00%'
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

  const getFeedTypeSymbol = (feedName, color = '#0E5353') => {
    const feedType = FEED_TYPE[feedName];
    const tooltipText = FEED_TOOLTIP[feedName] || '';
    
    if (!feedType) return null;
    
    let symbolStyle = {};
    if (feedType === 'market') {
      symbolStyle = {
        width: 0,
        height: 0,
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent',
        borderBottom: `7px solid ${color}`,
        flexShrink: 0
      };
    } else if (feedType === 'fundamental') {
      symbolStyle = {
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0
      };
    } else if (feedType === 'mix') {
      symbolStyle = {
        width: '7px',
        height: '7px',
        borderStyle: 'solid',
        borderWidth: '2px',
        borderColor: color,
        backgroundColor: color,
        flexShrink: 0
      };
    }
    
    return (
      <Tooltip title={tooltipText} placement="top" arrow>
        <div style={symbolStyle} />
      </Tooltip>
    );
  };

  // Function to get feed icon for various tokens
  const getFeedIcon = (feedName, iconColor = null) => {
    const iconStyle = { marginRight: '6px', flexShrink: 0 };
    const size = iconColor === 'white' ? '14' : '16';
    
    // Bitcoin
    if (feedName === 'BTC/USD' || feedName === 'tBTC/USD') {
      if (iconColor === 'white') {
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={iconStyle}>
            <path d="M17.027 10.377c.26-1.737-1.06-2.67-2.864-3.293l.585-2.346-1.43-.356-.57 2.286c-.376-.094-.763-.182-1.147-.27l.574-2.301-1.43-.356-.585 2.346c-.31-.07-.615-.14-.91-.213l.002-.007-1.97-.492-.38 1.524s1.06.243 1.038.258c.58.145.684.53.666.835l-.667 2.674c.04.01.092.024.15.047l-.153-.038-.947 3.797c-.071.18-.252.45-.66.348.015.021-1.04-.26-1.04-.26l-.71 1.644 1.863.464c.346.086.684.177 1.015.26l-.59 2.365 1.428.356.585-2.345c.39.106.767.203 1.13.295l-.583 2.338 1.43.356.59-2.365c2.448.463 4.285.276 5.06-1.938.625-1.78-.031-2.807-1.32-3.477.94-.217 1.648-.835 1.838-2.11zm-2.958 4.08c-.444 1.78-3.45.82-4.424.578l.79-3.164c.974.243 4.1.723 3.634 2.586zm.472-4.99c-.405 1.625-2.91.8-3.723.597l.715-2.867c.813.203 3.44.58 3.008 2.27z" fill="white"/>
          </svg>
        );
      }
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={iconStyle}>
          <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.243 15.525.362 9.105 1.963 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.117 8.738 14.546z" fill="#F7931A"/>
          <path d="M17.027 10.377c.26-1.737-1.06-2.67-2.864-3.293l.585-2.346-1.43-.356-.57 2.286c-.376-.094-.763-.182-1.147-.27l.574-2.301-1.43-.356-.585 2.346c-.31-.07-.615-.14-.91-.213l.002-.007-1.97-.492-.38 1.524s1.06.243 1.038.258c.58.145.684.53.666.835l-.667 2.674c.04.01.092.024.15.047l-.153-.038-.947 3.797c-.071.18-.252.45-.66.348.015.021-1.04-.26-1.04-.26l-.71 1.644 1.863.464c.346.086.684.177 1.015.26l-.59 2.365 1.428.356.585-2.345c.39.106.767.203 1.13.295l-.583 2.338 1.43.356.59-2.365c2.448.463 4.285.276 5.06-1.938.625-1.78-.031-2.807-1.32-3.477.94-.217 1.648-.835 1.838-2.11zm-2.958 4.08c-.444 1.78-3.45.82-4.424.578l.79-3.164c.974.243 4.1.723 3.634 2.586zm.472-4.99c-.405 1.625-2.91.8-3.723.597l.715-2.867c.813.203 3.44.58 3.008 2.27z" fill="#FFF"/>
        </svg>
      );
    }
    
    // Ethereum
    if (feedName === 'ETH/USD') {
      const fillColor = iconColor === 'white' ? 'white' : '#627EEA';
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={iconStyle}>
          <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill={fillColor}/>
          <path d="M12.3735 3V9.6525L17.9963 12.165L12.3735 3Z" fill="white" fillOpacity="0.602"/>
          <path d="M12.3735 3L6.75 12.165L12.3735 9.6525V3Z" fill="white"/>
          <path d="M12.3735 16.476V20.9963L18 12.621L12.3735 16.476Z" fill="white" fillOpacity="0.602"/>
          <path d="M12.3735 20.9963V16.4753L6.75 12.621L12.3735 20.9963Z" fill="white"/>
          <path d="M12.3735 15.4298L17.9963 12.165L12.3735 9.654V15.4298Z" fill="white" fillOpacity="0.2"/>
          <path d="M6.75 12.165L12.3735 15.4298V9.654L6.75 12.165Z" fill="white" fillOpacity="0.602"/>
        </svg>
      );
    }
    
    // Rocket Pool ETH (rETH)
    if (feedName === 'rETH/USD') {
      return (
        <img 
          src="/reth-usd-logo.png" 
          alt="rETH" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // Wrapped Staked ETH (wstETH)
    if (feedName === 'wstETH/USD') {
      return (
        <img 
          src="/wsteth-usd-logo.png" 
          alt="wstETH" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // Yearn ETH (yETH)
    if (feedName === 'yETH/USD') {
      return (
        <img 
          src="/yeth-usd-logo.png" 
          alt="yETH" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // USD Coin (USDC)
    if (feedName === 'USDC/USD') {
      const fillColor = iconColor === 'white' ? 'white' : '#2775CA';
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={iconStyle}>
          <circle cx="12" cy="12" r="12" fill={fillColor}/>
          <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12.75 15.75C12.75 16.1642 12.4142 16.5 12 16.5C11.5858 16.5 11.25 16.1642 11.25 15.75V14.25H9.75C9.33579 14.25 9 13.9142 9 13.5C9 13.0858 9.33579 12.75 9.75 12.75H11.25V11.25H9.75C9.33579 11.25 9 10.9142 9 10.5C9 10.0858 9.33579 9.75 9.75 9.75H11.25V8.25C11.25 7.83579 11.5858 7.5 12 7.5C12.4142 7.5 12.75 7.83579 12.75 8.25V9.75H14.25C14.6642 9.75 15 10.0858 15 10.5C15 10.9142 14.6642 11.25 14.25 11.25H12.75V12.75H14.25C14.6642 12.75 15 13.0858 15 13.5C15 13.9142 14.6642 14.25 14.25 14.25H12.75V15.75Z" fill="white"/>
        </svg>
      );
    }
    
    // Tether (USDT)
    if (feedName === 'USDT/USD') {
      const fillColor = iconColor === 'white' ? 'white' : '#26A17B';
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={iconStyle}>
          <circle cx="12" cy="12" r="12" fill={fillColor}/>
          <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12.75 15.75C12.75 16.1642 12.4142 16.5 12 16.5C11.5858 16.5 11.25 16.1642 11.25 15.75V14.25H9.75C9.33579 14.25 9 13.9142 9 13.5C9 13.0858 9.33579 12.75 9.75 12.75H11.25V11.25H9.75C9.33579 11.25 9 10.9142 9 10.5C9 10.0858 9.33579 9.75 9.75 9.75H11.25V8.25C11.25 7.83579 11.5858 7.5 12 7.5C12.4142 7.5 12.75 7.83579 12.75 8.25V9.75H14.25C14.6642 9.75 15 10.0858 15 10.5C15 10.9142 14.6642 11.25 14.25 11.25H12.75V12.75H14.25C14.6642 12.75 15 13.0858 15 13.5C15 13.9142 14.6642 14.25 14.25 14.25H12.75V15.75Z" fill="white"/>
        </svg>
      );
    }
    
    // Cosmos (ATOM)
    if (feedName === 'stATOM/USD') {
      const fillColor = iconColor === 'white' ? 'white' : '#2E3148';
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={iconStyle}>
          <circle cx="12" cy="12" r="12" fill={fillColor}/>
          <path d="M12 6L15.5 8.5L12 11L8.5 8.5L12 6ZM15.5 15.5L12 18L8.5 15.5L12 13L15.5 15.5ZM18.5 10.5L16 12L18.5 13.5L21 12L18.5 10.5ZM6 10.5L3.5 12L6 13.5L8.5 12L6 10.5Z" fill="white"/>
        </svg>
      );
    }
    
    // Tellor (TRB)
    if (feedName === 'TRB/USD') {
      return (
        <img 
          src="/trb-usd-logo.png" 
          alt="TRB" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // Neutrino USD (USDN)
    if (feedName === 'USDN/USD') {
      // Using PNG file from public folder
      return (
        <img 
          src="/usdn-logo.png" 
          alt="USDN" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // KING/USD
    if (feedName === 'KING/USD') {
      return (
        <img 
          src="/king-usd-logo.png" 
          alt="KING" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // yUSD/USD
    if (feedName === 'yUSD/USD') {
      return (
        <img 
          src="/yusd-usd-logo.png" 
          alt="yUSD" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // sUSN/USD
    if (feedName === 'sUSN/USD') {
      return (
        <img 
          src="/susn-usd-logo.png" 
          alt="sUSN" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // sUSDS/USD
    if (feedName === 'sUSDS/USD') {
      return (
        <img 
          src="/susds-usd-logo.png" 
          alt="sUSDS" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // SAGA/USD
    if (feedName === 'SAGA/USD') {
      return (
        <img 
          src="/saga-usd-logo.png" 
          alt="SAGA" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // sUSDe/USD
    if (feedName === 'sUSDe/USD') {
      return (
        <img 
          src="/susde-usd-logo.png" 
          alt="sUSDe" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // vyUSD/USD
    if (feedName === 'vyUSD/USD') {
      return (
        <img 
          src="/vyusd-usd-logo.png" 
          alt="vyUSD" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    // sfrxUSD/USD
    if (feedName === 'sfrxUSD/USD') {
      return (
        <img 
          src="/sfrxusd-usd-logo.png" 
          alt="sfrxUSD" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    return null;
  };

  // Function to get network icon
  const getNetworkIcon = (network, size = 20) => {
    const iconStyle = {
      marginRight: '8px',
      verticalAlign: 'middle',
      display: 'inline-block'
    };

    if (network === 'Sepolia') {
      return (
        <img 
          src="/sepolia-logo.png" 
          alt="Sepolia" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    if (network === 'Base') {
      return (
        <img 
          src="/base-mainnet-logo.png" 
          alt="Base" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    if (network === 'Saga') {
      return (
        <img 
          src="/saga-mainnet-logo.png" 
          alt="Saga" 
          width={size} 
          height={size} 
          style={iconStyle}
        />
      );
    }
    
    return null;
  };

  // Function to calculate heartbeat countdown (4 hours from reported time)
  const calculateHeartbeat = (reportedTimestamp) => {
    try {
      // heartbeatTick ensures this recalculates every second
      const _ = heartbeatTick; // eslint-disable-line no-unused-vars
      const reportedDate = new Date(reportedTimestamp);
      const now = new Date();
      const elapsed = Math.floor((now - reportedDate) / 1000); // seconds elapsed
      const fourHours = 4 * 60 * 60; // 4 hours in seconds
      const remaining = fourHours - elapsed;
      
      if (remaining <= 0) {
        // Calculate negative time (how long it's been over the heartbeat)
        const overTime = Math.abs(remaining);
        const hours = Math.floor(overTime / 3600);
        const minutes = Math.floor((overTime % 3600) / 60);
        const seconds = overTime % 60;
        // Format as -HH:MM:SS
        const text = `-${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return { text, expired: true };
      }
      
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      
      // Format as HH:MM:SS
      const text = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      return { text, expired: false };
    } catch (error) {
      return { text: 'N/A', expired: false };
    }
  };

  const [currentValue, setCurrentValue] = useState([]);
  const [overviewData, setOverviewData] = useState([]); // Separate state for Overview tab
  const [loading, setLoading] = useState(false); // Start as false since Overview tab (default) uses feedLoading
  const [feedLoading, setFeedLoading] = useState(false); // New state for feed selection loading
  const [error, setError] = useState(null);
  const [currentFeed, setCurrentFeed] = useState(null); // Track current feed being processed
  const [contractAddress, setContractAddress] = useState(SEPOLIA_CONTRACT_ADDRESS);
  const [inputAddress, setInputAddress] = useState(SEPOLIA_CONTRACT_ADDRESS);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [loadedTransactions, setLoadedTransactions] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [loadedPages, setLoadedPages] = useState(1); // Track how many pages we've loaded
  const [timeScale, setTimeScale] = useState('recent'); // 'recent', 'daily', 'weekly', or 'custom'
  const [includeBlockTime, setIncludeBlockTime] = useState(true);
  const [avgBlockTime, setAvgBlockTime] = useState(0);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDataBankContract, setIsDataBankContract] = useState(false);
  const [selectedDataBankFeed, setSelectedDataBankFeed] = useState(null);
  const [selectedSepoliaFeed, setSelectedSepoliaFeed] = useState('ETH/USD'); // Track which Sepolia feed is selected
  const [selectedBaseFeed, setSelectedBaseFeed] = useState('ETH/USD'); // Track which Base feed is selected
  // Add state for overview table sorting
  const [overviewSortColumn, setOverviewSortColumn] = useState('network'); // 'feed' or 'network'
  const [overviewSortDirection, setOverviewSortDirection] = useState('asc'); // 'asc' or 'desc'
  // Add new state for incremental loading
  const [isIncrementalLoading, setIsIncrementalLoading] = useState(false);
  // Add render key to force re-renders
  const [renderKey, setRenderKey] = useState(0);
  // Add flag to prevent auto-refresh until initial fetch is complete
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);
  // Use ref to track current data for immediate updates
  const currentValueRef = useRef([]);
  // Add cancellation token to prevent race conditions
  const [cancellationToken, setCancellationToken] = useState(0);
  // Add ref to track current feed for immediate filtering
  const currentFeedRef = useRef(null);
  // Add tab state for switching between data view and analytics
  const [activeTab, setActiveTab] = useState(0);
  // Add state for heartbeat countdowns (force re-render every second)
  const [heartbeatTick, setHeartbeatTick] = useState(0);

  // Function to determine which ABI to use based on contract address
  const getContractABI = (address) => {
    if (address.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      return DataBankABI.abi;
    }
    return TellorABI; // TellorABI is already an array, not an object with .abi
  };

  // Function to fetch data from DataBank contract
  const fetchDataBankData = useCallback(async (contract, provider, targetFeed = null, token = 0, blockTimeOverride = null, loadMore = false, startIndex = null) => {

  try {
    let data = [];
    
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
            
            // Set total transactions for pagination
            setTotalTransactions(numValueCount);
            
            // Determine pagination parameters
            let startIdx, endIdx;
            if (loadMore && startIndex !== null) {
              // Loading more transactions from a specific index
              startIdx = startIndex;
              endIdx = Math.max(0, startIndex - rowsPerPage);
            } else {
              // Initial load - only load first page
              startIdx = numValueCount - 1;
              endIdx = Math.max(0, numValueCount - 1 - rowsPerPage);
            }
            
            // Process transactions in the specified range
            for (let index = startIdx; index > endIdx; index--) {
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
                  
                  // Validate that we're still processing the correct feed
                  if (currentFeed !== targetFeed) {
                    return;
                  }
                  
                  // Add transaction to data array for batch processing
                  data.push(newTransaction);
                  
                  // Force React to rerender immediately by updating render key
                  setRenderKey(prev => prev + 1);
                  
                  // Break out of synchronous execution to allow React to update
                  await new Promise(resolve => setTimeout(resolve, 0));
                }
                
              } catch (indexError) {
                // Silent error handling
              }
            }
            
            // Update UI with batch of transactions
            if (data.length > 0) {
              setCurrentValue(prevData => {
                // Validate we're still processing the correct feed
                if (currentFeed !== targetFeed || currentFeedRef.current !== targetFeed) {
                  return prevData;
                }
                
                // For DataBank contracts, only add data if it's for the current feed
                if (isDataBankContract && currentFeedRef.current) {
                  const filteredData = data.filter(tx => tx.pair && tx.pair === currentFeedRef.current);
                  if (filteredData.length === 0) return prevData;
                  data = filteredData;
                }
                
                if (loadMore) {
                  // For load more, append new transactions to existing ones
                  
                  // Remove duplicates from new data
                  const uniqueNewData = data.filter(newTx => 
                    !prevData.some(existing => 
                      existing.txHash === newTx.txHash || 
                      (existing.pair === newTx.pair && existing._rawTimestamp === newTx._rawTimestamp)
                    )
                  );
                  
                  if (uniqueNewData.length === 0) {
                    return prevData;
                  }
                  
                  // Append new transactions and sort by timestamp descending (newest first)
                  const updatedData = [...prevData, ...uniqueNewData];
                  const sortedData = updatedData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
                  
                  // Update ref for immediate access
                  currentValueRef.current = sortedData;
                  // Update loaded transactions count
                  setLoadedTransactions(sortedData.length);
                  // Update loaded pages count
                  setLoadedPages(Math.ceil(sortedData.length / rowsPerPage));
                  // Check if there are more transactions to load
                  setHasMoreTransactions(sortedData.length < numValueCount);
                  return sortedData;
                } else {
                  // For initial load, use the existing logic
                  const cleanedPrevData = isDataBankContract && currentFeedRef.current 
                    ? prevData.filter(existing => !existing.pair || existing.pair === currentFeedRef.current)
                    : prevData;
                  
                  // Remove duplicates
                  const uniqueNewData = data.filter(newTx => 
                    !cleanedPrevData.some(existing => 
                      existing.txHash === newTx.txHash || 
                      (existing.pair === newTx.pair && existing._rawTimestamp === newTx._rawTimestamp)
                    )
                  );
                  
                  if (uniqueNewData.length === 0) {
                    return cleanedPrevData;
                  }
                  
                  const updatedData = [...cleanedPrevData, ...uniqueNewData];
                  // Sort by timestamp descending (newest first)
                  const sortedData = updatedData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
                  // Update ref for immediate access
                  currentValueRef.current = sortedData;
                  // Update loaded transactions count
                  setLoadedTransactions(sortedData.length);
                  // Update loaded pages count
                  setLoadedPages(Math.ceil(sortedData.length / rowsPerPage));
                  // Check if there are more transactions to load
                  setHasMoreTransactions(sortedData.length < numValueCount);
                  return sortedData;
                }
              });
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

  // Function to fetch data from Tellor contract (updated for new contract structure)
  const fetchTellorData = useCallback(async (contract, provider, feedName = 'ETH/USD', network = 'Sepolia', queryIds = SEPOLIA_QUERY_IDS) => {
    try {
        // Get query ID for the selected feed
        const queryId = queryIds[feedName];
        
        // Get the count of available data points
        let count;
        try {
          count = await contract.getAggregateValueCount(queryId);
        } catch (countError) {
          // If getAggregateValueCount fails, try to get current data instead
          try {
            const currentData = await contract.getCurrentAggregateData(queryId);
            if (currentData && currentData[0]) {
              const value = currentData[0];
              const aggregatePower = typeof currentData[1] === 'bigint' ? Number(currentData[1]) : Number(currentData[1]);
              const timestamp = typeof currentData[2] === 'bigint' ? Number(currentData[2]) : Number(currentData[2]);
              const relayTimestamp = typeof currentData[4] === 'bigint' ? Number(currentData[4]) : Number(currentData[4]);
              
              let timeDiff = Math.abs(Number(relayTimestamp) - (Number(timestamp) / 1000));
              if (includeBlockTime && avgBlockTime > 0) {
                timeDiff = Math.max(0, timeDiff - avgBlockTime);
              }
              
              const timeDiffFormatted = timeDiff < 60 
                ? `${timeDiff.toFixed(1)}s`
                : `${Math.floor(timeDiff / 60)}m ${(timeDiff % 60).toFixed(1)}s`;
              
              return [{
                pair: feedName,
                network: network,
                value: parseFloat(ethers.formatUnits(value, 18)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }),
                timestamp: new Date(Number(timestamp)).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                }),
                aggregatePower: aggregatePower.toLocaleString(),
                relayTimestamp: new Date(Number(relayTimestamp) * 1000).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                }),
                timeDifference: timeDiffFormatted,
                blockNumber: "Current",
                txHash: `tellor_${feedName.toLowerCase().replace('/', '_')}_current_${Date.now()}`,
                note: `Current ${feedName} Data`,
                _rawTimestamp: Number(timestamp)
              }];
            }
          } catch (currentError) {
            // Both methods failed, no data available - return empty array
            return [];
          }
          // If getAggregateValueCount failed and we couldn't get current data, return empty array
          return [];
        }
        const countNum = Number(count);
        
        if (countNum === 0) {
          try {
            const currentData = await contract.getCurrentAggregateData(queryId);
            if (currentData && currentData[0]) {
              const value = currentData[0];
              const aggregatePower = typeof currentData[1] === 'bigint' ? Number(currentData[1]) : Number(currentData[1]);
              const timestamp = typeof currentData[2] === 'bigint' ? Number(currentData[2]) : Number(currentData[2]);
              const relayTimestamp = typeof currentData[4] === 'bigint' ? Number(currentData[4]) : Number(currentData[4]);
              
              let timeDiff = Math.abs(Number(relayTimestamp) - (Number(timestamp) / 1000));
              if (includeBlockTime && avgBlockTime > 0) {
                timeDiff = Math.max(0, timeDiff - avgBlockTime);
              }
              
              const timeDiffFormatted = timeDiff < 60 
                ? `${timeDiff.toFixed(1)}s`
                : `${Math.floor(timeDiff / 60)}m ${(timeDiff % 60).toFixed(1)}s`;
              
              return [{
                pair: feedName,
                network: network,
                value: parseFloat(ethers.formatUnits(value, 18)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }),
                timestamp: new Date(Number(timestamp)).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                }),
                aggregatePower: aggregatePower.toLocaleString(),
                relayTimestamp: new Date(Number(relayTimestamp) * 1000).toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                }),
                timeDifference: timeDiffFormatted,
                blockNumber: "Current",
                txHash: `tellor_${feedName.toLowerCase().replace('/', '_')}_current_${Date.now()}`,
                note: `Current ${feedName} Data`,
                _rawTimestamp: Number(timestamp)
              }];
            }
          } catch (currentError) {
            // No current data available - return empty array
            return [];
          }
          // If count is 0 and no current data, return empty array
          return [];
        }
        
        // Fetch data points with pagination (only first page initially)
        const processedData = [];
        const startIndex = Math.max(0, countNum - rowsPerPage); // Start from most recent
        const endIndex = countNum; // Go to the end
        
        for (let i = startIndex; i < endIndex; i++) {
          try {
            const data = await contract.getAggregateByIndex(queryId, i);
            
            const value = data[0];
            const aggregatePower = typeof data[1] === 'bigint' ? Number(data[1]) : Number(data[1]);
            const timestamp = typeof data[2] === 'bigint' ? Number(data[2]) : Number(data[2]);
            const relayTimestamp = typeof data[4] === 'bigint' ? Number(data[4]) : Number(data[4]);
            
            // Calculate time difference in seconds for current row
            // timestamp is in milliseconds, relayTimestamp is in seconds
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
              realBlockNumber = Math.floor(Number(timestamp)) || "Unknown";
            }
            
            processedData.push({
              pair: feedName,
              network: network,
              value: parseFloat(ethers.formatUnits(value, 18)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }),
              timestamp: new Date(Number(timestamp)).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }),
              aggregatePower: aggregatePower.toLocaleString(),
              relayTimestamp: new Date(Number(relayTimestamp) * 1000).toLocaleString('en-US', {
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
              txHash: `tellor_${feedName.toLowerCase().replace('/', '_')}_${i}_${Date.now()}`, // Generate a unique identifier
              note: `${feedName} Data ${i + 1}/${countNum}`,
              // Keep raw timestamp for sorting
              _rawTimestamp: Number(timestamp) * 1000
            });
          } catch (itemError) {
            // Silently skip data points that don't exist (contract reverts are expected)
            // Only log if it's not a revert/CALL_EXCEPTION (which indicates missing data)
            if (itemError.code !== 'CALL_EXCEPTION' && !itemError.message?.includes('revert')) {
              console.warn(`Failed to fetch data point ${i}:`, itemError);
            }
            // Continue with other data points
          }
        }
        
        if (processedData.length === 0) {
          // Return empty array instead of throwing - let caller handle empty data
          return [];
        }
          
          // Sort by raw timestamp descending (newest first)
          processedData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
          
          // Set pagination state for Tellor contracts
          setTotalTransactions(countNum);
          setLoadedTransactions(processedData.length);
          setLoadedPages(Math.ceil(processedData.length / rowsPerPage));
          setHasMoreTransactions(processedData.length < countNum);
          
        return processedData;
    } catch (error) {
      throw error;
    }
  }, [includeBlockTime, avgBlockTime, currentFeed, cancellationToken, isDataBankContract]);

  // Function to calculate average block time
  const calculateAverageBlockTime = async (provider, contractAddress) => {
    // Disable block time calculation to avoid API limits
    const isSagaChain = contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase();
    const isBaseChain = contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase();
    const defaultBlockTime = isSagaChain || isBaseChain ? 2 : 12;
    setAvgBlockTime(defaultBlockTime);
    return defaultBlockTime;
  };

  // Function to load more transactions (next page)
  const loadMoreTransactions = useCallback(async () => {
    if (!selectedDataBankFeed || !hasMoreTransactions || isIncrementalLoading) {
      return;
    }
    
    try {
      setIsIncrementalLoading(true);
      
      const provider = new ethers.JsonRpcProvider(SAGA_RPC_URL);
      const contract = new ethers.Contract(
        contractAddress,
        DataBankABI.abi,
        provider
      );
      
      // Calculate the next page starting index
      const currentPage = Math.ceil(loadedTransactions / rowsPerPage);
      const nextPage = currentPage + 1;
      const nextStartIndex = Math.max(0, totalTransactions - (nextPage * rowsPerPage));
      
      // Calculate block time if needed and not already cached
      let currentBlockTime = avgBlockTime;
      if (includeBlockTime && avgBlockTime === 0) {
        try {
          currentBlockTime = await calculateAverageBlockTime(provider, contractAddress);
          setAvgBlockTime(currentBlockTime);
          } catch (error) {
          console.warn('Failed to calculate block time for load more, using 0:', error.message);
          currentBlockTime = 0;
        }
      }
      
      // Load next page of transactions
      await fetchDataBankData(contract, provider, selectedDataBankFeed, cancellationToken, currentBlockTime, true, nextStartIndex);
      
    } catch (error) {
      console.error('Error loading more transactions:', error);
    } finally {
      setIsIncrementalLoading(false);
    }
  }, [selectedDataBankFeed, hasMoreTransactions, isIncrementalLoading, totalTransactions, loadedTransactions, rowsPerPage, contractAddress, avgBlockTime, includeBlockTime, cancellationToken, fetchDataBankData, calculateAverageBlockTime]);

  // Function to load more Tellor transactions (next page)
  const loadMoreTellorTransactions = useCallback(async () => {
    if (isDataBankContract || !hasMoreTransactions || isIncrementalLoading) {
      return;
    }
    
    try {
      setIsIncrementalLoading(true);
      
      let rpcUrl;
      if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
        rpcUrl = SAGA_RPC_URL;
      } else if (contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase()) {
        rpcUrl = BASE_RPC_URL;
      } else {
        rpcUrl = SEPOLIA_RPC_URL;
      }
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(
        contractAddress,
        TellorABI, // TellorABI is already an array
        provider
      );
      
      // Calculate the next page starting index
      const currentPage = Math.ceil(loadedTransactions / rowsPerPage);
      const nextPage = currentPage + 1;
      const startIndex = Math.max(0, totalTransactions - (nextPage * rowsPerPage));
      const endIndex = Math.max(0, totalTransactions - (currentPage * rowsPerPage));
      
      
      // Fetch next page of Tellor transactions
      const processedData = [];
      const isBaseContract = contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase();
      const selectedFeed = isBaseContract ? selectedBaseFeed : selectedSepoliaFeed;
      const queryIds = isBaseContract ? BASE_QUERY_IDS : SEPOLIA_QUERY_IDS;
      const network = isBaseContract ? 'Base' : 'Sepolia';
      const queryId = queryIds[selectedFeed];
      for (let i = startIndex; i < endIndex; i++) {
        try {
          const data = await contract.getAggregateByIndex(queryId, i);
          
          // Process the data (same logic as in fetchTellorData)
          const value = data[0];
          const aggregatePower = typeof data[1] === 'bigint' ? Number(data[1]) : Number(data[1]);
          const timestamp = typeof data[2] === 'bigint' ? Number(data[2]) : Number(data[2]);
          const relayTimestamp = typeof data[4] === 'bigint' ? Number(data[4]) : Number(data[4]);
          
          let timeDiff = Math.abs(Number(relayTimestamp) - (Number(timestamp) / 1000));
          if (includeBlockTime && avgBlockTime > 0) {
            timeDiff = Math.max(0, timeDiff - avgBlockTime);
          }
          
          const timeDiffFormatted = timeDiff < 60 
            ? `${timeDiff.toFixed(1)}s`
            : `${Math.floor(timeDiff / 60)}m ${(timeDiff % 60).toFixed(1)}s`;
          
          let realBlockNumber = "Fetching...";
          try {
            const currentBlock = await provider.getBlockNumber();
            realBlockNumber = currentBlock;
          } catch (blockError) {
            realBlockNumber = Math.floor(Number(timestamp)) || "Unknown";
          }
          
          processedData.push({
            pair: selectedFeed,
            network: network,
            value: parseFloat(ethers.formatUnits(value, 18)).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
            timestamp: new Date(Number(timestamp)).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }),
            aggregatePower: aggregatePower.toLocaleString(),
            relayTimestamp: new Date(Number(relayTimestamp) * 1000).toLocaleString('en-US', {
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
            txHash: `tellor_${selectedFeed.toLowerCase().replace('/', '_')}_${i}_${Date.now()}`,
            note: `${selectedFeed} Data Point ${i}`,
            _rawTimestamp: Number(timestamp)
          });
        } catch (indexError) {
          // Silent error handling
        }
      }
      
      // Update UI with new page
      if (processedData.length > 0) {
        setCurrentValue(prevData => {
          // Remove duplicates from new data
          const uniqueNewData = processedData.filter(newTx => 
            !prevData.some(existing => 
              existing.txHash === newTx.txHash || 
              existing._rawTimestamp === newTx._rawTimestamp
            )
          );
          
          if (uniqueNewData.length === 0) {
            return prevData;
          }
          
          // Append new transactions and sort by timestamp descending (newest first)
          const updatedData = [...prevData, ...uniqueNewData];
          const sortedData = updatedData.sort((a, b) => b._rawTimestamp - a._rawTimestamp);
          
          // Update ref for immediate access
          currentValueRef.current = sortedData;
          // Update loaded transactions count
          setLoadedTransactions(sortedData.length);
          // Update loaded pages count
          setLoadedPages(Math.ceil(sortedData.length / rowsPerPage));
          // Check if there are more transactions to load
          setHasMoreTransactions(sortedData.length < totalTransactions);
          
          return sortedData;
        });
      }
      
    } catch (error) {
      console.error('Error loading more Tellor transactions:', error);
    } finally {
      setIsIncrementalLoading(false);
    }
  }, [isDataBankContract, hasMoreTransactions, isIncrementalLoading, loadedTransactions, totalTransactions, rowsPerPage, contractAddress, avgBlockTime, includeBlockTime, cancellationToken, selectedSepoliaFeed, selectedBaseFeed]);

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
      const provider = new ethers.JsonRpcProvider(SAGA_RPC_URL);
      
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

  // Function to fetch just the latest entry for a single Saga feed (for Overview)
  const fetchLatestSagaFeedEntry = async (contract, provider, feedName, queryId) => {
    try {
      const valueCount = await contract.getAggregateValueCount(queryId);
      if (!valueCount || valueCount === 0) return null;
      
      const countNum = Number(valueCount);
      const latestIndex = countNum - 1;
      
      // Get the individual update data using the correct method
      const updateData = await contract.getAggregateByIndex(queryId, latestIndex);
      
      if (!updateData) return null;
      
      // Extract the core data fields (same structure as fetchDataBankData)
      let price = "0.00";
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
            console.warn(`Decode error for ${feedName}:`, decodeError);
            price = "0.00";
          }
        }
        
        // Extract timestamps and power from the update data using numeric indices
        power = Number(updateData[1] || 0);                    // index 1: power
        aggregateTimestamp = Number(updateData[2] || 0);       // index 2: aggregateTimestamp  
        relayTimestamp = Number(updateData[4] || 0);           // index 4: relayTimestamp
        
      } catch (decodeError) {
        console.warn(`Error processing data for ${feedName}:`, decodeError);
      }
      
      // Handle timestamp conversion - normalize both timestamps to milliseconds
      const aggTimestampMs = Number(aggregateTimestamp);
      const finalAggTimestamp = aggTimestampMs < 10000000000 ? aggTimestampMs * 1000 : aggTimestampMs;
      const relayTimestampMs = Number(relayTimestamp);
      const finalRelayTimestamp = relayTimestampMs < 10000000000 ? relayTimestampMs * 1000 : relayTimestampMs;
      
      // Calculate time difference
      const timeDiffSeconds = (finalRelayTimestamp - finalAggTimestamp) / 1000;
      const timeDiffFormatted = formatTimeString(Math.abs(timeDiffSeconds));
      
      const currentBlock = await provider.getBlock('latest');
      const realBlockNumber = currentBlock.number;
      
      return {
        pair: feedName,
        value: price,
        timestamp: new Date(finalAggTimestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
        aggregatePower: power.toLocaleString(),
        relayTimestamp: new Date(finalRelayTimestamp).toLocaleString('en-US', {
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
        _rawTimestamp: finalAggTimestamp
      };
    } catch (error) {
      console.warn(`Failed to fetch latest entry for ${feedName}:`, error);
      return null;
    }
  };

  // Function to fetch all feeds for Overview tab
  const fetchAllFeeds = useCallback(async () => {
    try {
      // Set feed loading state for Overview tab
      setFeedLoading(true);
      
      // Initialize providers and contracts in parallel
      const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      const sepoliaContract = new ethers.Contract(
        SEPOLIA_CONTRACT_ADDRESS,
        TellorABI,
        sepoliaProvider
      );
      
      const baseProvider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      const baseContract = new ethers.Contract(
        BASE_CONTRACT_ADDRESS,
        TellorABI,
        baseProvider
      );
      
      const sagaProvider = new ethers.JsonRpcProvider(SAGA_RPC_URL);
      const sagaContract = new ethers.Contract(
        DATABANK_CONTRACT_ADDRESS,
        DataBankABI.abi,
        sagaProvider
      );
      
      // Fetch all feeds in parallel across all networks
      const allPromises = [
        // Sepolia feeds (parallel)
        fetchTellorData(sepoliaContract, sepoliaProvider, 'ETH/USD', 'Sepolia', SEPOLIA_QUERY_IDS)
          .then(data => data && data.length > 0 ? data[0] : null)
          .catch(error => {
            console.warn('Failed to fetch Sepolia ETH/USD data:', error);
            return null;
          }),
        fetchTellorData(sepoliaContract, sepoliaProvider, 'BTC/USD', 'Sepolia', SEPOLIA_QUERY_IDS)
          .then(data => data && data.length > 0 ? data[0] : null)
          .catch(error => {
            console.warn('Failed to fetch Sepolia BTC/USD data:', error);
            return null;
          }),
        
        // Base feeds (parallel)
        fetchTellorData(baseContract, baseProvider, 'ETH/USD', 'Base', BASE_QUERY_IDS)
          .then(data => data && data.length > 0 ? data[0] : null)
          .catch(error => {
            console.warn('Failed to fetch Base ETH/USD data:', error);
            return null;
          }),
        fetchTellorData(baseContract, baseProvider, 'BTC/USD', 'Base', BASE_QUERY_IDS)
          .then(data => data && data.length > 0 ? data[0] : null)
          .catch(error => {
            console.warn('Failed to fetch Base BTC/USD data:', error);
            return null;
          }),
        fetchTellorData(baseContract, baseProvider, 'TRB/USD', 'Base', BASE_QUERY_IDS)
          .then(data => data && data.length > 0 ? data[0] : null)
          .catch(error => {
            console.warn('Failed to fetch Base TRB/USD data:', error);
            return null;
          }),
        
        // Saga feeds (parallel)
        ...Object.entries(DATABANK_PRICE_PAIRS).map(([feedName, queryId]) =>
          fetchLatestSagaFeedEntry(sagaContract, sagaProvider, feedName, queryId)
            .catch(error => {
              console.warn(`Failed to fetch Saga ${feedName} data:`, error);
              return null;
            })
        )
      ];
      
      // Wait for all promises to settle (parallel execution)
      const results = await Promise.all(allPromises);
      
      // Filter out null results and update state
      const allData = results.filter(result => result !== null);
      
      if (allData.length > 0) {
        setOverviewData(allData);
        setInitialFetchComplete(true);
      }
      
      setLoading(false);
      setFeedLoading(false);
    } catch (error) {
      console.error('Error fetching all feeds:', error);
      setLoading(false);
      setFeedLoading(false);
    }
  }, [fetchTellorData]);

  // UseEffect to fetch all feeds on mount for Overview tab
  useEffect(() => {
    // Only run when on Overview tab
    if (activeTab === 0) {
      // Set loading to false immediately so UI renders
      setLoading(false);
      // Fetch all feeds (if not already loaded)
      if (overviewData.length === 0) {
        fetchAllFeeds();
      }
    }
  }, [activeTab, fetchAllFeeds, overviewData.length]);

  // UseEffect for heartbeat countdown timer (updates every second)
  // This causes the Overview tab to re-render every second, updating all countdowns
  useEffect(() => {
    if (activeTab === 0) {
      const heartbeatInterval = setInterval(() => {
        setHeartbeatTick(prev => prev + 1);
      }, 1000);
      return () => clearInterval(heartbeatInterval);
    }
  }, [activeTab]);

  useEffect(() => {
    // Skip main data fetching if on Overview tab
    if (activeTab === 0) {
      return;
    }
    
    // Skip main data fetching if a specific DataBank feed is selected
    if (selectedDataBankFeed && contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      return;
    }
    
    // Skip if we're switching to DataBank contract but don't have feed yet
    if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
      return;
    }
    
    setFeedLoading(true);
    
    const fetchData = async () => {
      try {
        let rpcUrl;
        if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
          rpcUrl = SAGA_RPC_URL;
        } else if (contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase()) {
          rpcUrl = BASE_RPC_URL;
        } else {
          rpcUrl = SEPOLIA_RPC_URL;
        }
        
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
          const isBaseContract = contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase();
          const selectedFeed = isBaseContract ? selectedBaseFeed : selectedSepoliaFeed;
          const queryIds = isBaseContract ? BASE_QUERY_IDS : SEPOLIA_QUERY_IDS;
          const network = isBaseContract ? 'Base' : 'Sepolia';
          try {
            processedData = await fetchTellorData(contract, provider, selectedFeed, network, queryIds);
          } catch (error) {
            console.error('Tellor fetch error:', error);
            processedData = [];
          }
        }
        
        if (processedData && processedData.length > 0) {
          // Set data for Tellor contract (when not using DataBank)
          setCurrentValue(processedData);
          currentValueRef.current = processedData;
          setInitialFetchComplete(true); // Mark initial fetch as complete
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
  }, [contractAddress, includeBlockTime, timeScale, customStartDate, customEndDate, fetchTellorData, selectedDataBankFeed, selectedSepoliaFeed, selectedBaseFeed, activeTab]);

    // Separate useEffect to handle DataBank feed selection changes
  useEffect(() => {
    // Skip if on Overview tab
    if (activeTab === 0) {
      return;
    }
    
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
      setLoadedTransactions(0);
      setTotalTransactions(0);
      setHasMoreTransactions(false);
      setLoadedPages(1);
    }
    
    // Prevent duplicate fetches for the same feed if data already exists
    if (currentValue.length > 0 && currentValue[0]?.pair === selectedDataBankFeed) {
      return;
    }
    
    // Set current feed being processed
    setCurrentFeed(selectedDataBankFeed);
    
    setFeedLoading(true);
    
    // Initial data fetch when feed selection changes
    const fetchSelectedFeedData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(SAGA_RPC_URL);
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
        
        // Calculate average block time if toggle is enabled and not already cached
        let currentBlockTime = avgBlockTime;
        if (includeBlockTime && avgBlockTime === 0) {
          try {
          const blockTime = await calculateAverageBlockTime(provider, contractAddress);
          // Update state and also use the value directly
          setAvgBlockTime(blockTime);
          currentBlockTime = blockTime;
          } catch (error) {
            console.warn('Failed to calculate block time, using 0:', error.message);
            currentBlockTime = 0;
          }
        }
        
        await fetchDataBankData(contract, provider, selectedDataBankFeed, cancellationToken, currentBlockTime);
        
        setLoading(false);
        setFeedLoading(false);
        setError(null);
        
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
            const provider = new ethers.JsonRpcProvider(SAGA_RPC_URL);
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
              
              // Recalculate block time if toggle is enabled and not already cached
              let currentRefreshBlockTime = avgBlockTime;
              if (includeBlockTime && avgBlockTime === 0) {
                try {
                const blockTime = await calculateAverageBlockTime(provider, contractAddress);
                currentRefreshBlockTime = blockTime;
                  setAvgBlockTime(blockTime);
                } catch (error) {
                  console.warn('Failed to calculate block time in refresh, using cached value:', error.message);
                }
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
                  // Validate we're still on the correct feed
                  if (currentFeed !== selectedDataBankFeed || currentFeedRef.current !== selectedDataBankFeed) {
                    return prevData;
                  }
                  
                  // Clean existing data to remove any cross-feed contamination
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
      setLoadedTransactions(0);
      setTotalTransactions(0);
      setHasMoreTransactions(false);
      setLoadedPages(1);
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
    
  }, [selectedDataBankFeed, contractAddress, fetchDataBankData, activeTab]);

  // Effect to immediately clear data when feed changes
  useEffect(() => {
    // Clear data immediately when feed changes
    setCurrentValue([]);
    currentValueRef.current = [];
    setInitialFetchComplete(false);
    setIsIncrementalLoading(false);
    setPage(1);
    
    // Clear block time cache when switching feeds
    setAvgBlockTime(0);
    
    if (selectedDataBankFeed) {
      setCurrentFeed(selectedDataBankFeed);
      currentFeedRef.current = selectedDataBankFeed;
    } else if (contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase()) {
      setCurrentFeed(selectedSepoliaFeed);
      currentFeedRef.current = selectedSepoliaFeed;
    } else if (contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase()) {
      setCurrentFeed(selectedBaseFeed);
      currentFeedRef.current = selectedBaseFeed;
    } else {
      setCurrentFeed(null);
      currentFeedRef.current = null;
    }
    
    // Force a re-render to ensure UI updates
    setRenderKey(prev => prev + 1);
  }, [selectedDataBankFeed, selectedSepoliaFeed, selectedBaseFeed, contractAddress]);

  // Effect to recalculate block time when toggle changes or feed changes
  useEffect(() => {

    const recalculateBlockTime = async () => {
      if (includeBlockTime) {
        try {
          let rpcUrl;
          if (contractAddress.toLowerCase() === DATABANK_CONTRACT_ADDRESS.toLowerCase()) {
            rpcUrl = SAGA_RPC_URL;
          } else if (contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase()) {
            rpcUrl = BASE_RPC_URL;
          } else {
            rpcUrl = SEPOLIA_RPC_URL;
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
    // Clear data completely when switching contract types
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
      setLoadedTransactions(0);
      setTotalTransactions(0);
      setHasMoreTransactions(false);
      setLoadedPages(1);
    };
  }, []);

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
          <Box
            component="img"
            src="/tellor-relayer-logo.png"
            alt="Tellor Relayer"
            sx={{
              height: { xs: '35px', sm: '50px' },
              width: 'auto',
              maxWidth: '100%',
              display: 'block'
            }}
          />
          
        </Grid>
      </Grid>

      {/* Tabs for Overview and Feed History */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: '#0E5353',
              fontWeight: 'normal',
              textTransform: 'none',
              fontSize: '16px',
              minWidth: 120,
            },
            '& .Mui-selected': {
              color: '#0E5353',
              fontWeight: 'bold',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0E5353',
              height: 3,
            }
          }}
        >
          <Tab label="Overview" />
          <Tab label="Feed Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 ? (
        // Overview Tab - Latest report from each feed
        <div className="overview-tab">
          {/* Feed Selection */}
          <div className="price-feeds-container" style={{ padding: '8px 16px', backgroundColor: 'transparent' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0' }}>
              <Typography variant="body2" sx={{ color: '#0E5353', fontWeight: 'bold', mb: 0, fontSize: '16px', lineHeight: 1.2 }}>
                Latest Reports from All Feeds
              </Typography>
              <Typography variant="body2" sx={{ color: '#0E5353', fontSize: '14px', opacity: 0.8, lineHeight: 1.2 }}>
                Showing the most recent report relayed from Tellor for each unique price feed across all networks
              </Typography>
            </div>
          </div>

          {/* Latest Reports Table */}
          <TableContainer 
            component={Paper}
            sx={{ 
              backgroundColor: 'transparent',
              boxShadow: 'none',
              border: '1px solid rgba(14, 83, 83, 0.2)',
              mt: 2
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(14, 83, 83, 0.05)' }}>
                  <TableCell 
                    sx={{ 
                      color: '#0E5353', 
                      fontWeight: 'bold', 
                      fontSize: '14px', 
                      borderBottom: '2px solid rgba(14, 83, 83, 0.3)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(14, 83, 83, 0.1)'
                      }
                    }}
                    onClick={() => {
                      if (overviewSortColumn === 'feed') {
                        setOverviewSortDirection(overviewSortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setOverviewSortColumn('feed');
                        setOverviewSortDirection('asc');
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Feed
                      {overviewSortColumn === 'feed' && (
                        overviewSortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: '16px' }} /> : <ArrowDownward sx={{ fontSize: '16px' }} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: '#0E5353', 
                      fontWeight: 'bold', 
                      fontSize: '14px', 
                      borderBottom: '2px solid rgba(14, 83, 83, 0.3)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(14, 83, 83, 0.1)'
                      }
                    }}
                    onClick={() => {
                      if (overviewSortColumn === 'network') {
                        setOverviewSortDirection(overviewSortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setOverviewSortColumn('network');
                        setOverviewSortDirection('asc');
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Network
                      {overviewSortColumn === 'network' && (
                        overviewSortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: '16px' }} /> : <ArrowDownward sx={{ fontSize: '16px' }} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                    Value
                  </TableCell>
                  <TableCell sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                    Deviation Threshold
                  </TableCell>
                  <TableCell sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                    Heartbeat
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, border: 'none' }}>
                      <CircularProgress size={40} style={{ color: '#0E5353', marginBottom: '16px' }} />
                      <div style={{ color: '#0E5353' }}>Loading all feeds...</div>
                    </TableCell>
                  </TableRow>
                ) : Array.isArray(overviewData) && overviewData.length > 0 ? (
                  // Group by feed and network, show only the latest report for each
                  (() => {
                    const latestReports = {};
                    overviewData.forEach(data => {
                      const feedName = data.pair || 'ETH/USD';
                      const network = data.network || 'Saga';
                      // Use feedName + network as key to distinguish between networks
                      const key = `${feedName}-${network}`;
                      if (!latestReports[key] || data._rawTimestamp > latestReports[key]._rawTimestamp) {
                        latestReports[key] = data;
                      }
                    });
                    
                    return Object.values(latestReports)
                      .sort((a, b) => {
                        let compareResult = 0;
                        
                        if (overviewSortColumn === 'network') {
                          const networkA = a.network || 'Saga';
                          const networkB = b.network || 'Saga';
                          compareResult = networkA.localeCompare(networkB);
                          // If networks are equal, sort by feed name as secondary
                          if (compareResult === 0) {
                            const feedA = a.pair || 'ETH/USD';
                            const feedB = b.pair || 'ETH/USD';
                            compareResult = feedA.localeCompare(feedB);
                          }
                        } else if (overviewSortColumn === 'feed') {
                          const feedA = a.pair || 'ETH/USD';
                          const feedB = b.pair || 'ETH/USD';
                          compareResult = feedA.localeCompare(feedB);
                          // If feeds are equal, sort by network as secondary
                          if (compareResult === 0) {
                            const networkA = a.network || 'Saga';
                            const networkB = b.network || 'Saga';
                            compareResult = networkA.localeCompare(networkB);
                          }
                        }
                        
                        // Apply sort direction
                        return overviewSortDirection === 'asc' ? compareResult : -compareResult;
                      })
                      .map((data, index) => {
                        const feedName = data.pair || 'ETH/USD';
                        const network = data.network || 'Saga';
                        const networkDisplayName = network === 'Sepolia' ? 'Sepolia Testnet' : network === 'Base' ? 'Base Mainnet' : 'Saga Mainnet';
                        return (
                          <TableRow 
                            key={index}
                            onClick={() => {
                            let explorerUrl;
                            if (data.network === 'Sepolia') {
                              explorerUrl = ETHERSCAN_BASE_URL + SEPOLIA_CONTRACT_ADDRESS;
                            } else if (data.network === 'Base') {
                              explorerUrl = `https://basescan.org/address/${BASE_CONTRACT_ADDRESS}`;
                            } else {
                              explorerUrl = `https://sagaevm.sagaexplorer.io/address/${DATABANK_CONTRACT_ADDRESS}?tab=transactions`;
                            }
                              window.open(explorerUrl, '_blank');
                            }}
                            sx={{
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              '&:hover': {
                                backgroundColor: 'rgba(14, 83, 83, 0.08)',
                              },
                              '&:last-child td': {
                                border: 0
                              }
                            }}
                          >
                            <TableCell sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {getFeedIcon(feedName)}
                                <span style={{ fontWeight: 'bold' }}>{feedName}</span>
                              </div>
                            </TableCell>
                            <TableCell sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {getNetworkIcon(network)}
                                <span style={{ fontWeight: 'bold' }}>{networkDisplayName}</span>
                              </div>
                            </TableCell>
                            <TableCell sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                              ${data.value}
                            </TableCell>
                            <TableCell sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                              {DEVIATION_THRESHOLD[feedName] || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)', fontSize: '13px' }}>
                              {(() => {
                                const heartbeat = calculateHeartbeat(data.timestamp);
                                return heartbeat.text;
                              })()}
                            </TableCell>
                          </TableRow>
                        );
                      });
                  })()
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, border: 'none' }}>
                      <div style={{ color: '#0E5353', opacity: 0.7 }}>
                        {loading ? (
                          <div>
                            <CircularProgress size={40} style={{ color: '#0E5353', marginBottom: '16px' }} />
                            <div>Loading data...</div>
                          </div>
                        ) : (
                          <div>No data available. Please wait for feeds to load.</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      ) : (
        // Feed History Tab - Historical data with analytics
        <div className="feed-history-tab">
        <div className="datafeed-container">
        {/* Left Column - Price Feeds + Data Feed */}
        <div className="datafeed-left-column">
          {/* Oracle Price Feeds */}
          <div className="price-feeds-container">
            {/* Feed Selection - Responsive Layout */}
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-between' }}>
              {/* Left Side - Feed Sections Stacked Vertically */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '0 0 auto' }}>
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
                        setSelectedSepoliaFeed('ETH/USD');
                        
                        // Use Sepolia Tellor contract
                        setSelectedDataBankFeed(null);
                        setIsDataBankContract(false);
                        setContractAddress('0xF03B401966eF4c32e7Cef769c4BB2833BaC0eb9a');
                        setInputAddress('0xF03B401966eF4c32e7Cef769c4BB2833BaC0eb9a');
                        
                        // Clear current data immediately to show loading state
                        setCurrentValue([]);
                        currentValueRef.current = [];
                        setCurrentFeed(null);
                        currentFeedRef.current = null;
                        setInitialFetchComplete(false);
                        setIsIncrementalLoading(false);
                        setPage(1);
                        
                        // Force re-render
                        setRenderKey(prev => prev + 1);
                      }}
                      disabled={feedLoading}
                  style={{
                      minWidth: '110px',
                    padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: (!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'ETH/USD') ? 'bold' : 'normal',
                        backgroundColor: (!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'ETH/USD') ? '#0E5353' : 'transparent',
                        color: (!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'ETH/USD') ? 'white' : '#0E5353',
                        border: `2px solid #0E5353`,
                      borderRadius: '4px',
                      cursor: feedLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                        opacity: feedLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'ETH/USD')) {
                          e.target.style.backgroundColor = 'rgba(14, 83, 83, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'ETH/USD')) {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {feedLoading && selectedDataBankFeed ? (
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
                                    ? ((!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'ETH/USD') ? 'white' : '#0E5353')
                                    : 'rgba(255,255,255,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          {getFeedTypeSymbol('ETH/USD', (!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'ETH/USD') ? 'white' : '#0E5353')}
                          <span>ETH/USD</span>
                        </div>
                      )}
                  </button>
                  
                  <button
                      onClick={() => {
                        if (feedLoading) return;
                        
                        setFeedLoading(true);
                        setSelectedSepoliaFeed('BTC/USD');
                        
                        // Use Sepolia Tellor contract
                        setSelectedDataBankFeed(null);
                        setIsDataBankContract(false);
                        setContractAddress('0xF03B401966eF4c32e7Cef769c4BB2833BaC0eb9a');
                        setInputAddress('0xF03B401966eF4c32e7Cef769c4BB2833BaC0eb9a');
                        
                        // Clear current data immediately to show loading state
                        setCurrentValue([]);
                        currentValueRef.current = [];
                        setCurrentFeed(null);
                        currentFeedRef.current = null;
                        setInitialFetchComplete(false);
                        setIsIncrementalLoading(false);
                        setPage(1);
                        
                        // Force re-render
                        setRenderKey(prev => prev + 1);
                      }}
                      disabled={feedLoading}
                  style={{
                      minWidth: '110px',
                    padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: (!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'BTC/USD') ? 'bold' : 'normal',
                        backgroundColor: (!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'BTC/USD') ? '#0E5353' : 'transparent',
                        color: (!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'BTC/USD') ? 'white' : '#0E5353',
                        border: `2px solid #0E5353`,
                      borderRadius: '4px',
                      cursor: feedLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                        opacity: feedLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'BTC/USD')) {
                          e.target.style.backgroundColor = 'rgba(14, 83, 83, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'BTC/USD')) {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {feedLoading && selectedDataBankFeed ? (
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
                            title={`Risk Level: ${FEED_RISK_ASSESSMENT['BTC/USD'] === 'exemplary' ? 'Exemplary (3/3)' : FEED_RISK_ASSESSMENT['BTC/USD'] === 'moderate' ? 'Moderate (2/3)' : 'High Risk (1/3)'}`}
                          >
                            {Array.from({ length: 3 }, (_, index) => (
                              <div
                                key={index}
                                style={{
                                  width: '6px',
                                  height: '2px',
                                  backgroundColor: index < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT['BTC/USD'] || 'high'] 
                                    ? ((!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'BTC/USD') ? 'white' : '#0E5353')
                                    : 'rgba(255,255,255,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          {getFeedTypeSymbol('BTC/USD', (!selectedDataBankFeed && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && selectedSepoliaFeed === 'BTC/USD') ? 'white' : '#0E5353')}
                          <span>BTC/USD</span>
                        </div>
                      )}
                  </button>
                  </div>
                </div>

                {/* Base Feeds */}
                <div>
                  <Typography variant="body2" sx={{ color: '#0E5353', fontWeight: 'bold', mb: 2, fontSize: '14px' }}>
                    Base Feeds:
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
                        setSelectedBaseFeed('ETH/USD');
                        
                        // Use Base Tellor contract
                        setSelectedDataBankFeed(null);
                        setIsDataBankContract(false);
                        setContractAddress('0x5589e306b1920F009979a50B88caE32aecD471E4');
                        setInputAddress('0x5589e306b1920F009979a50B88caE32aecD471E4');
                        
                        // Clear current data immediately to show loading state
                        setCurrentValue([]);
                        currentValueRef.current = [];
                        setCurrentFeed(null);
                        currentFeedRef.current = null;
                        setInitialFetchComplete(false);
                        setIsIncrementalLoading(false);
                        setPage(1);
                        
                        // Force re-render
                        setRenderKey(prev => prev + 1);
                      }}
                      disabled={feedLoading}
                  style={{
                      minWidth: '110px',
                    padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'ETH/USD') ? 'bold' : 'normal',
                        backgroundColor: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'ETH/USD') ? '#0E5353' : 'transparent',
                        color: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'ETH/USD') ? 'white' : '#0E5353',
                        border: `2px solid #0E5353`,
                      borderRadius: '4px',
                      cursor: feedLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                        opacity: feedLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'ETH/USD')) {
                          e.target.style.backgroundColor = 'rgba(14, 83, 83, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'ETH/USD')) {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {feedLoading && selectedDataBankFeed ? (
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
                                    ? ((!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'ETH/USD') ? 'white' : '#0E5353')
                                    : 'rgba(255,255,255,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          {getFeedTypeSymbol('ETH/USD', (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'ETH/USD') ? 'white' : '#0E5353')}
                          <span>ETH/USD</span>
                        </div>
                      )}
                  </button>
                  
                  <button
                      onClick={() => {
                        if (feedLoading) return;
                        
                        setFeedLoading(true);
                        setSelectedBaseFeed('BTC/USD');
                        
                        // Use Base Tellor contract
                        setSelectedDataBankFeed(null);
                        setIsDataBankContract(false);
                        setContractAddress('0x5589e306b1920F009979a50B88caE32aecD471E4');
                        setInputAddress('0x5589e306b1920F009979a50B88caE32aecD471E4');
                        
                        // Clear current data immediately to show loading state
                        setCurrentValue([]);
                        currentValueRef.current = [];
                        setCurrentFeed(null);
                        currentFeedRef.current = null;
                        setInitialFetchComplete(false);
                        setIsIncrementalLoading(false);
                        setPage(1);
                        
                        // Force re-render
                        setRenderKey(prev => prev + 1);
                      }}
                      disabled={feedLoading}
                  style={{
                      minWidth: '110px',
                    padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'BTC/USD') ? 'bold' : 'normal',
                        backgroundColor: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'BTC/USD') ? '#0E5353' : 'transparent',
                        color: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'BTC/USD') ? 'white' : '#0E5353',
                        border: `2px solid #0E5353`,
                      borderRadius: '4px',
                      cursor: feedLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                        opacity: feedLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'BTC/USD')) {
                          e.target.style.backgroundColor = 'rgba(14, 83, 83, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'BTC/USD')) {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {feedLoading && selectedDataBankFeed ? (
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
                            title={`Risk Level: ${FEED_RISK_ASSESSMENT['BTC/USD'] === 'exemplary' ? 'Exemplary (3/3)' : FEED_RISK_ASSESSMENT['BTC/USD'] === 'moderate' ? 'Moderate (2/3)' : 'High Risk (1/3)'}`}
                          >
                            {Array.from({ length: 3 }, (_, index) => (
                              <div
                                key={index}
                                style={{
                                  width: '6px',
                                  height: '2px',
                                  backgroundColor: index < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT['BTC/USD'] || 'high'] 
                                    ? ((!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'BTC/USD') ? 'white' : '#0E5353')
                                    : 'rgba(255,255,255,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          {getFeedTypeSymbol('BTC/USD', (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'BTC/USD') ? 'white' : '#0E5353')}
                          <span>BTC/USD</span>
                        </div>
                      )}
                  </button>
                  
                  <button
                      onClick={() => {
                        if (feedLoading) return;
                        
                        setFeedLoading(true);
                        setSelectedBaseFeed('TRB/USD');
                        
                        // Use Base Tellor contract
                        setSelectedDataBankFeed(null);
                        setIsDataBankContract(false);
                        setContractAddress('0x5589e306b1920F009979a50B88caE32aecD471E4');
                        setInputAddress('0x5589e306b1920F009979a50B88caE32aecD471E4');
                        
                        // Clear current data immediately to show loading state
                        setCurrentValue([]);
                        currentValueRef.current = [];
                        setCurrentFeed(null);
                        currentFeedRef.current = null;
                        setInitialFetchComplete(false);
                        setIsIncrementalLoading(false);
                        setPage(1);
                        
                        // Force re-render
                        setRenderKey(prev => prev + 1);
                      }}
                      disabled={feedLoading}
                  style={{
                      minWidth: '110px',
                    padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'TRB/USD') ? 'bold' : 'normal',
                        backgroundColor: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'TRB/USD') ? '#0E5353' : 'transparent',
                        color: (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'TRB/USD') ? 'white' : '#0E5353',
                        border: `2px solid #0E5353`,
                      borderRadius: '4px',
                      cursor: feedLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s ease',
                        opacity: feedLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'TRB/USD')) {
                          e.target.style.backgroundColor = 'rgba(14, 83, 83, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!feedLoading && !(!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'TRB/USD')) {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {feedLoading && selectedDataBankFeed ? (
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
                            title={`Risk Level: ${FEED_RISK_ASSESSMENT['TRB/USD'] === 'exemplary' ? 'Exemplary (3/3)' : FEED_RISK_ASSESSMENT['TRB/USD'] === 'moderate' ? 'Moderate (2/3)' : 'High Risk (1/3)'}`}
                          >
                            {Array.from({ length: 3 }, (_, index) => (
                              <div
                                key={index}
                                style={{
                                  width: '6px',
                                  height: '2px',
                                  backgroundColor: index < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT['TRB/USD'] || 'high'] 
                                    ? ((!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'TRB/USD') ? 'white' : '#0E5353')
                                    : 'rgba(255,255,255,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          {getFeedTypeSymbol('TRB/USD', (!selectedDataBankFeed && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && selectedBaseFeed === 'TRB/USD') ? 'white' : '#0E5353')}
                          <span>TRB/USD</span>
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
                      color: selectedDataBankFeed ? 'white' : '#0E5353',
                    }
                  }}
                >
                  <Select
                    value={selectedDataBankFeed || ''}
                    label="Select Saga Feed"
                    displayEmpty
                    sx={{
                      '& .MuiSelect-select': {
                        backgroundColor: selectedDataBankFeed ? '#0E5353' : 'transparent',
                        color: selectedDataBankFeed ? 'white' : '#0E5353',
                      },
                    }}
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
                        setRenderKey(prev => prev + 1);
                          setSelectedDataBankFeed(null);
                          setIsDataBankContract(false);
                          setContractAddress('0xF03B401966eF4c32e7Cef769c4BB2833BaC0eb9a');
                          setInputAddress('0xF03B401966eF4c32e7Cef769c4BB2833BaC0eb9a');
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
                        setRenderKey(prev => prev + 1);
                        setSelectedDataBankFeed(selectedFeed);
                          setIsDataBankContract(true);
                          setContractAddress('0x6f250229af8D83c51500f3565b10E93d8907B644');
                          setInputAddress('0x6f250229af8D83c51500f3565b10E93d8907B644');
                        }
                      }}
                      disabled={feedLoading}
                    renderValue={(selected) => {
                      if (!selected || selected === '') {
                        return <span style={{ color: '#0E5353', opacity: 0.6 }}>Select feed</span>;
                      }
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
                                    ? 'white'
                                    : 'rgba(255,255,255,0.3)',
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                          {getFeedTypeSymbol(selected, 'white')}
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
                          {getFeedTypeSymbol(pairName, 'white')}
                          <span>{pairName}</span>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                </div>
              </div>
              
              {/* Right Side - Legends Stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignSelf: 'flex-end' }}>
                {/* Best Practices Rating Legend */}
                <div style={{ 
                  padding: '12px 16px', 
                  backgroundColor: 'rgba(14, 83, 83, 0.05)', 
                  borderRadius: '6px',
                  border: '1px solid rgba(14, 83, 83, 0.1)',
                  width: 'fit-content'
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

                {/* Feed Types Legend */}
                <div style={{ 
                  padding: '12px 16px', 
                  backgroundColor: 'rgba(14, 83, 83, 0.05)', 
                  borderRadius: '6px',
                  border: '1px solid rgba(14, 83, 83, 0.1)',
                  width: 'fit-content'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Typography variant="caption" sx={{ 
                      color: '#0E5353', 
                      fontWeight: 'bold', 
                      fontSize: '11px'
                    }}>
                      Feed Types (hover over each feed's symbol for more details):
                    </Typography>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'nowrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ 
                          width: 0,
                          height: 0,
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderBottom: '7px solid #0E5353'
                        }} />
                        <span style={{ fontSize: '10px', color: '#0E5353' }}>market</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ 
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#0E5353'
                        }} />
                        <span style={{ fontSize: '10px', color: '#0E5353' }}>fundamental</span>
                      </div>
                      <span style={{ fontSize: '7px', color: '#0E5353', opacity: 0.8, lineHeight: '1' }}>(on-chain exchange rate)</span>
                      <span style={{ fontSize: '7px', color: '#0E5353', opacity: 0.8, lineHeight: '1' }}>×</span>
                      <span style={{ fontSize: '7px', color: '#0E5353', opacity: 0.8, lineHeight: '1' }}>(market price of underlying asset)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ 
                          width: '8px',
                          height: '8px',
                          borderStyle: 'solid',
                          borderWidth: '2px',
                          borderColor: '#0E5353',
                          backgroundColor: '#0E5353'
                        }} />
                        <span style={{ fontSize: '10px', color: '#0E5353' }}>mix</span>
                      </div>
                      <span style={{ fontSize: '7px', color: '#0E5353', opacity: 0.8, lineHeight: '1' }}>(on-chain exchange rate included in median)</span>
                    </div>
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
            
            {/* Table-based layout */}
            <TableContainer 
              component={Paper} 
              key={renderKey}
              sx={{ 
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: '1px solid rgba(14, 83, 83, 0.2)'
              }}
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(14, 83, 83, 0.05)' }}>
                    <TableCell sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                      Feed
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                      Value
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                      Deviation Threshold
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                      Power
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                      Reported
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                      Relayed
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#0E5353', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid rgba(14, 83, 83, 0.3)' }}>
                      Delay
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedLoading ? (
                    // Show loading state when fetching feed data
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, border: 'none' }}>
                        <CircularProgress size={40} style={{ color: '#0E5353', marginBottom: '16px' }} />
                        <div style={{ color: '#0E5353' }}>Loading {selectedDataBankFeed} data...</div>
                        <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px', color: '#0E5353' }}>
                          This may take a few moments while we fetch the latest transactions
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : Array.isArray(currentValue) && currentValue.length > 0 ? (
                    // Filter and display data based on contract type
                    currentValue
                      .filter(data => {
                        // For DataBank contracts, only show current feed data
                        if (isDataBankContract && selectedDataBankFeed && data.pair) {
                          return data.pair === selectedDataBankFeed;
                        }
                        // For Sepolia Tellor contracts, show data matching selected feed
                        if (!isDataBankContract && contractAddress.toLowerCase() === SEPOLIA_CONTRACT_ADDRESS.toLowerCase() && data.network === 'Sepolia') {
                          return data.pair === selectedSepoliaFeed;
                        }
                        // For Base Tellor contracts, show data matching selected feed
                        if (!isDataBankContract && contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase() && data.network === 'Base') {
                          return data.pair === selectedBaseFeed;
                        }
                        // For old Tellor contracts without feed selection, exclude DataBank data
                        if (!isDataBankContract && !selectedDataBankFeed && data.network !== 'Sepolia' && data.network !== 'Base') {
                          return !data.pair;
                        }
                        // Fallback: don't show data if we're in an inconsistent state
                        return false;
                      })
                      .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                      .map((data, index) => (
                        <TableRow 
                          key={index}
                          onClick={() => {
                            if (isDataBankContract) {
                              window.open(`https://sagaevm.sagaexplorer.io/address/${contractAddress}?tab=transactions`, '_blank');
                            } else if (contractAddress.toLowerCase() === BASE_CONTRACT_ADDRESS.toLowerCase()) {
                              window.open(`https://basescan.org/address/${contractAddress}`, '_blank');
                            } else {
                              window.open(ETHERSCAN_BASE_URL + contractAddress, '_blank');
                            }
                          }}
                          sx={{
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              backgroundColor: 'rgba(14, 83, 83, 0.08)',
                            },
                            '&:last-child td': {
                              border: 0
                            }
                          }}
                        >
                          <TableCell sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column-reverse',
                                gap: '1px', 
                                height: '10px',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {Array.from({ length: 3 }, (_, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      width: '6px',
                                      height: '2px',
                                      backgroundColor: i < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT[data.pair || 'ETH/USD'] || 'high'] 
                                        ? '#0E5353'
                                        : 'rgba(14, 83, 83, 0.3)',
                                      borderRadius: '1px'
                                    }}
                                  />
                                ))}
                              </div>
                              {getFeedTypeSymbol(data.pair || 'ETH/USD', '#0E5353')}
                              <span style={{ fontWeight: 'bold' }}>
                                {data.pair || 'ETH/USD'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                            ${data.value}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                            {DEVIATION_THRESHOLD[data.pair || 'ETH/USD'] || 'N/A'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                            {data.aggregatePower}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#0E5353', py: 2, fontSize: '13px', borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                            {data.timestamp}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#0E5353', py: 2, fontSize: '13px', borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                            {data.relayTimestamp}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#0E5353', py: 2, borderBottom: '1px solid rgba(14, 83, 83, 0.1)' }}>
                            {data.timeDifference}
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    // Show no data message when not loading and no data
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, border: 'none' }}>
                        <div style={{ 
                          color: '#0E5353',
                          opacity: 0.7
                        }}>
                          <CircularProgress size={40} style={{ color: '#0E5353', marginBottom: '16px' }} />
                          <div>{feedLoading ? 'Fetching data for the selected feed...' : 'No data available for the selected feed'}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination and Load More Controls - outside table */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  {!feedLoading && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      {/* Pagination Controls */}
                      {loadedPages > 1 && (
                        <Pagination 
                          count={loadedPages}
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
                      
                      {/* Load More Button */}
                      {hasMoreTransactions && (
                        <Button
                          variant="contained"
                          onClick={isDataBankContract && selectedDataBankFeed ? loadMoreTransactions : loadMoreTellorTransactions}
                          disabled={isIncrementalLoading}
                          sx={{
                            backgroundColor: '#0E5353',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: '#0a3d3d',
                            },
                            '&:disabled': {
                              backgroundColor: '#666',
                            }
                          }}
                        >
                          {isIncrementalLoading ? 'Loading...' : `Load More (${loadedTransactions}/${totalTransactions})`}
                        </Button>
                      )}
                      
                      {/* Status Text */}
                      <Typography variant="body2" color="text.secondary" sx={{ color: '#0E5353' }}>
                        Showing {loadedTransactions} of {totalTransactions} transactions
                        {loadedPages > 1 && ` • Page ${page} of ${loadedPages}`}
                      </Typography>
                    </Box>
                  )}
            </Box>
          </div>
        </div>

        {/* Right Column - Analytics Dashboard */}
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
        </div>
      )}
    </Container>
  );
};

export default DataFeed;