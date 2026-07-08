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
  useTheme,
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

const cellSx = {
  color: "text.primary",
  py: 2,
  borderBottom: "1px solid",
  borderColor: "divider",
};

export const TableContent = React.memo(({
  loading,
  reports,
  feed,
  explorer,
  includeBlockTime,
  avgBlockTime,
}) => {
  const theme = useTheme();
  const accent = theme.palette.text.primary;
  const mutedBar = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,55,52,0.25)';

  return (
    <TableContainer
      component={Paper}
      sx={{
        backgroundColor: "background.paper",
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>Feed</TableCell>
            <TableCell align="right">Value</TableCell>
            <TableCell align="right">Deviation Threshold</TableCell>
            <TableCell align="right">Power</TableCell>
            <TableCell align="right">Reported</TableCell>
            <TableCell align="right">Relayed</TableCell>
            <TableCell align="right">Delay</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6, border: "none" }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <div style={{ color: accent }}>Loading data...</div>
                <div style={{ fontSize: "14px", opacity: 0.7, marginTop: "8px", color: accent }}>
                  This may take a few moments while we fetch the latest transactions
                </div>
              </TableCell>
            </TableRow>
          ) : Array.isArray(reports) && reports.length > 0 ? (
            reports.map((data, index) => (
              <TableRow
                key={index}
                onClick={() => {
                  const explorerUrl = `${explorer}/${data.transactionHash}`;
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
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                              i < RISK_BAR_COUNT[FEED_RISK_ASSESSMENT[feed || "ETH/USD"] || "high"]
                                ? accent
                                : mutedBar,
                            borderRadius: "1px",
                          }}
                        />
                      ))}
                    </div>
                    {getFeedTypeSymbol(feed || "ETH/USD", accent)}
                    <span style={{ fontWeight: "bold" }}>{feed || "ETH/USD"}</span>
                  </div>
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontFamily: theme.typography.fontFamilyMono }} className="t-num">
                  ${formatReportValue(data.reportValue)}
                </TableCell>
                <TableCell align="right" sx={cellSx}>
                  {DEVIATION_THRESHOLD[feed] || "N/A"}
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontFamily: theme.typography.fontFamilyMono }} className="t-num">
                  {Number(data.reportAggregatePower)}
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontSize: "13px" }}>
                  {convertTimestampToLocaleString(data.reportTimestamp)}
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontSize: "13px" }}>
                  {convertTimestampToLocaleString(data.relayTimestamp)}
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontFamily: theme.typography.fontFamilyMono }} className="t-num">
                  {(() => {
                    let delay = calculateTimeDifference(
                      data.reportTimestamp,
                      data.relayTimestamp
                    );
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
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6, border: "none", color: "text.secondary" }}>
                No data available for the selected feed
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
