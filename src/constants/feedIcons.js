import React from 'react';

// Feed icon types
export const ICON_TYPE = {
  SVG: 'svg',
  IMAGE: 'image'
};

// Feed icon configuration
export const FEED_ICONS = {
  'BTC/USD': { type: ICON_TYPE.SVG, icon: 'bitcoin' },
  'tBTC/USD': { type: ICON_TYPE.SVG, icon: 'bitcoin' },
  'ETH/USD': { type: ICON_TYPE.SVG, icon: 'ethereum' },
  'USDC/USD': { type: ICON_TYPE.SVG, icon: 'usdc' },
  'USDT/USD': { type: ICON_TYPE.SVG, icon: 'usdt' },
  'stATOM/USD': { type: ICON_TYPE.SVG, icon: 'cosmos' },
  'rETH/USD': { type: ICON_TYPE.IMAGE, src: '/reth-usd-logo.png', alt: 'rETH' },
  'wstETH/USD': { type: ICON_TYPE.IMAGE, src: '/wsteth-usd-logo.png', alt: 'wstETH' },
  'yETH/USD': { type: ICON_TYPE.IMAGE, src: '/yeth-usd-logo.png', alt: 'yETH' },
  'TRB/USD': { type: ICON_TYPE.IMAGE, src: '/trb-usd-logo.png', alt: 'TRB' },
  'USDN/USD': { type: ICON_TYPE.IMAGE, src: '/usdn-logo.png', alt: 'USDN' },
  'KING/USD': { type: ICON_TYPE.IMAGE, src: '/king-usd-logo.png', alt: 'KING' },
  'yUSD/USD': { type: ICON_TYPE.IMAGE, src: '/yusd-usd-logo.png', alt: 'yUSD' },
  'sUSN/USD': { type: ICON_TYPE.IMAGE, src: '/susn-usd-logo.png', alt: 'sUSN' },
  'sUSDS/USD': { type: ICON_TYPE.IMAGE, src: '/susds-usd-logo.png', alt: 'sUSDS' },
  'SAGA/USD': { type: ICON_TYPE.IMAGE, src: '/saga-usd-logo.png', alt: 'SAGA' },
  'sUSDe/USD': { type: ICON_TYPE.IMAGE, src: '/susde-usd-logo.png', alt: 'sUSDe' },
  'vyUSD/USD': { type: ICON_TYPE.IMAGE, src: '/vyusd-usd-logo.png', alt: 'vyUSD' },
  'sfrxUSD/USD': { type: ICON_TYPE.IMAGE, src: '/sfrxusd-usd-logo.png', alt: 'sfrxUSD' }
};

