export const calculateTimeDifference = (reportTimestamp, relayTimestamp) => {
  if (!reportTimestamp || !relayTimestamp) return 0;
  const reportDate = new Date(reportTimestamp);
  const relayDate = new Date(relayTimestamp);
  return Math.abs(relayDate - reportDate) / 1000;
};

export const calculateTimeDifferenceFormatted = (reportTimestamp, relayTimestamp) => {
    let timeDiff = calculateTimeDifference(reportTimestamp, relayTimestamp);
    const timeDiffFormatted = timeDiff < 60 
        ? `${timeDiff.toFixed(1)}s`
        : `${Math.floor(timeDiff / 60)}m ${(timeDiff % 60).toFixed(1)}s`;
    
        return timeDiffFormatted;
};

export const formatReportValue = (hexString) => {
  const normalizedHex = hexString.startsWith("0x")
    ? hexString
    : `0x${hexString}`;
  try {
    const bigIntValue = BigInt(normalizedHex);
    return parseFloat(Number(bigIntValue) / 1e18).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    return hexString;
  }
};

export const convertHexToDecimal = (hexString) => {
  const normalizedHex = hexString.startsWith("0x")
    ? hexString
    : `0x${hexString}`;
  try {
    const bigIntValue = BigInt(normalizedHex);
    return parseFloat(Number(bigIntValue) / 1e18);
  } catch (error) {
    return null;
  }
};
export const convertTimestampToLocaleString = (timestamp) => {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};
// Format price with dollar sign, commas, and two decimal places
export const formatPrice = (value) => {
    if (isNaN(value) || value === null || value === undefined) return "$0.00";
    const rounded = Math.round(value * 100) / 100;
    return (
      "$" +
      rounded.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };