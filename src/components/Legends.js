import React, { useState } from "react";
import {
  Typography,
  Tooltip,
  Popover,
} from "@mui/material";
import { InfoOutlined } from '@mui/icons-material';


export const Legends = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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
      {/* Feed Types Legend */}
      <div
        style={{
          padding: "20px 24px",
          backgroundColor: "rgba(14, 83, 83, 0.05)",
          borderRadius: "8px",
          border: "1px solid rgba(14, 83, 83, 0.1)",
          width: "fit-content",
          minWidth: "280px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#0E5353",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            Feed Types:
          </Typography>
          <Tooltip
            title="Hover over each feed's symbol for more details"
            placement="bottom"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.9)",
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
            alignItems: "flex-start",
            justifyContent: "flex-start",
            flexWrap: "nowrap",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderBottom: "9px solid #0E5353",
                }}
              />
              <span style={{ fontSize: "12px", color: "#0E5353", fontWeight: "500" }}>market</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#0E5353",
                }}
              />
              <span style={{ fontSize: "12px", color: "#0E5353", fontWeight: "500" }}>
                fundamental
              </span>
            </div>
            <span
              style={{
                fontSize: "10px",
                color: "#0E5353",
                opacity: 0.8,
                lineHeight: "1.4",
                marginLeft: "16px",
              }}
            >
              (on-chain exchange rate)
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#0E5353",
                opacity: 0.8,
                lineHeight: "1.4",
                marginLeft: "16px",
              }}
            >
              ×
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#0E5353",
                opacity: 0.8,
                lineHeight: "1.4",
                marginLeft: "16px",
              }}
            >
              (market price of underlying asset)
            </span>
          </div>
          {/* Mix category commented out - no feeds currently use mix category */}
          {/* <div
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
          </div> */}
        </div>
      </div>

      {/* Best Practices Rating Legend */}
      <div
        style={{
          padding: "20px 24px",
          backgroundColor: "rgba(14, 83, 83, 0.05)",
          borderRadius: "8px",
          border: "1px solid rgba(14, 83, 83, 0.1)",
          width: "fit-content",
          minWidth: "280px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#0E5353",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            'Best Practices' Rating:
          </Typography>
          <>
            <InfoOutlined
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
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
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleMouseLeave}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
              PaperProps={{
                sx: {
                  bgcolor: "rgba(0, 0, 0, 0.9)",
                  maxWidth: "min(850px, calc(100vw - 32px))",
                  margin: "8px",
                  pointerEvents: "auto",
                },
              }}
              disableRestoreFocus
            >
              <div 
                style={{ padding: "12px", textAlign: "center" }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
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
            </Popover>
          </>
        </div>
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            justifyContent: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: "2px",
                height: "10px",
              }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "3px",
                    backgroundColor: "#0E5353",
                    borderRadius: "1px",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "12px", color: "#0E5353", fontWeight: "500" }}>
              Exemplary
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: "2px",
                height: "10px",
              }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "3px",
                    backgroundColor:
                      i < 2 ? "#0E5353" : "rgba(14, 83, 83, 0.3)",
                    borderRadius: "1px",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "12px", color: "#0E5353", fontWeight: "500" }}>Moderate</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: "2px",
                height: "10px",
              }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "3px",
                    backgroundColor:
                      i < 1 ? "#0E5353" : "rgba(14, 83, 83, 0.3)",
                    borderRadius: "1px",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "12px", color: "#0E5353", fontWeight: "500" }}>
              High Risk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
