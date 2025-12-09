import React from 'react';
import { Tooltip } from '@mui/material';
// DataBank price pair queryIds (these are the specific feeds we want)

export const SEPOLIA_PRICE_PAIRS = {
  'BTC/USD': '0xa6f013ee236804827b77696d350e9f0ac3e879328f2a3021d473a0b778ad78ac',
  'ETH/USD': '0x83a7f3d48786ac2667503a61e8c415438ed2922eb86a2906e4ee66d9a2ce4992',
}

export const BASE_PRICE_PAIRS = {
  ...SEPOLIA_PRICE_PAIRS,
  'TRB/USD': '0x5c13cd9c97dbb98f2429c101a2a8150e6c7a0ddaff6124ee176a3a411067ded0',
};

export const SAGA_PRICE_PAIRS = {
  ...BASE_PRICE_PAIRS,
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
  'yETH/USD': '0x9874c1c7b7e76b78afdfdda6dcecef56edf6bf3d49d6d6ef2a98404ea2e04a59',
};

// Feed risk assessment mappingc
export const FEED_RISK_ASSESSMENT = {
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
export const RISK_BAR_COUNT = {
  'exemplary': 3,
  'moderate': 2,
  'high': 1
};

// Feed type mapping
const FEED_TYPE = {
  'BTC/USD': 'market',
  'ETH/USD': 'market',
  'KING/USD': 'market',
  'rETH/USD': 'fundamental',
  'SAGA/USD': 'market',
  'sfrxUSD/USD': 'fundamental',
  'stATOM/USD': 'market',
  'sUSDe/USD': 'fundamental',
  'sUSDS/USD': 'market',
  'sUSN/USD': 'fundamental',
  'tBTC/USD': 'market',
  'TRB/USD': 'market',
  'USDC/USD': 'market',
  'USDN/USD': 'market',
  'USDT/USD': 'market',
  'vyUSD/USD': 'fundamental',
  'wstETH/USD': 'fundamental',
  'yETH/USD': 'fundamental',
  'yUSD/USD': 'fundamental'
  // 'mix': commented out - no feeds currently use mix category
};

// Feed tooltip descriptions
const FEED_TOOLTIP = {
  'BTC/USD': 'market (7 sources)',
  'ETH/USD': 'market (7 sources)',
  'KING/USD': 'market',
  'rETH/USD': 'fundamental rETH/ETH ratio × market median ETH/USD price',
  'SAGA/USD': 'market (4 sources)',
  'sfrxUSD/USD': 'fundamental sfrxUSD/frxUSD ratio × market median frxUSD/USD price',
  'stATOM/USD': 'market (3 sources)',
  'sUSDe/USD': 'fundamental sUSDe/USDe ratio × market median USDe/USD price',
  'sUSDS/USD': 'market (1 source)',
  'sUSN/USD': 'fundamental sUSN/USN ratio × market median USN/USD price',
  'tBTC/USD': 'market (3 sources)',
  'TRB/USD': 'market',
  'USDC/USD': 'market (7 sources)',
  'USDN/USD': 'market (2 sources)',
  'USDT/USD': 'market (3 sources)',
  'vyUSD/USD': 'fundamental vyUSD/USDC ratio × market median USDC/USD price',
  'wstETH/USD': 'fundamental wstETH/stETH ratio × market median stETH/USD price',
  'yETH/USD': 'fundamental yeth/eth ratio × market median eth/usd price',
  'yUSD/USD': 'fundamental yUSD/USDC ratio × market median USDC/USD price'
};

// Deviation Threshold mapping
export const DEVIATION_THRESHOLD = {
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

export const getFeedTypeSymbol = (feedName, color = '#0E5353') => {
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
    }
    // Mix category commented out - no feeds currently use mix category
    // else if (feedType === 'mix') {
    //   symbolStyle = {
    //     width: '7px',
    //     height: '7px',
    //     borderStyle: 'solid',
    //     borderWidth: '2px',
    //     borderColor: color,
    //     backgroundColor: color,
    //     flexShrink: 0
    //   };
    // }
    
    return (
      <Tooltip title={tooltipText} placement="top" arrow>
        <div style={symbolStyle} />
      </Tooltip>
    );
  };