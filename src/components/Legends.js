import React from "react";
import { Typography, Tooltip, useTheme } from "@mui/material";
import { InfoOutlined } from '@mui/icons-material';

const legendCardStyle = {
  padding: "20px 24px",
  backgroundColor: "var(--m-surface-2)",
  borderRadius: "16px",
  border: "1px solid var(--m-border-soft)",
  width: "fit-content",
  minWidth: "280px",
};

export const Legends = () => {
  const theme = useTheme();
  const fg = theme.palette.text.primary;
  const mutedBar = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,55,52,0.25)';

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignSelf: "flex-start",
        height: "100%",
        justifyContent: "flex-start",
      }}
    >
      <div style={legendCardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600, fontSize: "13px" }}>
            Feed Types:
          </Typography>
          <Tooltip title="Hover over each feed's symbol for more details" placement="bottom" arrow>
            <InfoOutlined sx={{ fontSize: "14px", color: "text.secondary", cursor: "help", opacity: 0.7, "&:hover": { opacity: 1 } }} />
          </Tooltip>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "nowrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderBottom: `9px solid ${fg}`,
                }}
              />
              <span style={{ fontSize: "12px", color: fg, fontWeight: "500" }}>market</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: fg }} />
              <span style={{ fontSize: "12px", color: fg, fontWeight: "500" }}>fundamental</span>
            </div>
            <span style={{ fontSize: "10px", color: fg, opacity: 0.8, lineHeight: "1.4", marginLeft: "16px" }}>
              (on-chain exchange rate)
            </span>
            <span style={{ fontSize: "10px", color: fg, opacity: 0.8, lineHeight: "1.4", marginLeft: "16px" }}>×</span>
            <span style={{ fontSize: "10px", color: fg, opacity: 0.8, lineHeight: "1.4", marginLeft: "16px" }}>
              (market price of underlying asset)
            </span>
          </div>
        </div>
      </div>

      <div style={legendCardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
          <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600, fontSize: "13px" }}>
            'Best Practices' Rating:
          </Typography>
          <a
            href="/BPR.png"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: fg, textDecoration: "underline", cursor: "pointer", fontSize: "11px" }}
          >
            click to see ratings chart
          </a>
        </div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          {[3, 2, 1].map((filled, idx) => (
            <div key={filled} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ display: "flex", flexDirection: "column-reverse", gap: "2px", height: "10px" }}>
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "8px",
                      height: "3px",
                      backgroundColor: i < filled ? fg : mutedBar,
                      borderRadius: "1px",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: "12px", color: fg, fontWeight: "500" }}>
                {filled === 3 ? "Exemplary" : filled === 2 ? "Moderate" : "High Risk"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