// SVG Icon Components
export const SVG_ICONS = {
  bitcoin: ({ size, iconColor }) => {
    if (iconColor === 'white') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.027 10.377c.26-1.737-1.06-2.67-2.864-3.293l.585-2.346-1.43-.356-.57 2.286c-.376-.094-.763-.182-1.147-.27l.574-2.301-1.43-.356-.585 2.346c-.31-.07-.615-.14-.91-.213l.002-.007-1.97-.492-.38 1.524s1.06.243 1.038.258c.58.145.684.53.666.835l-.667 2.674c.04.01.092.024.15.047l-.153-.038-.947 3.797c-.071.18-.252.45-.66.348.015.021-1.04-.26-1.04-.26l-.71 1.644 1.863.464c.346.086.684.177 1.015.26l-.59 2.365 1.428.356.585-2.345c.39.106.767.203 1.13.295l-.583 2.338 1.43.356.59-2.365c2.448.463 4.285.276 5.06-1.938.625-1.78-.031-2.807-1.32-3.477.94-.217 1.648-.835 1.838-2.11zm-2.958 4.08c-.444 1.78-3.45.82-4.424.578l.79-3.164c.974.243 4.1.723 3.634 2.586zm.472-4.99c-.405 1.625-2.91.8-3.723.597l.715-2.867c.813.203 3.44.58 3.008 2.27z" fill="white"/>
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.243 15.525.362 9.105 1.963 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.117 8.738 14.546z" fill="#F7931A"/>
        <path d="M17.027 10.377c.26-1.737-1.06-2.67-2.864-3.293l.585-2.346-1.43-.356-.57 2.286c-.376-.094-.763-.182-1.147-.27l.574-2.301-1.43-.356-.585 2.346c-.31-.07-.615-.14-.91-.213l.002-.007-1.97-.492-.38 1.524s1.06.243 1.038.258c.58.145.684.53.666.835l-.667 2.674c.04.01.092.024.15.047l-.153-.038-.947 3.797c-.071.18-.252.45-.66.348.015.021-1.04-.26-1.04-.26l-.71 1.644 1.863.464c.346.086.684.177 1.015.26l-.59 2.365 1.428.356.585-2.345c.39.106.767.203 1.13.295l-.583 2.338 1.43.356.59-2.365c2.448.463 4.285.276 5.06-1.938.625-1.78-.031-2.807-1.32-3.477.94-.217 1.648-.835 1.838-2.11zm-2.958 4.08c-.444 1.78-3.45.82-4.424.578l.79-3.164c.974.243 4.1.723 3.634 2.586zm.472-4.99c-.405 1.625-2.91.8-3.723.597l.715-2.867c.813.203 3.44.58 3.008 2.27z" fill="#FFF"/>
      </svg>
    );
  },
  
  ethereum: ({ size, iconColor }) => {
    const fillColor = iconColor === 'white' ? 'white' : '#627EEA';
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill={fillColor}/>
        <path d="M12.3735 3V9.6525L17.9963 12.165L12.3735 3Z" fill="white" fillOpacity="0.602"/>
        <path d="M12.3735 3L6.75 12.165L12.3735 9.6525V3Z" fill="white"/>
        <path d="M12.3735 16.476V20.9963L18 12.621L12.3735 16.476Z" fill="white" fillOpacity="0.602"/>
        <path d="M12.3735 20.9963V16.4753L6.75 12.621L12.3735 20.9963Z" fill="white"/>
        <path d="M12.3735 15.4298L17.9963 12.165L12.3735 9.654V15.4298Z" fill="white" fillOpacity="0.2"/>
        <path d="M6.75 12.165L12.3735 15.4298V9.654L6.75 12.165Z" fill="white" fillOpacity="0.602"/>
      </svg>
    );
  },
  
  usdc: ({ size, iconColor }) => {
    const fillColor = iconColor === 'white' ? 'white' : '#2775CA';
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill={fillColor}/>
        <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12.75 15.75C12.75 16.1642 12.4142 16.5 12 16.5C11.5858 16.5 11.25 16.1642 11.25 15.75V14.25H9.75C9.33579 14.25 9 13.9142 9 13.5C9 13.0858 9.33579 12.75 9.75 12.75H11.25V11.25H9.75C9.33579 11.25 9 10.9142 9 10.5C9 10.0858 9.33579 9.75 9.75 9.75H11.25V8.25C11.25 7.83579 11.5858 7.5 12 7.5C12.4142 7.5 12.75 7.83579 12.75 8.25V9.75H14.25C14.6642 9.75 15 10.0858 15 10.5C15 10.9142 14.6642 11.25 14.25 11.25H12.75V12.75H14.25C14.6642 12.75 15 13.0858 15 13.5C15 13.9142 14.6642 14.25 14.25 14.25H12.75V15.75Z" fill="white"/>
      </svg>
    );
  },
  
  usdt: ({ size, iconColor }) => {
    const fillColor = iconColor === 'white' ? 'white' : '#26A17B';
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill={fillColor}/>
        <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12.75 15.75C12.75 16.1642 12.4142 16.5 12 16.5C11.5858 16.5 11.25 16.1642 11.25 15.75V14.25H9.75C9.33579 14.25 9 13.9142 9 13.5C9 13.0858 9.33579 12.75 9.75 12.75H11.25V11.25H9.75C9.33579 11.25 9 10.9142 9 10.5C9 10.0858 9.33579 9.75 9.75 9.75H11.25V8.25C11.25 7.83579 11.5858 7.5 12 7.5C12.4142 7.5 12.75 7.83579 12.75 8.25V9.75H14.25C14.6642 9.75 15 10.0858 15 10.5C15 10.9142 14.6642 11.25 14.25 11.25H12.75V12.75H14.25C14.6642 12.75 15 13.0858 15 13.5C15 13.9142 14.6642 14.25 14.25 14.25H12.75V15.75Z" fill="white"/>
      </svg>
    );
  },
  
  cosmos: ({ size, iconColor }) => {
    const fillColor = iconColor === 'white' ? 'white' : '#2E3148';
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill={fillColor}/>
        <path d="M12 6L15.5 8.5L12 11L8.5 8.5L12 6ZM15.5 15.5L12 18L8.5 15.5L12 13L15.5 15.5ZM18.5 10.5L16 12L18.5 13.5L21 12L18.5 10.5ZM6 10.5L3.5 12L6 13.5L8.5 12L6 10.5Z" fill="white"/>
      </svg>
    );
  }
};

// Helper function to get icon component
export const getIcon = (feedName, iconColor = null, size = '16') => {
  const iconStyle = { marginRight: '6px', flexShrink: 0 };
  const adjustedSize = iconColor === 'white' ? '14' : size;
  
  const config = FEED_ICONS[feedName];
  if (!config) return null;
  
  if (config.type === ICON_TYPE.SVG) {
    const IconComponent = SVG_ICONS[config.icon];
    if (!IconComponent) return null;
    
    return (
      <span style={iconStyle}>
        {IconComponent({ size: adjustedSize, iconColor })}
      </span>
    );
  }
  
  if (config.type === ICON_TYPE.IMAGE) {
    return (
      <img 
        src={config.src} 
        alt={config.alt} 
        width={adjustedSize} 
        height={adjustedSize} 
        style={iconStyle}
      />
    );
  }
  
  return null;
};

export const getNetworkIcon = (network, size = 20) => {
    const iconStyle = {
      marginRight: '8px',
      verticalAlign: 'middle',
      display: 'inline-block'
    };

    if (network === 'ethSepolia' || network === 'ethMainnet') {
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
    
    if (network === 'baseMainnet') {
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
    
    if (network === 'sagaEVM') {
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