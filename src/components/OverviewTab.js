import React from "react";
import {
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { formatReportValue } from "../utils/formatters";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { networks } from "../constants/networks";
import { DEVIATION_THRESHOLD } from "../constants/dataFeedConstants";
import { getIcon, getNetworkIcon } from '../constants/feedIcons';
import { HeartbeatTimer } from './HeartbeatTimer';

export const OverviewTab = ({
  overviewData,
  loading,
  overviewSortColumn,
  overviewSortDirection,
  setOverviewSortColumn,
  setOverviewSortDirection,
}) => {
  return (
    <div className="overview-tab">
      {/* Feed Selection */}
      <div
        className="price-feeds-container"
        style={{ padding: "8px 16px", backgroundColor: "transparent" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            marginBottom: "0",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#0E5353",
              fontWeight: "bold",
              mb: 0,
              fontSize: "16px",
              lineHeight: 1.2,
            }}
          >
            Latest Reports from All Feeds
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#0E5353",
              fontSize: "14px",
              opacity: 0.8,
              lineHeight: 1.2,
            }}
          >
            Showing the most recent report relayed from Tellor for each unique
            price feed across all networks
          </Typography>
        </div>
      </div>

      {/* Latest Reports Table */}
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "1px solid rgba(14, 83, 83, 0.2)",
          mt: 2,
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "rgba(14, 83, 83, 0.05)" }}>
              <TableCell
                sx={{
                  color: "#0E5353",
                  fontWeight: "bold",
                  fontSize: "14px",
                  borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    backgroundColor: "rgba(14, 83, 83, 0.1)",
                  },
                }}
                onClick={() => {
                  if (overviewSortColumn === "feed") {
                    setOverviewSortDirection(
                      overviewSortDirection === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setOverviewSortColumn("feed");
                    setOverviewSortDirection("asc");
                  }
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  Feed
                  {overviewSortColumn === "feed" &&
                    (overviewSortDirection === "asc" ? (
                      <ArrowUpward sx={{ fontSize: "16px" }} />
                    ) : (
                      <ArrowDownward sx={{ fontSize: "16px" }} />
                    ))}
                </div>
              </TableCell>
              <TableCell
                sx={{
                  color: "#0E5353",
                  fontWeight: "bold",
                  fontSize: "14px",
                  borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    backgroundColor: "rgba(14, 83, 83, 0.1)",
                  },
                }}
                onClick={() => {
                  if (overviewSortColumn === "network") {
                    setOverviewSortDirection(
                      overviewSortDirection === "asc" ? "desc" : "asc"
                    );
                  } else {
                    setOverviewSortColumn("network");
                    setOverviewSortDirection("asc");
                  }
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  Network
                  {overviewSortColumn === "network" &&
                    (overviewSortDirection === "asc" ? (
                      <ArrowUpward sx={{ fontSize: "16px" }} />
                    ) : (
                      <ArrowDownward sx={{ fontSize: "16px" }} />
                    ))}
                </div>
              </TableCell>
              <TableCell
                sx={{
                  color: "#0E5353",
                  fontWeight: "bold",
                  fontSize: "14px",
                  borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
                }}
              >
                Value
              </TableCell>
              <TableCell
                sx={{
                  color: "#0E5353",
                  fontWeight: "bold",
                  fontSize: "14px",
                  borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
                }}
              >
                Deviation Threshold
              </TableCell>
              <TableCell
                sx={{
                  color: "#0E5353",
                  fontWeight: "bold",
                  fontSize: "14px",
                  borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
                }}
              >
                Heartbeat
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 6, border: "none" }}
                >
                  <CircularProgress
                    size={40}
                    style={{ color: "#0E5353", marginBottom: "16px" }}
                  />
                  <div style={{ color: "#0E5353" }}>Loading all feeds...</div>
                </TableCell>
              </TableRow>
            ) : Array.isArray(overviewData) && overviewData.length > 0 ? (
              // Group by feed and network, show only the latest report for each
              (() => {
                const latestReports = {};
                overviewData.forEach((data) => {
                  const feedName = networks[data.network.toUpperCase()].pricePairs.getByValue(data.queryId);
                  if (!feedName) return;
                  const network = data.network;
                  // Use feedName + network as key to distinguish between networks
                  const key = `${feedName}-${network}`;
                  if (
                    !latestReports[key] ||
                    data.reportTimestamp > latestReports[key].reportTimestamp
                  ) {
                    latestReports[key] = data;
                  }
                });

                return Object.values(latestReports)
                  .sort((a, b) => {
                    let compareResult = 0;

                    if (overviewSortColumn === "network") {
                      // Get display names for sorting
                      const networkA = a.network || "sagaEVM";
                      const networkDisplayA = 
                        networkA === "ethSepolia" ? "Sepolia Testnet" :
                        networkA === "baseMainnet" ? "Base Mainnet" :
                        networkA === "ethMainnet" ? "Ethereum Mainnet" :
                        "Saga Mainnet";
                      
                      const networkB = b.network || "sagaEVM";
                      const networkDisplayB = 
                        networkB === "ethSepolia" ? "Sepolia Testnet" :
                        networkB === "baseMainnet" ? "Base Mainnet" :
                        networkB === "ethMainnet" ? "Ethereum Mainnet" :
                        "Saga Mainnet";
                      
                      compareResult = networkDisplayA.localeCompare(networkDisplayB);
                      // If networks are equal, sort by feed name as secondary
                      if (compareResult === 0) {
                        const feedA = networks[a.network.toUpperCase()].pricePairs.getByValue(a.queryId) || "ETH/USD";
                        const feedB = networks[b.network.toUpperCase()].pricePairs.getByValue(b.queryId) || "ETH/USD";
                        compareResult = feedA.localeCompare(feedB);
                      }
                    } else if (overviewSortColumn === "feed") {
                      const feedA = networks[a.network.toUpperCase()].pricePairs.getByValue(a.queryId) || "ETH/USD";
                      const feedB = networks[b.network.toUpperCase()].pricePairs.getByValue(b.queryId) || "ETH/USD";
                      compareResult = feedA.localeCompare(feedB);
                      // If feeds are equal, sort by network display names as secondary
                      if (compareResult === 0) {
                        const networkA = a.network || "sagaEVM";
                        const networkDisplayA = 
                          networkA === "ethSepolia" ? "Sepolia Testnet" :
                          networkA === "baseMainnet" ? "Base Mainnet" :
                          networkA === "ethMainnet" ? "Ethereum Mainnet" :
                          "Saga Mainnet";
                        
                        const networkB = b.network || "sagaEVM";
                        const networkDisplayB = 
                          networkB === "ethSepolia" ? "Sepolia Testnet" :
                          networkB === "baseMainnet" ? "Base Mainnet" :
                          networkB === "ethMainnet" ? "Ethereum Mainnet" :
                          "Saga Mainnet";
                        
                        compareResult = networkDisplayA.localeCompare(networkDisplayB);
                      }
                    }

                    // Apply sort direction
                    return overviewSortDirection === "asc"
                      ? compareResult
                      : -compareResult;
                  })
                  .map((data, index) => {
                    const feedName = networks[data.network.toUpperCase()].pricePairs.getByValue(data.queryId) || "ETH/USD";
                    const network = data.network || "sagaEVM";
                    const networkDisplayName =
                      network === "ethSepolia"
                        ? "Sepolia Testnet"
                        : network === "baseMainnet"
                        ? "Base Mainnet"
                        : network === "ethMainnet"
                        ? "Ethereum Mainnet"
                        : "Saga Mainnet";
                    return (
                      <TableRow
                        key={index}
                        onClick={() => {
                            let explorerUrl = `${networks[network.toUpperCase()]?.explorerUrl}tx/${data.transactionHash}`;
                            window.open(explorerUrl, "_blank");
                        }}
                        sx={{
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          "&:hover": {
                            backgroundColor: "rgba(14, 83, 83, 0.08)",
                          },
                          "&:last-child td": {
                            border: 0,
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            color: "#0E5353",
                            py: 2,
                            borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                          }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            {getIcon(feedName)}
                            <span style={{ fontWeight: "bold" }}>
                              {feedName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#0E5353",
                            py: 2,
                            borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                          }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            {getNetworkIcon(network)}
                            <span style={{ fontWeight: "bold" }}>
                              {networkDisplayName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#0E5353",
                            py: 2,
                            borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                          }}
                        >
                          ${formatReportValue(data.reportValue)}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#0E5353",
                            py: 2,
                            borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                          }}
                        >
                          {DEVIATION_THRESHOLD[feedName] || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#0E5353",
                            py: 2,
                            borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                            fontSize: "13px",
                          }}
                        >
                          <HeartbeatTimer reportedTimestamp={data.reportTimestamp} />
                        </TableCell>
                      </TableRow>
                    );
                  });
              })()
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ py: 6, border: "none" }}
                >
                  <div style={{ color: "#0E5353", opacity: 0.7 }}>
                    {loading ? (
                      <div>
                        <CircularProgress
                          size={40}
                          style={{ color: "#0E5353", marginBottom: "16px" }}
                        />
                        <div>Loading data...</div>
                      </div>
                    ) : (
                      <div>
                        No data available. Please wait for feeds to load.
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
