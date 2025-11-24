import React from "react";
import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  DEVIATION_THRESHOLD,
  getFeedTypeSymbol,
  RISK_BAR_COUNT,
  FEED_RISK_ASSESSMENT,
} from "../constants/dataFeedConstants";
import {
  formatReportValue,
  convertTimestampToLocaleString,
  calculateTimeDifference,
} from "../utils/formatters";

export const TableContent = React.memo(({
  loading,
  reports,
  feed,
  explorer,
  includeBlockTime,
  avgBlockTime,
}) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        backgroundColor: "transparent",
        boxShadow: "none",
        border: "1px solid rgba(14, 83, 83, 0.2)",
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
              }}
            >
              Feed
            </TableCell>
            <TableCell
              align="right"
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
              align="right"
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
              align="right"
              sx={{
                color: "#0E5353",
                fontWeight: "bold",
                fontSize: "14px",
                borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
              }}
            >
              Power
            </TableCell>
            <TableCell
              align="right"
              sx={{
                color: "#0E5353",
                fontWeight: "bold",
                fontSize: "14px",
                borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
              }}
            >
              Reported
            </TableCell>
            <TableCell
              align="right"
              sx={{
                color: "#0E5353",
                fontWeight: "bold",
                fontSize: "14px",
                borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
              }}
            >
              Relayed
            </TableCell>
            <TableCell
              align="right"
              sx={{
                color: "#0E5353",
                fontWeight: "bold",
                fontSize: "14px",
                borderBottom: "2px solid rgba(14, 83, 83, 0.3)",
              }}
            >
              Delay
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            // Show loading state when fetching feed data
            <TableRow>
              <TableCell
                colSpan={7}
                align="center"
                sx={{ py: 6, border: "none" }}
              >
                <CircularProgress
                  size={40}
                  style={{ color: "#0E5353", marginBottom: "16px" }}
                />
                <div style={{ color: "#0E5353" }}>Loading data...</div>
                <div
                  style={{
                    fontSize: "14px",
                    opacity: 0.7,
                    marginTop: "8px",
                    color: "#0E5353",
                  }}
                >
                  This may take a few moments while we fetch the latest
                  transactions
                </div>
              </TableCell>
            </TableRow>
          ) : Array.isArray(reports) && reports.length > 0 ? (
            reports.map((data, index) => (
              <TableRow
                key={index}
                onClick={() => {
                  let explorerUrl = `${explorer}/${data.transactionHash}`;
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column-reverse",
                        gap: "1px",
                        height: "10px",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          style={{
                            width: "6px",
                            height: "2px",
                            backgroundColor:
                              i <
                              RISK_BAR_COUNT[
                                FEED_RISK_ASSESSMENT[feed || "ETH/USD"] ||
                                  "high"
                              ]
                                ? "#0E5353"
                                : "rgba(14, 83, 83, 0.3)",
                            borderRadius: "1px",
                          }}
                        />
                      ))}
                    </div>
                    {getFeedTypeSymbol(feed || "ETH/USD", "#0E5353")}
                    <span style={{ fontWeight: "bold" }}>
                      {feed || "ETH/USD"}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: "#0E5353",
                    py: 2,
                    borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                  }}
                >
                  ${formatReportValue(data.reportValue)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: "#0E5353",
                    py: 2,
                    borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                  }}
                >
                  {DEVIATION_THRESHOLD[feed] || "N/A"}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: "#0E5353",
                    py: 2,
                    borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                  }}
                >
                  {Number(data.reportAggregatePower)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: "#0E5353",
                    py: 2,
                    fontSize: "13px",
                    borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                  }}
                >
                  {convertTimestampToLocaleString(data.reportTimestamp)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: "#0E5353",
                    py: 2,
                    fontSize: "13px",
                    borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                  }}
                >
                  {convertTimestampToLocaleString(data.relayTimestamp)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: "#0E5353",
                    py: 2,
                    borderBottom: "1px solid rgba(14, 83, 83, 0.1)",
                  }}
                >
                  {(() => {
                    let delay = calculateTimeDifference(
                      data.reportTimestamp,
                      data.relayTimestamp
                    );
                    // Subtract block time if enabled
                    if (includeBlockTime && avgBlockTime > 0) {
                      delay = Math.max(0, delay - avgBlockTime);
                    }
                    return delay.toFixed(1);
                  })()}
                  s
                </TableCell>
              </TableRow>
            ))
          ) : (
            // Show no data message when not loading and no data
            <TableRow>
              <TableCell
                colSpan={7}
                align="center"
                sx={{ py: 6, border: "none" }}
              >
                <div
                  style={{
                    color: "#0E5353",
                    opacity: 0.7,
                  }}
                >
                  <div>No data available for the selected feed</div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
