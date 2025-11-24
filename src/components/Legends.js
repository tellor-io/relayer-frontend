import React from "react";
import {
  Typography,
  Tooltip,
} from "@mui/material";
import { InfoOutlined } from '@mui/icons-material';


export const Legends = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignSelf: "flex-end",
      }}
    >
      {/* Best Practices Rating Legend */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "rgba(14, 83, 83, 0.05)",
          borderRadius: "6px",
          border: "1px solid rgba(14, 83, 83, 0.1)",
          width: "fit-content",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "6px",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#0E5353",
              fontWeight: "bold",
              fontSize: "11px",
            }}
          >
            'Best Practices' Rating:
          </Typography>
          <Tooltip
            title={
              <div style={{ padding: "12px", textAlign: "center" }}>
                <img
                  src="/BPR.png"
                  alt="Best Practices Rating Chart"
                  style={{
                    maxWidth: "800px",
                    width: "100%",
                    height: "auto",
                    borderRadius: "6px",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div
                  style={{
                    display: "none",
                    color: "white",
                    fontSize: "14px",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  Best Practices Rating Chart
                  <br />
                  <span style={{ fontSize: "12px", opacity: 0.8 }}>
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
                  bgcolor: "rgba(0, 0, 0, 0.9)",
                  maxWidth: "850px",
                  "& .MuiTooltip-arrow": {
                    color: "rgba(0, 0, 0, 0.9)",
                  },
                },
              },
            }}
          >
            <InfoOutlined
              sx={{
                fontSize: "14px",
                color: "#0E5353",
                cursor: "help",
                opacity: 0.7,
                "&:hover": {
                  opacity: 1,
                },
              }}
            />
          </Tooltip>
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: "1px",
                height: "8px",
              }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "2px",
                    backgroundColor: "#0E5353",
                    borderRadius: "1px",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "10px", color: "#0E5353" }}>
              Exemplary
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: "1px",
                height: "8px",
              }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "2px",
                    backgroundColor:
                      i < 2 ? "#0E5353" : "rgba(14, 83, 83, 0.3)",
                    borderRadius: "1px",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "10px", color: "#0E5353" }}>Moderate</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: "1px",
                height: "8px",
              }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "2px",
                    backgroundColor:
                      i < 1 ? "#0E5353" : "rgba(14, 83, 83, 0.3)",
                    borderRadius: "1px",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "10px", color: "#0E5353" }}>
              High Risk
            </span>
          </div>
        </div>
      </div>

      {/* Feed Types Legend */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "rgba(14, 83, 83, 0.05)",
          borderRadius: "6px",
          border: "1px solid rgba(14, 83, 83, 0.1)",
          width: "fit-content",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "6px",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#0E5353",
              fontWeight: "bold",
              fontSize: "11px",
            }}
          >
            Feed Types (hover over each feed's symbol for more details):
          </Typography>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            justifyContent: "center",
            flexWrap: "nowrap",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderBottom: "7px solid #0E5353",
                }}
              />
              <span style={{ fontSize: "10px", color: "#0E5353" }}>market</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#0E5353",
                }}
              />
              <span style={{ fontSize: "10px", color: "#0E5353" }}>
                fundamental
              </span>
            </div>
            <span
              style={{
                fontSize: "7px",
                color: "#0E5353",
                opacity: 0.8,
                lineHeight: "1",
              }}
            >
              (on-chain exchange rate)
            </span>
            <span
              style={{
                fontSize: "7px",
                color: "#0E5353",
                opacity: 0.8,
                lineHeight: "1",
              }}
            >
              ×
            </span>
            <span
              style={{
                fontSize: "7px",
                color: "#0E5353",
                opacity: 0.8,
                lineHeight: "1",
              }}
            >
              (market price of underlying asset)
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginLeft: "-70px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderStyle: "solid",
                  borderWidth: "2px",
                  borderColor: "#0E5353",
                  backgroundColor: "#0E5353",
                }}
              />
              <span style={{ fontSize: "10px", color: "#0E5353" }}>mix</span>
            </div>
            <span
              style={{
                fontSize: "7px",
                color: "#0E5353",
                opacity: 0.8,
                lineHeight: "1",
              }}
            >
              (on-chain exchange rate included in median)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
