import React, { useState, useEffect } from 'react';

export const HeartbeatTimer = React.memo(({ reportedTimestamp }) => {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const calculateHeartbeat = () => {
    try {
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
  
  const heartbeat = calculateHeartbeat();
  
  return (
    <span style={{ 
      color: heartbeat.expired ? '#ff6b6b' : 'inherit',
      fontWeight: heartbeat.expired ? 'bold' : 'normal'
    }}>
      {heartbeat.text}
    </span>
  );
});

HeartbeatTimer.displayName = 'HeartbeatTimer';