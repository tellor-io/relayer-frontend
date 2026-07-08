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
  useTheme,
} from "@mui/material";
import { formatReportValue } from "../utils/formatters";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { networks } from "../constants/networks";
import { DEVIATION_THRESHOLD, HIDE_SAGA_FEEDS } from "../constants/dataFeedConstants";
import { getIcon, getNetworkIcon } from '../constants/feedIcons';
import { HeartbeatTimer } from './HeartbeatTimer';

const NETWORK_SORT_ORDER = { ethMainnet: 0, ethSepolia: 1, baseMainnet: 2, sagaEVM: 3 };
function networkSortRank(network) {
  return NETWORK_SORT_ORDER[network] ?? 4;
}

const cellSx = {
  color: "text.primary",
  py: 2,
  borderBottom: "1px solid",
  borderColor: "divider",
};

const sortableHeadSx = {
  cursor: "pointer",
  userSelect: "none",
  "&:hover": { backgroundColor: "action.hover" },
};

export const OverviewTab = ({
  overviewData,
  loading,
  overviewSortColumn,
  overviewSortDirection,
  setOverviewSortColumn,
  setOverviewSortDirection,
}) => {
  const theme = useTheme();
  const accent = theme.palette.text.primary;

  const renderSortIcon = (column) =>
    overviewSortColumn === column &&
    (overviewSortDirection === "asc" ? (
      <ArrowUpward sx={{ fontSize: "16px" }} />
    ) : (
      <ArrowDownward sx={{ fontSize: "16px" }} />
    ));

  return (
    <div className="overview-tab">
      <div className="price-feeds-container" style={{ padding: "8px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Typography
            variant="body2"
            sx={{ color: "text.primary", fontWeight: 600, mb: 0, fontSize: "16px", lineHeight: 1.2 }}
          >
            Latest Reports from All Feeds
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontSize: "14px", lineHeight: 1.2 }}
          >
            Showing the most recent report relayed from Tellor for each unique
            price feed across all networks
          </Typography>
        </div>
      </div>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "background.paper",
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "16px",
          overflow: "hidden",
          mt: 2,
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={sortableHeadSx}
                onClick={() => {
                  if (overviewSortColumn === "feed") {
                    setOverviewSortDirection(overviewSortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setOverviewSortColumn("feed");
                    setOverviewSortDirection("asc");
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  Feed
                  {renderSortIcon("feed")}
                </div>
              </TableCell>
              <TableCell
                sx={sortableHeadSx}
                onClick={() => {
                  if (overviewSortColumn === "network") {
                    setOverviewSortDirection(overviewSortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setOverviewSortColumn("network");
                    setOverviewSortDirection("asc");
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  Network
                  {renderSortIcon("network")}
                </div>
              </TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Deviation Threshold</TableCell>
              <TableCell>Heartbeat</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, border: "none" }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <div style={{ color: accent }}>Loading all feeds...</div>
                </TableCell>
              </TableRow>
            ) : Array.isArray(overviewData) && overviewData.length > 0 ? (
              (() => {
                const latestReports = {};
                overviewData.forEach((data) => {
                  if (HIDE_SAGA_FEEDS && data.network?.toLowerCase() === 'sagaevm') return;
                  const feedName = networks[data.network.toUpperCase()].pricePairs.getByValue(data.queryId);
                  if (!feedName) return;
                  const network = data.network;
                  const key = `${feedName}-${network}`;
                  if (!latestReports[key] || data.reportTimestamp > latestReports[key].reportTimestamp) {
                    latestReports[key] = data;
                  }
                });

                return Object.values(latestReports)
                  .sort((a, b) => {
                    let compareResult = 0;
                    if (overviewSortColumn === "network") {
                      compareResult = networkSortRank(a.network) - networkSortRank(b.network);
                      if (compareResult === 0) {
                        const feedA = networks[a.network.toUpperCase()].pricePairs.getByValue(a.queryId) || "ETH/USD";
                        const feedB = networks[b.network.toUpperCase()].pricePairs.getByValue(b.queryId) || "ETH/USD";
                        compareResult = feedA.localeCompare(feedB);
                      }
                    } else if (overviewSortColumn === "feed") {
                      const feedA = networks[a.network.toUpperCase()].pricePairs.getByValue(a.queryId) || "ETH/USD";
                      const feedB = networks[b.network.toUpperCase()].pricePairs.getByValue(b.queryId) || "ETH/USD";
                      compareResult = feedA.localeCompare(feedB);
                      if (compareResult === 0) {
                        compareResult = networkSortRank(a.network || "sagaEVM") - networkSortRank(b.network || "sagaEVM");
                      }
                    }
                    return overviewSortDirection === "asc" ? compareResult : -compareResult;
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
                        : "SagaEVM Mainnet";
                    return (
                      <TableRow
                        key={index}
                        onClick={() => {
                          const explorerUrl = `${networks[network.toUpperCase()]?.explorerUrl}tx/${data.transactionHash}`;
                          window.open(explorerUrl, "_blank");
                        }}
                        sx={{
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          "&:hover": { backgroundColor: "action.hover" },
                          "&:last-child td": { border: 0 },
                        }}
                      >
                        <TableCell sx={cellSx}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            {getIcon(feedName)}
                            <span style={{ fontWeight: "bold" }}>{feedName}</span>
                          </div>
                        </TableCell>
                        <TableCell sx={cellSx}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            {getNetworkIcon(network)}
                            <span style={{ fontWeight: "bold" }}>{networkDisplayName}</span>
                          </div>
                        </TableCell>
                        <TableCell sx={{ ...cellSx, fontFamily: theme.typography.fontFamilyMono }} className="t-num">
                          ${formatReportValue(data.reportValue)}
                        </TableCell>
                        <TableCell sx={cellSx}>{DEVIATION_THRESHOLD[feedName] || "N/A"}</TableCell>
                        <TableCell sx={{ ...cellSx, fontSize: "13px" }}>
                          <HeartbeatTimer reportedTimestamp={data.reportTimestamp} />
                        </TableCell>
                      </TableRow>
                    );
                  });
              })()
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, border: "none", color: "text.secondary" }}>
                  {loading ? (
                    <div>
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                      <div>Loading data...</div>
                    </div>
                  ) : (
                    <div>No data available. Please wait for feeds to load.</div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
